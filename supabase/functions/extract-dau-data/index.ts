import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfText } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no configurado');
    }

    console.log('Extrayendo datos del DAU con IA...');

    const systemPrompt = `Eres un asistente médico especializado en extraer datos estructurados de documentos DAU (Dato de Atención de Urgencia) chilenos.

Extrae la siguiente información del documento DAU y devuélvela en formato JSON estricto:
{
  "patientName": "nombre completo del paciente",
  "rut": "RUT del paciente",
  "dateOfBirth": "fecha de nacimiento en formato YYYY-MM-DD",
  "age": "edad del paciente",
  "sex": "MASCULINO o FEMENINO",
  "admissionDate": "fecha de ingreso en formato YYYY-MM-DD",
  "admissionTime": "hora de ingreso HH:MM",
  "chiefComplaint": "motivo de consulta",
  "presentIllness": "resumen de anamnesis próxima y enfermedad actual",
  "vitalSigns": {
    "weight": "peso en kg (solo número)",
    "temperature": "temperatura (solo número)",
    "heartRate": "frecuencia cardíaca (solo número)",
    "respiratoryRate": "frecuencia respiratoria (solo número)",
    "bloodPressure": "presión arterial",
    "saturation": "saturación O2 (solo número)"
  },
  "allergies": "alergias mencionadas o 'No refiere'",
  "personalHistory": "antecedentes mórbidos, quirúrgicos, hospitalizaciones",
  "physicalExam": "resumen del examen físico",
  "labResults": "exámenes de laboratorio si están presentes",
  "imagingResults": "imagenología si está presente",
  "provisionalDiagnosis": "diagnósticos mencionados"
}

Si algún dato no está presente en el documento, usa null o una cadena vacía según corresponda.
IMPORTANTE: Responde SOLO con el JSON, sin texto adicional antes o después.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Extrae los datos de este DAU:\n\n${pdfText}` }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error de AI Gateway:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Límite de solicitudes excedido. Intenta nuevamente en unos momentos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const extractedData = data.choices[0].message.content;
    
    console.log('Datos extraídos exitosamente');

    // Parse JSON response
    let parsedData;
    try {
      parsedData = JSON.parse(extractedData);
    } catch (e) {
      console.error('Error parsing JSON:', e);
      // Try to extract JSON from markdown code blocks
      const jsonMatch = extractedData.match(/```json\n([\s\S]*?)\n```/) || 
                       extractedData.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('No se pudo parsear la respuesta de IA');
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: parsedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en extract-dau-data:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});