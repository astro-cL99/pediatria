import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Plus, Trash2, FileText, Stethoscope, Activity, Droplets, FileSearch, ClipboardList, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AITextFormatter } from "./AITextFormatter";
import { FluidTherapyCalculator } from "./FluidTherapyCalculator";
import { CIE10Search } from "./CIE10Search";
import type { FluidTherapyCalculation } from "@/utils/fluidTherapy";

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
  const [activeTab, setActiveTab] = useState("evaluacion");
  
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

  // MEJORA 2: Scores respiratorios
  const [respiratoryScores, setRespiratoryScores] = useState({
    pulmonary_at_admission: "",
    pulmonary_current: "",
    tal_at_admission: "",
    tal_current: "",
  });

  // MEJORA 4: Fluidoterapia
  const [fluidCalculation, setFluidCalculation] = useState<FluidTherapyCalculation | null>(null);
  const [patientWeight, setPatientWeight] = useState<number>(0);
  const [patientHeight, setPatientHeight] = useState<number>(0);

  // Cargar peso y talla del paciente
  useEffect(() => {
    const loadPatientData = async () => {
      const { data } = await supabase
        .from("anthropometric_data")
        .select("weight_kg, height_cm")
        .eq("patient_id", patientId)
        .order("measured_at", { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setPatientWeight(Number(data.weight_kg) || 0);
        setPatientHeight(Number(data.height_cm) || 0);
      }
    };
    loadPatientData();
  }, [patientId]);

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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Debes iniciar sesión para guardar la evolución");
        return;
      }

      // Preparar scores respiratorios
      const scoresData = {
        ...(respiratoryScores.pulmonary_at_admission && respiratoryScores.pulmonary_current
          ? {
              pulmonary_score: {
                at_admission: Number(respiratoryScores.pulmonary_at_admission),
                current: Number(respiratoryScores.pulmonary_current),
                date_measured: new Date().toISOString(),
              },
            }
          : {}),
        ...(respiratoryScores.tal_at_admission && respiratoryScores.tal_current
          ? {
              tal_score: {
                at_admission: Number(respiratoryScores.tal_at_admission),
                current: Number(respiratoryScores.tal_current),
                date_measured: new Date().toISOString(),
              },
            }
          : {}),
      };

      const { data, error } = await supabase
        .from("daily_evolutions")
        .insert([
          {
            patient_id: patientId,
            admission_id: admissionId!,
            created_by: user.id,
            subjective: currentStatus,
            objective: JSON.stringify(physicalExam),
            assessment: diagnoses.filter(d => d.trim() !== "").join(", "),
            plan: plans.filter(p => p.trim() !== "").join(", "),
            vital_signs: vitalSigns,
            respiratory_scores: Object.keys(scoresData).length > 0 ? scoresData : null,
            fluid_calculations: fluidCalculation ? JSON.parse(JSON.stringify(fluidCalculation)) : null,
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="evaluacion">
            <Activity className="w-4 h-4 mr-2" />
            Evaluación
          </TabsTrigger>
          <TabsTrigger value="examen">
            <Stethoscope className="w-4 h-4 mr-2" />
            Examen Físico
          </TabsTrigger>
          <TabsTrigger value="scores">
            <FileSearch className="w-4 h-4 mr-2" />
            Scores & Labs
          </TabsTrigger>
          <TabsTrigger value="fluidos">
            <Droplets className="w-4 h-4 mr-2" />
            Fluidoterapia
          </TabsTrigger>
          <TabsTrigger value="plan">
            <ClipboardList className="w-4 h-4 mr-2" />
            Plan
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Evaluación (combina Diagnósticos + Estado Actual + Signos) */}
        <TabsContent value="evaluacion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📋 EVOLUCIÓN DIARIA</CardTitle>
              <CardDescription>Actualización: peso del día, fiebre, cambios ATB, exámenes, estado general</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Diagnósticos con CIE-10 */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Diagnósticos</Label>
                <CIE10Search
                  selectedDiagnoses={diagnoses}
                  onDiagnosesChange={setDiagnoses}
                />
              </div>

              {/* Estado Actual */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold">Evolución Actual</Label>
                  <AITextFormatter 
                    onFormat={(formattedText) => setCurrentStatus(formattedText)}
                    placeholder="Describa el estado actual del paciente..."
                    buttonText="Formatear con IA"
                  />
                </div>
                <Textarea
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value)}
                  placeholder="Describa el estado actual del paciente..."
                  rows={6}
                  className="min-h-[150px]"
                />
              </div>

              {/* Signos Vitales */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Signos Vitales</Label>
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
                    <Label>FC (lpm)</Label>
                    <Input
                      type="number"
                      value={vitalSigns.heartRate}
                      onChange={(e) => setVitalSigns({...vitalSigns, heartRate: e.target.value})}
                      placeholder="80"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>PA (mmHg)</Label>
                    <Input
                      value={vitalSigns.bloodPressure}
                      onChange={(e) => setVitalSigns({...vitalSigns, bloodPressure: e.target.value})}
                      placeholder="120/80"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>FR (rpm)</Label>
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
                <div className="flex justify-between items-center">
                  <Label>Evolución actual</Label>
                  <AITextFormatter 
                    onFormat={(formattedText) => setCurrentStatus(formattedText)}
                    placeholder="Describa el estado actual del paciente..."
                    buttonText="Formatear con IA"
                  />
                </div>
                <Textarea
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value)}
                  placeholder="Describa el estado actual del paciente..."
                  rows={8}
                  className="min-h-[200px]"
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

        {/* MEJORA 2: Scores Respiratorios */}
        <TabsContent value="scores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📊 Scores Respiratorios Evolutivos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Pulmonary Score</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Score al Ingreso</Label>
                    <Input
                      type="number"
                      min="0"
                      max="12"
                      value={respiratoryScores.pulmonary_at_admission}
                      onChange={(e) =>
                        setRespiratoryScores({
                          ...respiratoryScores,
                          pulmonary_at_admission: e.target.value,
                        })
                      }
                      placeholder="0-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Score Actual</Label>
                    <Input
                      type="number"
                      min="0"
                      max="12"
                      value={respiratoryScores.pulmonary_current}
                      onChange={(e) =>
                        setRespiratoryScores({
                          ...respiratoryScores,
                          pulmonary_current: e.target.value,
                        })
                      }
                      placeholder="0-12"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Score de Tal Modificado</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Score al Ingreso</Label>
                    <Input
                      type="number"
                      min="0"
                      max="12"
                      value={respiratoryScores.tal_at_admission}
                      onChange={(e) =>
                        setRespiratoryScores({
                          ...respiratoryScores,
                          tal_at_admission: e.target.value,
                        })
                      }
                      placeholder="0-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Score Actual</Label>
                    <Input
                      type="number"
                      min="0"
                      max="12"
                      value={respiratoryScores.tal_current}
                      onChange={(e) =>
                        setRespiratoryScores({
                          ...respiratoryScores,
                          tal_current: e.target.value,
                        })
                      }
                      placeholder="0-12"
                    />
                  </div>
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

        {/* MEJORA 4: Fluidoterapia */}
        <TabsContent value="fluidos">
          <FluidTherapyCalculator
            initialWeight={patientWeight}
            initialHeight={patientHeight}
            onCalculationComplete={setFluidCalculation}
          />
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
