import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { differenceInDays, differenceInYears, differenceInMonths } from "date-fns";
import { Wind, Pill, Activity, AlertCircle, FileText, Pencil, UserCircle, LogOut, ArrowRightLeft } from "lucide-react";
import { EditAdmissionForm } from "./EditAdmissionForm";
import { ExternalLinksPanel } from "./ExternalLinksPanel";
import { ChangeBedDialog } from "./ChangeBedDialog";
import { toast } from "sonner";

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

export function BedPatientDetail({ bed, open, onOpenChange, onUpdate }: BedPatientDetailProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isDischarging, setIsDischarging] = useState(false);
  const [showChangeBed, setShowChangeBed] = useState(false);

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

  const handleEditSuccess = () => {
    setIsEditing(false);
    onUpdate();
  };

  const handleDischarge = async () => {
    if (!confirm("¿Está seguro de dar de alta a este paciente?")) {
      return;
    }

    setIsDischarging(true);
    try {
      // Desactivar la asignación de cama
      const { error: bedError } = await supabase
        .from("bed_assignments")
        .update({ is_active: false, discharged_at: new Date().toISOString() })
        .eq("id", bed.id);

      if (bedError) throw bedError;

      // Actualizar estado de admisión
      const { error: admissionError } = await supabase
        .from("admissions")
        .update({ status: "discharged", discharge_date: new Date().toISOString() })
        .eq("id", bed.admission.id);

      if (admissionError) throw admissionError;

      // Actualizar estado del paciente
      const { error: patientError } = await supabase
        .from("patients")
        .update({ status: "discharged", discharge_date: new Date().toISOString() })
        .eq("id", bed.patient.id);

      if (patientError) throw patientError;

      toast.success("Paciente dado de alta exitosamente");
      onOpenChange(false);
      onUpdate();
    } catch (error: any) {
      console.error("Error al dar de alta:", error);
      toast.error("Error al dar de alta: " + error.message);
    } finally {
      setIsDischarging(false);
    }
  };

  const handleGoToPatient = () => {
    navigate(`/patients/${bed.patient.id}`);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Cama {bed.room_number} - Subcama {bed.bed_number}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGoToPatient}
                >
                  <UserCircle className="h-4 w-4 mr-2" />
                  Ver Perfil Completo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowChangeBed(true)}
                >
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Cambiar Cama
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  {isEditing ? "Ver Detalles" : "Editar"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDischarge}
                  disabled={isDischarging}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {isDischarging ? "Procesando..." : "Dar de Alta"}
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

        {isEditing ? (
          <EditAdmissionForm
            admissionId={bed.admission.id}
            currentData={bed.admission}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
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

            {/* External Links */}
            <ExternalLinksPanel 
              patientRut={bed.patient.rut}
              variant="inline"
            />

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
              {bed.admission.oxygen_requirement && Object.keys(bed.admission.oxygen_requirement).length > 0 && (
                <Card className="border-red-200 dark:border-red-900">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center text-red-700 dark:text-red-400">
                      <Wind className="h-5 w-5 mr-2" />
                      Requerimiento O₂
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-base font-semibold">
                        {bed.admission.oxygen_requirement.type}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {bed.admission.oxygen_requirement.flow && (
                        <div>
                          <p className="text-muted-foreground">Flujo</p>
                          <p className="font-semibold text-lg">{bed.admission.oxygen_requirement.flow} L/min</p>
                        </div>
                      )}
                      
                      {bed.admission.oxygen_requirement.peep && (
                        <div>
                          <p className="text-muted-foreground">PEEP</p>
                          <p className="font-semibold text-lg">{bed.admission.oxygen_requirement.peep} cmH₂O</p>
                        </div>
                      )}
                      
                      {bed.admission.oxygen_requirement.fio2 && (
                        <div>
                          <p className="text-muted-foreground">FiO₂</p>
                          <p className="font-semibold text-lg">{bed.admission.oxygen_requirement.fio2}%</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Antibiotics */}
              {bed.admission.antibiotics && (
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

            {/* Panel Respiratorio */}
            {bed.admission.viral_panel && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Panel Respiratorio</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge 
                    variant={bed.admission.viral_panel.toLowerCase().includes("positivo") ? "default" : "secondary"}
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
        )}
      </DialogContent>
    </Dialog>

    <ChangeBedDialog
      open={showChangeBed}
      onOpenChange={setShowChangeBed}
      currentBedId={bed.id}
      currentRoom={bed.room_number}
      currentBed={bed.bed_number}
      patientId={bed.patient.id}
      admissionId={bed.admission.id}
      onSuccess={() => {
        setShowChangeBed(false);
        onOpenChange(false); // Cerrar también el diálogo principal
        onUpdate();
      }}
    />
    </>
  );
}
