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
    const { rawText } = await req.json();
    console.log('Procesando anamnesis próxima...');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no configurado');
    }

    const systemPrompt = `Eres un médico pediatra experto en redacción de historias clínicas.

Tu tarea es transformar el texto de anamnesis próxima proporcionado en una narrativa clínica profesional que:
1. Sea cronológica y secuencial - organiza los eventos en orden temporal desde el inicio de los síntomas hasta la consulta actual
2. Sea clara y entendible - usa lenguaje médico apropiado pero estructurado
3. Sea lógica - conecta los eventos de manera coherente explicando la evolución del cuadro
4. Corrija errores ortográficos, gramaticales y de sintaxis
5. Elimine redundancias y organice la información de forma profesional
6. Mantenga todos los datos clínicos importantes (síntomas, duración, tratamientos previos, evolución)

Formato esperado:
- Inicio con el tiempo de evolución y síntoma principal
- Descripción cronológica de la evolución
- Síntomas asociados y su relación temporal
- Tratamientos recibidos y respuesta
- Estado actual al momento de la consulta

IMPORTANTE: 
- NO inventes información que no esté en el texto original
- Mantén TODOS los datos clínicos relevantes
- Si el texto está muy desordenado, reorganízalo cronológicamente
- Corrige errores obvios de escritura o digitación
- Devuelve SOLO el texto mejorado de la anamnesis, sin introducciones ni explicaciones adicionales`;

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
          { role: 'user', content: rawText }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error en AI Gateway:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const improvedText = aiResponse.choices[0].message.content;

    console.log('Anamnesis procesada exitosamente');

    return new Response(
      JSON.stringify({ success: true, improvedText }),
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
