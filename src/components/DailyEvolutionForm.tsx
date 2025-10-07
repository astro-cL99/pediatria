import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save } from "lucide-react";

interface VitalSigns {
  temperature?: string;
  heartRate?: string;
  respiratoryRate?: string;
  bloodPressure?: string;
  oxygenSaturation?: string;
}

interface DailyEvolutionFormProps {
  patientId: string;
  admissionId?: string;
  onSuccess?: () => void;
}

export function DailyEvolutionForm({ patientId, admissionId, onSuccess }: DailyEvolutionFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({
    temperature: "",
    heartRate: "",
    respiratoryRate: "",
    bloodPressure: "",
    oxygenSaturation: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase.from("daily_evolutions").insert([{
        patient_id: patientId,
        admission_id: admissionId || null,
        subjective: formData.subjective,
        objective: formData.objective,
        assessment: formData.assessment,
        plan: formData.plan,
        vital_signs: vitalSigns as any,
        created_by: user.id,
      }]);

      if (error) throw error;

      // Log audit
      await supabase.from("audit_logs").insert([{
        table_name: "daily_evolutions",
        record_id: patientId,
        action: "CREATE",
        new_data: { ...formData, vital_signs: vitalSigns } as any,
        user_id: user.id,
      }]);

      toast.success("Evolución registrada exitosamente");
      
      // Reset form
      setFormData({
        subjective: "",
        objective: "",
        assessment: "",
        plan: "",
      });
      setVitalSigns({
        temperature: "",
        heartRate: "",
        respiratoryRate: "",
        bloodPressure: "",
        oxygenSaturation: "",
      });

      onSuccess?.();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Error al registrar evolución");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Signos Vitales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label>Temperatura (°C)</Label>
            <Input
              type="number"
              step="0.1"
              value={vitalSigns.temperature}
              onChange={(e) => setVitalSigns({ ...vitalSigns, temperature: e.target.value })}
              placeholder="36.5"
            />
          </div>
          <div className="space-y-2">
            <Label>FC (lpm)</Label>
            <Input
              type="number"
              value={vitalSigns.heartRate}
              onChange={(e) => setVitalSigns({ ...vitalSigns, heartRate: e.target.value })}
              placeholder="80"
            />
          </div>
          <div className="space-y-2">
            <Label>FR (rpm)</Label>
            <Input
              type="number"
              value={vitalSigns.respiratoryRate}
              onChange={(e) => setVitalSigns({ ...vitalSigns, respiratoryRate: e.target.value })}
              placeholder="20"
            />
          </div>
          <div className="space-y-2">
            <Label>PA (mmHg)</Label>
            <Input
              value={vitalSigns.bloodPressure}
              onChange={(e) => setVitalSigns({ ...vitalSigns, bloodPressure: e.target.value })}
              placeholder="120/80"
            />
          </div>
          <div className="space-y-2">
            <Label>SatO₂ (%)</Label>
            <Input
              type="number"
              value={vitalSigns.oxygenSaturation}
              onChange={(e) => setVitalSigns({ ...vitalSigns, oxygenSaturation: e.target.value })}
              placeholder="98"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="subjective">Subjetivo (S)</Label>
          <Textarea
            id="subjective"
            value={formData.subjective}
            onChange={(e) => setFormData({ ...formData, subjective: e.target.value })}
            placeholder="Síntomas reportados por el paciente o tutor..."
            rows={3}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="objective">Objetivo (O)</Label>
          <Textarea
            id="objective"
            value={formData.objective}
            onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
            placeholder="Hallazgos del examen físico, resultados de laboratorio..."
            rows={3}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="assessment">Análisis (A)</Label>
          <Textarea
            id="assessment"
            value={formData.assessment}
            onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
            placeholder="Evaluación y diagnóstico..."
            rows={3}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="plan">Plan (P)</Label>
          <Textarea
            id="plan"
            value={formData.plan}
            onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
            placeholder="Plan de tratamiento y seguimiento..."
            rows={3}
            required
          />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="gap-2">
        <Save className="w-4 h-4" />
        {loading ? "Guardando..." : "Guardar Evolución"}
      </Button>
    </form>
  );
}