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
    console.log('Analizando patrones clínicos...');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Variables de entorno no configuradas');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Obtener todos los documentos procesados
    const { data: documents, error: docsError } = await supabase
      .from('clinical_documents')
      .select('*')
      .eq('processed', true)
      .limit(100);

    if (docsError) throw docsError;

    console.log('Documentos a analizar:', documents?.length || 0);

    if (!documents || documents.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No hay documentos para analizar' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Preparar datos para análisis
    const documentsSummary = documents.map(doc => ({
      type: doc.document_type,
      data: doc.extracted_data,
      date: doc.uploaded_at
    }));

    const analysisPrompt = `Analiza los siguientes documentos clínicos pediátricos y genera insights útiles:

DOCUMENTOS (${documents.length} total):
${JSON.stringify(documentsSummary, null, 2)}

GENERA UN ANÁLISIS DETALLADO EN FORMATO JSON:
{
  "diagnosticosFrecuentes": [
    {
      "diagnostico": "nombre del diagnóstico",
      "frecuencia": número de casos,
      "porcentaje": porcentaje del total
    }
  ],
  "patronesEstacionales": {
    "descripcion": "Patrones observados por época del año"
  },
  "tratamientosExitosos": [
    {
      "diagnostico": "diagnóstico",
      "tratamiento": "tratamiento más usado",
      "frecuencia": número
    }
  ],
  "complicacionesComunes": [
    {
      "complicacion": "nombre",
      "asociadoA": "diagnósticos relacionados",
      "frecuencia": número
    }
  ],
  "tiemposHospitalizacion": {
    "promedio": días promedio,
    "porDiagnostico": {
      "diagnostico": días promedio
    }
  },
  "alertas": [
    {
      "tipo": "tipo de alerta",
      "descripcion": "descripción",
      "severidad": "alta/media/baja"
    }
  ],
  "recomendaciones": [
    {
      "area": "área de mejora",
      "recomendacion": "recomendación específica"
    }
  ]
}

IMPORTANTE: 
- Sé específico y cuantitativo
- Identifica tendencias reales en los datos
- Genera alertas útiles para el equipo médico
- Sugiere mejoras basadas en los patrones observados`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: analysisPrompt }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Error en AI:', aiResponse.status, errorText);
      throw new Error(`Error en AI: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let analysisText = aiData.choices[0].message.content;

    // Manejar bloques markdown JSON
    if (analysisText.includes('```json')) {
      analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    const analysis = JSON.parse(analysisText);

    // Guardar insights en la base de datos
    const insightsToSave = [
      {
        insight_type: 'diagnosticos_frecuentes',
        data: { insights: analysis.diagnosticosFrecuentes }
      },
      {
        insight_type: 'patrones_estacionales',
        data: analysis.patronesEstacionales
      },
      {
        insight_type: 'tratamientos_exitosos',
        data: { insights: analysis.tratamientosExitosos }
      },
      {
        insight_type: 'complicaciones',
        data: { insights: analysis.complicacionesComunes }
      },
      {
        insight_type: 'tiempos_hospitalizacion',
        data: analysis.tiemposHospitalizacion
      },
      {
        insight_type: 'alertas',
        data: { insights: analysis.alertas }
      },
      {
        insight_type: 'recomendaciones',
        data: { insights: analysis.recomendaciones }
      }
    ];

    const { error: insertError } = await supabase
      .from('clinical_insights')
      .insert(insightsToSave);

    if (insertError) {
      console.error('Error guardando insights:', insertError);
      throw insertError;
    }

    console.log('Análisis completado y guardado');

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        documentsAnalyzed: documents.length
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
