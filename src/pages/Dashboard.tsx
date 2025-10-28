import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Clock, Plus, AlertTriangle, CheckCircle, XCircle, BarChart3, Users, TrendingUp, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { MedicalAnalyticsDashboard } from "@/components/MedicalAnalyticsDashboard";
import { ExternalLinksPanel } from "@/components/ExternalLinksPanel";
import { DashboardMetricsGrid } from "@/components/DashboardMetricsGrid";
import { DashboardCharts } from "@/components/DashboardCharts";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AssignedPatient {
  id: string;
  patient: {
    id: string;
    name: string;
    rut: string;
    date_of_birth: string;
  };
  admission_date: string;
  admission_diagnoses: string[];
  status: string;
  pending_tasks: string | null;
  antibiotics: any;
  oxygen_requirement: any;
}

interface RecentActivity {
  id: string;
  created_at: string;
  action: string;
  table_name: string;
  new_data: any;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userSpecialty, setUserSpecialty] = useState("");
  const [assignedPatients, setAssignedPatients] = useState<AssignedPatient[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [upcomingAlerts, setUpcomingAlerts] = useState<any[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalPatients: 0,
    occupancyRate: 0,
    criticalPatients: 0,
    averageStay: 0,
    activeAntibiotics: 0,
    pendingDischarges: 0,
    todayAdmissions: 0,
    oxygenPatients: 0,
  });

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    await checkUser();
    await Promise.all([
      fetchMyPatients(),
      fetchMyActivity(),
      fetchDashboardMetrics(),
    ]);
    setLoading(false);
  };

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role, specialty")
      .eq("id", user.id)
      .single();

    if (profile) {
      setUserName(profile.full_name);
      setUserRole(profile.role);
      setUserSpecialty(profile.specialty);
    }
  };

  const fetchMyPatients = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Sesión no válida. Por favor, inicia sesión nuevamente.");
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from('admissions')
        .select(`
          id,
          admission_date,
          admission_diagnoses,
          status,
          pending_tasks,
          antibiotics,
          oxygen_requirement,
          patient:patients!inner(*)
        `)
        .eq('admitted_by', userData.user.id)
        .eq('status', 'active')
        .not('patient', 'is', null)
        .order('admission_date', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching patients:', error);
        toast.error("Error al cargar pacientes asignados");
        return;
      }
      
      // Validación extra de seguridad
      const validData = (data || []).filter(admission => 
        admission.patient && 
        admission.patient.id && 
        admission.patient.name
      );
      
      setAssignedPatients(validData);
    } catch (error: any) {
      console.error('Unexpected error in fetchMyPatients:', error);
      toast.error("Error inesperado al cargar datos");
    }
  };

  const fetchMyActivity = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentActivity(data || []);
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  };

  const fetchDashboardMetrics = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Total de pacientes activos
      const { count: totalPatients } = await supabase
        .from("admissions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Ingresos de hoy
      const { count: todayAdmissions } = await supabase
        .from("admissions")
        .select("*", { count: "exact", head: true })
        .gte("admission_date", today.toISOString())
        .eq("status", "active");

      // Altas próximas (3 días)
      const threeDaysLater = new Date();
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);
      const { count: pendingDischarges } = await supabase
        .from("admissions")
        .select("*", { count: "exact", head: true })
        .not("discharge_date", "is", null)
        .lte("discharge_date", threeDaysLater.toISOString())
        .eq("status", "active");

      // Pacientes con O2 y ATB
      const { data: activeAdmissions } = await supabase
        .from("admissions")
        .select("oxygen_requirement, antibiotics")
        .eq("status", "active");

      const oxygenPatients = activeAdmissions?.filter(
        a => a.oxygen_requirement && Object.keys(a.oxygen_requirement).length > 0
      ).length || 0;

      const activeAntibiotics = activeAdmissions?.filter(
        a => a.antibiotics && Array.isArray(a.antibiotics) && a.antibiotics.length > 0
      ).length || 0;

      // Calcular ocupación (ejemplo: 30 camas totales)
      const totalBeds = 30;
      const occupancyRate = totalPatients ? Math.round((totalPatients / totalBeds) * 100) : 0;

      // Pacientes críticos (con O2 alta o múltiples ATB)
      const criticalPatients = activeAdmissions?.filter(a => {
        const o2Req = a.oxygen_requirement as any;
        const hasHighO2 = o2Req?.fio2 && Number(o2Req.fio2) > 40;
        const hasMultipleAtb = Array.isArray(a.antibiotics) && a.antibiotics.length >= 2;
        return hasHighO2 || hasMultipleAtb;
      }).length || 0;

      // Calcular estancia promedio
      const { data: dischargedData } = await supabase
        .from("admissions")
        .select("admission_date, discharge_date")
        .not("discharge_date", "is", null)
        .gte("discharge_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      let averageStay = 0;
      if (dischargedData && dischargedData.length > 0) {
        const totalDays = dischargedData.reduce((sum, adm) => {
          return sum + differenceInDays(new Date(adm.discharge_date!), new Date(adm.admission_date));
        }, 0);
        averageStay = Math.round((totalDays / dischargedData.length) * 10) / 10;
      }

      setDashboardMetrics({
        totalPatients: totalPatients || 0,
        occupancyRate,
        criticalPatients,
        averageStay,
        activeAntibiotics,
        pendingDischarges: pendingDischarges || 0,
        todayAdmissions: todayAdmissions || 0,
        oxygenPatients,
      });
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
    }
  };

  const fetchMyAlerts = async () => {
    const alerts: any[] = [];
    
    // Antibióticos próximos a terminar
    assignedPatients.forEach(patient => {
      if (patient.antibiotics && Array.isArray(patient.antibiotics)) {
        patient.antibiotics.forEach((atb: any) => {
          if (atb.planned_days && atb.start_date) {
            const daysElapsed = differenceInDays(new Date(), new Date(atb.start_date));
            const daysRemaining = atb.planned_days - daysElapsed;
            if (daysRemaining <= 1 && daysRemaining >= 0) {
              alerts.push({
                type: 'antibiotic',
                patient: patient.patient.name,
                message: `Antibiótico ${atb.name} termina en ${daysRemaining} día(s)`,
                severity: 'warning'
              });
            }
          }
        });
      }

      // Tareas pendientes
      if (patient.pending_tasks && patient.pending_tasks.trim()) {
        alerts.push({
          type: 'task',
          patient: patient.patient.name,
          message: 'Tiene tareas pendientes',
          severity: 'info'
        });
      }
    });

    setUpcomingAlerts(alerts);
  };

  const calculateAge = (dob: string): string => {
    const today = new Date();
    const birth = new Date(dob);
    const years = today.getFullYear() - birth.getFullYear();
    return years < 1 ? `${Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30))}m` : `${years}a`;
  };

  const getDaysHospitalized = (admissionDate: string) => {
    return differenceInDays(new Date(), new Date(admissionDate));
  };

  useEffect(() => {
    if (assignedPatients.length > 0) {
      fetchMyAlerts();
    }
  }, [assignedPatients]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <Activity className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Welcome Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 md:p-8 border shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Hola, {userName || 'Doctor'}
            </h1>
            <p className="text-muted-foreground mt-2 flex items-center gap-2">
              <Badge variant="outline" className="font-normal">
                {userSpecialty || 'Médico'}
              </Badge>
              <span className="hidden md:inline">•</span>
              <span className="text-sm">
                {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
              </span>
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button onClick={() => navigate("/admission/new")} className="gap-2 flex-1 md:flex-initial shadow-lg">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo Ingreso</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/patients")} 
              className="gap-2 flex-1 md:flex-initial"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Ver Pacientes</span>
              <span className="sm:hidden">Pacientes</span>
            </Button>
          </div>
        </div>
      </div>

      {/* External Links - Quick Access */}
      <ExternalLinksPanel variant="inline" />

      {/* Dashboard Metrics Grid */}
      <DashboardMetricsGrid metrics={dashboardMetrics} />

      {/* Alertas Importantes - Mejoradas */}
      {upcomingAlerts.length > 0 && (
        <Card className="medical-card border-l-4 border-l-warning animate-slide-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" style={{ color: 'hsl(var(--warning))' }} />
              </div>
              <div>
                <p className="text-lg">Alertas Importantes</p>
                <p className="text-sm text-muted-foreground font-normal">
                  {upcomingAlerts.length} {upcomingAlerts.length === 1 ? 'alerta requiere' : 'alertas requieren'} tu atención
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-3">
                {upcomingAlerts.map((alert, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-start gap-3 p-4 bg-gradient-to-r from-warning/10 to-transparent rounded-lg border border-warning/20 hover:shadow-md transition-all duration-200 cursor-pointer group"
                  >
                    <div className="h-10 w-10 rounded-lg bg-warning/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      {alert.type === 'antibiotic' ? '💊' : '📋'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{alert.patient}</p>
                      <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                    </div>
                    <Badge 
                      variant={alert.severity === 'warning' ? 'destructive' : 'secondary'}
                      className="flex-shrink-0"
                    >
                      {alert.type === 'antibiotic' ? 'ATB' : 'Tarea'}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Tabs para diferentes vistas - Mejorados */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl h-12 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Resumen General</span>
            <span className="sm:hidden">Resumen</span>
          </TabsTrigger>
          <TabsTrigger value="my-patients" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Mis Pacientes</span>
            <span className="sm:hidden">Pacientes</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DashboardCharts />
        </TabsContent>

        <TabsContent value="my-patients" className="space-y-6">
          {/* My Patients */}
          <Card className="medical-card">
            <CardHeader>
              <CardTitle>Mis Pacientes Asignados</CardTitle>
              <CardDescription>Pacientes actualmente bajo mi cuidado</CardDescription>
            </CardHeader>
        <CardContent>
          {assignedPatients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No tienes pacientes asignados actualmente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => navigate(`/patients/${patient.patient.id}`)}
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{patient.patient.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {patient.patient.rut} • {calculateAge(patient.patient.date_of_birth)}
                    </p>
                    {patient.admission_diagnoses && patient.admission_diagnoses.length > 0 && (
                      <p className="text-sm mt-1">{patient.admission_diagnoses[0]}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {getDaysHospitalized(patient.admission_date)} días
                    </Badge>
                    {patient.oxygen_requirement && Object.keys(patient.oxygen_requirement).length > 0 && (
                      <Badge variant="destructive">O₂</Badge>
                    )}
                    {patient.antibiotics && patient.antibiotics.length > 0 && (
                      <Badge variant="secondary">ATB</Badge>
                    )}
                    {patient.pending_tasks && patient.pending_tasks.trim() && (
                      <Badge variant="outline" className="bg-amber-50">⚠️</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="medical-card">
        <CardHeader>
          <CardTitle>Mi Actividad Reciente</CardTitle>
          <CardDescription>Últimas 5 acciones realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay actividad reciente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <Activity className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {activity.action} en {activity.table_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(activity.created_at), "PPp", { locale: es })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <MedicalAnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
