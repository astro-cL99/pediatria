import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Wind, Pill, Activity, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { BedPatientDetail } from "./BedPatientDetail";
import { PatientExpandedView } from "./PatientExpandedView";
import { AntibioticTracker } from "./AntibioticTracker";
import { useState } from "react";
import { differenceInDays } from "date-fns";
import { calculateDaysHospitalized, getHospitalizationColor } from "@/utils/automaticTracking";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
    oxygen_requirement: any;
    respiratory_score: string | null;
    viral_panel: string | null;
    pending_tasks: string | null;
    antibiotics: any;
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

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    
    if (years < 1) {
      return `${months + (years * 12)}m`;
    }
    return `${years}a`;
  };

  const getDaysHospitalized = (admissionDate: string) => {
    return differenceInDays(new Date(), new Date(admissionDate));
  };

  const getStatusColor = (bed: BedData) => {
    const { oxygen_requirement, antibiotics, viral_panel } = bed.admission;
    
    if (oxygen_requirement && Object.keys(oxygen_requirement).length > 0) {
      return "border-red-500 bg-red-50 dark:bg-red-950/20";
    }
    if (antibiotics && Object.keys(antibiotics).length > 0) {
      return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20";
    }
    if (viral_panel && viral_panel.toLowerCase().includes("positivo")) {
      return "border-blue-500 bg-blue-50 dark:bg-blue-950/20";
    }
    return "border-green-500 bg-green-50 dark:bg-green-950/20";
  };

  const hasPendingTasks = (bed: BedData) => {
    return bed.admission.pending_tasks && bed.admission.pending_tasks.trim().length > 0;
  };

  return (
    <>
      <Card className={`relative ${beds.length === 0 ? 'opacity-60' : ''}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Cama {roomNumber}</span>
            {beds.length > 0 && (
              <Badge variant="secondary">{beds.length}/3</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {beds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Cama disponible</p>
            </div>
          ) : (
            beds.map((bed) => (
              <div
                key={bed.id}
                onClick={() => setSelectedBed(bed)}
                className={`p-3 rounded-lg border-2 cursor-pointer hover:shadow-md transition-all ${getStatusColor(bed)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-sm truncate">
                      {bed.patient.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {calculateAge(bed.patient.date_of_birth)} • Subcama {bed.bed_number}
                    </p>
                  </div>
                  {hasPendingTasks(bed) && (
                    <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 ml-2" />
                  )}
                </div>

                {bed.admission.admission_diagnoses && bed.admission.admission_diagnoses.length > 0 && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {bed.admission.admission_diagnoses[0]}
                  </p>
                )}

                <div className="flex flex-wrap gap-1 mb-2">
                  {bed.admission.oxygen_requirement && Object.keys(bed.admission.oxygen_requirement).length > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      <Wind className="h-3 w-3 mr-1" />
                      O2
                    </Badge>
                  )}
                  {bed.admission.antibiotics && Object.keys(bed.admission.antibiotics).length > 0 && (
                    <Badge variant="default" className="text-xs bg-yellow-600">
                      <Pill className="h-3 w-3 mr-1" />
                      ATB
                    </Badge>
                  )}
                  {bed.admission.respiratory_score && (
                    <Badge variant="outline" className="text-xs">
                      <Activity className="h-3 w-3 mr-1" />
                      {bed.admission.respiratory_score}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  {getDaysHospitalized(bed.admission.admission_date)} días
                </div>
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
