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
    const { query, filters, limit = 10 } = await req.json();
    console.log('Búsqueda semántica:', query);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Variables de entorno no configuradas');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Generar embedding del query
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
      const errorText = await embeddingResponse.text();
      console.error('Error generando embedding:', embeddingResponse.status, errorText);
      throw new Error('Error generando embedding del query');
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Construir query SQL con filtros
    let sqlQuery = `
      SELECT 
        cd.*,
        p.name as patient_name,
        p.rut,
        a.admission_date,
        1 - (cd.embeddings <=> $1::vector) as similarity
      FROM clinical_documents cd
      LEFT JOIN patients p ON cd.patient_id = p.id
      LEFT JOIN admissions a ON cd.admission_id = a.id
      WHERE cd.embeddings IS NOT NULL
    `;

    const params: any[] = [JSON.stringify(queryEmbedding)];
    let paramIndex = 2;

    // Aplicar filtros adicionales
    if (filters?.documentType) {
      sqlQuery += ` AND cd.document_type = $${paramIndex}`;
      params.push(filters.documentType);
      paramIndex++;
    }

    if (filters?.patientId) {
      sqlQuery += ` AND cd.patient_id = $${paramIndex}`;
      params.push(filters.patientId);
      paramIndex++;
    }

    if (filters?.startDate) {
      sqlQuery += ` AND cd.uploaded_at >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters?.endDate) {
      sqlQuery += ` AND cd.uploaded_at <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    sqlQuery += `
      ORDER BY cd.embeddings <=> $1::vector
      LIMIT $${paramIndex}
    `;
    params.push(limit);

    // Ejecutar búsqueda (por ahora simplificado, la función RPC se agregará después)
    const { data, error } = await supabase
      .from('clinical_documents')
      .select(`
        *,
        patients(name, rut),
        admissions(admission_date)
      `)
      .not('embeddings', 'is', null)
      .limit(limit);

    if (error) {
      console.error('Error en búsqueda:', error);
      throw error;
    }

    console.log(`Encontrados ${data?.length || 0} resultados`);

    return new Response(
      JSON.stringify({
        success: true,
        results: data || [],
        query
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
