import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ScoreSelector } from "@/components/ScoreSelector";

interface EditAdmissionFormProps {
  admissionId: string;
  currentData: {
    admission_diagnoses?: string[];
    oxygen_requirement?: any;
    respiratory_score?: string;
    viral_panel?: string;
    pending_tasks?: string;
    antibiotics?: any;
    current_medications?: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditAdmissionForm({ admissionId, currentData, onSuccess, onCancel }: EditAdmissionFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    diagnoses: currentData.admission_diagnoses?.join(", ") || "",
    oxygenType: currentData.oxygen_requirement?.type || "",
    oxygenFlow: currentData.oxygen_requirement?.flow || "",
    oxygenPeep: currentData.oxygen_requirement?.peep || "",
    oxygenFio2: currentData.oxygen_requirement?.fio2 || "",
    respiratoryScore: currentData.respiratory_score || "",
    viralPanel: currentData.viral_panel || "",
    pendingTasks: currentData.pending_tasks || "",
    antibiotics: currentData.antibiotics?.map((a: any) => `${a.name} (${a.dose})`).join(", ") || "",
    medications: currentData.current_medications || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const diagnosesArray = formData.diagnoses
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);

      const antibioticsArray = formData.antibiotics
        ? formData.antibiotics.split(",").map((ab) => {
            const match = ab.match(/(.+?)\s*\((.+?)\)/);
            if (match) {
              return { name: match[1].trim(), dose: match[2].trim() };
            }
            return { name: ab.trim(), dose: "" };
          })
        : [];

      const oxygenRequirement = formData.oxygenType
        ? {
            type: formData.oxygenType,
            flow: formData.oxygenFlow,
            peep: formData.oxygenPeep || null,
            fio2: formData.oxygenFio2 || null,
          }
        : null;

      const { error } = await supabase
        .from("admissions")
        .update({
          admission_diagnoses: diagnosesArray,
          oxygen_requirement: oxygenRequirement,
          respiratory_score: formData.respiratoryScore || null,
          viral_panel: formData.viralPanel || null,
          pending_tasks: formData.pendingTasks || null,
          antibiotics: antibioticsArray.length > 0 ? antibioticsArray : null,
          current_medications: formData.medications || null,
        })
        .eq("id", admissionId);

      if (error) throw error;

      toast.success("Datos actualizados correctamente");
      onSuccess();
    } catch (error: any) {
      console.error("Error updating admission:", error);
      toast.error("Error al actualizar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="diagnoses">Diagnósticos (separados por coma)</Label>
        <Textarea
          id="diagnoses"
          value={formData.diagnoses}
          onChange={(e) => setFormData({ ...formData, diagnoses: e.target.value })}
          placeholder="Ej: Bronquiolitis, Neumonía"
          rows={2}
        />
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="oxygenType">Tipo de Oxígeno</Label>
            <Select
              value={formData.oxygenType}
              onValueChange={(value) => setFormData({ ...formData, oxygenType: value })}
            >
              <SelectTrigger id="oxygenType">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ambiental">Ambiental</SelectItem>
                <SelectItem value="Naricera">Naricera</SelectItem>
                <SelectItem value="Venturi">Venturi</SelectItem>
                <SelectItem value="CNAF">CNAF</SelectItem>
                <SelectItem value="CPAP">CPAP</SelectItem>
                <SelectItem value="VMI">VMI</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="oxygenFlow">Flujo (L/min)</Label>
            <Input
              id="oxygenFlow"
              value={formData.oxygenFlow}
              onChange={(e) => setFormData({ ...formData, oxygenFlow: e.target.value })}
              placeholder="Ej: 2"
            />
          </div>
        </div>

        {/* Campos adicionales para CPAP */}
        {(formData.oxygenType === 'CPAP' || formData.oxygenType === 'VMI') && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div>
              <Label htmlFor="oxygenPeep" className="text-blue-900 dark:text-blue-100">
                PEEP (cmH₂O)
              </Label>
              <Input
                id="oxygenPeep"
                value={formData.oxygenPeep}
                onChange={(e) => setFormData({ ...formData, oxygenPeep: e.target.value })}
                placeholder="Ej: 5"
                className="bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <Label htmlFor="oxygenFio2" className="text-blue-900 dark:text-blue-100">
                FiO₂ (%)
              </Label>
              <Input
                id="oxygenFio2"
                value={formData.oxygenFio2}
                onChange={(e) => setFormData({ ...formData, oxygenFio2: e.target.value })}
                placeholder="Ej: 40"
                className="bg-white dark:bg-gray-800"
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="respiratoryScore">Score Respiratorio</Label>
        <Select
          value={formData.respiratoryScore}
          onValueChange={(value) => setFormData({ ...formData, respiratoryScore: value })}
        >
          <SelectTrigger id="respiratoryScore">
            <SelectValue placeholder="Seleccionar score" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="No aplica">No aplica</SelectItem>
            <SelectItem value="TAL">TAL</SelectItem>
            <SelectItem value="Pulmonary">Pulmonary</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Mostrar tabla interactiva del score seleccionado */}
        {(formData.respiratoryScore === "TAL" || formData.respiratoryScore === "Pulmonary") && (
          <ScoreSelector 
            scoreType={formData.respiratoryScore as "TAL" | "Pulmonary"}
            onScoreCalculated={(result) => {
              // Opcional: guardar el resultado para usarlo después
              console.log("Score calculado:", result);
            }}
          />
        )}
      </div>

      <div>
        <Label htmlFor="viralPanel">Panel Viral</Label>
        <Input
          id="viralPanel"
          value={formData.viralPanel}
          onChange={(e) => setFormData({ ...formData, viralPanel: e.target.value })}
          placeholder="Ej: VRS positivo"
        />
      </div>

      <div>
        <Label htmlFor="medications">Medicamentos y Antibióticos</Label>
        <Textarea
          id="medications"
          value={formData.medications}
          onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
          placeholder="Ej: Ampicilina (100mg/kg/día), Salbutamol, Paracetamol"
          rows={3}
        />
        <p className="text-sm text-muted-foreground mt-1">
          Incluir todos los medicamentos y antibióticos con sus dosis si corresponde
        </p>
      </div>

      <div>
        <Label htmlFor="pendingTasks">Tareas Pendientes</Label>
        <Textarea
          id="pendingTasks"
          value={formData.pendingTasks}
          onChange={(e) => setFormData({ ...formData, pendingTasks: e.target.value })}
          placeholder="Ej: Control de hemograma, Evaluación por cirugía"
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar Cambios
        </Button>
      </div>
    </form>
  );
}
