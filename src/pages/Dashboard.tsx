import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, Calendar, Stethoscope, FileText, Bell, User } from "lucide-react";
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

      const { data, error } = await supabase
        .from('patient_controls')
        .select(`
          id,
          patient:patient_id (id, name, room_number, bed_number),
          control_date,
          control_type,
          notes
        `)
        .eq('doctor_id', userData.user.id)
        .gte('control_date', today.toISOString())
        .lte('control_date', nextWeek.toISOString())
        .order('control_date', { ascending: true });

      if (error) throw error;
      setUpcomingControls(data || []);
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

    const filtered = patients.filter(patient =>
      patient.name.toLowerCase().includes(value.toLowerCase()) ||
      patient.rut.includes(value)
    );
    setFilteredPatients(filtered);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Pagination
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

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

  return (
    <div className="p-6 space-y-6 animate-fade-in">
        {showRoles ? (
          <RoleManagement />
        ) : (
          <>
            {/* Stats Dashboard */}
            <DashboardStats patientsCount={patients.length} />

        {/* Patients Section */}
        <div className="space-y-4 mb-6 mt-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Pacientes Hospitalizados</h2>
            <div className="flex gap-2">
              <Button 
                onClick={() => exportPatientDataToCSV(patients)} 
                variant="outline" 
                className="gap-2"
                disabled={patients.length === 0}
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
              <Button onClick={() => navigate("/patient/new")} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Paciente
              </Button>
              <Button onClick={() => navigate("/admission/new")} className="gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Ingreso
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
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Cargando pacientes...
            </CardContent>
          </Card>
        ) : filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">
                {searchTerm ? "No se encontraron pacientes" : "No hay pacientes activos"}
              </p>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Intenta con otro término de búsqueda" : "Comienza agregando tu primer paciente"}
              </p>
              {!searchTerm && (
                <Button onClick={() => navigate("/patient/new")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Paciente
                </Button>
              )}
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
                        <CardTitle className="text-xl">{patient.name}</CardTitle>
                        {patient.allergies && (
                          <Badge variant="destructive" className="text-xs">⚠️ Alergia</Badge>
                        )}
                      </div>
                      <CardDescription className="flex gap-4 text-sm">
                        <span>RUT: {patient.rut}</span>
                        <span>Edad: {calculateAge(patient.date_of_birth)}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDaysHospitalized(calculateDaysHospitalized(patient.admission_date))}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(patient.status)}>
                      {patient.status === "active" ? "Activo" : patient.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Ingreso: {new Date(patient.admission_date).toLocaleDateString("es-CL")}
                  </p>
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
