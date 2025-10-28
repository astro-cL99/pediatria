import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Heart, Activity, Thermometer, Wind, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface VitalsMonitorProps {
  patientId: string;
  ageMonths: number;
  currentVitals: any;
}

export function RealtimeVitalsMonitor({ patientId, ageMonths, currentVitals }: VitalsMonitorProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentVitals && patientId) {
      analyzeVitals();
    }
  }, [currentVitals]);

  const analyzeVitals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('real-time-vitals', {
        body: {
          patientId,
          vitalSigns: currentVitals,
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
        }
      }
    } catch (error) {
      console.error('Error analyzing vitals:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!analysis) return null;

  return (
    <Card className={`border-l-4 ${
      analysis.status === 'critical' ? 'border-l-destructive bg-destructive/5' : 
      analysis.status === 'warning' ? 'border-l-warning bg-warning/5' : 
      'border-l-success'
    }`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Análisis de Signos Vitales</CardTitle>
          <Badge variant={
            analysis.status === 'critical' ? 'destructive' : 
            analysis.status === 'warning' ? 'outline' : 
            'default'
          }>
            {analysis.status === 'critical' ? 'CRÍTICO' : 
             analysis.status === 'warning' ? 'ADVERTENCIA' : 
             'NORMAL'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">FC</p>
              <p className="text-lg font-bold">{currentVitals.heartRate} lpm</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">FR</p>
              <p className="text-lg font-bold">{currentVitals.respiratoryRate} rpm</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Wind className="h-5 w-5 text-cyan-500" />
            <div>
              <p className="text-xs text-muted-foreground">SatO2</p>
              <p className="text-lg font-bold">{currentVitals.saturation}%</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Temp</p>
              <p className="text-lg font-bold">{currentVitals.temperature}°C</p>
            </div>
          </div>
        </div>

        {analysis.alerts && analysis.alerts.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">Alertas Detectadas:</p>
            {analysis.alerts.map((alert: any, index: number) => (
              <Alert key={index} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium">{alert.message}</p>
                  {alert.recommendation && (
                    <p className="text-sm mt-1 text-muted-foreground">
                      → {alert.recommendation}
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p><strong>Rangos normales ({analysis.ageCategory}):</strong></p>
          <p>FC: {analysis.normalRanges.heartRate.min}-{analysis.normalRanges.heartRate.max} lpm</p>
          <p>FR: {analysis.normalRanges.respiratoryRate.min}-{analysis.normalRanges.respiratoryRate.max} rpm</p>
          <p>SatO2: {analysis.normalRanges.saturation.min}-{analysis.normalRanges.saturation.max}%</p>
        </div>
      </CardContent>
    </Card>
  );
}
