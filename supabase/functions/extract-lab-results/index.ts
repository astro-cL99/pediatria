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

    // Convertir a base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Prompt especializado para extracción de laboratorio pediátrico
    const systemPrompt = `Eres un experto en análisis de exámenes de laboratorio pediátrico chileno. 
Tu tarea es extraer TODOS los valores de laboratorio del documento con absoluta precisión.

INSTRUCCIONES CRÍTICAS:
1. Extrae TODOS los parámetros visibles, incluso si están en formato no estándar
2. Identifica valores críticos según criterios pediátricos chilenos:
   - Hemoglobina <7.0 g/dL: CRÍTICO (considerar transfusión)
   - Plaquetas <10,000/µL: CRÍTICO (alto riesgo de sangrado)
   - Leucocitos <1,000/µL o >50,000/µL: CRÍTICO
   - Glucosa <40 mg/dL o >500 mg/dL: CRÍTICO
   - Potasio <2.5 o >6.5 mEq/L: CRÍTICO (riesgo de arritmia)
   - Sodio <120 o >160 mEq/L: CRÍTICO
   - Creatinina >2.0 mg/dL: CRÍTICO (insuficiencia renal)
   - Bilirrubina >15 mg/dL: CRÍTICO (ictericia severa)

3. Marca como "isAbnormal" si está fuera del rango de referencia
4. Marca como "isCritical" si cumple criterios críticos
5. Agrupa por secciones: Hemograma, Química Sanguínea, Electrolitos, Gases Arteriales, Coagulación, Perfil Hepático, Perfil Renal, Marcadores Inflamatorios, etc.

FORMATO DE SALIDA REQUERIDO:
{
  "sections": {
    "Hemograma": [
      {"name": "Hemoglobina", "value": 8.5, "unit": "g/dL", "referenceRange": "11.5-15.5", "isAbnormal": true, "isCritical": false},
      {"name": "Plaquetas", "value": 45000, "unit": "/µL", "referenceRange": "150,000-450,000", "isAbnormal": true, "isCritical": false}
    ],
    "Química": [
      {"name": "Glucosa", "value": 95, "unit": "mg/dL", "referenceRange": "70-100", "isAbnormal": false, "isCritical": false}
    ]
  },
  "metadata": {
    "laboratoryName": "nombre del laboratorio",
    "sampleDate": "fecha de toma de muestra",
    "reportDate": "fecha del informe"
  }
}`;

    const userPrompt = `Analiza este examen de laboratorio pediátrico y extrae TODOS los valores con máxima precisión. 
Identifica valores críticos que requieren atención inmediata médica.`;

    // Llamar a Lovable AI con imagen
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
                  url: `data:${fileData.type};base64,${base64}`
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
