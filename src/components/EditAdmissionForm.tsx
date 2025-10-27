import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { ScoreSelector } from "@/components/ScoreSelector";
import { OxygenTherapySelector } from "@/components/OxygenTherapySelector";

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
    diet?: any;
    iv_therapy?: any;
  };
  patientAge?: number; // edad en meses
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditAdmissionForm({ admissionId, currentData, patientAge = 24, onSuccess, onCancel }: EditAdmissionFormProps) {
  const [loading, setLoading] = useState(false);
  const [diagnoses, setDiagnoses] = useState<string[]>(currentData.admission_diagnoses || []);
  const [diagnosisInput, setDiagnosisInput] = useState("");
  const [viralPanelItems, setViralPanelItems] = useState<string[]>(
    currentData.viral_panel ? currentData.viral_panel.split(", ").filter(Boolean) : []
  );
  const [formData, setFormData] = useState({
    oxygenType: currentData.oxygen_requirement?.type || "",
    oxygenFlow: currentData.oxygen_requirement?.flow || "",
    oxygenPeep: currentData.oxygen_requirement?.peep || "",
    oxygenFio2: currentData.oxygen_requirement?.fio2 || "",
    respiratoryScore: currentData.respiratory_score || "",
    pendingTasks: currentData.pending_tasks || "",
    antibiotics: currentData.antibiotics?.map((a: any) => `${a.name} (${a.dose})`).join(", ") || "",
    medications: currentData.current_medications || "",
    dietType: currentData.diet?.type || "",
    dietNotes: currentData.diet?.notes || "",
    ivTherapyActive: currentData.iv_therapy?.active || false,
    ivTherapyType: currentData.iv_therapy?.type || "",
    ivTherapyPercentage: currentData.iv_therapy?.percentage || "",
    ivNaCl: currentData.iv_therapy?.nacl || "",
    ivKCl: currentData.iv_therapy?.kcl || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
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

      const diet = formData.dietType
        ? {
            type: formData.dietType,
            notes: formData.dietNotes || null,
          }
        : null;

      const ivTherapy = formData.ivTherapyActive
        ? {
            active: true,
            type: formData.ivTherapyType || null,
            percentage: formData.ivTherapyPercentage,
            nacl: formData.ivNaCl || null,
            kcl: formData.ivKCl || null,
          }
        : null;

      const { error } = await supabase
        .from("admissions")
        .update({
          admission_diagnoses: diagnoses,
          oxygen_requirement: oxygenRequirement,
          respiratory_score: formData.respiratoryScore || null,
          viral_panel: viralPanelItems.length > 0 ? viralPanelItems.join(", ") : null,
          pending_tasks: formData.pendingTasks || null,
          antibiotics: antibioticsArray.length > 0 ? antibioticsArray : null,
          current_medications: formData.medications || null,
          diet: diet,
          iv_therapy: ivTherapy,
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

  const handleDiagnosisKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && diagnosisInput.trim()) {
      e.preventDefault();
      setDiagnoses([...diagnoses, diagnosisInput.trim()]);
      setDiagnosisInput("");
    }
  };

  const removeDiagnosis = (index: number) => {
    setDiagnoses(diagnoses.filter((_, i) => i !== index));
  };

  const addViralPanelItem = (value: string) => {
    if (value && !viralPanelItems.includes(value)) {
      setViralPanelItems([...viralPanelItems, value]);
    }
  };

  const removeViralPanelItem = (index: number) => {
    setViralPanelItems(viralPanelItems.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Diagnósticos con Tags */}
      <div>
        <Label htmlFor="diagnoses">Diagnósticos</Label>
        <Input
          id="diagnoses"
          value={diagnosisInput}
          onChange={(e) => setDiagnosisInput(e.target.value)}
          onKeyDown={handleDiagnosisKeyDown}
          placeholder="Escribir diagnóstico y presionar Enter"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {diagnoses.map((dx, index) => (
            <Badge key={index} variant="secondary" className="gap-1">
              {dx}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => removeDiagnosis(index)}
              />
            </Badge>
          ))}
        </div>
      </div>

      {/* Oxígeno */}
      <div className="space-y-4">
        <OxygenTherapySelector
          value={{
            type: formData.oxygenType,
            flow: formData.oxygenFlow,
            peep: formData.oxygenPeep,
            fio2: formData.oxygenFio2,
          }}
          onChange={(oxygenData) => {
            setFormData({
              ...formData,
              oxygenType: oxygenData.type,
              oxygenFlow: oxygenData.flow,
              oxygenPeep: oxygenData.peep || "",
              oxygenFio2: oxygenData.fio2 || "",
            });
          }}
        />
      </div>

      {/* Score Respiratorio */}
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
        
        {(formData.respiratoryScore === "TAL" || formData.respiratoryScore === "Pulmonary") && (
          <ScoreSelector 
            scoreType={formData.respiratoryScore as "TAL" | "Pulmonary"}
            patientAge={patientAge}
            hasSupplementalOxygen={!!formData.oxygenType}
            onScoreCalculated={(result) => {
              console.log("Score calculado:", result);
            }}
          />
        )}
      </div>

      {/* Panel Respiratorio */}
      <div>
        <Label htmlFor="viralPanel">Panel Respiratorio</Label>
        <Select
          value=""
          onValueChange={(value) => addViralPanelItem(value)}
        >
          <SelectTrigger id="viralPanel">
            <SelectValue placeholder="Seleccionar agente etiológico" />
          </SelectTrigger>
          <SelectContent className="bg-background">
            <SelectItem value="Pendiente">Pendiente</SelectItem>
            <SelectItem value="VRS +">VRS (Virus Respiratorio Sincicial) +</SelectItem>
            <SelectItem value="Influenza A +">Influenza A +</SelectItem>
            <SelectItem value="Influenza B +">Influenza B +</SelectItem>
            <SelectItem value="Adenovirus +">Adenovirus +</SelectItem>
            <SelectItem value="Parainfluenza +">Parainfluenza +</SelectItem>
            <SelectItem value="Metapneumovirus +">Metapneumovirus +</SelectItem>
            <SelectItem value="Rinovirus +">Rinovirus +</SelectItem>
            <SelectItem value="SARS-CoV-2 (COVID-19) +">SARS-CoV-2 (COVID-19) +</SelectItem>
            <SelectItem value="Neumococo +">Neumococo +</SelectItem>
            <SelectItem value="H. influenzae +">H. influenzae +</SelectItem>
            <SelectItem value="M. pneumoniae +">M. pneumoniae +</SelectItem>
            <SelectItem value="Panel negativo">Panel Negativo</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex flex-wrap gap-2 mt-2">
          {viralPanelItems.map((item, index) => (
            <Badge key={index} variant="default" className="gap-1 bg-primary">
              {item}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => removeViralPanelItem(index)}
              />
            </Badge>
          ))}
        </div>
      </div>

      {/* Alimentación */}
      <div className="space-y-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
        <Label className="text-base font-semibold">Alimentación</Label>
        <div>
          <Label htmlFor="dietType">Tipo de Régimen</Label>
          <Select
            value={formData.dietType}
            onValueChange={(value) => setFormData({ ...formData, dietType: value })}
          >
            <SelectTrigger id="dietType">
              <SelectValue placeholder="Seleccionar régimen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Régimen cero">Régimen cero (NPO)</SelectItem>
              <SelectItem value="Régimen común">Régimen común</SelectItem>
              <SelectItem value="Régimen liviano">Régimen liviano</SelectItem>
              <SelectItem value="Selectividad alimentaria">Selectividad alimentaria</SelectItem>
              <SelectItem value="Sin gluten">Sin gluten (Celiaquía)</SelectItem>
              <SelectItem value="Sin lactosa">Sin lactosa</SelectItem>
              <SelectItem value="Sin APLV">Sin proteínas leche vaca (APLV)</SelectItem>
              <SelectItem value="Fórmula elemental">Fórmula elemental</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="dietNotes">Notas sobre Alimentación</Label>
          <Textarea
            id="dietNotes"
            value={formData.dietNotes}
            onChange={(e) => setFormData({ ...formData, dietNotes: e.target.value })}
            placeholder="Ej: Aceptación 50%, necesita estímulo"
            rows={2}
          />
        </div>
      </div>

      {/* Sueroterapia EV */}
      <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Sueroterapia EV</Label>
          <div className="flex items-center gap-2">
            <Label htmlFor="ivTherapyActive" className="text-sm">Activa</Label>
            <Switch
              id="ivTherapyActive"
              checked={formData.ivTherapyActive}
              onCheckedChange={(checked) => setFormData({ ...formData, ivTherapyActive: checked })}
            />
          </div>
        </div>
        
        {formData.ivTherapyActive && (
          <>
            <div>
              <Label htmlFor="ivTherapyType">Tipo de Suero</Label>
              <Select
                value={formData.ivTherapyType || ""}
                onValueChange={(value) => setFormData({ ...formData, ivTherapyType: value })}
              >
                <SelectTrigger id="ivTherapyType">
                  <SelectValue placeholder="Seleccionar tipo de suero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SF 0.9%">Suero Fisiológico 0.9%</SelectItem>
                  <SelectItem value="Ringer Lactato">Ringer Lactato</SelectItem>
                  <SelectItem value="Glucosado 2.5%">Suero Glucosado 2.5%</SelectItem>
                  <SelectItem value="Glucosado 5%">Suero Glucosado 5%</SelectItem>
                  <SelectItem value="Glucosado 7.5%">Suero Glucosado 7.5%</SelectItem>
                  <SelectItem value="Glucosado 10%">Suero Glucosado 10%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="ivTherapyPercentage">% de Requerimientos</Label>
              <Select
                value={formData.ivTherapyPercentage}
                onValueChange={(value) => setFormData({ ...formData, ivTherapyPercentage: value })}
              >
                <SelectTrigger id="ivTherapyPercentage">
                  <SelectValue placeholder="Seleccionar porcentaje" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50%">50%</SelectItem>
                  <SelectItem value="60%">60%</SelectItem>
                  <SelectItem value="70%">70%</SelectItem>
                  <SelectItem value="80%">80%</SelectItem>
                  <SelectItem value="90%">90%</SelectItem>
                  <SelectItem value="100%">100%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ivNaCl">NaCl 10%</Label>
                <Select
                  value={formData.ivNaCl || ""}
                  onValueChange={(value) => setFormData({ ...formData, ivNaCl: value })}
                >
                  <SelectTrigger id="ivNaCl">
                    <SelectValue placeholder="cc" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No aplica</SelectItem>
                    <SelectItem value="5cc">5 cc</SelectItem>
                    <SelectItem value="10cc">10 cc</SelectItem>
                    <SelectItem value="20cc">20 cc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="ivKCl">KCl 7.5%</Label>
                <Select
                  value={formData.ivKCl || ""}
                  onValueChange={(value) => setFormData({ ...formData, ivKCl: value })}
                >
                  <SelectTrigger id="ivKCl">
                    <SelectValue placeholder="cc" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No aplica</SelectItem>
                    <SelectItem value="5cc">5 cc</SelectItem>
                    <SelectItem value="10cc">10 cc</SelectItem>
                    <SelectItem value="20cc">20 cc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Medicamentos y Antibióticos */}
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

      {/* Tareas Pendientes */}
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
