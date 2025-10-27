import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus, Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Patient {
  id: string;
  name: string;
  rut: string;
  date_of_birth: string;
}

interface BedAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomNumber: string;
  bedNumber: string;
  onAssignmentComplete: () => void;
}

export function BedAssignmentDialog({
  open,
  onOpenChange,
  roomNumber,
  bedNumber,
  onAssignmentComplete,
}: BedAssignmentDialogProps) {
  const navigate = useNavigate();
  const [patientsWithoutBed, setPatientsWithoutBed] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPatientsWithoutBed();
    }
  }, [open]);

  const fetchPatientsWithoutBed = async () => {
    try {
      // Obtener admisiones activas con los IDs de pacientes
      const { data: activeAdmissions, error: admissionsError } = await supabase
        .from("admissions")
        .select("patient_id")
        .eq("status", "active");

      if (admissionsError) throw admissionsError;

      if (!activeAdmissions || activeAdmissions.length === 0) {
        setPatientsWithoutBed([]);
        return;
      }

      const activePatientIds = activeAdmissions.map(a => a.patient_id).filter(Boolean);

      // Obtener asignaciones de cama activas
      const { data: bedAssignments, error: bedError } = await supabase
        .from("bed_assignments")
        .select("patient_id")
        .eq("is_active", true);

      if (bedError) throw bedError;

      const assignedPatientIds = new Set(bedAssignments?.map(a => a.patient_id) || []);
      
      // Filtrar IDs de pacientes que tienen admisión activa pero NO tienen cama asignada
      const patientIdsWithoutBed = activePatientIds.filter(
        patientId => !assignedPatientIds.has(patientId)
      );

      if (patientIdsWithoutBed.length === 0) {
        setPatientsWithoutBed([]);
        return;
      }

      // Obtener los datos completos de los pacientes
      const { data: patients, error: patientsError } = await supabase
        .from("patients")
        .select("id, name, rut, date_of_birth")
        .in("id", patientIdsWithoutBed);

      if (patientsError) throw patientsError;

      setPatientsWithoutBed(patients || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("Error al cargar pacientes");
    }
  };

  const handleAssignExistingPatient = async () => {
    if (!selectedPatient) {
      toast.error("Seleccione un paciente");
      return;
    }

    setLoading(true);
    try {
      // Obtener la admisión activa del paciente
      const { data: admission, error: admissionError } = await supabase
        .from("admissions")
        .select("id")
        .eq("patient_id", selectedPatient)
        .eq("status", "active")
        .maybeSingle();

      if (admissionError) throw admissionError;
      if (!admission) {
        toast.error("No se encontró una admisión activa para este paciente");
        return;
      }

      // Crear la asignación de cama
      const { error: assignError } = await supabase
        .from("bed_assignments")
        .insert({
          patient_id: selectedPatient,
          admission_id: admission.id,
          room_number: roomNumber,
          bed_number: parseInt(bedNumber),
          is_active: true,
        });

      if (assignError) throw assignError;

      toast.success("Cama asignada exitosamente");
      onOpenChange(false);
      onAssignmentComplete();
    } catch (error: any) {
      console.error("Error assigning bed:", error);
      toast.error(error.message || "Error al asignar cama");
    } finally {
      setLoading(false);
    }
  };

  const handleNewAdmission = () => {
    onOpenChange(false);
    navigate(`/admission/new?room=${roomNumber}&bed=${bedNumber}`);
  };

  const calculateAge = (dateOfBirth: string) => {
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
    return `${years} años`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Asignar Cama {roomNumber}-{bedNumber}</DialogTitle>
          <DialogDescription>
            Seleccione un paciente sin cama o cree un nuevo ingreso
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Opción 1: Asignar paciente existente */}
          <div className="space-y-3">
            <Label>Pacientes sin cama asignada ({patientsWithoutBed.length})</Label>
            {patientsWithoutBed.length > 0 ? (
              <>
                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patientsWithoutBed.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{patient.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {patient.rut} • {calculateAge(patient.date_of_birth)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleAssignExistingPatient} 
                  disabled={!selectedPatient || loading}
                  className="w-full gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  {loading ? "Asignando..." : "Asignar Paciente Seleccionado"}
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                No hay pacientes con admisión activa sin cama asignada
              </p>
            )}
          </div>

          <Separator />

          {/* Opción 2: Nuevo ingreso */}
          <div className="space-y-3">
            <Label>Crear nuevo ingreso hospitalario</Label>
            <Button 
              onClick={handleNewAdmission} 
              variant="outline"
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              Nuevo Ingreso con Asignación de Cama
            </Button>
            <p className="text-xs text-muted-foreground">
              Para pacientes nuevos o sin admisión activa previa
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
