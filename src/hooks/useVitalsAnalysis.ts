import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VitalSigns {
  heartRate?: number;
  respiratoryRate?: number;
  saturation?: number;
  temperature?: number;
  bloodPressure?: string;
}

export interface VitalsAnalysis {
  status: 'normal' | 'warning' | 'critical';
  alerts: Array<{
    type: string;
    severity: 'warning' | 'critical';
    message: string;
    value: any;
    normalRange: any;
    recommendation?: string;
  }>;
  ageCategory: string;
  normalRanges: any;
  timestamp: string;
}

export function useVitalsAnalysis() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<VitalsAnalysis | null>(null);

  const analyzeVitals = async (
    patientId: string,
    vitalSigns: VitalSigns,
    ageMonths: number
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('real-time-vitals', {
        body: {
          patientId,
          vitalSigns,
          ageMonths
        }
      });

      if (error) throw error;

      if (data.success) {
        setAnalysis(data.analysis);
        
        if (data.analysis.status === 'critical') {
          toast.error('⚠️ ALERTA CRÍTICA en signos vitales', {
            description: data.analysis.alerts[0]?.message || 'Revisar paciente inmediatamente',
            duration: 10000
          });
        } else if (data.analysis.status === 'warning') {
          toast.warning('Advertencia en signos vitales', {
            description: `${data.analysis.alerts.length} alerta(s) detectada(s)`,
            duration: 5000
          });
        }

        return data.analysis;
      }
    } catch (error) {
      console.error('Error analyzing vitals:', error);
      toast.error('Error al analizar signos vitales');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    analyzeVitals,
    analysis,
    loading
  };
}
