import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const KNOWN_INTERACTIONS: Record<string, any> = {
  'amoxicilina': {
    interactions: ['anticonceptivos orales'],
    contraindications: ['alergia penicilinas', 'mononucleosis'],
    warnings: ['Puede disminuir eficacia de anticonceptivos orales']
  },
  'ceftriaxona': {
    interactions: ['calcio IV'],
    contraindications: ['hiperbilirrubinemia neonatal', 'prematuros <41 sem'],
    warnings: ['No administrar con soluciones con calcio en menores de 28 días']
  },
  'gentamicina': {
    interactions: ['furosemida', 'vancomicina'],
    contraindications: ['insuficiencia renal severa'],
    warnings: ['Nefrotoxicidad y ototoxicidad, monitoreo de niveles séricos']
  },
  'paracetamol': {
    interactions: ['warfarina'],
    contraindications: ['hepatopatía severa', 'G6PD deficiencia'],
    warnings: ['Dosis máxima 90mg/kg/día en niños, hepatotoxicidad en sobredosis']
  },
  'ibuprofeno': {
    interactions: ['aspirina', 'warfarina', 'corticoides'],
    contraindications: ['úlcera péptica activa', 'asma severa', 'deshidratación', '<6 meses'],
    warnings: ['Riesgo de gastropatía, usar con precaución en asma']
  },
  'salbutamol': {
    interactions: ['propranolol', 'digoxina'],
    contraindications: ['cardiopatía descompensada', 'tirotoxicosis'],
    warnings: ['Puede causar taquicardia e hipokalemia']
  },
  'prednisona': {
    interactions: ['AINES', 'vacunas vivas', 'anticoagulantes'],
    contraindications: ['infecciones sistémicas no tratadas', 'varicela activa'],
    warnings: ['Inmunosupresión, no vacunas vivas, riesgo de Cushing con uso prolongado']
  },
  'dexametasona': {
    interactions: ['AINES', 'digoxina', 'diuréticos'],
    contraindications: ['infecciones fúngicas sistémicas'],
    warnings: ['Hiperglicemia, inmunosupresión, supresión eje HPA']
  },
  'fenobarbital': {
    interactions: ['valproato', 'warfarina', 'anticonceptivos'],
    contraindications: ['porfiria aguda', 'insuficiencia respiratoria'],
    warnings: ['Inductor enzimático, afecta metabolismo de múltiples fármacos']
  }
};

function normalizeMedicationName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
}

async function analyzeWithAI(
  newMedication: string,
  currentMedications: string[],
  allergies: string[],
  apiKey: string
): Promise<any> {
  const prompt = `Eres un farmacólogo clínico pediátrico. Analiza las siguientes interacciones medicamentosas:

MEDICAMENTO A PRESCRIBIR: ${newMedication}
MEDICAMENTOS ACTUALES: ${currentMedications.join(', ') || 'Ninguno'}
ALERGIAS CONOCIDAS: ${allergies.join(', ') || 'Ninguna'}

Analiza:
1. ¿Existe alergia cruzada con alguna alergia conocida?
2. ¿Hay interacciones farmacológicas significativas con los medicamentos actuales?
3. ¿Cuál es la severidad de cada interacción? (leve/moderada/severa/crítica)
4. ¿Qué recomendaciones darías? (ajuste de dosis, monitoreo, contraindicación absoluta)

Responde en JSON:
{
  "safe": boolean (true si es seguro prescribir),
  "allergyRisk": {
    "exists": boolean,
    "description": "string o null",
    "severity": "leve|moderada|severa|crítica" o null
  },
  "interactions": [
    {
      "medication": "nombre del medicamento que interactúa",
      "type": "farmacocinética|farmacodinámica|alergia",
      "severity": "leve|moderada|severa|crítica",
      "description": "descripción de la interacción",
      "recommendation": "qué hacer (ajustar dosis, monitoreo, suspender, etc)"
    }
  ],
  "overallRecommendation": "recomendación general del farmacólogo",
  "requiresSpecialistConsult": boolean (true si necesita consulta con especialista)
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-exp',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 2000
    }),
  });

  if (!response.ok) {
    throw new Error(`AI analysis failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No se pudo extraer JSON de respuesta IA');
  }
  
  return JSON.parse(jsonMatch[0]);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      patientId, 
      newMedication, 
      dose, 
      route, 
      frequency 
    } = await req.json();

    if (!patientId || !newMedication) {
      throw new Error('patientId y newMedication son requeridos');
    }

    console.log(`[medication-interactions] Analizando: ${newMedication} para paciente ${patientId}`);

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Variables de Supabase no configuradas');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: patient } = await supabase
      .from('patients')
      .select('allergies')
      .eq('id', patientId)
      .single();

    const { data: admission } = await supabase
      .from('admissions')
      .select('medications')
      .eq('patient_id', patientId)
      .eq('status', 'active')
      .single();

    const currentMedications = admission?.medications || [];
    const allergies = patient?.allergies ? [patient.allergies] : [];

    console.log(`Medicamentos actuales: ${currentMedications.length}`);
    console.log(`Alergias: ${allergies.join(', ') || 'Ninguna'}`);

    const normalizedNew = normalizeMedicationName(newMedication);
    const localData = KNOWN_INTERACTIONS[normalizedNew];
    
    let localWarnings: any[] = [];
    if (localData) {
      const allergyMatch = allergies.some(allergy => 
        localData.contraindications.some((contra: string) => 
          allergy.toLowerCase().includes(contra) || 
          contra.includes(allergy.toLowerCase())
        )
      );
      
      if (allergyMatch) {
        localWarnings.push({
          type: 'allergy',
          severity: 'critical',
          message: `CONTRAINDICACIÓN: Posible alergia. Contraindicaciones: ${localData.contraindications.join(', ')}`,
          contraindications: localData.contraindications
        });
      }

      currentMedications.forEach((med: string) => {
        const normalizedCurrent = normalizeMedicationName(med);
        if (localData.interactions.some((int: string) => normalizedCurrent.includes(int) || int.includes(normalizedCurrent))) {
          localWarnings.push({
            type: 'interaction',
            severity: 'warning',
            message: `Interacción con ${med}. ${localData.warnings[0] || ''}`,
            medication: med
          });
        }
      });
    }

    let aiAnalysis = null;
    if (LOVABLE_API_KEY) {
      try {
        aiAnalysis = await analyzeWithAI(
          newMedication,
          currentMedications,
          allergies,
          LOVABLE_API_KEY
        );
        console.log('[medication-interactions] Análisis IA completado');
      } catch (aiError) {
        console.error('[medication-interactions] Error en análisis IA:', aiError);
      }
    }

    const combinedAnalysis = {
      safe: localWarnings.length === 0 && (aiAnalysis?.safe !== false),
      localWarnings,
      aiAnalysis,
      medication: {
        name: newMedication,
        dose,
        route,
        frequency
      },
      patient: {
        currentMedications,
        allergies
      },
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify({
        success: true,
        ...combinedAnalysis
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[medication-interactions] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
