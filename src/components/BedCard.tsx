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
    
    const scores = typeof admission.respiratory_score === 'string' 
      ? JSON.parse(admission.respiratory_score) 
      : admission.respiratory_score;
    
    if (scores.at_admission && scores.current) {
      const delta = scores.at_admission - scores.current;
      if (delta > 0) return ` ↓${delta}`;
      if (delta < 0) return ` ↑${Math.abs(delta)}`;
      return " →";
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
      <Card className="hover:shadow-lg transition-all duration-200 border-l-4" 
            style={{ borderLeftColor: getServiceColor(roomNumber) }}>
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Bed className="h-4 w-4" />
              Sala {roomNumber}
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {beds.length}/3 camas
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-2">
          {beds.length === 0 ? (
            <div className="text-center py-4 bg-muted/30 rounded-md">
              <p className="text-xs text-muted-foreground">Sala disponible</p>
            </div>
          ) : (
            beds.map((bed) => (
              <div
                key={bed.id}
                onClick={() => setSelectedBed(bed)}
                className="p-2 rounded-md border cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200 bg-card"
              >
                {/* Header con nombre, edad, RUT */}
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1">
                    <p className="font-bold text-sm truncate">{bed.patient.name}</p>
                    <p className="text-xs text-muted-foreground">
                      RUT: {bed.patient.rut} • {calculateDetailedAge(bed.patient.date_of_birth)}
                    </p>
                  </div>
                  <Badge variant={isNewAdmission(bed) ? "destructive" : "outline"} className="ml-2 text-xs">
                    {isNewAdmission(bed) ? "NUEVO" : `${getDaysHospitalized(bed.admission.admission_date)}d`}
                  </Badge>
                </div>

                {/* Fecha ingreso */}
                <p className="text-xs text-muted-foreground mb-2">
                  📅 Ingreso: {format(new Date(bed.admission.admission_date), "dd/MM/yyyy HH:mm")}
                </p>

                {/* Diagnósticos */}
                <div className="mb-2">
                  <p className="text-xs font-semibold">Dx Ingreso:</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {bed.admission.admission_diagnoses?.[0] || "N/A"}
                  </p>
                  {bed.admission.current_diagnoses && bed.admission.current_diagnoses.length > 0 && (
                    <>
                      <p className="text-xs font-semibold mt-1">Dx Actual:</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {bed.admission.current_diagnoses[0]}
                      </p>
                    </>
                  )}
                </div>

                {/* Scores respiratorios */}
                {bed.admission.respiratory_score && (
                  <div className="flex gap-2 text-xs mb-2">
                    <Badge variant="outline">
                      Score: {(() => {
                        try {
                          const score = typeof bed.admission.respiratory_score === 'string' 
                            ? JSON.parse(bed.admission.respiratory_score) 
                            : bed.admission.respiratory_score;
                          return score?.at_admission || score || "N/A";
                        } catch {
                          return bed.admission.respiratory_score;
                        }
                      })()}
                      {getScoreDelta(bed.admission)}
                    </Badge>
                  </div>
                )}

                {/* Oxígeno */}
                {bed.admission.oxygen_requirement && Object.keys(bed.admission.oxygen_requirement).length > 0 && (
                  <div className="bg-red-50 dark:bg-red-950/20 p-2 rounded text-xs mb-2">
                    <p className="font-semibold flex items-center">
                      <Wind className="h-3 w-3 mr-1" />
                      {bed.admission.oxygen_requirement.type || "O₂"}
                    </p>
                    {bed.admission.oxygen_requirement.type === "CNAF" && (
                      <p>Flujo: {bed.admission.oxygen_requirement.flow} L/min • FiO₂: {bed.admission.oxygen_requirement.fio2}%</p>
                    )}
                    {bed.admission.oxygen_requirement.type === "CPAP" && (
                      <p>PEEP: {bed.admission.oxygen_requirement.peep} cmH₂O • FiO₂: {bed.admission.oxygen_requirement.fio2}%</p>
                    )}
                  </div>
                )}

                {/* Panel viral/bacteriano */}
                {bed.admission.viral_panel && (
                  <div className="flex items-center gap-1 text-xs mb-2">
                    <TestTube className="h-3 w-3" />
                    <span className="font-semibold">Panel:</span>
                    <Badge variant={getViralPanelVariant(bed.admission.viral_panel)}>
                      {bed.admission.viral_panel}
                    </Badge>
                  </div>
                )}

                {/* Antibióticos con tracking de días */}
                {bed.admission.antibiotics_tracking && bed.admission.antibiotics_tracking.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {bed.admission.antibiotics_tracking.map((atb: any, idx: number) => {
                      const currentDay = differenceInDays(new Date(), new Date(atb.start_date)) + 1;
                      const progress = (currentDay / atb.planned_days) * 100;
                      
                      return (
                        <div key={idx} className="bg-yellow-50 dark:bg-yellow-950/20 p-2 rounded">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold">{atb.name}</span>
                            <Badge variant="outline">D{currentDay}/{atb.planned_days}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{atb.dose}</p>
                          {/* Barra de progreso */}
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-yellow-600 h-1.5 rounded-full transition-all" 
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Tareas pendientes */}
                {bed.admission.pending_tasks && bed.admission.pending_tasks.trim() && (
                  <Alert variant="destructive" className="py-1 px-2">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">
                      {bed.admission.pending_tasks}
                    </AlertDescription>
                  </Alert>
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
