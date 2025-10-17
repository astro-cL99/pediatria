import { supabase } from '@/integrations/supabase/client';

interface ProcessDocumentParams {
  documentId: string;
  fileInfo: {
    name: string;
    type: string;
    size: number;
  };
}

export const processDocument = async ({ documentId, fileInfo }: ProcessDocumentParams) => {
  try {
    const { data, error } = await supabase.functions.invoke('document-processing', {
      body: { documentId, fileInfo },
    });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error processing document:', error);
    return { data: null, error };
  }
};

export const getDocumentProcessingStatus = async (documentId: string) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('id, status, processed_data, updated_at')
      .eq('id', documentId)
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error getting document status:', error);
    return { data: null, error };
  }
};

// Add this to your document upload flow in documentService.ts
// After successful upload, call processDocument to start processing
