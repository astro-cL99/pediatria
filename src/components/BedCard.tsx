import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Wind, Pill, Activity, Clock, TestTube, Bed } from "lucide-react";
import { BedPatientDetail } from "./BedPatientDetail";
import { useState } from "react";
import { differenceInDays, differenceInHours, format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BedData {
  id: string;
  room_number: string;
  bed_number: number;
  patient_id: string;
  admission_id: string;
  assigned_at: string;
  patient: {
    id: string;
    name: string;
    rut: string;
    date_of_birth: string;
    allergies: string | null;
  };
  admission: {
    id: string;
    admission_date: string;
    admission_diagnoses: string[];
    current_diagnoses?: string[];
    oxygen_requirement: any;
    respiratory_score: string | null;
    viral_panel: string | null;
    pending_tasks: string | null;
    antibiotics: any;
    antibiotics_tracking?: any[];
    medications: any;
    diet?: any;
    iv_therapy?: any;
  };
}

interface BedCardProps {
  roomNumber: string;
  beds: BedData[];
  onUpdate: () => void;
}

export function BedCard({ roomNumber, beds, onUpdate }: BedCardProps) {
  const [selectedBed, setSelectedBed] = useState<BedData | null>(null);

  const calculateDetailedAge = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    
    if (years < 1) {
      const totalMonths = months + (years * 12);
      return `${totalMonths} ${totalMonths === 1 ? 'mes' : 'meses'}`;
    }
    if (years < 2) {
      return `${years} año ${months} ${months === 1 ? 'mes' : 'meses'}`;
    }
    return `${years} años ${months} ${months === 1 ? 'mes' : 'meses'}`;
  };

  const getDaysHospitalized = (admissionDate: string) => {
    return differenceInDays(new Date(), new Date(admissionDate));
  };

  const isNewAdmission = (bed: BedData) => {
    return differenceInHours(new Date(), new Date(bed.admission.admission_date)) < 24;
  };

  const getViralPanelVariant = (panel: string): "destructive" | "default" | "secondary" | "outline" => {
    const lowerPanel = panel.toLowerCase();
    if (lowerPanel.includes("positivo")) return "destructive";
    if (lowerPanel.includes("negativo")) return "default";
    if (lowerPanel.includes("pendiente")) return "secondary";
    return "outline";
  };

  const getScoreDelta = (admission: any) => {
    if (!admission.respiratory_score) return "";
    
    try {
      const scores = typeof admission.respiratory_score === 'string' 
        ? JSON.parse(admission.respiratory_score) 
        : admission.respiratory_score;
      
      if (scores.at_admission && scores.current) {
        const delta = scores.at_admission - scores.current;
        if (delta > 0) return ` ↓${delta}`;
        if (delta < 0) return ` ↑${Math.abs(delta)}`;
        return " →";
      }
    } catch {
      // Si no es JSON válido, es un string simple como "Tal 5" - no mostrar delta
      return "";
    }
    return "";
  };

  const getServiceColor = (room: string) => {
    const roomNum = parseInt(room);
    if (roomNum >= 501 && roomNum <= 504) return "hsl(var(--primary))";
    if (roomNum >= 505 && roomNum <= 508) return "hsl(var(--secondary))";
    return "hsl(var(--accent))";
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-200 border-l-4 h-full" 
            style={{ borderLeftColor: getServiceColor(roomNumber) }}>
        <CardHeader className="pb-2 pt-2 px-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-1">
              <Bed className="h-3 w-3" />
              {roomNumber}
            </CardTitle>
            <Badge variant="outline" className="text-xs px-1 py-0">
              {beds.length}/{roomNumber === "507" ? "1" : "3"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-2 pt-0 space-y-1.5">
          {beds.length === 0 ? (
            <div className="text-center py-3 bg-muted/30 rounded-md">
              <p className="text-xs text-muted-foreground">Disponible</p>
            </div>
          ) : (
            beds.map((bed) => (
              <div
                key={bed.id}
                onClick={() => setSelectedBed(bed)}
                className="p-1.5 rounded-md border cursor-pointer hover:shadow-md hover:border-primary transition-all duration-200 bg-card"
              >
                {/* Header compacto */}
                <div className="flex justify-between items-start mb-0.5">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs truncate">{bed.patient.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {bed.patient.rut} • {calculateDetailedAge(bed.patient.date_of_birth)}
                    </p>
                  </div>
                  <Badge variant={isNewAdmission(bed) ? "destructive" : "outline"} className="ml-1 text-[10px] px-1 py-0">
                    {isNewAdmission(bed) ? "NEW" : `${getDaysHospitalized(bed.admission.admission_date)}d`}
                  </Badge>
                </div>

                {/* Fecha ingreso compacta */}
                <p className="text-[10px] text-muted-foreground mb-1">
                  📅 {format(new Date(bed.admission.admission_date), "dd/MM/yy HH:mm")}
                </p>

                {/* Diagnósticos compactos */}
                <div className="mb-1 space-y-0.5">
                  <div className="flex items-start gap-1">
                    <span className="text-[10px] font-semibold min-w-[30px]">Dx I:</span>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 flex-1">
                      {bed.admission.admission_diagnoses?.[0] || "N/A"}
                    </p>
                  </div>
                  {bed.admission.current_diagnoses && bed.admission.current_diagnoses.length > 0 && (
                    <div className="flex items-start gap-1">
                      <span className="text-[10px] font-semibold min-w-[30px]">Dx A:</span>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 flex-1">
                        {bed.admission.current_diagnoses[0]}
                      </p>
                    </div>
                  )}
                </div>

                {/* Badges compactos en línea */}
                <div className="flex flex-wrap gap-1 mb-1">
                  {bed.admission.respiratory_score && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      Score: {(() => {
                        try {
                          const score = typeof bed.admission.respiratory_score === 'string' 
                            ? JSON.parse(bed.admission.respiratory_score) 
                            : bed.admission.respiratory_score;
                          return score?.current || score?.at_admission || score || "?";
                        } catch {
                          return bed.admission.respiratory_score;
                        }
                      })()}
                      {getScoreDelta(bed.admission)}
                    </Badge>
                  )}
                  
                  {bed.admission.oxygen_requirement && Object.keys(bed.admission.oxygen_requirement).length > 0 && (
                    <Badge variant="destructive" className="text-[10px] px-1 py-0">
                      <Wind className="h-2 w-2 mr-0.5" />
                      {bed.admission.oxygen_requirement.type || "O₂"}
                    </Badge>
                  )}
                  
                  {bed.admission.viral_panel && (
                    <Badge variant={getViralPanelVariant(bed.admission.viral_panel)} className="text-[10px] px-1 py-0">
                      <TestTube className="h-2 w-2 mr-0.5" />
                      {bed.admission.viral_panel.substring(0, 10)}
                    </Badge>
                  )}
                  
                  {bed.admission.diet && bed.admission.diet.type && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      🍽️ {bed.admission.diet.type.substring(0, 8)}
                    </Badge>
                  )}
                  
                  {bed.admission.iv_therapy && bed.admission.iv_therapy.active && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      💉 EV {bed.admission.iv_therapy.percentage}
                    </Badge>
                  )}
                </div>

                {/* Antibióticos ultra-compactos */}
                {bed.admission.antibiotics_tracking && bed.admission.antibiotics_tracking.length > 0 && (
                  <div className="space-y-0.5 mb-1">
                    {bed.admission.antibiotics_tracking.map((atb: any, idx: number) => {
                      const currentDay = differenceInDays(new Date(), new Date(atb.start_date)) + 1;
                      const progress = (currentDay / atb.planned_days) * 100;
                      
                      return (
                        <div key={idx} className="bg-yellow-50 dark:bg-yellow-950/20 p-1 rounded">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-semibold truncate flex-1">{atb.name}</span>
                            <Badge variant="outline" className="text-[9px] px-1 py-0 ml-1">
                              D{currentDay}/{atb.planned_days}
                            </Badge>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1 mt-0.5">
                            <div 
                              className="bg-yellow-600 h-1 rounded-full transition-all" 
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Tareas pendientes compactas */}
                {bed.admission.pending_tasks && bed.admission.pending_tasks.trim() && (
                  <div className="bg-destructive/10 border-l-2 border-destructive p-1 rounded">
                    <div className="flex items-start gap-1">
                      <AlertCircle className="h-2 w-2 mt-0.5 text-destructive flex-shrink-0" />
                      <p className="text-[10px] text-destructive line-clamp-2">
                        {bed.admission.pending_tasks}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {selectedBed && (
        <BedPatientDetail
          bed={selectedBed}
          open={!!selectedBed}
          onOpenChange={(open) => !open && setSelectedBed(null)}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}
