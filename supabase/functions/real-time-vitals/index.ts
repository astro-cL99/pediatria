import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VITAL_RANGES = {
  neonate: {
    heartRate: { min: 100, max: 160 },
    respiratoryRate: { min: 30, max: 60 },
    systolicBP: { min: 60, max: 90 },
    temperature: { min: 36.5, max: 37.5 },
    saturation: { min: 95, max: 100 }
  },
  infant: {
    heartRate: { min: 100, max: 160 },
    respiratoryRate: { min: 25, max: 50 },
    systolicBP: { min: 70, max: 100 },
    temperature: { min: 36.5, max: 37.5 },
    saturation: { min: 95, max: 100 }
  },
  toddler: {
    heartRate: { min: 90, max: 150 },
    respiratoryRate: { min: 20, max: 40 },
    systolicBP: { min: 80, max: 110 },
    temperature: { min: 36.5, max: 37.5 },
    saturation: { min: 95, max: 100 }
  },
  preschool: {
    heartRate: { min: 80, max: 140 },
    respiratoryRate: { min: 20, max: 30 },
    systolicBP: { min: 90, max: 110 },
    temperature: { min: 36.5, max: 37.5 },
    saturation: { min: 95, max: 100 }
  },
  schoolAge: {
    heartRate: { min: 70, max: 120 },
    respiratoryRate: { min: 18, max: 25 },
    systolicBP: { min: 95, max: 120 },
    temperature: { min: 36.5, max: 37.5 },
    saturation: { min: 95, max: 100 }
  },
  adolescent: {
    heartRate: { min: 60, max: 100 },
    respiratoryRate: { min: 12, max: 20 },
    systolicBP: { min: 110, max: 135 },
    temperature: { min: 36.5, max: 37.5 },
    saturation: { min: 95, max: 100 }
  }
};

function getAgeCategory(ageMonths: number): keyof typeof VITAL_RANGES {
  if (ageMonths < 1) return 'neonate';
  if (ageMonths < 12) return 'infant';
  if (ageMonths < 36) return 'toddler';
  if (ageMonths < 72) return 'preschool';
  if (ageMonths < 144) return 'schoolAge';
  return 'adolescent';
}

function analyzeVitals(vitals: any, ageMonths: number) {
  const ageCategory = getAgeCategory(ageMonths);
  const ranges = VITAL_RANGES[ageCategory];
  const alerts: any[] = [];
  let severity: 'normal' | 'warning' | 'critical' = 'normal';

  if (vitals.heartRate) {
    if (vitals.heartRate < ranges.heartRate.min) {
      const isCritical = vitals.heartRate < ranges.heartRate.min * 0.8;
      alerts.push({
        type: 'bradycardia',
        severity: isCritical ? 'critical' : 'warning',
        message: `Bradicardia: ${vitals.heartRate} lpm (normal: ${ranges.heartRate.min}-${ranges.heartRate.max})`,
        value: vitals.heartRate,
        normalRange: ranges.heartRate
      });
      severity = isCritical ? 'critical' : 'warning';
    } else if (vitals.heartRate > ranges.heartRate.max) {
      const isCritical = vitals.heartRate > ranges.heartRate.max * 1.2;
      alerts.push({
        type: 'tachycardia',
        severity: isCritical ? 'critical' : 'warning',
        message: `Taquicardia: ${vitals.heartRate} lpm (normal: ${ranges.heartRate.min}-${ranges.heartRate.max})`,
        value: vitals.heartRate,
        normalRange: ranges.heartRate
      });
      severity = isCritical ? 'critical' : (severity === 'critical' ? 'critical' : 'warning');
    }
  }

  if (vitals.respiratoryRate) {
    if (vitals.respiratoryRate < ranges.respiratoryRate.min) {
      alerts.push({
        type: 'bradypnea',
        severity: 'warning',
        message: `Bradipnea: ${vitals.respiratoryRate} rpm (normal: ${ranges.respiratoryRate.min}-${ranges.respiratoryRate.max})`,
        value: vitals.respiratoryRate,
        normalRange: ranges.respiratoryRate
      });
      severity = severity === 'critical' ? 'critical' : 'warning';
    } else if (vitals.respiratoryRate > ranges.respiratoryRate.max) {
      const isCritical = vitals.respiratoryRate > ranges.respiratoryRate.max * 1.3;
      alerts.push({
        type: 'tachypnea',
        severity: isCritical ? 'critical' : 'warning',
        message: `Taquipnea: ${vitals.respiratoryRate} rpm (normal: ${ranges.respiratoryRate.min}-${ranges.respiratoryRate.max})`,
        value: vitals.respiratoryRate,
        normalRange: ranges.respiratoryRate
      });
      severity = isCritical ? 'critical' : (severity === 'critical' ? 'critical' : 'warning');
    }
  }

  if (vitals.saturation) {
    if (vitals.saturation < 92) {
      alerts.push({
        type: 'hypoxemia',
        severity: 'critical',
        message: `Hipoxemia crítica: ${vitals.saturation}% (normal: >95%)`,
        value: vitals.saturation,
        normalRange: ranges.saturation,
        recommendation: 'Evaluar necesidad de oxígeno suplementario URGENTE'
      });
      severity = 'critical';
    } else if (vitals.saturation < 95) {
      alerts.push({
        type: 'hypoxemia_mild',
        severity: 'warning',
        message: `Saturación baja: ${vitals.saturation}% (normal: >95%)`,
        value: vitals.saturation,
        normalRange: ranges.saturation,
        recommendation: 'Monitoreo estrecho, considerar oxígeno'
      });
      severity = severity === 'critical' ? 'critical' : 'warning';
    }
  }

  if (vitals.temperature) {
    if (vitals.temperature < 36) {
      alerts.push({
        type: 'hypothermia',
        severity: 'warning',
        message: `Hipotermia: ${vitals.temperature}°C (normal: 36.5-37.5°C)`,
        value: vitals.temperature,
        normalRange: ranges.temperature,
        recommendation: 'Evaluar ambiente, aplicar medidas de calentamiento'
      });
      severity = severity === 'critical' ? 'critical' : 'warning';
    } else if (vitals.temperature >= 38) {
      const feverSeverity = vitals.temperature >= 39.5 ? 'critical' : 'warning';
      alerts.push({
        type: 'fever',
        severity: feverSeverity,
        message: `Fiebre ${vitals.temperature >= 39.5 ? 'alta' : ''}: ${vitals.temperature}°C`,
        value: vitals.temperature,
        normalRange: ranges.temperature,
        recommendation: vitals.temperature >= 39.5 ? 
          'Antipirético STAT, evaluar foco infeccioso' : 
          'Antipirético según indicación, monitoreo'
      });
      severity = feverSeverity === 'critical' ? 'critical' : (severity === 'critical' ? 'critical' : 'warning');
    }
  }

  if (vitals.bloodPressure) {
    const bpMatch = vitals.bloodPressure.match(/(\d+)\/(\d+)/);
    if (bpMatch) {
      const systolic = parseInt(bpMatch[1]);
      
      if (systolic < ranges.systolicBP.min) {
        const isCritical = systolic < ranges.systolicBP.min * 0.8;
        alerts.push({
          type: 'hypotension',
          severity: isCritical ? 'critical' : 'warning',
          message: `Hipotensión: ${vitals.bloodPressure} mmHg (sistólica normal: ${ranges.systolicBP.min}-${ranges.systolicBP.max})`,
          value: vitals.bloodPressure,
          normalRange: `${ranges.systolicBP.min}-${ranges.systolicBP.max}/60-80`,
          recommendation: isCritical ? 
            'Evaluar shock, considerar bolos de volumen' : 
            'Monitoreo, evaluar perfusión'
        });
        severity = isCritical ? 'critical' : (severity === 'critical' ? 'critical' : 'warning');
      } else if (systolic > ranges.systolicBP.max * 1.2) {
        alerts.push({
          type: 'hypertension',
          severity: 'warning',
          message: `Hipertensión: ${vitals.bloodPressure} mmHg`,
          value: vitals.bloodPressure,
          normalRange: `${ranges.systolicBP.min}-${ranges.systolicBP.max}/60-80`,
          recommendation: 'Repetir toma, evaluar antihipertensivos si persiste'
        });
        severity = severity === 'critical' ? 'critical' : 'warning';
      }
    }
  }

  return {
    status: severity,
    alerts,
    ageCategory,
    normalRanges: ranges,
    timestamp: new Date().toISOString()
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patientId, vitalSigns, ageMonths } = await req.json();

    if (!patientId || !vitalSigns || ageMonths === undefined) {
      throw new Error('patientId, vitalSigns y ageMonths son requeridos');
    }

    console.log(`[real-time-vitals] Analizando signos vitales para paciente ${patientId}`);

    const analysis = analyzeVitals(vitalSigns, ageMonths);

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        requiresAction: analysis.status === 'critical'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[real-time-vitals] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
