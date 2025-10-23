import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath, patientId, documentType } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Descargar archivo desde storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('medical-documents')
      .download(filePath);

    if (downloadError) throw downloadError;

    // Convertir archivo a base64
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64 = btoa(String.fromCharCode(...uint8Array));

    // Detectar tipo MIME del archivo
    let mimeType = 'application/pdf';
    if (filePath.toLowerCase().endsWith('.pdf')) {
      mimeType = 'application/pdf';
    } else if (filePath.toLowerCase().endsWith('.jpg') || filePath.toLowerCase().endsWith('.jpeg')) {
      mimeType = 'image/jpeg';
    } else if (filePath.toLowerCase().endsWith('.png')) {
      mimeType = 'image/png';
    }

    console.log(`Processing file: ${filePath}, MIME type: ${mimeType}`);

    // Prompt especializado para extracción de laboratorio pediátrico chileno
    const systemPrompt = `Eres un experto en análisis de exámenes de laboratorio pediátrico del Hospital Regional Libertador Bernardo O'Higgins de Chile.

INSTRUCCIONES CRÍTICAS DE EXTRACCIÓN:

1. DETECTA Y EXTRAE TODOS LOS VALORES:
   - Busca tablas con columnas: Examen, Resultado, U.M., Valores de Referencia, Método
   - Los símbolos ">" o "<" junto al resultado indican valores ANORMALES
   - Extrae valores numéricos incluso si tienen símbolos o espacios
   - Ejemplo: "24.2 >" debe extraerse como value: 24.2 con isAbnormal: true

2. SECCIONES COMUNES A DETECTAR:
   - HEMOGRAMA: Leucocitos, Eritrocitos, Hemoglobina, Hematocrito, Plaquetas, VCM, HCM, CHCM, ADE, VPM
   - FÓRMULA DIFERENCIAL: Segmentados, Linfocitos, Monocitos, Eosinófilos, Basófilos (% y #)
   - ELECTROLITOS: Sodio, Potasio, Cloro
   - QUÍMICA: Glucosa, Creatinina, Urea, Bilirrubina
   - MARCADORES INFLAMATORIOS: PCR, Procalcitonina, VHS
   - BIOLOGÍA MOLECULAR: Panel Viral Respiratorio, SARS-COV-2
   - COAGULACIÓN: TP, TTPA, INR, Fibrinógeno
   - PERFIL HEPÁTICO: Transaminasas, Fosfatasa Alcalina
   - PERFIL RENAL: Creatinina, BUN, Clearance

3. VALORES CRÍTICOS PEDIÁTRICOS:
   - Hemoglobina: <7.0 g/dL
   - Leucocitos: <1.0 o >50.0 x10³/mm³
   - Plaquetas: <10 x10³/mm³
   - Sodio: <120 o >160 mEq/L
   - Potasio: <2.5 o >6.5 mEq/L
   - Glucosa: <40 o >500 mg/dL
   - PCR: >10 mg/dL
   - Procalcitonina: >2.0 ng/mL

4. MARCADO DE ANORMALIDADES:
   - isAbnormal: true si el resultado está FUERA del rango de referencia O tiene símbolo > o <
   - isCritical: true si cumple criterios críticos listados arriba

5. METADATOS A EXTRAER:
   - Nombre del paciente
   - RUT del paciente
   - Edad del paciente
   - Fecha/Hora de Ingreso
   - Fecha de Toma de Muestras
   - Procedencia (URGENCIA PEDIATRICA, PEDIATRIA, etc.)
   - Número de Solicitud

FORMATO JSON REQUERIDO:
{
  "sections": {
    "Hemograma": [
      {"name": "RECUENTO DE LEUCOCITOS", "value": 24.2, "unit": "x10³/mm³", "referenceRange": "5.50-18.00", "isAbnormal": true, "isCritical": false},
      {"name": "HEMOGLOBINA", "value": 12.4, "unit": "g/dL", "referenceRange": "9.2-13.6", "isAbnormal": false, "isCritical": false}
    ],
    "Electrolitos": [
      {"name": "SODIO", "value": 127.9, "unit": "mEq/L", "referenceRange": "135-145", "isAbnormal": true, "isCritical": true}
    ],
    "Panel Viral": [
      {"name": "Virus Respiratorio Sincicial A/B", "value": "POSITIVO", "unit": "", "referenceRange": "Negativo", "isAbnormal": true, "isCritical": false}
    ]
  },
  "metadata": {
    "laboratoryName": "HOSPITAL REGIONAL LIBERTADOR BERNARDO O'HIGGINS",
    "patientName": "nombre del paciente",
    "patientRUT": "RUT",
    "patientAge": "edad",
    "admissionDate": "fecha ingreso",
    "sampleDate": "fecha toma muestra",
    "reportDate": "fecha informe",
    "requestNumber": "número solicitud",
    "origin": "procedencia"
  }
}`;

    const userPrompt = `Analiza este documento de laboratorio pediátrico del Hospital Regional de Rancagua.

INSTRUCCIONES ESPECÍFICAS:
1. Extrae TODOS los valores de exámenes, sin omitir ninguno
2. Detecta los símbolos ">" o "<" que indican valores fuera de rango
3. Identifica valores CRÍTICOS que requieren atención médica inmediata
4. Agrupa los exámenes por sección (Hemograma, Electrolitos, etc.)
5. Extrae todos los metadatos del paciente y del documento
6. Para resultados cualitativos (POSITIVO, Negativo), marca como anormal si es POSITIVO

IMPORTANTE: 
- Si un valor tiene ">" o "<", es ANORMAL
- Compara con rangos de referencia para detectar anormalidades
- Marca como CRÍTICO según criterios pediátricos definidos
- Incluye TODOS los exámenes, incluso los normales`;

    // Llamar a Lovable AI con el documento
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: systemPrompt 
          },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: userPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64}`
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Límite de tasa excedido. Por favor intenta de nuevo más tarde.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    const aiResponse = await response.json();
    let extractedText = aiResponse.choices[0]?.message?.content || '';

    console.log('AI Response:', extractedText);

    // Limpiar y parsear JSON
    extractedText = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let extractedData;
    try {
      extractedData = JSON.parse(extractedText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.log('Raw text:', extractedText);
      
      // Fallback: intentar extraer JSON del texto
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No se pudo parsear la respuesta del AI');
      }
    }

    // Calcular score de confianza basado en datos extraídos
    const totalExams = Object.values(extractedData.sections || {})
      .flat()
      .length;
    
    const confidence = Math.min(0.95, 0.5 + (totalExams * 0.02));

    console.log(`Extraídos ${totalExams} exámenes con confianza ${confidence}`);

    return new Response(
      JSON.stringify({ 
        extractedData,
        confidence,
        totalExams
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-lab-results:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error desconocido',
        details: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
