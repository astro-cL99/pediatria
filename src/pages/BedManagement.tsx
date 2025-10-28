import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Bed, UserPlus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Patient {
  id: string;
  name: string;
  rut: string;
  status: string;
  admission_date: string;
}

export default function BedManagement() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [bedAssignments, setBedAssignments] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [bedNumber, setBedNumber] = useState("1");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchActivePatients();
    fetchBedAssignments();
  }, []);

  const fetchActivePatients = async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("id, name, rut, status, admission_date")
        .eq("status", "active")
        .order("admission_date", { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("Error al cargar pacientes");
    }
  };

  const fetchBedAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from("bed_assignments")
        .select(`
          *,
          patient:patients(name, rut),
          admission:admissions(id)
        `)
        .eq("is_active", true)
        .order("room_number")
        .order("bed_number");

      if (error) throw error;
      setBedAssignments(data || []);
    } catch (error) {
      console.error("Error fetching bed assignments:", error);
      toast.error("Error al cargar asignaciones");
    }
  };

  const handleAssignBed = async () => {
    if (!selectedPatient || !roomNumber || !bedNumber) {
      toast.error("Complete todos los campos");
      return;
    }

    setLoading(true);
    try {
      // First, deactivate any existing bed assignment for this patient
      const { error: deactivateError } = await supabase
        .from("bed_assignments")
        .update({ is_active: false, discharged_at: new Date().toISOString() })
        .eq("patient_id", selectedPatient)
        .eq("is_active", true);

      if (deactivateError) console.log("No previous bed to deactivate");

      // Get active admission for patient
      const { data: admissionData, error: admissionError } = await supabase
        .from("admissions")
        .select("id")
        .eq("patient_id", selectedPatient)
        .eq("status", "active")
        .maybeSingle();

      if (admissionError) throw admissionError;
      if (!admissionData) {
        toast.error("No se encontró una admisión activa para este paciente");
        return;
      }

      // Create new bed assignment (works for both new admissions and bed transfers)
      const { error: assignError } = await supabase.from("bed_assignments").insert({
        patient_id: selectedPatient,
        admission_id: admissionData.id,
        room_number: roomNumber,
        bed_number: parseInt(bedNumber),
        is_active: true,
      });

      if (assignError) throw assignError;

      toast.success("Cama asignada exitosamente");
      setDialogOpen(false);
      setSelectedPatient("");
      setRoomNumber("");
      setBedNumber("1");
      fetchBedAssignments();
      fetchActivePatients();
    } catch (error: any) {
      console.error("Error assigning bed:", error);
      toast.error(error.message || "Error al asignar cama");
    } finally {
      setLoading(false);
    }
  };

  const handleDischargeBed = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from("bed_assignments")
        .update({
          is_active: false,
          discharged_at: new Date().toISOString(),
        })
        .eq("id", assignmentId);

      if (error) throw error;

      toast.success("Paciente dado de alta de la cama");
      fetchBedAssignments();
    } catch (error) {
      console.error("Error discharging bed:", error);
      toast.error("Error al dar de alta");
    }
  };

  // Show all active patients (allows for bed transfers)
  const availablePatients = patients;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Camas</h1>
          <p className="text-muted-foreground">
            Asignar y gestionar camas de pacientes
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Asignar Cama
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Asignar Paciente a Cama</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Permite ingresos nuevos y traslados de cama
              </p>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Paciente</Label>
                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePatients.map((patient) => {
                      const hasCurrentBed = bedAssignments.find(a => a.patient_id === patient.id);
                      return (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name} - {patient.rut}
                          {hasCurrentBed && ` (actual: ${hasCurrentBed.room_number}-${hasCurrentBed.bed_number})`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Número de Habitación</Label>
                <Input
                  placeholder="501, 502, 601..."
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                />
              </div>

              <div>
                <Label>Subcama</Label>
                <Select value={bedNumber} onValueChange={setBedNumber}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleAssignBed} disabled={loading} className="w-full">
                {loading ? "Asignando..." : "Asignar Cama"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bed className="mr-2 h-5 w-5" />
              Camas Asignadas ({bedAssignments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bedAssignments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No hay camas asignadas
                </p>
              ) : (
                bedAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-semibold">
                        Cama {assignment.room_number}-{assignment.bed_number}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {assignment.patient.name}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDischargeBed(assignment.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="mr-2 h-5 w-5" />
              Pacientes Sin Cama ({patients.filter(p => !bedAssignments.some(a => a.patient_id === p.id)).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {patients.filter(p => !bedAssignments.some(a => a.patient_id === p.id)).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Todos los pacientes tienen cama asignada
                </p>
              ) : (
                patients.filter(p => !bedAssignments.some(a => a.patient_id === p.id)).map((patient) => (
                  <div key={patient.id} className="p-3 border rounded-lg">
                    <p className="font-semibold">{patient.name}</p>
                    <p className="text-sm text-muted-foreground">{patient.rut}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
