import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Activity, FileText, AlertTriangle, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DashboardStatsProps {
  patientsCount: number;
}

export function DashboardStats({ patientsCount }: DashboardStatsProps) {
  const [todayAdmissions, setTodayAdmissions] = useState(0);
  const [pendingDischarges, setPendingDischarges] = useState(0);
  const [recentEvolutions, setRecentEvolutions] = useState<any[]>([]);
  const [patientsWithAllergies, setPatientsWithAllergies] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Ingresos de hoy
    const { count: todayCount } = await supabase
      .from("admissions")
      .select("*", { count: "exact", head: true })
      .gte("admission_date", today.toISOString());

    setTodayAdmissions(todayCount || 0);

    // Pacientes con alta programada próximamente (próximos 3 días)
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const { count: dischargeCount } = await supabase
      .from("admissions")
      .select("*", { count: "exact", head: true })
      .not("discharge_date", "is", null)
      .lte("discharge_date", threeDaysLater.toISOString())
      .eq("status", "active");

    setPendingDischarges(dischargeCount || 0);

    // Evoluciones recientes (últimas 24h)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: evolutions } = await supabase
      .from("daily_evolutions")
      .select(`
        id,
        evolution_date,
        evolution_time,
        patient_id,
        patients:patient_id (name)
      `)
      .gte("created_at", yesterday.toISOString())
      .order("created_at", { ascending: false })
      .limit(5);

    setRecentEvolutions(evolutions || []);

    // Pacientes con alergias
    const { data: allergyPatients } = await supabase
      .from("patients")
      .select("id, name, allergies")
      .eq("status", "active")
      .not("allergies", "is", null)
      .neq("allergies", "");

    setPatientsWithAllergies(allergyPatients || []);
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="text-3xl font-bold">{patientsCount}</div>
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
            <div className="text-3xl font-bold">{todayAdmissions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Altas Próximas
              </CardTitle>
              <Calendar className="w-4 h-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingDischarges}</div>
            <p className="text-xs text-muted-foreground mt-1">Próximos 3 días</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Alertas de Alergias
              </CardTitle>
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{patientsWithAllergies.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allergy Alerts */}
        {patientsWithAllergies.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Pacientes con Alergias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-3">
                  {patientsWithAllergies.map((patient) => (
                    <div key={patient.id} className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                      <p className="font-semibold text-sm">{patient.name}</p>
                      <p className="text-xs text-destructive mt-1">⚠️ {patient.allergies}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              {recentEvolutions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay evoluciones recientes
                </p>
              ) : (
                <div className="space-y-3">
                  {recentEvolutions.map((evolution) => (
                    <div key={evolution.id} className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded">
                      <FileText className="w-4 h-4 text-muted-foreground mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {evolution.patients?.name || "Paciente"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Evolución - {evolution.evolution_date} {evolution.evolution_time}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">Nueva</Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}