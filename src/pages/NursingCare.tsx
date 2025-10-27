import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Heart, Activity, Shield, ClipboardList } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  rut: string;
}

interface Admission {
  id: string;
  patient_id: string;
  admission_date: string;
  patients: Patient;
}

export default function NursingCare() {
  const [searchParams] = useSearchParams();
  const [activeAdmissions, setActiveAdmissions] = useState<Admission[]>([]);
  const [selectedAdmission, setSelectedAdmission] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isNurse, setIsNurse] = useState(false);

  // Braden Scale State
  const [bradenScore, setBradenScore] = useState({
    sensory_perception: 0,
    moisture: 0,
    activity: 0,
    mobility: 0,
    nutrition: 0,
    friction_shear: 0,
  });

  // Humpty Dumpty Scale State
  const [humptyScore, setHumptyScore] = useState({
    age: 0,
    gender: 0,
    diagnosis: 0,
    cognitive_impairment: 0,
    environmental_factors: 0,
    response_to_surgery: 0,
    medication_usage: 0,
  });

  // Care Plan State
  const [carePlan, setCarePlan] = useState("");
  const [activityLog, setActivityLog] = useState("");
  const [observations, setObservations] = useState("");

  useEffect(() => {
    checkNurseRole();
    fetchActiveAdmissions();
    const admissionId = searchParams.get("admission");
    if (admissionId) setSelectedAdmission(admissionId);
  }, [searchParams]);

  const checkNurseRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["nurse", "admin"]);

    setIsNurse(!!data && data.length > 0);
  };

  const fetchActiveAdmissions = async () => {
    const { data, error } = await supabase
      .from("admissions")
      .select("id, patient_id, admission_date, patients(id, name, rut)")
      .eq("status", "active")
      .order("admission_date", { ascending: false });

    if (error) {
      toast.error("Error al cargar ingresos activos");
      return;
    }
    setActiveAdmissions(data as any);
  };

  const calculateBradenTotal = () => {
    return Object.values(bradenScore).reduce((sum, val) => sum + val, 0);
  };

  const calculateHumptyTotal = () => {
    return Object.values(humptyScore).reduce((sum, val) => sum + val, 0);
  };

  const getBradenRisk = (total: number) => {
    if (total <= 9) return { level: "Riesgo Muy Alto", color: "text-red-600" };
    if (total <= 12) return { level: "Riesgo Alto", color: "text-orange-600" };
    if (total <= 14) return { level: "Riesgo Moderado", color: "text-yellow-600" };
    return { level: "Riesgo Bajo", color: "text-green-600" };
  };

  const getHumptyRisk = (total: number) => {
    if (total >= 12) return { level: "Riesgo Alto", color: "text-red-600" };
    if (total >= 7) return { level: "Riesgo Bajo", color: "text-yellow-600" };
    return { level: "Sin Riesgo", color: "text-green-600" };
  };

  const handleSubmitBraden = async () => {
    if (!selectedAdmission || !isNurse) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const admission = activeAdmissions.find(a => a.id === selectedAdmission);
      if (!admission) throw new Error("Admisión no encontrada");

      const total = calculateBradenTotal();
      const { error } = await supabase.from("nursing_records").insert([{
        patient_id: admission.patient_id,
        admission_id: selectedAdmission,
        record_type: "braden_scale",
        braden_score: { ...bradenScore, total_score: total },
        observations,
        created_by: user.id,
      }]);

      if (error) throw error;
      toast.success("Escala de Braden registrada exitosamente");
      setBradenScore({ sensory_perception: 0, moisture: 0, activity: 0, mobility: 0, nutrition: 0, friction_shear: 0 });
      setObservations("");
    } catch (error: any) {
      toast.error("Error al guardar escala de Braden");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitHumpty = async () => {
    if (!selectedAdmission || !isNurse) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const admission = activeAdmissions.find(a => a.id === selectedAdmission);
      if (!admission) throw new Error("Admisión no encontrada");

      const total = calculateHumptyTotal();
      const { error } = await supabase.from("nursing_records").insert([{
        patient_id: admission.patient_id,
        admission_id: selectedAdmission,
        record_type: "humpty_dumpty_scale",
        humpty_dumpty_score: { ...humptyScore, total_score: total },
        observations,
        created_by: user.id,
      }]);

      if (error) throw error;
      toast.success("Escala de Humpty Dumpty registrada exitosamente");
      setHumptyScore({ age: 0, gender: 0, diagnosis: 0, cognitive_impairment: 0, environmental_factors: 0, response_to_surgery: 0, medication_usage: 0 });
      setObservations("");
    } catch (error: any) {
      toast.error("Error al guardar escala de Humpty Dumpty");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCarePlan = async () => {
    if (!selectedAdmission || !isNurse) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const admission = activeAdmissions.find(a => a.id === selectedAdmission);
      if (!admission) throw new Error("Admisión no encontrada");

      const { error } = await supabase.from("nursing_records").insert([{
        patient_id: admission.patient_id,
        admission_id: selectedAdmission,
        record_type: "care_plan",
        care_plan: carePlan,
        observations,
        created_by: user.id,
      }]);

      if (error) throw error;
      toast.success("Plan de cuidados registrado exitosamente");
      setCarePlan("");
      setObservations("");
    } catch (error: any) {
      toast.error("Error al guardar plan de cuidados");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitActivityLog = async () => {
    if (!selectedAdmission || !isNurse) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const admission = activeAdmissions.find(a => a.id === selectedAdmission);
      if (!admission) throw new Error("Admisión no encontrada");

      const { error } = await supabase.from("nursing_records").insert([{
        patient_id: admission.patient_id,
        admission_id: selectedAdmission,
        record_type: "activity_log",
        activities_performed: activityLog,
        observations,
        created_by: user.id,
      }]);

      if (error) throw error;
      toast.success("Registro de actividad guardado exitosamente");
      setActivityLog("");
      setObservations("");
    } catch (error: any) {
      toast.error("Error al guardar registro de actividad");
    } finally {
      setLoading(false);
    }
  };

  if (!isNurse) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Esta sección es exclusiva para personal de enfermería.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const bradenTotal = calculateBradenTotal();
  const bradenRisk = getBradenRisk(bradenTotal);
  const humptyTotal = calculateHumptyTotal();
  const humptyRisk = getHumptyRisk(humptyTotal);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Heart className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Gestión de Enfermería</h1>
          <p className="text-muted-foreground">Registros, escalas y planes de cuidado</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedAdmission} onValueChange={setSelectedAdmission}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar ingreso activo..." />
            </SelectTrigger>
            <SelectContent>
              {activeAdmissions.map((admission) => (
                <SelectItem key={admission.id} value={admission.id}>
                  {admission.patients.name} - {admission.patients.rut}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedAdmission && (
        <Tabs defaultValue="braden" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="braden" className="gap-2">
              <Shield className="w-4 h-4" />
              Braden
            </TabsTrigger>
            <TabsTrigger value="humpty" className="gap-2">
              <Activity className="w-4 h-4" />
              Humpty Dumpty
            </TabsTrigger>
            <TabsTrigger value="care" className="gap-2">
              <Heart className="w-4 h-4" />
              Plan de Cuidados
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              Registro Actividades
            </TabsTrigger>
          </TabsList>

          <TabsContent value="braden" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Escala de Braden (Prevención de Úlceras por Presión)</CardTitle>
                <p className="text-sm text-muted-foreground">Puntaje Total: {bradenTotal} - <span className={bradenRisk.color}>{bradenRisk.level}</span></p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Percepción Sensorial (1-4)</Label>
                    <Input type="number" min="1" max="4" value={bradenScore.sensory_perception} onChange={(e) => setBradenScore({ ...bradenScore, sensory_perception: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Humedad (1-4)</Label>
                    <Input type="number" min="1" max="4" value={bradenScore.moisture} onChange={(e) => setBradenScore({ ...bradenScore, moisture: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Actividad (1-4)</Label>
                    <Input type="number" min="1" max="4" value={bradenScore.activity} onChange={(e) => setBradenScore({ ...bradenScore, activity: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Movilidad (1-4)</Label>
                    <Input type="number" min="1" max="4" value={bradenScore.mobility} onChange={(e) => setBradenScore({ ...bradenScore, mobility: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nutrición (1-4)</Label>
                    <Input type="number" min="1" max="4" value={bradenScore.nutrition} onChange={(e) => setBradenScore({ ...bradenScore, nutrition: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fricción y Cizallamiento (1-3)</Label>
                    <Input type="number" min="1" max="3" value={bradenScore.friction_shear} onChange={(e) => setBradenScore({ ...bradenScore, friction_shear: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Observaciones</Label>
                    <Textarea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Observaciones adicionales..." />
                  </div>
                </div>
                <Button onClick={handleSubmitBraden} disabled={loading}>Guardar Escala de Braden</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="humpty" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Escala de Humpty Dumpty (Riesgo de Caídas Pediátrico)</CardTitle>
                <p className="text-sm text-muted-foreground">Puntaje Total: {humptyTotal} - <span className={humptyRisk.color}>{humptyRisk.level}</span></p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Edad (1-4)</Label>
                    <Input type="number" min="1" max="4" value={humptyScore.age} onChange={(e) => setHumptyScore({ ...humptyScore, age: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Género (1-2)</Label>
                    <Input type="number" min="1" max="2" value={humptyScore.gender} onChange={(e) => setHumptyScore({ ...humptyScore, gender: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Diagnóstico (1-4)</Label>
                    <Input type="number" min="1" max="4" value={humptyScore.diagnosis} onChange={(e) => setHumptyScore({ ...humptyScore, diagnosis: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Deterioro Cognitivo (1-3)</Label>
                    <Input type="number" min="1" max="3" value={humptyScore.cognitive_impairment} onChange={(e) => setHumptyScore({ ...humptyScore, cognitive_impairment: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Factores Ambientales (1-4)</Label>
                    <Input type="number" min="1" max="4" value={humptyScore.environmental_factors} onChange={(e) => setHumptyScore({ ...humptyScore, environmental_factors: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Respuesta a Cirugía/Sedación (1-3)</Label>
                    <Input type="number" min="1" max="3" value={humptyScore.response_to_surgery} onChange={(e) => setHumptyScore({ ...humptyScore, response_to_surgery: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Uso de Medicamentos (1-3)</Label>
                    <Input type="number" min="1" max="3" value={humptyScore.medication_usage} onChange={(e) => setHumptyScore({ ...humptyScore, medication_usage: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Observaciones</Label>
                    <Textarea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Observaciones adicionales..." />
                  </div>
                </div>
                <Button onClick={handleSubmitHumpty} disabled={loading}>Guardar Escala de Humpty Dumpty</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="care" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Plan de Cuidados de Enfermería</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Plan de Cuidados</Label>
                  <Textarea rows={6} value={carePlan} onChange={(e) => setCarePlan(e.target.value)} placeholder="Describir plan de cuidados, objetivos, intervenciones..." required />
                </div>
                <div className="space-y-2">
                  <Label>Observaciones</Label>
                  <Textarea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Observaciones adicionales..." />
                </div>
                <Button onClick={handleSubmitCarePlan} disabled={loading || !carePlan}>Guardar Plan de Cuidados</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Registro de Actividades de Enfermería</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Actividades Realizadas</Label>
                  <Textarea rows={6} value={activityLog} onChange={(e) => setActivityLog(e.target.value)} placeholder="Registrar actividades realizadas (higiene, movilización, alimentación, administración de medicamentos, etc.)" required />
                </div>
                <div className="space-y-2">
                  <Label>Observaciones</Label>
                  <Textarea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Observaciones adicionales..." />
                </div>
                <Button onClick={handleSubmitActivityLog} disabled={loading || !activityLog}>Guardar Registro de Actividades</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}