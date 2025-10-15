import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to convert ReadableStream to Buffer
async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  return Buffer.concat(chunks);
}

export const config = {
  api: {
    bodyParser: false, // Disable body parsing, we'll handle it manually
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the form data
    const formData = await new Promise<{ audio: File }>((resolve, reject) => {
      const chunks: any[] = [];
      
      req.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      req.on('end', () => {
        const data = Buffer.concat(chunks);
        const boundary = req.headers['content-type']?.split('boundary=')[1] || '';
        
        // Simple boundary parsing for the audio file
        const parts = data.toString('binary').split(`--${boundary}`);
        
        for (const part of parts) {
          if (part.includes('name="audio"')) {
            const content = part.split('\r\n\r\n')[1];
            const fileData = Buffer.from(content, 'binary');
            
            // Create a file-like object
            const file = {
              arrayBuffer: () => Promise.resolve(fileData.buffer),
              size: fileData.length,
              type: 'audio/wav',
              name: 'recording.wav',
            } as unknown as File;
            
            return resolve({ audio: file });
          }
        }
        
        reject(new Error('No audio file found in form data'));
      });
      
      req.on('error', (err) => {
        reject(err);
      });
    });

    // Upload to Supabase Storage
    const fileExt = 'wav';
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `recordings/${fileName}`;
    
    const fileBuffer = await formData.audio.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('recordings')
      .upload(filePath, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'audio/wav',
      });
    
    if (uploadError) {
      console.error('Error uploading to Supabase Storage:', uploadError);
      // Continue with transcription even if upload fails
    }

    // Convert the file to a format that OpenAI can use
    const file = new File([formData.audio], 'recording.wav', { type: 'audio/wav' });
    
    // Transcribe using OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'es', // Set to Spanish
    });

    // Return the transcription
    return res.status(200).json({ 
      text: transcription.text,
      audioUrl: uploadError ? null : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/recordings/${filePath}`
    });

  } catch (error) {
    console.error('Error in transcription:', error);
    return res.status(500).json({ 
      error: 'Error processing audio',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
