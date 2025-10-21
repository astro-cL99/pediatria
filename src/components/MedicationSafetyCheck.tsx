import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface MedicationSafetyCheckProps {
  patientId: string;
  newMedication: {
    name: string;
    dose: string;
    route: string;
    frequency: string;
  };
  onApproved: () => void;
  onRejected: () => void;
}

export function MedicationSafetyCheck({ 
  patientId, 
  newMedication, 
  onApproved, 
  onRejected 
}: MedicationSafetyCheckProps) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<any>(null);

  const checkInteractions = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('medication-interactions', {
        body: {
          patientId,
          newMedication: newMedication.name,
          dose: newMedication.dose,
          route: newMedication.route,
          frequency: newMedication.frequency
        }
      });

      if (error) throw error;

      if (data.success) {
        setResult(data);
        
        if (!data.safe) {
          toast.warning('⚠️ Advertencias de seguridad detectadas', {
            description: 'Revisar interacciones antes de prescribir'
          });
        } else {
          toast.success('✓ Medicación segura para prescribir');
        }
      }
    } catch (error) {
      console.error('Error checking interactions:', error);
      toast.error('Error al verificar interacciones medicamentosas');
    } finally {
      setChecking(false);
    }
  };

  if (!result) {
    return (
      <div className="flex items-center justify-center p-6">
        <Button onClick={checkInteractions} disabled={checking} className="gap-2">
          <Shield className="h-4 w-4" />
          {checking ? 'Verificando seguridad...' : 'Verificar Seguridad del Medicamento'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {result.safe ? (
            <CheckCircle className="h-5 w-5 text-success" />
          ) : (
            <XCircle className="h-5 w-5 text-destructive" />
          )}
          Análisis de Seguridad
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setResult(null)}
        >
          Verificar Nuevamente
        </Button>
      </div>

      {result.localWarnings && result.localWarnings.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Alertas de Base de Datos:</p>
          {result.localWarnings.map((warning: any, index: number) => (
            <Alert key={index} variant={warning.severity === 'critical' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{warning.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {result.aiAnalysis && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Análisis Farmacológico (IA):</p>
          
          {result.aiAnalysis.allergyRisk?.exists && (
            <Alert variant="destructive">
              <AlertTitle>Riesgo de Alergia</AlertTitle>
              <AlertDescription>
                <p className="font-medium">
                  Severidad: {result.aiAnalysis.allergyRisk.severity}
                </p>
                <p className="text-sm mt-1">
                  {result.aiAnalysis.allergyRisk.description}
                </p>
              </AlertDescription>
            </Alert>
          )}

          {result.aiAnalysis.interactions && result.aiAnalysis.interactions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Interacciones Detectadas:</p>
              {result.aiAnalysis.interactions.map((interaction: any, index: number) => (
                <Alert 
                  key={index} 
                  variant={
                    interaction.severity === 'crítica' || interaction.severity === 'severa' ? 
                    'destructive' : 'default'
                  }
                >
                  <AlertTitle className="flex items-center justify-between">
                    <span>Con: {interaction.medication}</span>
                    <Badge variant="outline">{interaction.severity}</Badge>
                  </AlertTitle>
                  <AlertDescription>
                    <p className="text-sm">{interaction.description}</p>
                    <p className="text-sm mt-2">
                      <strong>Recomendación:</strong> {interaction.recommendation}
                    </p>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {result.aiAnalysis.overallRecommendation && (
            <Alert variant="default" className="bg-accent/10 border-accent">
              <AlertTitle>Recomendación del Farmacólogo</AlertTitle>
              <AlertDescription className="text-sm">
                {result.aiAnalysis.overallRecommendation}
              </AlertDescription>
            </Alert>
          )}

          {result.aiAnalysis.requiresSpecialistConsult && (
            <Alert variant="default" className="border-warning bg-warning/10">
              <AlertDescription className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-sm">
                  Se recomienda <strong>consulta con especialista</strong> antes de prescribir
                </span>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div className="text-xs text-muted-foreground border-t pt-3">
        <p><strong>Medicamentos actuales:</strong> {result.patient.currentMedications.join(', ') || 'Ninguno'}</p>
        <p><strong>Alergias:</strong> {result.patient.allergies.join(', ') || 'Ninguna'}</p>
      </div>

      <div className="flex gap-3 pt-4">
        {result.safe || !result.localWarnings.some((w: any) => w.severity === 'critical') ? (
          <>
            <Button onClick={onApproved} className="flex-1">
              <CheckCircle className="mr-2 h-4 w-4" />
              Prescribir de Todos Modos
            </Button>
            <Button variant="outline" onClick={onRejected}>
              Cancelar
            </Button>
          </>
        ) : (
          <>
            <Button variant="destructive" onClick={onRejected} className="flex-1">
              <XCircle className="mr-2 h-4 w-4" />
              No Prescribir (Contraindicado)
            </Button>
            <Button variant="outline" onClick={onApproved}>
              Forzar (Bajo mi Responsabilidad)
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
