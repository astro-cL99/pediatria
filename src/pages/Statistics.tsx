import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, TrendingUp, Calendar, Activity, Brain, Loader2, AlertTriangle } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { useClinicalInsights, useGenerateInsights } from "@/hooks/useClinicalInsights";
import { toast } from "sonner";

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
  const [generatingInsights, setGeneratingInsights] = useState(false);
  
  const { data: insights, isLoading: insightsLoading, refetch: refetchInsights } = useClinicalInsights();
  const generateInsights = useGenerateInsights();

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

  const handleGenerateInsights = async () => {
    setGeneratingInsights(true);
    try {
      await generateInsights();
      await refetchInsights();
    } catch (error) {
      console.error("Error generando insights:", error);
    } finally {
      setGeneratingInsights(false);
    }
  };

  const diagnosticosInsight = insights?.find(i => i.insight_type === 'diagnosticos_frecuentes');
  const alertasInsight = insights?.find(i => i.insight_type === 'alertas');
  const recomendacionesInsight = insights?.find(i => i.insight_type === 'recomendaciones');

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Estadísticas y Análisis</h1>
          <p className="text-muted-foreground">Panel de control y análisis inteligente</p>
        </div>
        <Button onClick={handleGenerateInsights} disabled={generatingInsights}>
          {generatingInsights ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Generar Insights IA
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="estadisticas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
          <TabsTrigger value="insights">Insights IA</TabsTrigger>
        </TabsList>

        <TabsContent value="estadisticas" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {insightsLoading ? (
            <SkeletonCard />
          ) : !insights || insights.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No hay insights generados</h3>
                <p className="text-muted-foreground mb-4">
                  Genera insights con IA para obtener análisis profundos de los datos clínicos
                </p>
                <Button onClick={handleGenerateInsights} disabled={generatingInsights}>
                  {generatingInsights ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Generar Insights
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {alertasInsight && alertasInsight.data?.insights && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      Alertas Clínicas
                    </CardTitle>
                    <CardDescription>Patrones que requieren atención</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {alertasInsight.data.insights.map((alerta: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                          <Badge 
                            variant={alerta.severidad === 'alta' ? 'destructive' : 'secondary'}
                            className="mt-1"
                          >
                            {alerta.severidad}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-medium">{alerta.tipo}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {alerta.descripcion}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {diagnosticosInsight && diagnosticosInsight.data?.insights && (
                <Card>
                  <CardHeader>
                    <CardTitle>Diagnósticos Más Frecuentes</CardTitle>
                    <CardDescription>Análisis de patrones diagnósticos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {diagnosticosInsight.data.insights.map((diag: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{diag.diagnostico}</p>
                            <p className="text-sm text-muted-foreground">
                              {diag.frecuencia} casos
                            </p>
                          </div>
                          <Badge variant="outline">{diag.porcentaje}%</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {recomendacionesInsight && recomendacionesInsight.data?.insights && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recomendaciones</CardTitle>
                    <CardDescription>Sugerencias basadas en análisis de datos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recomendacionesInsight.data.insights.map((rec: any, idx: number) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <p className="font-medium text-sm text-primary">{rec.area}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {rec.recomendacion}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
