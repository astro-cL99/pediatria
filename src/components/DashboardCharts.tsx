import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";

const admissionTrendData = [
  { date: 'Lun', ingresos: 4, altas: 2 },
  { date: 'Mar', ingresos: 3, altas: 5 },
  { date: 'Mié', ingresos: 6, altas: 3 },
  { date: 'Jue', ingresos: 5, altas: 4 },
  { date: 'Vie', ingresos: 7, altas: 6 },
  { date: 'Sáb', ingresos: 2, altas: 3 },
  { date: 'Dom', ingresos: 1, altas: 2 },
];

const diagnosisData = [
  { name: 'Neumonía', value: 35, color: 'hsl(var(--chart-1))' },
  { name: 'Bronquiolitis', value: 28, color: 'hsl(var(--chart-2))' },
  { name: 'Gastroenteritis', value: 20, color: 'hsl(var(--chart-3))' },
  { name: 'Asma', value: 12, color: 'hsl(var(--chart-4))' },
  { name: 'Otros', value: 5, color: 'hsl(var(--chart-5))' },
];

const antibioticUsageData = [
  { nombre: 'Ceftriaxona', pacientes: 8 },
  { nombre: 'Ampicilina', pacientes: 6 },
  { nombre: 'Gentamicina', pacientes: 4 },
  { nombre: 'Cloxacilina', pacientes: 3 },
  { nombre: 'Cefotaxima', pacientes: 2 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function DashboardCharts() {
  return (
    <div className="grid gap-6 md:grid-cols-2 animate-slide-in-up">
      {/* Tendencia de Ingresos y Altas */}
      <Card className="medical-card col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tendencia Semanal: Ingresos vs Altas</span>
            <Badge variant="outline" className="text-xs">Última semana</Badge>
          </CardTitle>
          <CardDescription>
            Análisis de movimiento de pacientes en los últimos 7 días
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={admissionTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />
              <Line 
                type="monotone" 
                dataKey="ingresos" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
                name="Ingresos"
              />
              <Line 
                type="monotone" 
                dataKey="altas" 
                stroke="hsl(var(--success))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--success))', r: 4 }}
                activeDot={{ r: 6 }}
                name="Altas"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Distribución de Diagnósticos */}
      <Card className="medical-card">
        <CardHeader>
          <CardTitle>Distribución de Diagnósticos</CardTitle>
          <CardDescription>Patologías más frecuentes este mes</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={diagnosisData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {diagnosisData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {diagnosisData.map((diagnosis, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: diagnosis.color }}
                />
                <span className="text-muted-foreground truncate">{diagnosis.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Uso de Antibióticos */}
      <Card className="medical-card">
        <CardHeader>
          <CardTitle>Antibióticos Más Utilizados</CardTitle>
          <CardDescription>Top 5 medicamentos en uso</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={antibioticUsageData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                type="number" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                dataKey="nombre" 
                type="category" 
                width={100}
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '11px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="pacientes" 
                fill="hsl(var(--secondary))" 
                radius={[0, 8, 8, 0]}
                name="Pacientes"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}