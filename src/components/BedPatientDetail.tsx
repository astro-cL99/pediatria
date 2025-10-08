import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { differenceInDays, differenceInYears, differenceInMonths } from "date-fns";
import { Wind, Pill, Activity, AlertCircle, FileText } from "lucide-react";

interface BedPatientDetailProps {
  bed: {
    id: string;
    room_number: string;
    bed_number: number;
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
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function BedPatientDetail({ bed, open, onOpenChange }: BedPatientDetailProps) {
  const calculateAge = () => {
    const birth = new Date(bed.patient.date_of_birth);
    const years = differenceInYears(new Date(), birth);
    const months = differenceInMonths(new Date(), birth);
    
    if (years < 1) {
      return `${months} meses`;
    }
    return `${years} año${years !== 1 ? 's' : ''}`;
  };

  const getDaysHospitalized = () => {
    return differenceInDays(new Date(), new Date(bed.admission.admission_date));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Cama {bed.room_number} - Subcama {bed.bed_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información del Paciente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-semibold">{bed.patient.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">RUT</p>
                  <p className="font-semibold">{bed.patient.rut}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Edad</p>
                  <p className="font-semibold">{calculateAge()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Días Hospitalizado</p>
                  <p className="font-semibold">{getDaysHospitalized()} días</p>
                </div>
              </div>
              
              {bed.patient.allergies && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Alergias</p>
                  <Badge variant="destructive" className="mt-1">
                    {bed.patient.allergies}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Diagnoses */}
          {bed.admission.admission_diagnoses && bed.admission.admission_diagnoses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Diagnósticos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {bed.admission.admission_diagnoses.map((diagnosis, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-block w-6 text-muted-foreground">{index + 1}.</span>
                      <span>{diagnosis}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Clinical Status */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Oxygen Support */}
            {bed.admission.oxygen_requirement && Object.keys(bed.admission.oxygen_requirement).length > 0 && (
              <Card className="border-red-200 dark:border-red-900">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center text-red-700 dark:text-red-400">
                    <Wind className="h-5 w-5 mr-2" />
                    Soporte Oxígeno
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(bed.admission.oxygen_requirement, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Antibiotics */}
            {bed.admission.antibiotics && Object.keys(bed.admission.antibiotics).length > 0 && (
              <Card className="border-yellow-200 dark:border-yellow-900">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center text-yellow-700 dark:text-yellow-400">
                    <Pill className="h-5 w-5 mr-2" />
                    Antibióticos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(bed.admission.antibiotics, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Respiratory Score */}
          {bed.admission.respiratory_score && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Score Respiratorio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-lg">{bed.admission.respiratory_score}</p>
              </CardContent>
            </Card>
          )}

          {/* Viral Panel */}
          {bed.admission.viral_panel && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Panel Viral</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge 
                  variant={bed.admission.viral_panel.toLowerCase().includes("positivo") ? "destructive" : "secondary"}
                  className="text-sm"
                >
                  {bed.admission.viral_panel}
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Pending Tasks */}
          {bed.admission.pending_tasks && (
            <Card className="border-orange-200 dark:border-orange-900">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-orange-700 dark:text-orange-400">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{bed.admission.pending_tasks}</p>
              </CardContent>
            </Card>
          )}

          {/* Medications */}
          {bed.admission.medications && Object.keys(bed.admission.medications).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Medicamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm whitespace-pre-wrap">
                  {JSON.stringify(bed.admission.medications, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
