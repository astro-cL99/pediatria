import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Activity, Droplet, TestTube } from "lucide-react";

interface Evolution {
  evolution_date: string;
  vital_signs?: {
    temperature?: number;
    heart_rate?: number;
    respiratory_rate?: number;
    blood_pressure?: string;
    oxygen_saturation?: number;
  };
  respiratory_scores?: {
    pulmonary_score?: { current: number };
    tal_score?: { current: number };
  };
}

interface LabResult {
  test_date: string;
  results: {
    [key: string]: number;
  };
}

interface ParameterTrendChartsProps {
  evolutions: Evolution[];
  labResults?: LabResult[];
}

export function ParameterTrendCharts({ evolutions, labResults }: ParameterTrendChartsProps) {
  // Procesar datos de signos vitales
  const vitalSignsData = evolutions
    .filter(e => e.vital_signs)
    .map(e => ({
      fecha: new Date(e.evolution_date).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' }),
      temperatura: e.vital_signs?.temperature,
      fc: e.vital_signs?.heart_rate,
      fr: e.vital_signs?.respiratory_rate,
      satO2: e.vital_signs?.oxygen_saturation,
    }))
    .reverse()
    .slice(-7); // Últimos 7 días

  // Procesar datos de scores respiratorios
  const scoresData = evolutions
    .filter(e => e.respiratory_scores)
    .map(e => ({
      fecha: new Date(e.evolution_date).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' }),
      pulmonary: e.respiratory_scores?.pulmonary_score?.current,
      tal: e.respiratory_scores?.tal_score?.current,
    }))
    .reverse()
    .slice(-7);

  // Procesar datos de laboratorio
  const labData = labResults?.map(lab => ({
    fecha: new Date(lab.test_date).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' }),
    pcr: lab.results.pcr,
    leucocitos: lab.results.leucocitos,
    hemoglobina: lab.results.hemoglobina,
  })).reverse().slice(-7);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Tendencias Evolutivas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="vitales" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="vitales">
              <Activity className="h-4 w-4 mr-2" />
              Signos Vitales
            </TabsTrigger>
            <TabsTrigger value="scores">
              <Droplet className="h-4 w-4 mr-2" />
              Scores
            </TabsTrigger>
            <TabsTrigger value="labs">
              <TestTube className="h-4 w-4 mr-2" />
              Laboratorios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vitales" className="space-y-6 mt-6">
            {vitalSignsData.length > 0 ? (
              <>
                <div>
                  <h4 className="text-sm font-semibold mb-3">Saturación de O2 (%)</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={vitalSignsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis domain={[85, 100]} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="satO2"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Frecuencia Cardíaca (lpm)</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={vitalSignsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="fc"
                        stroke="hsl(var(--destructive))"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Frecuencia Respiratoria (rpm)</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={vitalSignsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="fr"
                        stroke="hsl(var(--secondary))"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay datos de signos vitales registrados</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="scores" className="mt-6">
            {scoresData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={scoresData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="pulmonary"
                    name="Pulmonary Score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="tal"
                    name="Score de Tal"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Droplet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay scores respiratorios registrados</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="labs" className="mt-6">
            {labData && labData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={labData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="pcr"
                    name="PCR (mg/L)"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="leucocitos"
                    name="Leucocitos (×10³/μL)"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <TestTube className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay resultados de laboratorio registrados</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
