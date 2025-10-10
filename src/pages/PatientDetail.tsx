import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Stethoscope, ClipboardList, Activity, FileSearch, Droplets } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CompleteEvolutionForm } from "@/components/CompleteEvolutionForm";
import { DailyEvolutionForm } from "@/components/DailyEvolutionForm";
import { EvolutionsList } from "@/components/EvolutionsList";
import { GrowthChart } from "@/components/GrowthChart";
import { AllergyAlert } from "@/components/AllergyAlert";
import { PatientTimeline } from "@/components/PatientTimeline";
import { LaboratoryExamsManager } from "@/components/LaboratoryExamsManager";

interface Admission {
  id: string;
  patient_id: string;
  admission_date: string;
  status: string;
}

interface Patient {
  id: string;
  name: string;
  rut: string;
  date_of_birth: string;
  blood_type: string | null;
  allergies: string | null;
  status: string;
  admission_date: string;
}

interface AnthroData {
  id: string;
  weight_kg: number;
  height_cm: number;
  bmi: number | null;
  body_surface_area: number | null;
  head_circumference_cm: number | null;
  measured_at: string;
}

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [anthroData, setAnthroData] = useState<AnthroData[]>([]);
  const [activeAdmission, setActiveAdmission] = useState<Admission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const fetchPatientData = async () => {
    try {
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .single();

      if (patientError) throw patientError;
      setPatient(patientData);

      const { data: anthroData, error: anthroError } = await supabase
        .from("anthropometric_data")
        .select("*")
        .eq("patient_id", id)
        .order("measured_at", { ascending: false });

      if (anthroError) throw anthroError;
      setAnthroData(anthroData || []);

      // Fetch active admission
      const { data: admission } = await supabase
        .from("admissions")
        .select("*")
        .eq("patient_id", id)
        .eq("status", "active")
        .order("admission_date", { ascending: false })
        .limit(1)
        .single();

      if (admission) {
        setActiveAdmission(admission);
      }
    } catch (error: any) {
      toast.error("Error al cargar datos del paciente");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    
    if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
      years--;
      months += 12;
    }

    if (years < 1) {
      return `${months} meses`;
    } else if (years < 2) {
      return `${years} año ${months} meses`;
    }
    return `${years} años`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Paciente no encontrado</p>
      </div>
    );
  }

  const latestAnthro = anthroData[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver al Dashboard
          </Button>
          
          {activeAdmission && (
            <Button
              variant="outline"
              onClick={() => window.open(`/admission/${activeAdmission.id}/print`, '_blank')}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              Imprimir Ingreso
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Allergy Alert */}
        <AllergyAlert allergies={patient.allergies} />

        {/* Patient Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl mb-2">{patient.name}</CardTitle>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>RUT: {patient.rut}</span>
                  <span>Edad: {calculateAge(patient.date_of_birth)}</span>
                  {patient.blood_type && <span>Grupo: {patient.blood_type}</span>}
                </div>
              </div>
              <Badge className="bg-secondary text-secondary-foreground">
                {patient.status === "active" ? "Hospitalizado" : patient.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Ingreso</p>
                <p className="font-medium">
                  {new Date(patient.admission_date).toLocaleDateString("es-CL", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              {patient.allergies && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Alergias</p>
                  <p className="font-medium text-destructive">{patient.allergies}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="evolutions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-8 gap-1">
            <TabsTrigger value="evolutions" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>Evoluciones</span>
            </TabsTrigger>
            <TabsTrigger value="complete-evolution" className="flex items-center gap-1">
              <ClipboardList className="h-4 w-4" />
              <span>Evolución</span>
            </TabsTrigger>
            <TabsTrigger value="anthropometry" className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              <span>Antropometría</span>
            </TabsTrigger>
            <TabsTrigger value="exams" className="flex items-center gap-1">
              <FileSearch className="h-4 w-4" />
              <span>Exámenes</span>
            </TabsTrigger>
            <TabsTrigger value="growth">Gráficas</TabsTrigger>
            <TabsTrigger value="timeline">Historial</TabsTrigger>
            <TabsTrigger value="diagnoses">Diagnósticos</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="evolutions">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Nueva Evolución</CardTitle>
                </CardHeader>
                <CardContent>
                  <DailyEvolutionForm 
                    patientId={id!} 
                    admissionId={activeAdmission?.id}
                    onSuccess={() => {}}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Evoluciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <EvolutionsList patientId={id!} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="exams">
            <LaboratoryExamsManager patientId={id!} admissionId={activeAdmission?.id} />
          </TabsContent>

          <TabsContent value="complete-evolution">
            <Card>
              <CardHeader>
                <CardTitle>Evolución Completa</CardTitle>
                <CardDescription>
                  Registre una evolución médica detallada del paciente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CompleteEvolutionForm 
                  patientId={id!}
                  admissionId={activeAdmission?.id}
                  defaultDiagnoses={[]}
                  defaultVitalSigns={{
                    temperature: "36.8",
                    heartRate: "120",
                    respiratoryRate: "24",
                    bloodPressure: "90/60",
                    oxygenSaturation: "98"
                  }}
                  onSuccess={() => {
                    // Refresh evolutions list or show success message
                    toast.success("Evolución registrada exitosamente");
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="anthropometry">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Datos Antropométricos</CardTitle>
                  <Button onClick={() => navigate(`/patient/${id}/anthropometry`)}>
                    Agregar Medición
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {latestAnthro ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-primary/10 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Peso</p>
                        <p className="text-2xl font-bold text-primary">{latestAnthro.weight_kg} kg</p>
                      </div>
                      <div className="p-4 bg-secondary/10 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Talla</p>
                        <p className="text-2xl font-bold text-secondary">{latestAnthro.height_cm} cm</p>
                      </div>
                      <div className="p-4 bg-accent/10 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">IMC</p>
                        <p className="text-2xl font-bold text-accent">
                          {latestAnthro.bmi?.toFixed(2)} kg/m²
                        </p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">SC</p>
                        <p className="text-2xl font-bold">
                          {latestAnthro.body_surface_area?.toFixed(3)} m²
                        </p>
                      </div>
                    </div>

                    {latestAnthro.head_circumference_cm && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Perímetro Cefálico</p>
                        <p className="text-lg font-semibold">{latestAnthro.head_circumference_cm} cm</p>
                      </div>
                    )}

                    <div className="text-sm text-muted-foreground">
                      Última medición:{" "}
                      {new Date(latestAnthro.measured_at).toLocaleDateString("es-CL", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>

                    {anthroData.length > 1 && (
                      <div className="mt-6">
                        <h4 className="font-semibold mb-3">Historial de Mediciones</h4>
                        <div className="space-y-2">
                          {anthroData.slice(1, 6).map((data) => (
                            <div
                              key={data.id}
                              className="flex justify-between items-center p-3 bg-muted/30 rounded"
                            >
                              <span className="text-sm">
                                {new Date(data.measured_at).toLocaleDateString("es-CL")}
                              </span>
                              <span className="text-sm">
                                {data.weight_kg} kg / {data.height_cm} cm
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No hay datos antropométricos registrados</p>
                    <Button onClick={() => navigate(`/patient/${id}/anthropometry`)}>
                      Agregar Primera Medición
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="growth">
            <GrowthChart patientId={id!} />
          </TabsContent>

          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Línea de Tiempo Clínica</CardTitle>
              </CardHeader>
              <CardContent>
                <PatientTimeline patientId={id!} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diagnoses">
            <Card>
              <CardHeader>
                <CardTitle>Diagnósticos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  Funcionalidad en desarrollo
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Documentos Médicos</CardTitle>
                  <Button className="gap-2">
                    <Upload className="w-4 h-4" />
                    Subir Documento
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay documentos cargados</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PatientDetail;
