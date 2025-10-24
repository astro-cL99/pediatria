import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Clock, Plus, AlertTriangle, CheckCircle, XCircle, BarChart3, Users } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { MedicalAnalyticsDashboard } from "@/components/MedicalAnalyticsDashboard";
import { ExternalLinksPanel } from "@/components/ExternalLinksPanel";

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

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    await checkUser();
    await fetchMyPatients();
    await fetchMyActivity();
    await fetchMyAlerts();
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

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Hola, {userName || 'Doctor'}</h1>
          <p className="text-muted-foreground">
            {userSpecialty || 'Médico'} • {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
          </p>
        </div>
        <Button onClick={() => navigate("/admission/new")} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Ingreso
        </Button>
      </div>

      {/* External Links - Quick Access */}
      <ExternalLinksPanel variant="inline" />

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="medical-card border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mis Pacientes</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{assignedPatients.length}</div>
            <p className="text-xs text-muted-foreground">Activos bajo mi cuidado</p>
          </CardContent>
        </Card>

        <Card className="medical-card border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4" style={{ color: 'hsl(var(--warning))' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'hsl(var(--warning))' }}>{upcomingAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>

        <Card className="medical-card border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actividad Hoy</CardTitle>
            <CheckCircle className="h-4 w-4" style={{ color: 'hsl(var(--success))' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'hsl(var(--success))' }}>{recentActivity.filter(a => {
              const activityDate = new Date(a.created_at);
              const today = new Date();
              return activityDate.toDateString() === today.toDateString();
            }).length}</div>
            <p className="text-xs text-muted-foreground">Acciones realizadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {upcomingAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Alertas Importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingAlerts.map((alert, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
                <div className="flex-1">
                  <p className="font-medium">{alert.patient}</p>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                </div>
                <Badge variant={alert.severity === 'warning' ? 'destructive' : 'secondary'}>
                  {alert.type === 'antibiotic' ? '💊 ATB' : '📋 Tarea'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tabs para diferentes vistas */}
      <Tabs defaultValue="my-patients" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="my-patients" className="gap-2">
            <Users className="h-4 w-4" />
            Mis Pacientes
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics Médicos
          </TabsTrigger>
        </TabsList>

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
