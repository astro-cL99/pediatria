import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Plus, Trash2, FileText, Stethoscope, Activity, Droplets, FileSearch, ClipboardList } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CompleteEvolutionFormProps {
  patientId: string;
  admissionId?: string;
  onSuccess?: () => void;
  defaultDiagnoses?: string[];
  defaultVitalSigns?: {
    temperature?: string;
    heartRate?: string;
    respiratoryRate?: string;
    bloodPressure?: string;
    oxygenSaturation?: string;
  };
}

export function CompleteEvolutionForm({ 
  patientId, 
  admissionId, 
  onSuccess,
  defaultDiagnoses = [],
  defaultVitalSigns = {}
}: CompleteEvolutionFormProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("diagnosticos");
  
  // Form states
  const [diagnoses, setDiagnoses] = useState<string[]>(defaultDiagnoses);
  const [newDiagnosis, setNewDiagnosis] = useState("");
  const [currentStatus, setCurrentStatus] = useState("");
  const [vitalSigns, setVitalSigns] = useState({
    temperature: "",
    heartRate: "",
    respiratoryRate: "",
    bloodPressure: "",
    oxygenSaturation: "",
    ...defaultVitalSigns
  });
  const [physicalExam, setPhysicalExam] = useState({
    generalAppearance: "",
    headNeck: "",
    chest: "",
    heart: "",
    abdomen: "",
    extremities: "",
    neurological: "",
  });
  const [labResults, setLabResults] = useState("");
  const [imagingResults, setImagingResults] = useState("");
  const [plans, setPlans] = useState(["", "", ""]);
  const [indications, setIndications] = useState({
    diet: "",
    activity: "",
    nursingCare: "",
    medications: "",
    pending: "",
  });

  const addDiagnosis = () => {
    if (newDiagnosis.trim() && !diagnoses.includes(newDiagnosis)) {
      setDiagnoses([...diagnoses, newDiagnosis]);
      setNewDiagnosis("");
    }
  };

  const removeDiagnosis = (index: number) => {
    setDiagnoses(diagnoses.filter((_, i) => i !== index));
  };

  const addPlan = () => {
    setPlans([...plans, ""]);
  };

  const updatePlan = (index: number, value: string) => {
    const newPlans = [...plans];
    newPlans[index] = value;
    setPlans(newPlans);
  };

  const removePlan = (index: number) => {
    if (plans.length > 1) {
      setPlans(plans.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!admissionId) {
      toast.error("No hay un ingreso activo para registrar la evolución");
      return;
    }
    
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("evolutions")
        .insert([
          {
            patient_id: patientId,
            admission_id: admissionId,
            diagnoses: diagnoses.filter(d => d.trim() !== ""),
            current_status: currentStatus,
            vital_signs: vitalSigns,
            physical_exam: physicalExam,
            lab_results: labResults,
            imaging_results: imagingResults,
            plans: plans.filter(p => p.trim() !== ""),
            indications: indications,
          },
        ])
        .select();

      if (error) throw error;

      toast.success("Evolución registrada correctamente");
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error saving evolution:", error);
      toast.error("Error al guardar la evolución");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="diagnosticos">
            <FileText className="w-4 h-4 mr-2" />
            Diagnósticos
          </TabsTrigger>
          <TabsTrigger value="actual">
            <Activity className="w-4 h-4 mr-2" />
            Estado Actual
          </TabsTrigger>
          <TabsTrigger value="examen">
            <Stethoscope className="w-4 h-4 mr-2" />
            Examen Físico
          </TabsTrigger>
          <TabsTrigger value="estudios">
            <FileSearch className="w-4 h-4 mr-2" />
            Estudios
          </TabsTrigger>
          <TabsTrigger value="plan">
            <ClipboardList className="w-4 h-4 mr-2" />
            Plan e Indicaciones
          </TabsTrigger>
        </TabsList>

        {/* Diagnósticos */}
        <TabsContent value="diagnosticos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Diagnósticos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Agregar diagnóstico</Label>
                <div className="flex gap-2">
                  <Input
                    value={newDiagnosis}
                    onChange={(e) => setNewDiagnosis(e.target.value)}
                    placeholder="Nuevo diagnóstico"
                  />
                  <Button type="button" onClick={addDiagnosis} variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Lista de diagnósticos</Label>
                <div className="border rounded-md p-4 space-y-2">
                  {diagnoses.length > 0 ? (
                    <ul className="space-y-2">
                      {diagnoses.map((diagnosis, index) => (
                        <li key={index} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                          <span>{diagnosis}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeDiagnosis(index)}
                            className="h-6 w-6"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-sm">No hay diagnósticos agregados</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Estado Actual */}
        <TabsContent value="actual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estado Actual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Evolución actual</Label>
                <Textarea
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value)}
                  placeholder="Describa el estado actual del paciente..."
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Temperatura (°C)</Label>
                  <Input
                    type="number"
                    value={vitalSigns.temperature}
                    onChange={(e) => setVitalSigns({...vitalSigns, temperature: e.target.value})}
                    placeholder="36.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frecuencia Cardíaca (lpm)</Label>
                  <Input
                    type="number"
                    value={vitalSigns.heartRate}
                    onChange={(e) => setVitalSigns({...vitalSigns, heartRate: e.target.value})}
                    placeholder="80"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Presión Arterial (mmHg)</Label>
                  <Input
                    value={vitalSigns.bloodPressure}
                    onChange={(e) => setVitalSigns({...vitalSigns, bloodPressure: e.target.value})}
                    placeholder="120/80"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frecuencia Respiratoria (rpm)</Label>
                  <Input
                    type="number"
                    value={vitalSigns.respiratoryRate}
                    onChange={(e) => setVitalSigns({...vitalSigns, respiratoryRate: e.target.value})}
                    placeholder="16"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sat O₂ (%)</Label>
                  <Input
                    type="number"
                    value={vitalSigns.oxygenSaturation}
                    onChange={(e) => setVitalSigns({...vitalSigns, oxygenSaturation: e.target.value})}
                    placeholder="98"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Examen Físico */}
        <TabsContent value="examen" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Examen Físico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Apariencia General</Label>
                <Textarea
                  value={physicalExam.generalAppearance}
                  onChange={(e) => setPhysicalExam({...physicalExam, generalAppearance: e.target.value})}
                  placeholder="Estado general, hidratación, facies, estado nutricional..."
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cabeza y Cuello</Label>
                  <Textarea
                    value={physicalExam.headNeck}
                    onChange={(e) => setPhysicalExam({...physicalExam, headNeck: e.target.value})}
                    placeholder="Pupilas, mucosas, cuello..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tórax</Label>
                  <Textarea
                    value={physicalExam.chest}
                    onChange={(e) => setPhysicalExam({...physicalExam, chest: e.target.value})}
                    placeholder="Simetría, expansión, murmullo vesicular..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Corazón</Label>
                  <Textarea
                    value={physicalExam.heart}
                    onChange={(e) => setPhysicalExam({...physicalExam, heart: e.target.value})}
                    placeholder="Ruidos cardíacos, soplos, ritmo..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Abdomen</Label>
                  <Textarea
                    value={physicalExam.abdomen}
                    onChange={(e) => setPhysicalExam({...physicalExam, abdomen: e.target.value})}
                    placeholder="Forma, ruidos hidroaéreos, dolor a la palpación..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Extremidades</Label>
                  <Textarea
                    value={physicalExam.extremities}
                    onChange={(e) => setPhysicalExam({...physicalExam, extremities: e.target.value})}
                    placeholder="Pulsos periféricos, edemas, relleno capilar..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Neurológico</Label>
                  <Textarea
                    value={physicalExam.neurological}
                    onChange={(e) => setPhysicalExam({...physicalExam, neurological: e.target.value})}
                    placeholder="Estado de conciencia, pares craneales, fuerza muscular..."
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Estudios */}
        <TabsContent value="estudios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estudios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Exámenes de Laboratorio</Label>
                <Textarea
                  value={labResults}
                  onChange={(e) => setLabResults(e.target.value)}
                  placeholder="Ingrese resultados de laboratorio..."
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Imagenología</Label>
                <Textarea
                  value={imagingResults}
                  onChange={(e) => setImagingResults(e.target.value)}
                  placeholder="Ingrese resultados de imagenología..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plan e Indicaciones */}
        <TabsContent value="plan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plan e Indicaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Planes</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addPlan}>
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar Plan
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {plans.map((plan, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <Input
                          value={plan}
                          onChange={(e) => updatePlan(index, e.target.value)}
                          placeholder={`Plan ${index + 1}`}
                        />
                      </div>
                      {plans.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePlan(index)}
                          className="h-10 w-10"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium">Indicaciones</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Dieta</Label>
                    <Input
                      value={indications.diet}
                      onChange={(e) => setIndications({...indications, diet: e.target.value})}
                      placeholder="Ej: Régimen escolar liviano"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Actividad</Label>
                    <Input
                      value={indications.activity}
                      onChange={(e) => setIndications({...indications, activity: e.target.value})}
                      placeholder="Ej: Reposo relativo, Fowler 30°"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Cuidados de Enfermería</Label>
                    <Textarea
                      value={indications.nursingCare}
                      onChange={(e) => setIndications({...indications, nursingCare: e.target.value})}
                      placeholder="Ej: CSV c/6 horas, monitorización continua, O2 para Sat > 93%"
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Medicamentos</Label>
                    <Textarea
                      value={indications.medications}
                      onChange={(e) => setIndications({...indications, medications: e.target.value})}
                      placeholder="Ej: Ampicilina/Sulbactam 850mg c/6h EV, Paracetamol 250mg c/6h SOS"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Pendientes</Label>
                    <Textarea
                      value={indications.pending}
                      onChange={(e) => setIndications({...indications, pending: e.target.value})}
                      placeholder="Ej: Seguimiento por Infectología, control de exámenes"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end border-t pt-4">
              <Button type="submit" disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Guardando..." : "Guardar Evolución"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  );
}
