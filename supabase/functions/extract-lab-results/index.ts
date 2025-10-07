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
    const { imageBase64, imageBase64List, fileName } = await req.json();
    console.log('Extrayendo datos de laboratorio...');
    console.log('Archivo:', fileName);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no configurado');
    }

    const systemPrompt = `Eres un asistente especializado en extraer datos de exámenes de laboratorio médicos.
Analiza TODAS las páginas del reporte de laboratorio y extrae la siguiente información en formato JSON:

{
  "procedencia": "origen del examen (ej: URGENCIA PEDIATRICA, otro hospital, etc)",
  "fechaToma": "fecha de toma de muestra en formato DD/MM/YYYY",
  "resultados": "texto con TODOS los resultados encontrados en TODAS las páginas, agrupados por sistemas. Ejemplo: Glucosa 79 LDH 152 // CK total 54 CK-MB <3.0 Troponina <0.01 // Creatinina 0.74 BUN 12.1 // PCR 0.11 // BT 1.46 BD 0.32 BI 1.14 GOT 24 GPT 13 GGT 14 FA 192 Proteínas totales 7.2 Albúmina 4.3 Globulina 2.9 // Colesterol 165 Triglicéridos 40 HDL 58 LDL 99 // Leucocitos 7.800 Eos 100 Bac 0 Seg 5.600 Linf 1.600 Mono 500 Hb 12.8 Hcto 39 VCM 82.1 HCM 27 CHCM 32.9 Plaquetas 352.000"
}

INSTRUCCIONES CRÍTICAS:
1. LEE TODAS LAS PÁGINAS DEL DOCUMENTO - no solo la primera
2. Extrae TODOS los exámenes que encuentres en cada página
3. Agrupa los resultados de forma lógica por sistemas:
   - Metabolismo (Glucosa, LDH)
   - Enzimas cardíacas (CK total, CK-MB, Troponina)
   - Función renal (Creatinina, BUN)
   - Inflamación (PCR)
   - Hepáticas (Bilirrubinas, GOT, GPT, GGT, FA, Proteínas totales, Albúmina, Globulina)
   - Lípidos (Colesterol total, Triglicéridos, HDL, LDL)
   - Coagulación (TP, INR, TTPA)
   - Hemograma (Leucocitos con diferencial, Hb, Hcto, VCM, HCM, CHCM, Plaquetas)
   - Gases arteriales (pH, pCO2, pO2, HCO3, EB, Lactato)
   - Electrolitos (Na, K, Cl, Ca, P, Mg)
   - Orina (Sedimento, densidad, pH, proteínas, glucosa, etc.)
4. Usa // para separar grupos de sistemas
5. Incluye TODOS los valores, tanto normales como anormales
6. Si un valor está fuera de rango, márcalo con > o < según corresponda
7. Si hay múltiples fechas, usa la fecha de toma de muestra más reciente`;

    // Construir contenido con una o varias imágenes (todas las páginas)
    const content: any[] = [{ type: 'text', text: systemPrompt }];
    if (Array.isArray(imageBase64List) && imageBase64List.length > 0) {
      for (const img of imageBase64List) {
        content.push({
          type: 'image_url',
          image_url: { url: `data:image/png;base64,${img}` }
        });
      }
      console.log('Páginas recibidas:', imageBase64List.length);
    } else if (imageBase64) {
      content.push({
        type: 'image_url',
        image_url: { url: `data:image/png;base64,${imageBase64}` }
      });
      console.log('Páginas recibidas:', 1);
    } else {
      throw new Error('No se recibió ninguna imagen para procesar');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content }
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
