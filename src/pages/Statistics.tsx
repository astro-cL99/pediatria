import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Calendar, Activity } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { SkeletonCard } from "@/components/ui/skeleton-card";

interface Statistics {
  totalPatients: number;
  averageStay: number;
  currentOccupancy: number;
  monthlyAdmissions: number;
}

export default function Statistics() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [admissionTrends, setAdmissionTrends] = useState<any[]>([]);
  const [topDiagnoses, setTopDiagnoses] = useState<any[]>([]);
  const [occupancyData, setOccupancyData] = useState<any[]>([]);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      // Total patients
      const { count: totalPatients } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true });

      // Active patients (current occupancy)
      const { count: currentOccupancy } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Monthly admissions
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: monthlyAdmissions } = await supabase
        .from("admissions")
        .select("*", { count: "exact", head: true })
        .gte("admission_date", startOfMonth.toISOString());

      // Average stay calculation
      const { data: dischargedPatients } = await supabase
        .from("admissions")
        .select("admission_date, discharge_date")
        .not("discharge_date", "is", null)
        .limit(100);

      let totalDays = 0;
      let count = 0;
      dischargedPatients?.forEach((admission) => {
        if (admission.discharge_date && admission.admission_date) {
          const diff = new Date(admission.discharge_date).getTime() - new Date(admission.admission_date).getTime();
          totalDays += diff / (1000 * 60 * 60 * 24);
          count++;
        }
      });
      const averageStay = count > 0 ? Math.round(totalDays / count) : 0;

      setStats({
        totalPatients: totalPatients || 0,
        averageStay,
        currentOccupancy: currentOccupancy || 0,
        monthlyAdmissions: monthlyAdmissions || 0,
      });

      // Fetch trends for last 6 months
      await fetchAdmissionTrends();
      await fetchTopDiagnoses();
      await fetchOccupancyTrend();
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmissionTrends = async () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        month: date.toLocaleDateString("es-CL", { month: "short" }),
        year: date.getFullYear(),
        startDate: new Date(date.getFullYear(), date.getMonth(), 1),
        endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0),
      });
    }

    const trendsData = await Promise.all(
      months.map(async ({ month, startDate, endDate }) => {
        const { count: admissions } = await supabase
          .from("admissions")
          .select("*", { count: "exact", head: true })
          .gte("admission_date", startDate.toISOString())
          .lte("admission_date", endDate.toISOString());

        const { count: discharges } = await supabase
          .from("admissions")
          .select("*", { count: "exact", head: true })
          .gte("discharge_date", startDate.toISOString())
          .lte("discharge_date", endDate.toISOString())
          .not("discharge_date", "is", null);

        return {
          month,
          Ingresos: admissions || 0,
          Egresos: discharges || 0,
        };
      })
    );

    setAdmissionTrends(trendsData);
  };

  const fetchTopDiagnoses = async () => {
    const { data } = await supabase
      .from("admissions")
      .select("admission_diagnoses")
      .not("admission_diagnoses", "is", null)
      .limit(100);

    const diagnosisCount: Record<string, number> = {};
    data?.forEach((admission) => {
      admission.admission_diagnoses?.forEach((diagnosis: string) => {
        diagnosisCount[diagnosis] = (diagnosisCount[diagnosis] || 0) + 1;
      });
    });

    const topDiags = Object.entries(diagnosisCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, value]) => ({ name: name.substring(0, 30), value }));

    setTopDiagnoses(topDiags);
  };

  const fetchOccupancyTrend = async () => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const { count } = await supabase
        .from("admissions")
        .select("*", { count: "exact", head: true })
        .lte("admission_date", nextDay.toISOString())
        .or(`discharge_date.gte.${date.toISOString()},discharge_date.is.null`);

      days.push({
        day: date.getDate() + "/" + (date.getMonth() + 1),
        pacientes: count || 0,
      });
    }

    setOccupancyData(days);
  };

  const COLORS = ["hsl(221, 83%, 53%)", "hsl(142, 76%, 36%)", "hsl(217, 91%, 60%)", "hsl(0, 84%, 60%)", "hsl(45, 93%, 47%)"];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Estadísticas y Reportes</h1>
        <p className="text-muted-foreground">Métricas y análisis del servicio pediátrico</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPatients}</div>
            <p className="text-xs text-muted-foreground">Histórico</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocupación Actual</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.currentOccupancy}</div>
            <p className="text-xs text-muted-foreground">Pacientes activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estadía Promedio</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageStay}</div>
            <p className="text-xs text-muted-foreground">Días</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.monthlyAdmissions}</div>
            <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString("es-CL", { month: "long" })}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Ingresos y Egresos</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={admissionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Ingresos" stroke="hsl(221, 83%, 53%)" strokeWidth={2} />
                <Line type="monotone" dataKey="Egresos" stroke="hsl(142, 76%, 36%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Diagnósticos</CardTitle>
            <CardDescription>Más frecuentes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topDiagnoses} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(221, 83%, 53%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Ocupación Diaria</CardTitle>
            <CardDescription>Últimos 30 días</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="pacientes" stroke="hsl(217, 91%, 60%)" fill="hsl(217, 91%, 60%, 0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
