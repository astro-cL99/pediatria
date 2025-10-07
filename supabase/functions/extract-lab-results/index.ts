import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    console.log('Extrayendo datos de laboratorio...');
    console.log('Archivo:', fileName);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no configurado');
    }

    const systemPrompt = `Eres un asistente especializado en extraer datos de exámenes de laboratorio médicos.
Analiza la imagen del reporte de laboratorio y extrae la siguiente información en formato JSON:

{
  "procedencia": "origen del examen (ej: URGENCIA PEDIATRICA, otro hospital, etc)",
  "fechaToma": "fecha de toma de muestra en formato DD/MM/YYYY",
  "resultados": "texto resumido agrupado por sistemas, por ejemplo: Glucosa 111 LDH 383// CK total 31 CK-MB 14 // Crea 0.35 BUN 9.6 // PCR 0.31 // Albúmina 4.2 GOT 118 Col-T 103 BT 0.41 FA 213 // TP 73% INR 1.2 TTPA 25 seg // Leucocitos 18.200 Segmentados 15% PQT 286.000 Hb 12.6 Hcto 38.1 // Sedimento urinario no inflamatorio // GSV: pH 7.39 pCO2 39 pO2 42.3 HCO3 23 EB -1.7 // Na 138.3 K 4.2 Cl 99.5 Ca. iónico 1.19 Fósforo 4.2 Calcio 9.2"
}

Agrupa los resultados de forma lógica:
- Metabolismo (Glucosa, LDH)
- Enzimas cardíacas (CK total, CK-MB, Troponina)
- Función renal (Creatinina, BUN)
- Inflamación (PCR)
- Hepáticas (Albúmina, GOT, GPT, Bilirrubina, Fosfatasa alcalina)
- Coagulación (TP, INR, TTPA)
- Hemograma (Leucocitos, Hb, Hcto, Plaquetas)
- Gases (pH, pCO2, pO2, HCO3, EB)
- Electrolitos (Na, K, Cl, Ca, P)
- Otros hallazgos relevantes

Usa // para separar grupos. Incluye solo valores anormales o clínicamente relevantes.
Si hay múltiples fechas, usa la fecha de toma de muestra más reciente.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: systemPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error en AI Gateway:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let extractedText = aiResponse.choices[0].message.content;

    // Handle markdown JSON blocks
    if (extractedText.includes('```json')) {
      extractedText = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      console.log('Extracted JSON from markdown block');
    }

    const extractedData = JSON.parse(extractedText);

    console.log('Datos de laboratorio extraídos exitosamente');

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
