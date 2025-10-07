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
  "resultados": [
    {
      "categoria": "nombre del sistema (ej: Química, Hemograma, Coagulación)",
      "examenes": [
        {
          "nombre": "nombre del examen",
          "valor": "valor numérico limpio sin unidades",
          "referencia": "rango de referencia del documento",
          "alterado": true o false
        }
      ]
    }
  ]
}

INSTRUCCIONES CRÍTICAS:
1. LEE TODAS LAS PÁGINAS DEL DOCUMENTO - no solo la primera
2. Extrae TODOS los exámenes que encuentres en cada página
3. Agrupa los resultados por categorías/sistemas (Química, Hemograma, Coagulación, etc.)
4. Para cada examen:
   - Extrae solo el nombre limpio del examen (ej: "Glucosa", "Hemoglobina", "Leucocitos")
   - Extrae solo el VALOR NUMÉRICO sin unidades (ej: "79", "15.2", "9800")
   - Extrae el rango de referencia si está disponible en el documento (ej: "70-100", "<1.0")
   - Determina si está alterado comparando el valor con la referencia
5. NO incluyas:
   - Unidades como mg/dL, g/dL, x10^3/mm3, etc.
   - Símbolos como #, %, etc. en el nombre del examen
   - Texto descriptivo adicional
6. Si un valor está marcado como alto/bajo en el documento, marca "alterado": true
7. Mantén los valores numéricos limpios y fáciles de leer
8. Si hay múltiples fechas, usa la fecha de toma de muestra más reciente`;

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
    console.log('Categorías encontradas:', extractedData.resultados?.length || 0);

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
