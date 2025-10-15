import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  updateAntibioticTracking,
  getAntibioticProgress,
  formatAntibioticDisplay,
  isAntibioticEndingSoon,
  hasAntibioticEnded,
  type AntibioticTracking,
} from "@/utils/automaticTracking";

interface AntibioticTrackerProps {
  antibiotics: AntibioticTracking[];
  compact?: boolean;
}

export function AntibioticTracker({ antibiotics, compact = false }: AntibioticTrackerProps) {
  if (!antibiotics || antibiotics.length === 0) {
    return null;
  }

  const updatedAntibiotics = updateAntibioticTracking(antibiotics);

  if (compact) {
    return (
      <div className="space-y-2">
        {updatedAntibiotics.map((atb, idx) => {
          const progress = getAntibioticProgress(atb.current_day, atb.planned_days);
          const ending = isAntibioticEndingSoon(atb);
          const ended = hasAntibioticEnded(atb);

          return (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{atb.name}</span>
                  <Badge variant={ended ? "secondary" : ending ? "destructive" : "default"}>
                    {formatAntibioticDisplay(atb)}
                  </Badge>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          💊 Tratamiento Antibiótico
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {updatedAntibiotics.map((atb, idx) => {
          const progress = getAntibioticProgress(atb.current_day, atb.planned_days);
          const ending = isAntibioticEndingSoon(atb);
          const ended = hasAntibioticEnded(atb);

          return (
            <div
              key={idx}
              className={`p-4 rounded-lg border ${
                ended
                  ? "bg-secondary/20 border-secondary"
                  : ending
                  ? "bg-destructive/10 border-destructive/30"
                  : "bg-card border-border"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{atb.name}</h4>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Inicio: {format(new Date(atb.start_date), "dd/MM", { locale: es })} → Fin:{" "}
                      {format(new Date(atb.end_date), "dd/MM", { locale: es })}
                    </span>
                  </div>
                </div>
                <Badge
                  variant={ended ? "secondary" : ending ? "destructive" : "default"}
                  className="text-base px-3 py-1"
                >
                  {formatAntibioticDisplay(atb)}
                </Badge>
              </div>

              <div className="space-y-2">
                <Progress value={progress} className="h-3" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {Math.round(progress)}% completado
                  </span>
                  {ending && !ended && (
                    <div className="flex items-center gap-1 text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      <span className="font-medium">Por terminar</span>
                    </div>
                  )}
                  {ended && (
                    <div className="flex items-center gap-1 text-secondary-foreground">
                      <CheckCircle2 className="h-3 w-3" />
                      <span className="font-medium">Completado</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
