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
    const { documentIds } = await req.json();
    console.log('Generando embeddings para documentos:', documentIds);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Variables de entorno no configuradas');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const ids = Array.isArray(documentIds) ? documentIds : [documentIds];
    const results = [];

    for (const docId of ids) {
      try {
        // Obtener documento
        const { data: doc, error: fetchError } = await supabase
          .from('clinical_documents')
          .select('*')
          .eq('id', docId)
          .single();

        if (fetchError || !doc) {
          console.error('Error obteniendo documento:', docId, fetchError);
          results.push({ id: docId, success: false, error: 'Documento no encontrado' });
          continue;
        }

        // Preparar texto para embedding
        const extractedData = doc.extracted_data || {};
        const textParts: string[] = [
          `Tipo: ${doc.document_type}`,
          `Archivo: ${doc.file_name}`,
        ];

        // Extraer texto relevante según tipo
        if (extractedData.diagnosticos) {
          textParts.push(`Diagnósticos: ${JSON.stringify(extractedData.diagnosticos)}`);
        }
        if (extractedData.diagnosticoIngreso) {
          textParts.push(`Diagnóstico ingreso: ${extractedData.diagnosticoIngreso}`);
        }
        if (extractedData.diagnosticosEgreso) {
          textParts.push(`Diagnósticos egreso: ${JSON.stringify(extractedData.diagnosticosEgreso)}`);
        }
        if (extractedData.hallazgos) {
          textParts.push(`Hallazgos: ${extractedData.hallazgos}`);
        }
        if (extractedData.conclusion) {
          textParts.push(`Conclusión: ${extractedData.conclusion}`);
        }
        if (extractedData.categorias) {
          for (const cat of extractedData.categorias) {
            textParts.push(`${cat.nombre}: ${JSON.stringify(cat.examenes)}`);
          }
        }
        if (extractedData.anamnesis) {
          textParts.push(`Anamnesis: ${extractedData.anamnesis}`);
        }
        if (extractedData.planTratamiento) {
          textParts.push(`Plan: ${extractedData.planTratamiento}`);
        }
        if (extractedData.resumenEvolucion) {
          textParts.push(`Evolución: ${extractedData.resumenEvolucion}`);
        }

        const textToEmbed = textParts.join('\n').slice(0, 8000); // Límite para modelo

        // Generar embedding usando text-embedding-ada-002
        const embeddingResponse = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-ada-002',
            input: textToEmbed
          })
        });

        if (!embeddingResponse.ok) {
          const errorText = await embeddingResponse.text();
          console.error('Error generando embedding:', embeddingResponse.status, errorText);
          results.push({ id: docId, success: false, error: 'Error en API de embeddings' });
          continue;
        }

        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;

        // Guardar embedding en base de datos
        const { error: updateError } = await supabase
          .from('clinical_documents')
          .update({
            embeddings: embedding,
            processed: true
          })
          .eq('id', docId);

        if (updateError) {
          console.error('Error actualizando documento:', updateError);
          results.push({ id: docId, success: false, error: updateError.message });
        } else {
          console.log('Embedding generado para:', docId);
          results.push({ id: docId, success: true });
        }

      } catch (docError) {
        console.error('Error procesando documento:', docId, docError);
        results.push({
          id: docId,
          success: false,
          error: docError instanceof Error ? docError.message : 'Error desconocido'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Procesados ${successCount}/${ids.length} documentos`);

    return new Response(
      JSON.stringify({ success: true, results }),
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
