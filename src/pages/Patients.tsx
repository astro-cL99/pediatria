import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, UserPlus, Clock, AlertCircle, Wind, Pill, Activity, Droplet, Bed, Users, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";

interface BedAssignment {
  id: string;
  room_number: string;
  bed_number: number;
  patient_id: string;
  admission_id: string;
  assigned_at: string;
  patient: {
    id: string;
    name: string;
    rut: string;
    date_of_birth: string;
    allergies: string | null;
  };
  admission: {
    id: string;
    admission_date: string;
    admission_diagnoses: string[];
    oxygen_requirement: any;
    respiratory_score: string | null;
    viral_panel: string | null;
    pending_tasks: string | null;
    antibiotics: any;
    medications: any;
  };
}

export default function Patients() {
  const navigate = useNavigate();
  const [bedAssignments, setBedAssignments] = useState<BedAssignment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterService, setFilterService] = useState<"all" | "pediatria" | "cirugia">("all");

  useEffect(() => {
    fetchBedAssignments();

    const channel = supabase
      .channel('patients-bed-assignments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bed_assignments' },
        () => fetchBedAssignments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBedAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from("bed_assignments")
        .select(`
          *,
          patient:patients(*),
          admission:admissions(*)
        `)
        .eq("is_active", true)
        .order("room_number")
        .order("bed_number");

      if (error) throw error;
      setBedAssignments(data || []);
    } catch (error) {
      console.error("Error fetching bed assignments:", error);
      toast.error("Error al cargar pacientes hospitalizados");
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    
    if (years < 1) {
      return `${months + (years * 12)}m`;
    }
    return `${years}a`;
  };

  const getDaysHospitalized = (admissionDate: string) => {
    return differenceInDays(new Date(), new Date(admissionDate));
  };

  const filteredPatients = bedAssignments.filter((bed) => {
    const matchesSearch = 
      bed.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bed.patient.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bed.room_number.includes(searchTerm);

    const matchesService = 
      filterService === "all" ||
      (filterService === "pediatria" && bed.room_number.startsWith("50")) ||
      (filterService === "cirugia" && bed.room_number.startsWith("60"));

    return matchesSearch && matchesService;
  });

  // Calcular estadísticas
  const stats = {
    total: filteredPatients.length,
    withO2: filteredPatients.filter(b => b.admission.oxygen_requirement && Object.keys(b.admission.oxygen_requirement).length > 0).length,
    withATB: filteredPatients.filter(b => b.admission.antibiotics && Object.keys(b.admission.antibiotics).length > 0).length,
    withPending: filteredPatients.filter(b => b.admission.pending_tasks && b.admission.pending_tasks.trim().length > 0).length,
    avgDays: filteredPatients.length > 0 
      ? Math.round(filteredPatients.reduce((sum, b) => sum + getDaysHospitalized(b.admission.admission_date), 0) / filteredPatients.length)
      : 0,
  };

  const getStatusBadge = (bed: BedAssignment) => {
    const { oxygen_requirement, antibiotics, viral_panel } = bed.admission;
    
    if (oxygen_requirement && Object.keys(oxygen_requirement).length > 0) {
      return <Badge variant="destructive">Requiere O2</Badge>;
    }
    if (antibiotics && Object.keys(antibiotics).length > 0) {
      return <Badge className="bg-yellow-600">Con ATB</Badge>;
    }
    if (viral_panel && viral_panel.toLowerCase().includes("positivo")) {
      return <Badge variant="secondary">Panel Viral +</Badge>;
    }
    return <Badge variant="outline">Estable</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Pacientes Hospitalizados
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestión y seguimiento de pacientes activos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/admission/new")} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Nuevo Ingreso
          </Button>
          <Button onClick={() => navigate("/patient/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Paciente
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Pacientes</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Con Soporte O2</CardTitle>
              <Wind className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.withO2}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Con Antibióticos</CardTitle>
              <Pill className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.withATB}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Con Pendientes</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.withPending}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Promedio Días</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.avgDays}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por paciente, RUT o número de sala..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={filterService} onValueChange={(v) => setFilterService(v as any)} className="w-full md:w-auto">
              <TabsList className="grid w-full md:w-auto grid-cols-3">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="pediatria">Pediatría</TabsTrigger>
                <TabsTrigger value="cirugia">Cirugía</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </Card>

      {/* Patients List */}
      <div>
        {loading ? (
          <Card className="p-12">
            <div className="text-center">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
              <p className="text-lg font-medium">Cargando pacientes...</p>
            </div>
          </Card>
        ) : filteredPatients.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <UserPlus className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl font-semibold mb-2">
                {searchTerm ? "No se encontraron pacientes" : "No hay pacientes hospitalizados"}
              </p>
              <p className="text-muted-foreground mb-6">
                {searchTerm ? "Intenta con otro término de búsqueda" : "Los pacientes hospitalizados aparecerán aquí"}
              </p>
              {!searchTerm && (
                <Button onClick={() => navigate("/admission/new")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Nuevo Ingreso
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredPatients.map((bed) => {
              const days = getDaysHospitalized(bed.admission.admission_date);
              const hasO2 = bed.admission.oxygen_requirement && Object.keys(bed.admission.oxygen_requirement).length > 0;
              const hasATB = bed.admission.antibiotics && Object.keys(bed.admission.antibiotics).length > 0;
              const hasViralPanel = bed.admission.viral_panel && bed.admission.viral_panel.toLowerCase().includes("positivo");
              
              return (
                <Card
                  key={bed.id}
                  className="hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 hover:scale-[1.01]"
                  style={{
                    borderLeftColor: hasO2 ? '#ef4444' : hasATB ? '#eab308' : hasViralPanel ? '#3b82f6' : '#10b981'
                  }}
                  onClick={() => navigate(`/patient/${bed.patient_id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <CardTitle className="text-xl font-bold">{bed.patient.name}</CardTitle>
                          {bed.patient.allergies && (
                            <Badge variant="destructive" className="text-xs animate-pulse">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Alergia
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                          <span className="font-medium">RUT: {bed.patient.rut}</span>
                          <span>Edad: {calculateAge(bed.patient.date_of_birth)}</span>
                          <span className="flex items-center gap-1">
                            <Bed className="w-3 h-3" />
                            Sala {bed.room_number}-{bed.bed_number}
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3" />
                            {days} {days === 1 ? 'día' : 'días'}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2">
                      {hasO2 && (
                        <Badge variant="destructive" className="gap-1">
                          <Wind className="h-3 w-3" />
                          Soporte O2
                        </Badge>
                      )}
                      {hasATB && (
                        <Badge className="bg-yellow-600 hover:bg-yellow-700 gap-1">
                          <Pill className="h-3 w-3" />
                          Antibióticos
                        </Badge>
                      )}
                      {hasViralPanel && (
                        <Badge variant="secondary" className="gap-1">
                          <Droplet className="h-3 w-3" />
                          Panel Viral +
                        </Badge>
                      )}
                      {bed.admission.respiratory_score && (
                        <Badge variant="outline" className="gap-1">
                          <Activity className="h-3 w-3" />
                          Score: {bed.admission.respiratory_score}
                        </Badge>
                      )}
                      {!hasO2 && !hasATB && !hasViralPanel && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Estable
                        </Badge>
                      )}
                    </div>

                    {/* Diagnosis */}
                    {bed.admission.admission_diagnoses && bed.admission.admission_diagnoses.length > 0 && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <span className="text-sm font-semibold text-foreground">Diagnóstico: </span>
                        <span className="text-sm text-muted-foreground">
                          {bed.admission.admission_diagnoses[0]}
                        </span>
                        {bed.admission.admission_diagnoses.length > 1 && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            +{bed.admission.admission_diagnoses.length - 1} más
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Pending Tasks */}
                    {bed.admission.pending_tasks && bed.admission.pending_tasks.trim().length > 0 && (
                      <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-sm font-semibold text-orange-900 dark:text-orange-100">Pendientes: </span>
                            <span className="text-sm text-orange-800 dark:text-orange-200">
                              {bed.admission.pending_tasks}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Allergies */}
                    {bed.patient.allergies && (
                      <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-sm font-semibold text-red-900 dark:text-red-100">Alergias: </span>
                            <span className="text-sm text-red-800 dark:text-red-200">
                              {bed.patient.allergies}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
