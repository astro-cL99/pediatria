import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DauRequest {
  imageBase64: string;
  fileName: string;
}

function validateRequest(body: any): DauRequest {
  if (!body.imageBase64 || typeof body.imageBase64 !== 'string') {
    throw new Error('imageBase64 es requerido y debe ser una cadena');
  }
  
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(body.imageBase64)) {
    throw new Error('imageBase64 no es válido');
  }
  
  if (body.imageBase64.length > 10 * 1024 * 1024) {
    throw new Error('La imagen es demasiado grande (máximo 10MB en base64)');
  }
  
  return {
    imageBase64: body.imageBase64,
    fileName: body.fileName || 'documento.pdf'
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const { imageBase64, fileName } = validateRequest(body);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no configurado en variables de entorno');
    }

    console.log(`[extract-dau-data] Procesando: ${fileName}`);
    console.log(`[extract-dau-data] Tamaño imagen: ${(imageBase64.length / 1024).toFixed(2)} KB`);

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
        model: 'google/gemini-2.0-flash-exp',
        messages: [
          { 
            role: 'user', 
            content: [
              {
                type: 'text',
                text: systemPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${imageBase64}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
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
    
    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error('[extract-dau-data] Respuesta AI sin contenido:', JSON.stringify(data));
      throw new Error('Respuesta de IA vacía o mal formada');
    }
    
    const extractedData = data.choices[0].message.content;
    console.log(`[extract-dau-data] Respuesta recibida (${extractedData.length} chars)`);

    let parsedData;
    const cleanedData = extractedData.trim();
    
    try {
      const markdownMatch = cleanedData.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (markdownMatch) {
        console.log('[extract-dau-data] JSON encontrado en bloque markdown');
        parsedData = JSON.parse(markdownMatch[1].trim());
      } else {
        const jsonMatch = cleanedData.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          console.log('[extract-dau-data] JSON encontrado por regex');
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          console.log('[extract-dau-data] Intentando parse directo');
          parsedData = JSON.parse(cleanedData);
        }
      }
      
      if (!parsedData || typeof parsedData !== 'object') {
        throw new Error('El JSON parseado no es un objeto válido');
      }
      
      if (parsedData.vitalSigns && typeof parsedData.vitalSigns === 'string') {
        try {
          parsedData.vitalSigns = JSON.parse(parsedData.vitalSigns);
        } catch {
          parsedData.vitalSigns = {};
        }
      }
      
      console.log('[extract-dau-data] ✓ Datos parseados correctamente');
      console.log(`[extract-dau-data] Campos extraídos: ${Object.keys(parsedData).length}`);
      
    } catch (parseError) {
      console.error('[extract-dau-data] Error al parsear JSON:', parseError);
      console.error('[extract-dau-data] Contenido recibido (primeros 1000 chars):', 
        cleanedData.substring(0, 1000));
      
      parsedData = {
        patientName: "", rut: "", dateOfBirth: "", age: "", gender: "",
        address: "", contactNumbers: "", caregiver: "", caregiverRut: "",
        admissionDate: "", admissionTime: "",
        chiefComplaint: extractedData.substring(0, 500),
        presentIllness: "",
        vitalSigns: { weight: "", temperature: "", heartRate: "", respiratoryRate: "", bloodPressure: "", saturation: "" },
        allergies: "", personalHistory: "", physicalExam: "",
        labResults: "", imagingResults: "", provisionalDiagnosis: ""
      };
      
      console.warn('[extract-dau-data] Usando estructura de recuperación');
    }

    const processingTime = Date.now() - startTime;
    console.log(`[extract-dau-data] ✓ Completado en ${processingTime}ms`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: parsedData,
        metadata: {
          fileName,
          processingTimeMs: Date.now() - startTime,
          model: 'google/gemini-2.0-flash-exp'
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[extract-dau-data] ✗ Error después de ${processingTime}ms:`, error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido al procesar DAU',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});