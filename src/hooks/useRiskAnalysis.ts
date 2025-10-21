import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RiskAnalysis {
  riskScore: number;
  riskLevel: 'bajo' | 'moderado' | 'alto' | 'crítico';
  riskFactors: string[];
  recommendations: string[];
  calculatedAt: string;
}

export function useRiskAnalysis() {
  const [loading, setLoading] = useState(false);
  const [riskData, setRiskData] = useState<RiskAnalysis | null>(null);

  const calculateRisk = async (patientId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('predictive-analytics', {
        body: { patientId }
      });

      if (error) throw error;

      if (data.success) {
        setRiskData({
          riskScore: data.riskScore,
          riskLevel: data.riskLevel,
          riskFactors: data.riskFactors,
          recommendations: data.recommendations,
          calculatedAt: data.calculatedAt
        });

        if (data.riskLevel === 'crítico') {
          toast.error('🚨 RIESGO CRÍTICO DETECTADO', {
            description: `Score: ${data.riskScore}. Requiere atención inmediata.`,
            duration: 10000
          });
        } else if (data.riskLevel === 'alto') {
          toast.warning('⚠️ RIESGO ALTO DETECTADO', {
            description: `Score: ${data.riskScore}. Monitoreo estrecho requerido.`,
            duration: 7000
          });
        }

        return data;
      }
    } catch (error) {
      console.error('Error calculating risk:', error);
      toast.error('Error al calcular análisis de riesgo');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    calculateRisk,
    riskData,
    loading
  };
}
