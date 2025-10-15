import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, Calendar, Stethoscope, FileText, Bell, User, Search, Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { DashboardStats } from "@/components/DashboardStats";
import { calculateDaysHospitalized } from "@/utils/calculateDaysHospitalized";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Patient {
  id: string;
  name: string;
  rut: string;
  date_of_birth: string;
  status: string;
  admission_date: string;
  allergies?: string | null;
  room_number?: string;
  bed_number?: number;
  doctor_id?: string;
  doctor_name?: string;
  last_evolution?: string;
  next_control?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showRoles, setShowRoles] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 10;
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userSpecialty, setUserSpecialty] = useState("");
  const [assignedPatients, setAssignedPatients] = useState<Patient[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [upcomingControls, setUpcomingControls] = useState<any[]>([]);

  useEffect(() => {
    const initializeDashboard = async () => {
      await checkUser();
      await fetchUserPatients();
      await fetchRecentActivity();
      await fetchUpcomingControls();
      
      // Set up realtime subscriptions
      const patientsChannel = supabase
        .channel('user-patients-changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'patients' },
          () => fetchUserPatients()
        )
        .subscribe();

      const activityChannel = supabase
        .channel('user-activity-changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'patient_activities' },
          () => {
            fetchRecentActivity();
            fetchUpcomingControls();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(patientsChannel);
        supabase.removeChannel(activityChannel);
      };
    };

    initializeDashboard();
  }, []);

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
      setUserRole(profile.role || 'Médico');
      setUserSpecialty(profile.specialty || '');
    }
  };

  const fetchUserPatients = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .rpc('get_doctor_patients', { doctor_id: userData.user.id })
        .order("admission_date", { ascending: false });

      if (error) throw error;
      setAssignedPatients(data || []);
    } catch (error) {
      console.error("Error al cargar pacientes asignados:", error);
      toast.error("Error al cargar pacientes asignados");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('patient_activities')
        .select(`
          id,
          patient:patient_id (id, name, room_number, bed_number),
          type,
          description,
          created_at
        `)
        .eq('created_by', userData.user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentActivity(data || []);
    } catch (error) {
      console.error("Error al cargar actividad reciente:", error);
    }
  };

  const fetchUpcomingControls = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      // Using the admissions table as a fallback for controls
      const { data, error } = await supabase
        .from('admissions')
        .select(`
          id,
          patient:patient_id (id, name, room_number, bed_number),
          admission_date,
          admission_diagnoses,
          discharge_date
        `)
        .eq('admitted_by', userData.user.id)
        .is('discharge_date', null) // Only active admissions
        .order('admission_date', { ascending: true });

      if (error) throw error;
      
      // Map admissions to controls format
      const controls = (data || []).map(admission => ({
        id: admission.id,
        patient: admission.patient,
        control_date: admission.admission_date,
        control_type: 'Control de ingreso',
        notes: admission.admission_diagnoses?.[0] || 'Sin diagnóstico especificado'
      }));
      
      setUpcomingControls(controls);
    } catch (error) {
      console.error("Error al cargar controles programados:", error);
    }
  };

  const formatActivityDate = (dateString: string) => {
    return format(new Date(dateString), "PPp", { locale: es });
  };

  const formatControlDate = (dateString: string) => {
    return format(new Date(dateString), "EEEE d 'de' MMMM, HH:mm", { locale: es });
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };
  };

  // Filter patients based on search term
  const filteredPatients = assignedPatients.filter(patient =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.rut?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // Add missing Input component
  const Input = ({ placeholder, value, onChange, className, ...props }: {
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    [key: string]: any;
  }) => (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    if (age < 1) {
      const months = monthDiff < 0 ? 12 + monthDiff : monthDiff;
      return `${months}m`;
    }
    return `${age}a`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-secondary text-secondary-foreground";
      case "discharged":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatDaysHospitalized = (days: number) => {
    if (days === 0) return "Hoy";
    if (days === 1) return "1 día";
    return `${days} días`;
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {showRoles ? (
        <div>Role Management Component</div>
      ) : (
        <>
          {/* Welcome Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Hola, {userName || 'Médico'}</h1>
              <p className="text-muted-foreground">
                {userSpecialty || 'Médico'} • {new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/admission/new")}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Ingreso
            </Button>
          </div>

          {/* Stats Dashboard */}
          <DashboardStats patientsCount={assignedPatients.length} />

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Actividad Reciente</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recentActivity.map((activity) => (
                  <Card key={activity.id}>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        {formatActivityDate(activity.created_at)}
                      </CardDescription>
                      <CardTitle className="text-lg">
                        {activity.patient?.name || 'Paciente'}
                      </CardTitle>
                      {activity.patient?.room_number && (
                        <p className="text-sm text-muted-foreground">
                          Hab. {activity.patient.room_number} • Cama {activity.patient.bed_number}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{activity.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Patients Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Mis Pacientes</h2>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {}} 
                  variant="outline" 
                  className="gap-2"
                  disabled={assignedPatients.length === 0}
                >
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </Button>
                <Button onClick={() => navigate("/patient/new")} variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nuevo Paciente
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o RUT..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

        {loading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <SkeletonCard key={i} className="h-24" />
            ))}
          </div>
        ) : assignedPatients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">
                No tienes pacientes asignados
              </p>
              <p className="text-muted-foreground mb-4">
                Comienza agregando un nuevo paciente o espera a que te asignen pacientes
              </p>
              <Button onClick={() => navigate("/patient/new")}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Paciente
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4">
              {currentPatients.map((patient) => (
                <Card
                  key={patient.id}
                  className="hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => navigate(`/patient/${patient.id}`)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <CardTitle className="text-xl">{patient.name || 'Paciente sin nombre'}</CardTitle>
                          {patient.allergies && (
                            <Badge variant="destructive" className="text-xs">⚠️ Alergia</Badge>
                          )}
                        </div>
                        <CardDescription className="flex gap-4 text-sm">
                          <span>RUT: {patient.rut || 'No especificado'}</span>
                          {patient.date_of_birth && (
                            <span>Edad: {calculateAge(patient.date_of_birth)}</span>
                          )}
                          {patient.admission_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDaysHospitalized(calculateDaysHospitalized(patient.admission_date))}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(patient.status || 'active')}>
                        {patient.status === "active" ? "Activo" : (patient.status || 'Sin estado')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {patient.room_number && patient.bed_number && (
                        <span>Habitación {patient.room_number} - Cama {patient.bed_number}</span>
                      )}
                      {patient.admission_date && (
                        <span>• Ingreso: {new Date(patient.admission_date).toLocaleDateString("es-CL")}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          )}
          </>
        )}
          </>
        )}
    </div>
  );
};

export default Dashboard;
