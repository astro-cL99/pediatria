import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Plus, Activity, Users, FileText, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface Patient {
  id: string;
  name: string;
  rut: string;
  date_of_birth: string;
  status: string;
  admission_date: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    checkUser();
    fetchPatients();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (profile) {
      setUserName(profile.full_name);
    }
  };

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("status", "active")
        .order("admission_date", { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error: any) {
      toast.error("Error al cargar pacientes");
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">PediaMed</h1>
              <p className="text-sm text-muted-foreground">Servicio de Pediatría</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground">Médico Tratante</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pacientes Activos
                </CardTitle>
                <Users className="w-4 h-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{patients.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ingresos Hoy
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-secondary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Altas Programadas
                </CardTitle>
                <Activity className="w-4 h-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pendientes
                </CardTitle>
                <FileText className="w-4 h-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
            </CardContent>
          </Card>
        </div>

        {/* Patients Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Pacientes Hospitalizados</h2>
          <Button onClick={() => navigate("/patient/new")} className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Paciente
          </Button>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Cargando pacientes...
            </CardContent>
          </Card>
        ) : patients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No hay pacientes activos</p>
              <p className="text-muted-foreground mb-4">
                Comienza agregando tu primer paciente
              </p>
              <Button onClick={() => navigate("/patient/new")}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Paciente
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {patients.map((patient) => (
              <Card
                key={patient.id}
                className="hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate(`/patient/${patient.id}`)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">{patient.name}</CardTitle>
                      <CardDescription className="flex gap-4 text-sm">
                        <span>RUT: {patient.rut}</span>
                        <span>Edad: {calculateAge(patient.date_of_birth)}</span>
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
        )}
      </main>
    </div>
  );
};

export default Dashboard;
