import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface GrowthData {
  measurement_date: string;
  weight_kg: number;
  height_cm: number;
  bmi: number;
}

interface GrowthChartProps {
  patientId: string;
}

export function GrowthChart({ patientId }: GrowthChartProps) {
  const [data, setData] = useState<GrowthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrowthData();
  }, [patientId]);

  const fetchGrowthData = async () => {
    try {
      const { data: measurements, error } = await supabase
        .from("growth_measurements")
        .select("measurement_date, weight_kg, height_cm, bmi")
        .eq("patient_id", patientId)
        .order("measurement_date", { ascending: true });

      if (error) throw error;
      setData(measurements || []);
    } catch (error) {
      console.error("Error fetching growth data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Cargando gráficas...
        </CardContent>
      </Card>
    );
  }

  if (data.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Curvas de Crecimiento
          </CardTitle>
          <CardDescription>
            Se necesitan al menos 2 mediciones para generar gráficas
          </CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center text-muted-foreground">
          No hay suficientes datos para mostrar tendencias
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    date: new Date(item.measurement_date).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "short",
    }),
    Peso: item.weight_kg,
    Talla: item.height_cm,
    IMC: item.bmi,
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Peso y Talla</CardTitle>
          <CardDescription>Evolución antropométrica del paciente</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="Peso"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="Talla"
                stroke="hsl(var(--secondary))"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Índice de Masa Corporal (IMC)</CardTitle>
          <CardDescription>Tendencia del IMC en el tiempo</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="IMC"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}