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
    const { imageBase64, fileName } = await req.json();
    
    if (!imageBase64) {
      throw new Error('No se proporcionó la imagen del DAU');
    }
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no configurado');
    }

    console.log('Extrayendo datos del DAU con IA...');
    console.log('Archivo:', fileName);

    const systemPrompt = `Eres un asistente médico especializado en extraer datos de documentos DAU (Dato de Atención de Urgencia) del sistema público de salud chileno.

FORMATO DE RESPUESTA: Debes responder ÚNICAMENTE con un objeto JSON válido, sin bloques de código markdown, sin explicaciones adicionales.

ESTRUCTURA DEL DAU CHILENO:
- Encabezado con datos del hospital y paciente
- Sección de identificación: nombre, RUT, fecha nacimiento, edad, sexo, dirección
- Números de contacto y previsión (FONASA)
- Motivo de consulta
- Datos del acompañante
- Categorización de urgencia
- Signos vitales: Peso, FR, PA, SAT O2, FC, Temperatura
- Anamnesis y examen físico
- Antecedentes (AM, Cx, Hosp, RAM)
- Impresión diagnóstica

EXTRAE LOS SIGUIENTES DATOS Y DEVUELVE ESTE JSON EXACTO:
{
  "patientName": "nombre completo del paciente (ej: SANTIAGO AGUSTÍN DELGADO CABEZAS)",
  "rut": "RUT del paciente con guión (ej: 26809578-0)",
  "dateOfBirth": "fecha nacimiento en formato DD/MM/YYYY (ej: 29/04/2019)",
  "age": "edad en formato texto (ej: 06A 05m)",
  "gender": "Masculino o Femenino",
  "address": "dirección completa (ej: EL MANZANO 0 ,ZUÑIGA , SAN VICENTE)",
  "contactNumbers": "números de contacto (ej: 941147491)",
  "caregiver": "nombre de persona a cargo y relación (ej: KARINA ANDREA CABEZAS VARGAS - madre)",
  "caregiverRut": "RUT de persona a cargo (ej: 15110755-9)",
  "admissionDate": "fecha ingreso YYYY-MM-DD",
  "admissionTime": "hora ingreso HH:MM",
  "chiefComplaint": "texto del motivo de consulta",
  "presentIllness": "descripción completa de enfermedad actual desde anamnesis",
  "vitalSigns": {
    "weight": "peso en Kg como número",
    "temperature": "temperatura axilar como número",
    "heartRate": "FC como número",
    "respiratoryRate": "FR como número",
    "bloodPressure": "PA en formato ej: 118/62",
    "saturation": "SAT O2 como número"
  },
  "allergies": "alergias o 'No refiere'",
  "personalHistory": "antecedentes mórbidos, quirúrgicos, hospitalizaciones previas",
  "physicalExam": "descripción del examen físico completo",
  "labResults": "exámenes de laboratorio si aparecen",
  "imagingResults": "imagenología si aparece",
  "provisionalDiagnosis": "impresión diagnóstica o diagnósticos"
}

REGLAS:
- Si un dato no aparece en el documento, usa cadena vacía ""
- Extrae TODOS los datos que encuentres
- Para la persona a cargo, incluye nombre completo y relación (padre/madre/tutor)
- Responde SOLO el JSON, sin markdown
- Mantén el formato exacto del JSON mostrado`;

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
          { 
            role: 'user', 
            content: [
              {
                type: 'text',
                text: 'Extrae los datos estructurados de este documento DAU chileno:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        temperature: 0.2,
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

    // Parse JSON response - handle markdown code blocks
    let parsedData;
    const cleanedData = extractedData.trim();
    
    try {
      // First try to extract from markdown code blocks
      const jsonMatch = cleanedData.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        console.log('Extracted JSON from markdown block');
        parsedData = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try direct parse
        parsedData = JSON.parse(cleanedData);
      }
    } catch (e) {
      console.error('Error parsing JSON:', e);
      console.error('Raw response:', cleanedData.substring(0, 500));
      throw new Error('No se pudo parsear la respuesta de IA');
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