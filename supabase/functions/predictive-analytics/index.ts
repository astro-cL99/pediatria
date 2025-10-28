import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VITAL_RANGES = {
  neonate: { heartRate: { min: 100, max: 160 }, respiratoryRate: { min: 30, max: 60 } },
  infant: { heartRate: { min: 100, max: 160 }, respiratoryRate: { min: 25, max: 50 } },
  toddler: { heartRate: { min: 90, max: 150 }, respiratoryRate: { min: 20, max: 40 } },
  preschool: { heartRate: { min: 80, max: 140 }, respiratoryRate: { min: 20, max: 30 } },
  schoolAge: { heartRate: { min: 70, max: 120 }, respiratoryRate: { min: 18, max: 25 } },
  adolescent: { heartRate: { min: 60, max: 100 }, respiratoryRate: { min: 12, max: 20 } }
};

function calculateAgeInMonths(dateOfBirth: string): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  const months = (today.getFullYear() - birth.getFullYear()) * 12 + 
                 (today.getMonth() - birth.getMonth());
  return Math.max(0, months);
}

function getAgeCategory(ageMonths: number): keyof typeof VITAL_RANGES {
  if (ageMonths < 1) return 'neonate';
  if (ageMonths < 12) return 'infant';
  if (ageMonths < 36) return 'toddler';
  if (ageMonths < 72) return 'preschool';
  if (ageMonths < 144) return 'schoolAge';
  return 'adolescent';
}

function calculateRiskScore(patient: any, admission: any, vitals: any): any {
  let riskScore = 0;
  const riskFactors: string[] = [];

  const ageMonths = calculateAgeInMonths(patient.date_of_birth);
  if (ageMonths < 6) {
    riskScore += 15;
    riskFactors.push('Menor de 6 meses (riesgo aumentado)');
  } else if (ageMonths < 12) {
    riskScore += 10;
    riskFactors.push('Menor de 1 año');
  }

  if (vitals) {
    if (vitals.saturation && vitals.saturation < 92) {
      riskScore += 20;
      riskFactors.push(`Hipoxemia severa (SatO2: ${vitals.saturation}%)`);
    } else if (vitals.saturation && vitals.saturation < 95) {
      riskScore += 10;
      riskFactors.push(`Hipoxemia leve (SatO2: ${vitals.saturation}%)`);
    }

    if (vitals.heartRate) {
      const ageCategory = getAgeCategory(ageMonths);
      const normalRange = VITAL_RANGES[ageCategory].heartRate;
      if (vitals.heartRate > normalRange.max * 1.3 || vitals.heartRate < normalRange.min * 0.7) {
        riskScore += 15;
        riskFactors.push(`Trastorno severo de frecuencia cardíaca (${vitals.heartRate} lpm)`);
      }
    }

    if (vitals.temperature && vitals.temperature >= 39.5) {
      riskScore += 10;
      riskFactors.push(`Fiebre alta (${vitals.temperature}°C)`);
    } else if (vitals.temperature && vitals.temperature < 36) {
      riskScore += 15;
      riskFactors.push(`Hipotermia (${vitals.temperature}°C)`);
    }
  }

  if (admission.personal_history) {
    const history = admission.personal_history.toLowerCase();
    
    if (history.includes('prematur') || history.includes('pretérmin')) {
      riskScore += 15;
      riskFactors.push('Antecedente de prematuridad');
    }
    
    if (history.includes('cardiopat') || history.includes('corazón')) {
      riskScore += 20;
      riskFactors.push('Cardiopatía conocida');
    }
    
    if (history.includes('neumopatía') || history.includes('displasia broncopulmonar') || history.includes('dbp')) {
      riskScore += 15;
      riskFactors.push('Neumopatía crónica');
    }
    
    if (history.includes('inmunosupres') || history.includes('inmunodeficiencia')) {
      riskScore += 25;
      riskFactors.push('Inmunosupresión');
    }
    
    if (history.includes('desnutr')) {
      riskScore += 10;
      riskFactors.push('Desnutrición');
    }
  }

  const daysHospitalized = admission.discharge_date ? 
    Math.ceil((new Date(admission.discharge_date).getTime() - new Date(admission.admission_date).getTime()) / (1000 * 60 * 60 * 24)) :
    Math.ceil((Date.now() - new Date(admission.admission_date).getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysHospitalized > 10) {
    riskScore += 10;
    riskFactors.push(`Hospitalización prolongada (${daysHospitalized} días)`);
  }

  if (admission.oxygen_requirement) {
    if (admission.oxygen_requirement.type === 'CPAP' || admission.oxygen_requirement.type === 'VMI') {
      riskScore += 25;
      riskFactors.push(`Soporte ventilatorio avanzado (${admission.oxygen_requirement.type})`);
    } else if (admission.oxygen_requirement.type === 'CNAF') {
      riskScore += 15;
      riskFactors.push('Cánula nasal alto flujo');
    } else {
      riskScore += 5;
      riskFactors.push('Oxígeno suplementario');
    }
  }

  let riskLevel: 'bajo' | 'moderado' | 'alto' | 'crítico';
  let recommendations: string[];

  if (riskScore >= 60) {
    riskLevel = 'crítico';
    recommendations = [
      'Monitoreo continuo en unidad de cuidados intensivos',
      'Evaluación por intensivista pediátrico',
      'Protocolo de deterioro clínico activado',
      'Revisar necesidad de soporte vital avanzado',
      'Notificar a equipo de respuesta rápida'
    ];
  } else if (riskScore >= 40) {
    riskLevel = 'alto';
    recommendations = [
      'Monitoreo estrecho cada 2-4 horas',
      'Evaluación médica frecuente',
      'Considerar traslado a unidad intermedia',
      'Preparar para posible escalada de cuidados',
      'Mantener comunicación constante con familia'
    ];
  } else if (riskScore >= 20) {
    riskLevel = 'moderado';
    recommendations = [
      'Monitoreo regular cada 4-6 horas',
      'Evaluación médica diaria',
      'Vigilar aparición de signos de alarma',
      'Mantener vía venosa permeable',
      'Educación a padres sobre signos de deterioro'
    ];
  } else {
    riskLevel = 'bajo';
    recommendations = [
      'Monitoreo estándar según protocolo',
      'Evaluación médica según evolución',
      'Preparar condiciones para egreso si evoluciona favorablemente',
      'Educación de padres para cuidados domiciliarios'
    ];
  }

  return {
    riskScore,
    riskLevel,
    riskFactors,
    recommendations,
    calculatedAt: new Date().toISOString()
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patientId } = await req.json();

    if (!patientId) {
      throw new Error('patientId es requerido');
    }

    console.log(`[predictive-analytics] Analizando riesgo para paciente ${patientId}`);

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Variables de Supabase no configuradas');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      throw new Error('Paciente no encontrado');
    }

    const { data: admission, error: admissionError } = await supabase
      .from('admissions')
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'active')
      .single();

    if (admissionError || !admission) {
      throw new Error('No hay admisión activa para este paciente');
    }

    const { data: latestEvolution } = await supabase
      .from('daily_evolutions')
      .select('vital_signs')
      .eq('admission_id', admission.id)
      .order('evolution_date', { ascending: false })
      .limit(1)
      .single();

    const vitals = latestEvolution?.vital_signs || null;

    const riskAnalysis = calculateRiskScore(patient, admission, vitals);

    console.log(`[predictive-analytics] Riesgo calculado: ${riskAnalysis.riskLevel} (score: ${riskAnalysis.riskScore})`);

    return new Response(
      JSON.stringify({
        success: true,
        patient: {
          id: patient.id,
          name: patient.name,
          ageMonths: calculateAgeInMonths(patient.date_of_birth)
        },
        ...riskAnalysis
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[predictive-analytics] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
