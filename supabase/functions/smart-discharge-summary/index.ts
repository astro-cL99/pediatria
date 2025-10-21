import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { admissionId, includeRecommendations = true } = await req.json();

    if (!admissionId) {
      throw new Error('admissionId es requerido');
    }

    console.log(`[smart-discharge-summary] Generando resumen para admisión ${admissionId}`);

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !LOVABLE_API_KEY) {
      throw new Error('Variables de entorno no configuradas');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: admission, error: admissionError } = await supabase
      .from('admissions')
      .select(`
        *,
        patient:patients(*)
      `)
      .eq('id', admissionId)
      .single();

    if (admissionError || !admission) {
      throw new Error('Admisión no encontrada');
    }

    const { data: evolutions } = await supabase
      .from('daily_evolutions')
      .select('*')
      .eq('admission_id', admissionId)
      .order('evolution_date', { ascending: true });

    const { data: documents } = await supabase
      .from('clinical_documents')
      .select('document_type, extracted_data, uploaded_at')
      .eq('admission_id', admissionId)
      .order('uploaded_at', { ascending: true });

    console.log(`Recopilado: ${evolutions?.length || 0} evoluciones, ${documents?.length || 0} documentos`);

    const patientInfo = `
INFORMACIÓN DEL PACIENTE:
- Nombre: ${admission.patient.name}
- RUT: ${admission.patient.rut}
- Edad: ${admission.patient.date_of_birth}
- Sexo: ${admission.patient.gender || 'No especificado'}
- Alergias: ${admission.patient.allergies || 'Sin alergias conocidas'}

DATOS DE INGRESO:
- Fecha ingreso: ${new Date(admission.admission_date).toLocaleDateString('es-CL')}
- Fecha egreso: ${admission.discharge_date ? new Date(admission.discharge_date).toLocaleDateString('es-CL') : 'Pendiente'}
- Días de hospitalización: ${admission.discharge_date ? 
    Math.ceil((new Date(admission.discharge_date).getTime() - new Date(admission.admission_date).getTime()) / (1000 * 60 * 60 * 24)) : 
    'En curso'}
- Diagnóstico de ingreso: ${Array.isArray(admission.admission_diagnoses) ? admission.admission_diagnoses.join('; ') : admission.admission_diagnoses}
- Anamnesis: ${admission.present_illness || 'No disponible'}
- Examen físico inicial: ${admission.physical_exam || 'No disponible'}
`;

    let evolutionsText = '\nEVOLUCIÓN CLÍNICA:\n';
    evolutions?.forEach((evo: any, index: number) => {
      evolutionsText += `\n[Día ${index + 1} - ${new Date(evo.evolution_date).toLocaleDateString('es-CL')}]\n`;
      evolutionsText += `Evolución: ${evo.evolution_text || 'Sin registro'}\n`;
      if (evo.diagnoses && evo.diagnoses.length > 0) {
        evolutionsText += `Diagnósticos: ${evo.diagnoses.join('; ')}\n`;
      }
      if (evo.treatment_plan) {
        evolutionsText += `Plan: ${evo.treatment_plan}\n`;
      }
    });

    let documentsText = '\nEXÁMENES Y DOCUMENTOS COMPLEMENTARIOS:\n';
    documents?.forEach((doc: any) => {
      documentsText += `\n[${doc.document_type} - ${new Date(doc.uploaded_at).toLocaleDateString('es-CL')}]\n`;
      if (doc.extracted_data) {
        documentsText += `${JSON.stringify(doc.extracted_data, null, 2)}\n`;
      }
    });

    const prompt = `Eres un médico pediatra especialista generando una EPICRISIS (resumen de alta hospitalaria) profesional.

INSTRUCCIONES CRÍTICAS:
1. Redacta un resumen clínico completo, coherente y profesional
2. Usa terminología médica apropiada pero clara
3. Estructura cronológica y lógica
4. Destaca hallazgos relevantes y evolución
5. Incluye diagnósticos finales (no solo de ingreso)
6. Menciona procedimientos y tratamientos principales
7. ${includeRecommendations ? 'Incluye indicaciones de alta y recomendaciones de seguimiento' : 'Sin indicaciones de alta'}
8. Formato narrativo profesional (no bullet points)

DATOS CLÍNICOS:
${patientInfo}
${evolutionsText}
${documentsText}

GENERA UN RESUMEN ESTRUCTURADO EN FORMATO JSON:
{
  "resumenIngreso": "string - Resumen del cuadro de ingreso, anamnesis y examen físico inicial (2-3 párrafos)",
  "evolucionTratamiento": "string - Evolución clínica día a día, tratamientos aplicados, respuesta terapéutica (3-5 párrafos)",
  "examenesComplementarios": "string - Resumen de exámenes de laboratorio, imágenes y otros estudios con resultados relevantes (1-2 párrafos)",
  "diagnosticosFinal": ["array de strings - Diagnósticos finales ordenados por importancia"],
  "procedimientos": ["array de strings - Procedimientos realizados durante hospitalización"],
  "medicacionAlta": ["array de strings - Medicamentos activos al alta con dosis"],
  "indicacionesAlta": "string - Indicaciones para casa: reposo, dieta, signos de alarma (solo si includeRecommendations=true)",
  "seguimiento": "string - Plan de seguimiento: controles, especialistas a ver, exámenes pendientes (solo si includeRecommendations=true)",
  "pronostico": "string - Pronóstico y comentarios finales (1 párrafo)"
}

IMPORTANTE: Responde SOLO el JSON, sin markdown, sin explicaciones adicionales.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 4000
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`Error en IA: ${aiResponse.status} - ${errorText}`);
      throw new Error(`Error generando epicrisis con IA: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No se pudo extraer JSON de respuesta IA');
    }

    const epicrisis = JSON.parse(jsonMatch[0]);

    console.log('[smart-discharge-summary] ✓ Epicrisis generada exitosamente');

    return new Response(
      JSON.stringify({
        success: true,
        epicrisis,
        metadata: {
          evolutionsAnalyzed: evolutions?.length || 0,
          documentsAnalyzed: documents?.length || 0,
          generatedAt: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[smart-discharge-summary] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
