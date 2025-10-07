import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, Pill, Upload, Activity } from "lucide-react";

interface TimelineEvent {
  id: string;
  type: "admission" | "evolution" | "medication" | "document" | "discharge";
  date: string;
  title: string;
  description?: string;
  icon: any;
}

export function PatientTimeline({ patientId }: { patientId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimelineEvents();
  }, [patientId]);

  const fetchTimelineEvents = async () => {
    try {
      const timelineEvents: TimelineEvent[] = [];

      // Fetch admissions
      const { data: admissions } = await supabase
        .from("admissions")
        .select("*")
        .eq("patient_id", patientId);

      admissions?.forEach((admission) => {
        timelineEvents.push({
          id: admission.id,
          type: "admission",
          date: admission.admission_date,
          title: "Ingreso Hospitalario",
          description: admission.chief_complaint,
          icon: Activity,
        });

        if (admission.discharge_date) {
          timelineEvents.push({
            id: admission.id + "-discharge",
            type: "discharge",
            date: admission.discharge_date,
            title: "Alta Médica",
            icon: Calendar,
          });
        }
      });

      // Fetch evolutions
      const { data: evolutions } = await supabase
        .from("daily_evolutions")
        .select("*")
        .eq("patient_id", patientId)
        .limit(20);

      evolutions?.forEach((evolution) => {
        timelineEvents.push({
          id: evolution.id,
          type: "evolution",
          date: evolution.evolution_date + "T" + evolution.evolution_time,
          title: "Evolución Médica",
          description: evolution.assessment?.substring(0, 100),
          icon: FileText,
        });
      });

      // Fetch documents
      const { data: documents } = await supabase
        .from("medical_documents")
        .select("*")
        .eq("patient_id", patientId);

      documents?.forEach((doc) => {
        timelineEvents.push({
          id: doc.id,
          type: "document",
          date: doc.uploaded_at,
          title: `Documento: ${doc.document_type}`,
          description: doc.file_name,
          icon: Upload,
        });
      });

      // Sort by date descending
      timelineEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setEvents(timelineEvents);
    } catch (error) {
      console.error("Error fetching timeline:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      admission: "bg-primary/10 text-primary border-primary/20",
      evolution: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      medication: "bg-green-500/10 text-green-600 border-green-500/20",
      document: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      discharge: "bg-secondary/10 text-secondary border-secondary/20",
    };
    return colors[type] || "";
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando historial...</div>;
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const Icon = event.icon;
        return (
          <Card key={event.id} className="relative">
            {index !== events.length - 1 && (
              <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-border" />
            )}
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${getTypeColor(event.type)}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold">{event.title}</h4>
                    <Badge variant="outline" className={getTypeColor(event.type)}>
                      {event.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {new Date(event.date).toLocaleDateString("es-CL", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {event.description && (
                    <p className="text-sm">{event.description}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
