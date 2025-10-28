import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Stethoscope, Activity, Droplets, FileSearch, ClipboardList, TestTube } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FluidTherapyCalculator } from "./FluidTherapyCalculator";
import { CIE10Search } from "./CIE10Search";
import { ScoreSelector } from "./ScoreSelector";
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
  
  // Diagnósticos
  const [diagnoses, setDiagnoses] = useState<string[]>(defaultDiagnoses);
  
  // Estado Actual estructurado
  const [currentStatus, setCurrentStatus] = useState({
    generalCondition: "",
    accompaniedBy: "",
    symptoms: "",
    urine: true,
    stool: true,
    painLevel: "Sin dolor",
    freeText: "",
  });
  
  // Signos Vitales
  const [vitalSigns, setVitalSigns] = useState({
    weight: "",
    height: "",
    temperature: "",
    heartRate: "",
    respiratoryRate: "",
    bloodPressure: "",
    oxygenSaturation: "",
    oxygenSupport: "",
    ...defaultVitalSigns
  });
  
  // Examen Físico
  const [physicalExam, setPhysicalExam] = useState({
    consciousness: "",
    skinPerfusion: "",
    headNeck: "",
    chest: "",
    heart: "",
    abdomen: "",
    extremities: "",
    neurological: "",
  });
  
  // Exámenes Complementarios
  const [exams, setExams] = useState({
    labResults: "",
    imagingResults: "",
  });
  
  // Scores Respiratorios
  const [respiratoryScore, setRespiratoryScore] = useState({
    type: "",
    value: "",
  });
  
  // Planes por Sistema
  const [systemPlans, setSystemPlans] = useState({
    fen: "",
    respiratory: "",
    infectious: "",
    neurological: "",
    cardiovascular: "",
    other: "",
  });
  
  // Indicaciones
  const [indications, setIndications] = useState({
    position: "",
    diet: "",
    nursingCare: [] as string[],
    medications: "",
    exams: "",
    consultations: "",
    pending: "",
  });

  // Fluidoterapia
  const [fluidCalculation, setFluidCalculation] = useState<FluidTherapyCalculation | null>(null);
  const [patientWeight, setPatientWeight] = useState<number>(0);
  const [patientHeight, setPatientHeight] = useState<number>(0);

  // Cargar datos del paciente
  useEffect(() => {
    const loadPatientData = async () => {
      const { data } = await supabase
        .from("anthropometric_data")
        .select("weight_kg, height_cm")
        .eq("patient_id", patientId)
        .order("measured_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) {
        setPatientWeight(Number(data.weight_kg) || 0);
        setPatientHeight(Number(data.height_cm) || 0);
        setVitalSigns(prev => ({
          ...prev,
          weight: data.weight_kg?.toString() || "",
          height: data.height_cm?.toString() || "",
        }));
      }
    };
    loadPatientData();
  }, [patientId]);

  const toggleNursingCare = (care: string) => {
    setIndications(prev => ({
      ...prev,
      nursingCare: prev.nursingCare.includes(care)
        ? prev.nursingCare.filter(c => c !== care)
        : [...prev.nursingCare, care]
    }));
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

      // Preparar estado actual como texto
      const currentStatusText = `${currentStatus.generalCondition}. ${currentStatus.accompaniedBy ? `Acompañado por ${currentStatus.accompaniedBy}.` : ''} ${currentStatus.symptoms}. ${currentStatus.painLevel}. Diuresis ${currentStatus.urine ? '(+)' : '(-)'}, Deposiciones ${currentStatus.stool ? '(+)' : '(-)'}.${currentStatus.freeText ? ` ${currentStatus.freeText}` : ''}`;

      // Preparar examen físico como texto
      const examText = `CSV: PA ${vitalSigns.bloodPressure || 'N/A'} mmHg, FC ${vitalSigns.heartRate || 'N/A'} lpm, FR ${vitalSigns.respiratoryRate || 'N/A'} rpm, T° ${vitalSigns.temperature || 'N/A'}°C, SatO2 ${vitalSigns.oxygenSaturation || 'N/A'}% ${vitalSigns.oxygenSupport || 'ambiente'}

${physicalExam.consciousness}
${physicalExam.skinPerfusion}
${physicalExam.headNeck ? `Cabeza y Cuello: ${physicalExam.headNeck}` : ''}
${physicalExam.chest ? `Tórax: ${physicalExam.chest}` : ''}
${physicalExam.heart ? `Cardiovascular: ${physicalExam.heart}` : ''}
${physicalExam.abdomen ? `Abdomen: ${physicalExam.abdomen}` : ''}
${physicalExam.extremities ? `Extremidades: ${physicalExam.extremities}` : ''}
${physicalExam.neurological ? `Neurológico: ${physicalExam.neurological}` : ''}`;

      // Preparar planes por sistema
      const allPlans = Object.entries(systemPlans)
        .filter(([_, value]) => value.trim())
        .map(([system, plan]) => {
          const systemNames: Record<string, string> = {
            fen: 'FEN (Fluidos, Electrolitos, Nutrición)',
            respiratory: 'Respiratorio',
            infectious: 'Infeccioso',
            neurological: 'Neurológico',
            cardiovascular: 'Cardiovascular',
            other: 'Otros'
          };
          return `${systemNames[system]}: ${plan}`;
        })
        .join("\n\n");

      // Preparar indicaciones
      const indicationsText = `Posición: ${indications.position || 'N/A'}
Régimen: ${indications.diet || 'N/A'}
Cuidados enfermería: ${indications.nursingCare.join(', ') || 'N/A'}
Medicamentos: ${indications.medications || 'N/A'}
Exámenes pendientes: ${indications.exams || 'N/A'}
Interconsultas: ${indications.consultations || 'N/A'}
Pendientes: ${indications.pending || 'N/A'}`;

      const { error } = await supabase
        .from("daily_evolutions")
        .insert([
          {
            patient_id: patientId,
            admission_id: admissionId!,
            created_by: user.id,
            subjective: currentStatusText,
            objective: examText,
            assessment: diagnoses.join(", "),
            plan: allPlans + "\n\nINDICACIONES:\n" + indicationsText,
            vital_signs: vitalSigns,
            respiratory_scores: respiratoryScore.type && respiratoryScore.value 
              ? { type: respiratoryScore.type, value: respiratoryScore.value } as any
              : null,
            fluid_calculations: fluidCalculation as any,
          },
        ]);

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
            <TestTube className="w-4 h-4 mr-2" />
            Labs & Scores
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

        {/* Tab 1: Evaluación */}
        <TabsContent value="evaluacion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📋 EVOLUCIÓN DIARIA</CardTitle>
              <CardDescription>Estado actual del paciente y signos vitales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Diagnósticos */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Diagnósticos</Label>
                <CIE10Search
                  selectedDiagnoses={diagnoses}
                  onDiagnosesChange={setDiagnoses}
                />
              </div>

              {/* Estado Actual con menús desplegables */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Estado Actual</Label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Condición General</Label>
                    <Select
                      value={currentStatus.generalCondition}
                      onValueChange={(value) => setCurrentStatus({...currentStatus, generalCondition: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="Estable, en buenas condiciones generales">Estable, buenas condiciones</SelectItem>
                        <SelectItem value="Estable hemodinámicamente">Estable hemodinámicamente</SelectItem>
                        <SelectItem value="Lúcido y orientado en TEP">Lúcido y orientado</SelectItem>
                        <SelectItem value="En buenas condiciones generales, jugando">Buenas condiciones, jugando</SelectItem>
                        <SelectItem value="Inestable, requiere monitorización">Inestable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Acompañado por</Label>
                    <Select
                      value={currentStatus.accompaniedBy}
                      onValueChange={(value) => setCurrentStatus({...currentStatus, accompaniedBy: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="Madre">Madre</SelectItem>
                        <SelectItem value="Padre">Padre</SelectItem>
                        <SelectItem value="Ambos padres">Ambos padres</SelectItem>
                        <SelectItem value="Abuela">Abuela</SelectItem>
                        <SelectItem value="Familiar">Otro familiar</SelectItem>
                        <SelectItem value="Solo">Solo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Dolor</Label>
                  <Select
                    value={currentStatus.painLevel}
                    onValueChange={(value) => setCurrentStatus({...currentStatus, painLevel: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="Sin dolor">Sin dolor</SelectItem>
                      <SelectItem value="Dolor leve">Dolor leve</SelectItem>
                      <SelectItem value="Dolor moderado">Dolor moderado</SelectItem>
                      <SelectItem value="Dolor severo">Dolor severo</SelectItem>
                      <SelectItem value="No refiere dolor ni molestias">No refiere dolor ni molestias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="urine"
                      checked={currentStatus.urine}
                      onCheckedChange={(checked) => setCurrentStatus({...currentStatus, urine: checked as boolean})}
                    />
                    <Label htmlFor="urine" className="cursor-pointer">Diuresis (+)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="stool"
                      checked={currentStatus.stool}
                      onCheckedChange={(checked) => setCurrentStatus({...currentStatus, stool: checked as boolean})}
                    />
                    <Label htmlFor="stool" className="cursor-pointer">Deposiciones (+)</Label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Síntomas y Evolución</Label>
                  <Textarea
                    value={currentStatus.symptoms}
                    onChange={(e) => setCurrentStatus({...currentStatus, symptoms: e.target.value})}
                    placeholder="Ej: Afebril, eupneico, tolerando vía oral sin incidentes, sin uso de musculatura accesoria..."
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Texto Adicional (Opcional)</Label>
                  <Textarea
                    value={currentStatus.freeText}
                    onChange={(e) => setCurrentStatus({...currentStatus, freeText: e.target.value})}
                    placeholder="Información adicional relevante..."
                    rows={2}
                  />
                </div>
              </div>

              {/* Signos Vitales */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Signos Vitales (CSV)</Label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Peso (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={vitalSigns.weight}
                      onChange={(e) => setVitalSigns({...vitalSigns, weight: e.target.value})}
                      placeholder="Peso actual"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Talla (cm)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={vitalSigns.height}
                      onChange={(e) => setVitalSigns({...vitalSigns, height: e.target.value})}
                      placeholder="Talla actual"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label>T° (°C)</Label>
                    <Input
                      type="number"
                      step="0.1"
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
                    <Label>SatO₂ (%)</Label>
                    <Input
                      type="number"
                      value={vitalSigns.oxygenSaturation}
                      onChange={(e) => setVitalSigns({...vitalSigns, oxygenSaturation: e.target.value})}
                      placeholder="98"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Aporte de O₂</Label>
                  <Select
                    value={vitalSigns.oxygenSupport}
                    onValueChange={(value) => setVitalSigns({...vitalSigns, oxygenSupport: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="Ambiente">Ambiente (AMB)</SelectItem>
                      <SelectItem value="1L O2 x NRC">1L O₂ x NRC</SelectItem>
                      <SelectItem value="2L O2 x NRC">2L O₂ x NRC</SelectItem>
                      <SelectItem value="3L O2 x NRC">3L O₂ x NRC</SelectItem>
                      <SelectItem value="Venturi FiO2 35%">Venturi FiO₂ 35%</SelectItem>
                      <SelectItem value="Venturi FiO2 40%">Venturi FiO₂ 40%</SelectItem>
                      <SelectItem value="CNAF">CNAF</SelectItem>
                      <SelectItem value="CPAP">CPAP</SelectItem>
                      <SelectItem value="VMI">VMI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Examen Físico */}
        <TabsContent value="examen" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Examen Físico Detallado</CardTitle>
              <CardDescription>Evaluación por sistemas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estado de Conciencia</Label>
                  <Select
                    value={physicalExam.consciousness}
                    onValueChange={(value) => setPhysicalExam({...physicalExam, consciousness: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="Vigil, atento, cooperador">Vigil, atento, cooperador</SelectItem>
                      <SelectItem value="Vigil, orientado en TEP">Vigil, orientado en TEP</SelectItem>
                      <SelectItem value="Somnoliento pero reactivo">Somnoliento pero reactivo</SelectItem>
                      <SelectItem value="Irritable">Irritable</SelectItem>
                      <SelectItem value="Letárgico">Letárgico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Piel y Perfusión</Label>
                  <Select
                    value={physicalExam.skinPerfusion}
                    onValueChange={(value) => setPhysicalExam({...physicalExam, skinPerfusion: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="Bien hidratado y perfundido, llene capilar < 2 seg">Bien hidratado, LLC {"<"}2s</SelectItem>
                      <SelectItem value="Piel sin lesiones, mucosas hidratadas">Piel sin lesiones, hidratado</SelectItem>
                      <SelectItem value="Deshidratado leve">Deshidratado leve</SelectItem>
                      <SelectItem value="Pálido, mala perfusión">Pálido, mala perfusión</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cabeza, Cuello y Faringe */}
                <div className="space-y-2">
                  <Label>Cabeza, Cuello y Faringe</Label>
                  <Select
                    value={physicalExam.headNeck === "" ? "" : physicalExam.headNeck.startsWith("Ej:") ? "free" : physicalExam.headNeck}
                    onValueChange={(value) => {
                      if (value === "free") {
                        setPhysicalExam({...physicalExam, headNeck: ""});
                      } else {
                        setPhysicalExam({...physicalExam, headNeck: value});
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="Faringe sin eritema, amígdalas eutróficas sin exudado. Cuello sin adenopatías.">Normal - Sin eritema</SelectItem>
                      <SelectItem value="Faringe eritematosa, amígdalas hipertróficas. Cuello sin adenopatías.">Faringe eritematosa</SelectItem>
                      <SelectItem value="Amígdalas con exudado purulento. Adenopatías cervicales palpables.">Con exudado y adenopatías</SelectItem>
                      <SelectItem value="Cuello móvil, sin rigidez. Faringe normal.">Cuello móvil sin rigidez</SelectItem>
                      <SelectItem value="free">✏️ Texto libre</SelectItem>
                    </SelectContent>
                  </Select>
                  {(physicalExam.headNeck === "" || !["Faringe sin eritema, amígdalas eutróficas sin exudado. Cuello sin adenopatías.", "Faringe eritematosa, amígdalas hipertróficas. Cuello sin adenopatías.", "Amígdalas con exudado purulento. Adenopatías cervicales palpables.", "Cuello móvil, sin rigidez. Faringe normal."].includes(physicalExam.headNeck)) && (
                    <Textarea
                      value={physicalExam.headNeck}
                      onChange={(e) => setPhysicalExam({...physicalExam, headNeck: e.target.value})}
                      placeholder="Ej: Faringe sin eritema, amígdalas eutróficas sin exudado. Cuello sin adenopatías."
                      rows={2}
                    />
                  )}
                </div>

                {/* Tórax y Pulmones */}
                <div className="space-y-2">
                  <Label>Tórax y Pulmones</Label>
                  <Select
                    value={physicalExam.chest === "" ? "" : physicalExam.chest.startsWith("Ej:") ? "free" : physicalExam.chest}
                    onValueChange={(value) => {
                      if (value === "free") {
                        setPhysicalExam({...physicalExam, chest: ""});
                      } else {
                        setPhysicalExam({...physicalExam, chest: value});
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="Simétrico, normoexpansible, MP+, sin sibilancias espiratorias, sin UMA.">Simétrico, normoexpansible, MP+</SelectItem>
                      <SelectItem value="Simétrico, normoexpansible, MP+, sibilancias espiratorias, sin UMA.">Con sibilancias espiratorias</SelectItem>
                      <SelectItem value="Uso de musculatura accesoria, retracciones subcostales, sibilancias bilaterales.">Retracciones y sibilancias</SelectItem>
                      <SelectItem value="Crepitaciones bilaterales, sin sibilancias.">Crepitaciones bilaterales</SelectItem>
                      <SelectItem value="free">✏️ Texto libre</SelectItem>
                    </SelectContent>
                  </Select>
                  {(physicalExam.chest === "" || !["Simétrico, normoexpansible, MP+, sin sibilancias espiratorias, sin UMA.", "Simétrico, normoexpansible, MP+, sibilancias espiratorias, sin UMA.", "Uso de musculatura accesoria, retracciones subcostales, sibilancias bilaterales.", "Crepitaciones bilaterales, sin sibilancias."].includes(physicalExam.chest)) && (
                    <Textarea
                      value={physicalExam.chest}
                      onChange={(e) => setPhysicalExam({...physicalExam, chest: e.target.value})}
                      placeholder="Ej: Simétrico, normoexpansible, MP+, sibilancias espiratorias, sin UMA."
                      rows={2}
                    />
                  )}
                </div>

                {/* Cardiovascular */}
                <div className="space-y-2">
                  <Label>Cardiovascular</Label>
                  <Select
                    value={physicalExam.heart === "" ? "" : physicalExam.heart.startsWith("Ej:") ? "free" : physicalExam.heart}
                    onValueChange={(value) => {
                      if (value === "free") {
                        setPhysicalExam({...physicalExam, heart: ""});
                      } else {
                        setPhysicalExam({...physicalExam, heart: value});
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="RR2T NAS, sin soplos audibles, normocárdico.">RR2T NAS, sin soplos</SelectItem>
                      <SelectItem value="RR2T NAS, sin soplos audibles, taquicárdico.">Taquicárdico, sin soplos</SelectItem>
                      <SelectItem value="Soplo sistólico audible, normocárdico.">Con soplo sistólico</SelectItem>
                      <SelectItem value="Pulsos periféricos palpables y simétricos, llene capilar < 2 segundos.">Pulsos normales, LLC {"<"}2s</SelectItem>
                      <SelectItem value="free">✏️ Texto libre</SelectItem>
                    </SelectContent>
                  </Select>
                  {(physicalExam.heart === "" || !["RR2T NAS, sin soplos audibles, normocárdico.", "RR2T NAS, sin soplos audibles, taquicárdico.", "Soplo sistólico audible, normocárdico.", "Pulsos periféricos palpables y simétricos, llene capilar < 2 segundos."].includes(physicalExam.heart)) && (
                    <Textarea
                      value={physicalExam.heart}
                      onChange={(e) => setPhysicalExam({...physicalExam, heart: e.target.value})}
                      placeholder="Ej: RR2T NAS, sin soplos audibles, normocárdico."
                      rows={2}
                    />
                  )}
                </div>

                {/* Abdomen */}
                <div className="space-y-2">
                  <Label>Abdomen</Label>
                  <Select
                    value={physicalExam.abdomen === "" ? "" : physicalExam.abdomen.startsWith("Ej:") ? "free" : physicalExam.abdomen}
                    onValueChange={(value) => {
                      if (value === "free") {
                        setPhysicalExam({...physicalExam, abdomen: ""});
                      } else {
                        setPhysicalExam({...physicalExam, abdomen: value});
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="Blando, depresible, no doloroso, RHA+, no visceromegalias.">Blando, depresible, RHA+</SelectItem>
                      <SelectItem value="Blando, depresible, doloroso a la palpación, RHA+.">Doloroso a la palpación</SelectItem>
                      <SelectItem value="Distendido, RHA disminuidos, no visceromegalias.">Distendido, RHA disminuidos</SelectItem>
                      <SelectItem value="Hepatomegalia palpable, RHA+.">Con hepatomegalia</SelectItem>
                      <SelectItem value="free">✏️ Texto libre</SelectItem>
                    </SelectContent>
                  </Select>
                  {(physicalExam.abdomen === "" || !["Blando, depresible, no doloroso, RHA+, no visceromegalias.", "Blando, depresible, doloroso a la palpación, RHA+.", "Distendido, RHA disminuidos, no visceromegalias.", "Hepatomegalia palpable, RHA+."].includes(physicalExam.abdomen)) && (
                    <Textarea
                      value={physicalExam.abdomen}
                      onChange={(e) => setPhysicalExam({...physicalExam, abdomen: e.target.value})}
                      placeholder="Ej: Blando, depresible, no doloroso, RHA+, no visceromegalias."
                      rows={2}
                    />
                  )}
                </div>

                {/* Extremidades */}
                <div className="space-y-2">
                  <Label>Extremidades</Label>
                  <Select
                    value={physicalExam.extremities === "" ? "" : physicalExam.extremities.startsWith("Ej:") ? "free" : physicalExam.extremities}
                    onValueChange={(value) => {
                      if (value === "free") {
                        setPhysicalExam({...physicalExam, extremities: ""});
                      } else {
                        setPhysicalExam({...physicalExam, extremities: value});
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="Simétricas, sin edema, pulsos presentes.">Simétricas, sin edema</SelectItem>
                      <SelectItem value="Simétricas, móviles, perfusión distal conservada.">Móviles, perfusión conservada</SelectItem>
                      <SelectItem value="Edema en miembros inferiores.">Con edema en MMII</SelectItem>
                      <SelectItem value="Lesiones en piel, sin edema.">Con lesiones en piel</SelectItem>
                      <SelectItem value="free">✏️ Texto libre</SelectItem>
                    </SelectContent>
                  </Select>
                  {(physicalExam.extremities === "" || !["Simétricas, sin edema, pulsos presentes.", "Simétricas, móviles, perfusión distal conservada.", "Edema en miembros inferiores.", "Lesiones en piel, sin edema."].includes(physicalExam.extremities)) && (
                    <Textarea
                      value={physicalExam.extremities}
                      onChange={(e) => setPhysicalExam({...physicalExam, extremities: e.target.value})}
                      placeholder="Ej: Simétricas, sin edema, pulsos presentes."
                      rows={2}
                    />
                  )}
                </div>

                {/* Neurológico */}
                <div className="space-y-2">
                  <Label>Neurológico</Label>
                  <Select
                    value={physicalExam.neurological === "" ? "" : physicalExam.neurological.startsWith("Ej:") ? "free" : physicalExam.neurological}
                    onValueChange={(value) => {
                      if (value === "free") {
                        setPhysicalExam({...physicalExam, neurological: ""});
                      } else {
                        setPhysicalExam({...physicalExam, neurological: value});
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="Sin focalidad, pares craneales normales, fuerza conservada.">Sin focalidad, pares normales</SelectItem>
                      <SelectItem value="Alerta, reactivo, sin déficit neurológico aparente.">Alerta, reactivo</SelectItem>
                      <SelectItem value="Reflejos osteotendinosos presentes y simétricos.">ROT presentes y simétricos</SelectItem>
                      <SelectItem value="Signos meníngeos negativos.">Signos meníngeos negativos</SelectItem>
                      <SelectItem value="free">✏️ Texto libre</SelectItem>
                    </SelectContent>
                  </Select>
                  {(physicalExam.neurological === "" || !["Sin focalidad, pares craneales normales, fuerza conservada.", "Alerta, reactivo, sin déficit neurológico aparente.", "Reflejos osteotendinosos presentes y simétricos.", "Signos meníngeos negativos."].includes(physicalExam.neurological)) && (
                    <Textarea
                      value={physicalExam.neurological}
                      onChange={(e) => setPhysicalExam({...physicalExam, neurological: e.target.value})}
                      placeholder="Ej: Sin focalidad, pares craneales normales, fuerza conservada."
                      rows={2}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Exámenes y Scores */}
        <TabsContent value="scores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📊 Exámenes Complementarios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Exámenes de Laboratorio</Label>
                <Textarea
                  value={exams.labResults}
                  onChange={(e) => setExams({...exams, labResults: e.target.value})}
                  placeholder="Ej: Hb 12.9, Hto 38.5, Leucos 8.000 (Seg 68%), PCR 22 mg/L, Plaquetas 223.000"
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Imagenología</Label>
                <Textarea
                  value={exams.imagingResults}
                  onChange={(e) => setExams({...exams, imagingResults: e.target.value})}
                  placeholder="Ej: Rx Tórax: infiltrado intersticial bilateral, TC Cerebro: sin hallazgos agudos"
                  rows={3}
                />
              </div>

              <div className="space-y-4 mt-6">
                <Label className="text-base font-semibold">Score Respiratorio</Label>
                <div className="space-y-2">
                  <Label>Tipo de Score</Label>
                  <Select
                    value={respiratoryScore.type}
                    onValueChange={(value) => setRespiratoryScore({...respiratoryScore, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar score" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="No aplica">No aplica</SelectItem>
                      <SelectItem value="TAL">TAL</SelectItem>
                      <SelectItem value="Pulmonary">Pulmonary (Wood-Downes)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {(respiratoryScore.type === "TAL" || respiratoryScore.type === "Pulmonary") && (
                  <ScoreSelector 
                    scoreType={respiratoryScore.type as "TAL" | "Pulmonary"}
                    onScoreCalculated={(result) => {
                      setRespiratoryScore({
                        ...respiratoryScore,
                        value: `${result.score} puntos - ${result.severity}`
                      });
                    }}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Fluidoterapia */}
        <TabsContent value="fluidos">
          <FluidTherapyCalculator
            initialWeight={patientWeight}
            initialHeight={patientHeight}
            onCalculationComplete={setFluidCalculation}
          />
        </TabsContent>

        {/* Tab 5: Planes por Sistema e Indicaciones */}
        <TabsContent value="plan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📝 Evaluación y Planes por Sistema</CardTitle>
              <CardDescription>Plan médico organizado por sistemas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-semibold">1) FEN (Fluidos, Electrolitos, Nutrición)</Label>
                  <Textarea
                    value={systemPlans.fen}
                    onChange={(e) => setSystemPlans({...systemPlans, fen: e.target.value})}
                    placeholder="Ej: Paciente tolerando vía oral sin incidentes. PLAN: Régimen escolar común a tolerancia."
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="font-semibold">2) Respiratorio</Label>
                  <Textarea
                    value={systemPlans.respiratory}
                    onChange={(e) => setSystemPlans({...systemPlans, respiratory: e.target.value})}
                    placeholder="Ej: Paciente con mejoría clínica, sin uso de musculatura accesoria. PLAN: Mantener O2 para Sat>93%, KNT c/8hrs."
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="font-semibold">3) Infeccioso</Label>
                  <Textarea
                    value={systemPlans.infectious}
                    onChange={(e) => setSystemPlans({...systemPlans, infectious: e.target.value})}
                    placeholder="Ej: En tratamiento con Ampicilina/Sulbactam D2/7, afebril. PLAN: Completar esquema antibiótico."
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="font-semibold">4) Neurológico</Label>
                  <Textarea
                    value={systemPlans.neurological}
                    onChange={(e) => setSystemPlans({...systemPlans, neurological: e.target.value})}
                    placeholder="Ej: Sin nuevos episodios convulsivos, mantiene tratamiento con FAE. PLAN: Seguimiento ambulatorio."
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="font-semibold">5) Cardiovascular</Label>
                  <Textarea
                    value={systemPlans.cardiovascular}
                    onChange={(e) => setSystemPlans({...systemPlans, cardiovascular: e.target.value})}
                    placeholder="Ej: Hemodinámicamente estable, sin conflicto. PLAN: Monitorización c/6hrs."
                    rows={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="font-semibold">Otros Sistemas</Label>
                  <Textarea
                    value={systemPlans.other}
                    onChange={(e) => setSystemPlans({...systemPlans, other: e.target.value})}
                    placeholder="Otros planes relevantes (Social, Quirúrgico, etc)"
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Indicaciones Médicas */}
          <Card>
            <CardHeader>
              <CardTitle>📋 INDICACIONES MÉDICAS</CardTitle>
              <CardDescription>Órdenes médicas y cuidados de enfermería</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Posición</Label>
                  <Select
                    value={indications.position}
                    onValueChange={(value) => setIndications({...indications, position: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar posición" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="Reposo relativo">Reposo relativo</SelectItem>
                      <SelectItem value="Fowler 30°">Fowler 30°</SelectItem>
                      <SelectItem value="Fowler 45°">Fowler 45°</SelectItem>
                      <SelectItem value="Decúbito lateral">Decúbito lateral</SelectItem>
                      <SelectItem value="Decúbito supino">Decúbito supino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Régimen / Dieta</Label>
                  <Select
                    value={indications.diet}
                    onValueChange={(value) => setIndications({...indications, diet: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar régimen" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="Régimen cero (NPO)">Régimen cero (NPO)</SelectItem>
                      <SelectItem value="Régimen común">Régimen común</SelectItem>
                      <SelectItem value="Régimen liviano">Régimen liviano</SelectItem>
                      <SelectItem value="Régimen escolar común">Régimen escolar común</SelectItem>
                      <SelectItem value="Régimen escolar liviano">Régimen escolar liviano</SelectItem>
                      <SelectItem value="A tolerancia">A tolerancia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cuidados de Enfermería</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-muted/30 rounded-lg">
                  {[
                    "VVP (mantener)",
                    "CSV c/6 horas",
                    "CSV c/8 horas",
                    "Curva febril",
                    "O2 para Sat >93%",
                    "Monitorización continua",
                    "HGT c/12 horas",
                    "Prevención LPP",
                    "Prevención caídas",
                    "Control balance hídrico",
                  ].map((care) => (
                    <div key={care} className="flex items-center space-x-2">
                      <Checkbox
                        id={care}
                        checked={indications.nursingCare.includes(care)}
                        onCheckedChange={() => toggleNursingCare(care)}
                      />
                      <Label htmlFor={care} className="cursor-pointer text-sm">{care}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Medicamentos (con dosis)</Label>
                <Textarea
                  value={indications.medications}
                  onChange={(e) => setIndications({...indications, medications: e.target.value})}
                  placeholder="Ej: Ampicilina/Sulbactam 1.8g c/6hrs EV (FI 21/10), Paracetamol 500mg c/6hrs VO SOS"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Exámenes Pendientes</Label>
                <Textarea
                  value={indications.exams}
                  onChange={(e) => setIndications({...indications, exams: e.target.value})}
                  placeholder="Ej: Rx control 23/10, Hemograma control"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Interconsultas</Label>
                <Textarea
                  value={indications.consultations}
                  onChange={(e) => setIndications({...indications, consultations: e.target.value})}
                  placeholder="Ej: Seguimiento por Infectología, Evaluación por Neurología"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Tareas Pendientes / Seguimiento</Label>
                <Textarea
                  value={indications.pending}
                  onChange={(e) => setIndications({...indications, pending: e.target.value})}
                  placeholder="Ej: Control ambulatorio Dr. Chasi, Derivar nutricionista CESFAM"
                  rows={2}
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end border-t pt-4">
              <Button type="submit" disabled={loading} className="gap-2">
                <Save className="w-4 h-4" />
                {loading ? "Guardando..." : "Guardar Evolución Completa"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  );
}
