import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, conversationId } = await req.json();
    console.log('Asistente clínico - Query:', query);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Variables de entorno no configuradas');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Paso 1: Generar embedding del query
    const embeddingResponse = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: query
      })
    });

    if (!embeddingResponse.ok) {
      throw new Error('Error generando embedding del query');
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Paso 2: Buscar documentos relevantes usando la función RPC
    const { data: relevantDocs, error: searchError } = await supabase
      .rpc('search_clinical_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: 5
      });

    if (searchError) {
      console.error('Error en búsqueda:', searchError);
      throw searchError;
    }

    console.log('Documentos relevantes encontrados:', relevantDocs?.length || 0);

    // Paso 3: Construir contexto con documentos
    let context = '';
    const sources: any[] = [];

    if (relevantDocs && relevantDocs.length > 0) {
      relevantDocs.forEach((doc: any, index: number) => {
        const docNum = index + 1;
        context += `\n[Documento ${docNum}]\n`;
        context += `Tipo: ${doc.document_type}\n`;
        context += `Paciente: ${doc.patient_name || 'N/A'}\n`;
        context += `Fecha: ${new Date(doc.uploaded_at).toLocaleDateString('es-CL')}\n`;
        
        // Extraer información relevante según tipo
        const data = doc.extracted_data || {};
        if (data.diagnosticos) {
          context += `Diagnósticos: ${JSON.stringify(data.diagnosticos)}\n`;
        }
        if (data.hallazgos) {
          context += `Hallazgos: ${data.hallazgos}\n`;
        }
        if (data.conclusion) {
          context += `Conclusión: ${data.conclusion}\n`;
        }
        if (data.planTratamiento) {
          context += `Plan: ${data.planTratamiento}\n`;
        }
        if (data.categorias) {
          context += `Laboratorio:\n`;
          data.categorias.forEach((cat: any) => {
            context += `  ${cat.nombre}: ${JSON.stringify(cat.examenes)}\n`;
          });
        }
        context += `Similitud: ${(doc.similarity * 100).toFixed(1)}%\n`;
        context += '---\n';

        sources.push({
          id: doc.id,
          type: doc.document_type,
          patient: doc.patient_name,
          date: doc.uploaded_at,
          similarity: doc.similarity
        });
      });
    }

    // Paso 4: Llamar a Gemini con contexto y query
    const systemPrompt = `Eres un asistente clínico especializado en pediatría del Hospital de Puerto Montt. 
Tu rol es ayudar a los médicos respondiendo preguntas basadas en casos clínicos históricos.

INSTRUCCIONES CRÍTICAS:
1. Analiza cuidadosamente los documentos clínicos proporcionados
2. Responde de forma concisa, técnica y profesional
3. SIEMPRE cita las fuentes específicas usando [Documento N]
4. Si los documentos no contienen información suficiente, indícalo claramente
5. NO inventes información que no esté en los documentos
6. Usa terminología médica pediátrica apropiada
7. Si es apropiado, menciona guías clínicas o protocolos relevantes
8. Enfócate en información clínicamente útil y accionable

FORMATO DE RESPUESTA:
- Respuesta clara y directa (2-4 párrafos)
- Referencias explícitas a documentos: [Documento 1], [Documento 2], etc.
- Si aplica, sugerencias de acciones o consideraciones clínicas

CONTEXTO DE DOCUMENTOS CLÍNICOS:
${context || 'No se encontraron documentos relevantes para esta consulta.'}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Error en AI:', aiResponse.status, errorText);
      throw new Error(`Error en AI: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const response = aiData.choices[0].message.content;

    // Paso 5: Guardar en clinical_queries
    const { data: { user } } = await supabase.auth.getUser(
      req.headers.get('authorization')?.replace('Bearer ', '') || ''
    );

    if (user) {
      await supabase
        .from('clinical_queries')
        .insert({
          user_id: user.id,
          query,
          response,
          sources
        });
    }

    console.log('Respuesta generada exitosamente');

    return new Response(
      JSON.stringify({
        success: true,
        response,
        sources,
        documentsFound: relevantDocs?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
