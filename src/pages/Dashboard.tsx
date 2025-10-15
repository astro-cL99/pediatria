import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Activity, Clock, Search, Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { DashboardStats } from "@/components/DashboardStats";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type PatientStatus = 'active' | 'discharged' | 'pending' | 'transferred';

interface Patient {
  id: string;
  name: string;
  rut: string;
  date_of_birth: string;
  status: PatientStatus;
  admission_date: string;
  allergies?: string | null;
  room_number?: string;
  bed_number?: number;
  doctor_id?: string;
  doctor_name?: string;
  last_evolution?: string;
  next_control?: string;
}

interface ActivityLog {
  id: string;
  created_at: string;
  action_type: string;
  table_name: string;
  record_id: string;
  old_data: any;
  new_data: any;
  user_id: string;
  patient?: {
    id: string;
    name: string;
    room_number?: string;
    bed_number?: number;
  };
  description?: string;
}

interface Control {
  id: string;
  patient: {
    id: string;
    name: string;
    room_number?: string;
    bed_number?: number;
  };
  control_date: string;
  control_type: string;
  notes: string;
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
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);

  // Filter patients based on search term
  const handleSearch = (searchValue: string) => {
    setSearchTerm(searchValue);
    const filtered = assignedPatients.filter(patient => 
      patient.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      patient.rut.toLowerCase().includes(searchValue.toLowerCase())
    );
    setFilteredPatients(filtered);
  };

  // Get status color for badges
  const getStatusColor = (status: PatientStatus): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'discharged':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'transferred':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format activity date
  const formatActivityDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), "PPpp", { locale: es });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Fecha inválida';
    }
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string): string => {
    try {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 1) {
        const months = today.getMonth() - birthDate.getMonth() + (12 * (today.getFullYear() - birthDate.getFullYear()));
        return `${months} meses`;
      }
      
      return `${age} años`;
    } catch (error) {
      console.error('Error calculating age:', error);
      return 'N/A';
    }
  };

  // Initialize filtered patients when assignedPatients changes
  useEffect(() => {
    setFilteredPatients(assignedPatients);
  }, [assignedPatients]);

  const fetchUpcomingControls = async (): Promise<Control[]> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

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
        .is('discharge_date', null)
        .order('admission_date', { ascending: true });

      if (error) throw error;
      
      const controls: Control[] = (data || []).map((admission: any) => ({
        id: admission.id,
        patient: {
          id: admission.patient?.id || '',
          name: admission.patient?.name || 'Paciente sin nombre',
          room_number: admission.patient?.room_number,
          bed_number: admission.patient?.bed_number
        },
        control_date: admission.admission_date,
        control_type: 'Control de ingreso',
        notes: Array.isArray(admission.admission_diagnoses) 
          ? admission.admission_diagnoses[0] || 'Sin diagnóstico especificado'
          : 'Sin diagnóstico especificado'
      }));
      
      setUpcomingControls(controls);
      return controls;
    } catch (error) {
      console.error("Error al cargar controles programados:", error);
      return [];
    }
  };

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
      .single();

    if (profile) {
      setUserName(profile.full_name);
      setUserRole(profile.role);
      setUserSpecialty(profile.specialty);
    }
  };

  const fetchUserPatients = async (): Promise<Patient[]> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase
        .from('admissions')
        .select(`
          *,
          patient:patients(*)
        `)
        .eq('admitted_by', userData.user.id)
        .order('admission_date', { ascending: false });

      if (error) throw error;
      
      const patients: Patient[] = (data || []).map((admission: any) => ({
        id: admission.patient?.id || '',
        name: admission.patient?.name || 'Paciente sin nombre',
        rut: admission.patient?.rut || '',
        date_of_birth: admission.patient?.date_of_birth || '',
        status: admission.status || 'active',
        admission_date: admission.admission_date,
        allergies: admission.patient?.allergies || null,
        room_number: admission.room_number,
        bed_number: admission.bed_number,
        doctor_id: admission.admitted_by,
        last_evolution: admission.last_evolution,
        next_control: admission.next_control
      }));
      
      setAssignedPatients(patients);
      return patients;
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Error al cargar los pacientes');
      return [];
    }
  };

  const fetchRecentActivity = async (): Promise<ActivityLog[]> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const activities: ActivityLog[] = (data || []).map((log: any) => ({
        ...log,
        description: `Modificado: ${log.table_name}`,
        patient: {
          id: log.record_id,
          name: log.new_data?.name || 'Paciente',
          room_number: log.new_data?.room_number,
          bed_number: log.new_data?.bed_number
        }
      }));

      setRecentActivity(activities);
      return activities;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  const fetchUpcomingControls = async (): Promise<Control[]> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

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
        .is('discharge_date', null)
        .order('admission_date', { ascending: true });

      if (error) throw error;
      
      const controls: Control[] = (data || []).map((admission: any) => ({
        id: admission.id,
        patient: {
          id: admission.patient?.id || '',
          name: admission.patient?.name || 'Paciente sin nombre',
          room_number: admission.patient?.room_number,
          bed_number: admission.patient?.bed_number
        },
        control_date: admission.admission_date,
        control_type: 'Control de ingreso',
        notes: Array.isArray(admission.admission_diagnoses) 
          ? admission.admission_diagnoses[0] || 'Sin diagnóstico especificado'
          : 'Sin diagnóstico especificado'
      }));
      
      setUpcomingControls(controls);
      return controls;
    } catch (error) {
      console.error("Error al cargar controles programados:", error);
    }
  };

  const formatActivityDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), "PPp", { locale: es });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Fecha inválida';
    }
  };

  const formatControlDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), "EEEE d 'de' MMMM, HH:mm", { locale: es });
    } catch (error) {
      console.error('Error formatting control date:', error);
      return 'Fecha inválida';
    }
  };

  const handleSearch = (value: string): void => {
    setSearchTerm(value);
    setCurrentPage(1);
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

  interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
  }

  const formatDaysHospitalized = (days: number): string => {
    if (days === 1) return '1 día';
    return `${days} días`;
  };

  const Input = ({ 
    placeholder, 
    value, 
    onChange, 
    className = '', 
    ...props 
  }: InputProps) => (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );

  const calculateAge = (dateOfBirth: string): string => {
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

  const getStatusColor = (status: PatientStatus): string => {
    const statusColors: Record<PatientStatus, string> = {
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      discharged: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      transferred: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    };
    return statusColors[status] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  };

  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {showRoles ? (
        <div>Role Management Component</div>
      ) : (
        <div className="space-y-6">
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
        </div>
      )}

            {loading ? (
              <div className="grid gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24">
                    <SkeletonCard />
                  </div>
                ))}
              </div>
            ) : filteredPatients.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No hay pacientes asignados</h3>
                  <p className="text-muted-foreground mt-2">
                    Comienza agregando un nuevo paciente
                  </p>
                  <Button className="mt-4" onClick={() => navigate('/admission/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Ingreso
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredPatients
                  .slice((currentPage - 1) * patientsPerPage, currentPage * patientsPerPage)
                  .map((patient) => (
                    <Card key={patient.id}>
                      <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{patient.name}</h3>
                        <Badge variant="outline">{patient.rut}</Badge>
                        <Badge className={getStatusColor(patient.status)}>
                          {patient.status === 'active' ? 'Activo' : 
                           patient.status === 'discharged' ? 'Alta' :
                           patient.status === 'pending' ? 'Pendiente' : 'Transferido'}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {patient.room_number && (
                          <span>Habitación {patient.room_number} • </span>
                        )}
                        {patient.bed_number && (
                          <span>Cama {patient.bed_number} • </span>
                        )}
                        <span>Edad: {calculateAge(patient.date_of_birth)}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/patient/${patient.id}`)}
                    >
                      Ver Detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {Math.ceil(filteredPatients.length / patientsPerPage)}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage * patientsPerPage >= filteredPatients.length}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
