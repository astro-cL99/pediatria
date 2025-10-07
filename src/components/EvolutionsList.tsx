import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Activity } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Evolution {
  id: string;
  evolution_date: string;
  evolution_time: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  vital_signs: any;
  created_at: string;
}

interface EvolutionsListProps {
  patientId: string;
  admissionId?: string;
}

export function EvolutionsList({ patientId, admissionId }: EvolutionsListProps) {
  const [evolutions, setEvolutions] = useState<Evolution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvolutions();

    // Subscribe to changes
    const channel = supabase
      .channel('evolutions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_evolutions',
          filter: `patient_id=eq.${patientId}`,
        },
        () => fetchEvolutions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId, admissionId]);

  const fetchEvolutions = async () => {
    try {
      let query = supabase
        .from("daily_evolutions")
        .select("*")
        .eq("patient_id", patientId)
        .order("evolution_date", { ascending: false })
        .order("evolution_time", { ascending: false });

      if (admissionId) {
        query = query.eq("admission_id", admissionId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvolutions(data || []);
    } catch (error) {
      console.error("Error fetching evolutions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-center text-muted-foreground">Cargando evoluciones...</p>;
  }

  if (evolutions.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No hay evoluciones registradas</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-4">
        {evolutions.map((evolution) => (
          <Card key={evolution.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-lg">
                    {new Date(evolution.evolution_date).toLocaleDateString("es-CL", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </CardTitle>
                </div>
                <Badge variant="outline">{evolution.evolution_time}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {evolution.vital_signs && Object.keys(evolution.vital_signs).length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 p-3 bg-muted/50 rounded-lg text-sm">
                  {evolution.vital_signs.temperature && (
                    <div>
                      <span className="text-muted-foreground">T°:</span>{" "}
                      <span className="font-medium">{evolution.vital_signs.temperature}°C</span>
                    </div>
                  )}
                  {evolution.vital_signs.heartRate && (
                    <div>
                      <span className="text-muted-foreground">FC:</span>{" "}
                      <span className="font-medium">{evolution.vital_signs.heartRate} lpm</span>
                    </div>
                  )}
                  {evolution.vital_signs.respiratoryRate && (
                    <div>
                      <span className="text-muted-foreground">FR:</span>{" "}
                      <span className="font-medium">{evolution.vital_signs.respiratoryRate} rpm</span>
                    </div>
                  )}
                  {evolution.vital_signs.bloodPressure && (
                    <div>
                      <span className="text-muted-foreground">PA:</span>{" "}
                      <span className="font-medium">{evolution.vital_signs.bloodPressure}</span>
                    </div>
                  )}
                  {evolution.vital_signs.oxygenSaturation && (
                    <div>
                      <span className="text-muted-foreground">SatO₂:</span>{" "}
                      <span className="font-medium">{evolution.vital_signs.oxygenSaturation}%</span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-sm text-primary mb-1">Subjetivo:</p>
                  <p className="text-sm">{evolution.subjective}</p>
                </div>
                <div>
                  <p className="font-semibold text-sm text-secondary mb-1">Objetivo:</p>
                  <p className="text-sm">{evolution.objective}</p>
                </div>
                <div>
                  <p className="font-semibold text-sm text-accent mb-1">Análisis:</p>
                  <p className="text-sm">{evolution.assessment}</p>
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1">Plan:</p>
                  <p className="text-sm">{evolution.plan}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}