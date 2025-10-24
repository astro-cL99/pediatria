import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditAdmissionForm } from "./EditAdmissionForm";
import { Pencil, Droplet, Wind, Pill } from "lucide-react";
import { differenceInDays } from "date-fns";
import { calculatePediatricAgeShort } from "@/utils/calculatePediatricAge";

interface BedData {
  id: string;
  room_number: string;
  bed_number: number;
  patient_id: string;
  admission_id: string;
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

interface HandoverListViewProps {
  beds: BedData[];
  onUpdate: () => void;
}

export function HandoverListView({ beds, onUpdate }: HandoverListViewProps) {
  const [editingAdmission, setEditingAdmission] = useState<string | null>(null);
  const [selectedBed, setSelectedBed] = useState<BedData | null>(null);

  const getDaysHospitalized = (admissionDate: string) => {
    return differenceInDays(new Date(), new Date(admissionDate));
  };

  const handleEdit = (bed: BedData) => {
    setSelectedBed(bed);
    setEditingAdmission(bed.admission_id);
  };

  const handleEditSuccess = () => {
    setEditingAdmission(null);
    setSelectedBed(null);
    onUpdate();
  };

  // Sort beds by room number and bed number
  const sortedBeds = [...beds].sort((a, b) => {
    const roomCompare = a.room_number.localeCompare(b.room_number);
    if (roomCompare !== 0) return roomCompare;
    return a.bed_number - b.bed_number;
  });

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Sala</TableHead>
              <TableHead className="w-20">Cama</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead className="w-20">Edad</TableHead>
              <TableHead className="w-24">Días Hosp.</TableHead>
              <TableHead>Diagnósticos</TableHead>
              <TableHead className="w-32">Estado</TableHead>
              <TableHead className="w-24">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {sortedBeds.map((bed) => {
              const patient = bed.patient;
              const admission = bed.admission;
              const age = calculatePediatricAgeShort(patient.date_of_birth);
              const days = getDaysHospitalized(admission.admission_date);

              return (
                <TableRow key={bed.id}>
                  <TableCell className="font-medium">{bed.room_number}</TableCell>
                  <TableCell>{bed.bed_number}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{patient.name}</div>
                      <div className="text-sm text-muted-foreground">{patient.rut}</div>
                    </div>
                  </TableCell>
                  <TableCell>{age}</TableCell>
                  <TableCell>{days}d</TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {admission.admission_diagnoses?.[0] || "Sin diagnóstico"}
                      {admission.admission_diagnoses && admission.admission_diagnoses.length > 1 && (
                        <span className="text-muted-foreground"> +{admission.admission_diagnoses.length - 1}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {admission.oxygen_requirement && (
                        <Badge variant="destructive" className="text-xs">
                          <Droplet className="h-3 w-3 mr-1" />
                          O2
                        </Badge>
                      )}
                      {admission.antibiotics && (
                        <Badge variant="default" className="text-xs">
                          <Pill className="h-3 w-3 mr-1" />
                          ATB
                        </Badge>
                      )}
                      {admission.respiratory_score && (
                        <Badge variant="secondary" className="text-xs">
                          <Wind className="h-3 w-3 mr-1" />
                          Score
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(bed)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingAdmission} onOpenChange={() => setEditingAdmission(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Editar Admisión - {selectedBed?.patient.name}
              <div className="text-sm font-normal text-muted-foreground">
                Sala {selectedBed?.room_number}, Cama {selectedBed?.bed_number}
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedBed && (
            <EditAdmissionForm
              admissionId={selectedBed.admission_id}
              currentData={selectedBed.admission}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingAdmission(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
