import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, FileDown } from "lucide-react";
import { generateEpicrisisPDF } from "@/utils/generateEpicrisisPDF";

interface EpicrisisFormData {
  patient_id: string;
  admission_id: string;
  patient_name: string;
  patient_rut: string;
  date_of_birth: string;
  age_at_discharge: string;
  admission_date: string;
  admission_weight: string;
  discharge_date: string;
  discharge_weight: string;
  admission_diagnosis: string;
  discharge_diagnosis: string;
  evolution_and_treatment: string;
  laboratory_exams: string;
  imaging_exams: string;
  discharge_instructions: string;
  attending_physician: string;
}

export default function NewEpicrisis() {
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, watch } = useForm<EpicrisisFormData>();
  const [selectedAdmission, setSelectedAdmission] = useState<string>("");

  // Fetch active admissions
  const { data: admissions } = useQuery({
    queryKey: ["active-admissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admissions")
        .select(`
          id,
          admission_date,
          discharge_date,
          admission_diagnoses,
          patient_id,
          patients (
            id,
            name,
            rut,
            date_of_birth
          )
        `)
        .order("admission_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Auto-fill when admission is selected
  useEffect(() => {
    if (selectedAdmission && admissions) {
      const admission = admissions.find((a) => a.id === selectedAdmission);
      if (admission && admission.patients) {
        const patient = Array.isArray(admission.patients) 
          ? admission.patients[0] 
          : admission.patients;
        
        setValue("patient_id", patient.id);
        setValue("admission_id", admission.id);
        setValue("patient_name", patient.name);
        setValue("patient_rut", patient.rut);
        setValue("date_of_birth", patient.date_of_birth);
        setValue("admission_date", admission.admission_date);
        setValue("discharge_date", admission.discharge_date || new Date().toISOString());
        
        if (admission.admission_diagnoses && admission.admission_diagnoses.length > 0) {
          setValue("admission_diagnosis", admission.admission_diagnoses.join(", "));
        }

        // Calculate age at discharge
        const birthDate = new Date(patient.date_of_birth);
        const dischargeDate = new Date(admission.discharge_date || new Date());
        const ageYears = dischargeDate.getFullYear() - birthDate.getFullYear();
        const ageMonths = dischargeDate.getMonth() - birthDate.getMonth();
        setValue("age_at_discharge", `${ageYears} años ${ageMonths} meses`);
      }
    }
  }, [selectedAdmission, admissions, setValue]);

  const createEpicrisisMutation = useMutation({
    mutationFn: async (data: EpicrisisFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // Generate PDF
      const pdfBlob = await generateEpicrisisPDF(data);
      
      // Upload PDF to storage
      const fileName = `epicrisis_${data.patient_rut}_${new Date().getTime()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("medical-documents")
        .upload(fileName, pdfBlob);

      if (uploadError) throw uploadError;

      // Save epicrisis record
      const { data: epicrisisData, error: dbError } = await supabase
        .from("epicrisis")
        .insert({
          patient_id: data.patient_id,
          admission_id: data.admission_id,
          patient_name: data.patient_name,
          patient_rut: data.patient_rut,
          date_of_birth: data.date_of_birth,
          age_at_discharge: data.age_at_discharge,
          admission_date: data.admission_date,
          admission_weight: data.admission_weight ? parseFloat(data.admission_weight) : null,
          discharge_date: data.discharge_date,
          discharge_weight: data.discharge_weight ? parseFloat(data.discharge_weight) : null,
          admission_diagnosis: data.admission_diagnosis,
          discharge_diagnosis: data.discharge_diagnosis,
          evolution_and_treatment: data.evolution_and_treatment,
          laboratory_exams: data.laboratory_exams,
          imaging_exams: data.imaging_exams,
          discharge_instructions: data.discharge_instructions,
          attending_physician: data.attending_physician,
          pdf_file_path: uploadData.path,
          created_by: user.id,
        })
        .select()
        .single();

      if (dbError) throw dbError;
      return epicrisisData;
    },
    onSuccess: () => {
      toast.success("Epicrisis generada exitosamente");
      navigate("/epicrisis");
    },
    onError: (error) => {
      console.error("Error creating epicrisis:", error);
      toast.error("Error al generar epicrisis");
    },
  });

  const onSubmit = (data: EpicrisisFormData) => {
    createEpicrisisMutation.mutate(data);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/epicrisis")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nueva Epicrisis</h1>
          <p className="text-muted-foreground">
            Generar documento de epicrisis hospitalaria
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Ingreso</CardTitle>
            <CardDescription>
              Seleccione el ingreso hospitalario para generar la epicrisis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="admission">Ingreso Hospitalario</Label>
                <Select value={selectedAdmission} onValueChange={setSelectedAdmission}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un ingreso..." />
                  </SelectTrigger>
                  <SelectContent>
                    {admissions?.map((admission) => {
                      const patient = Array.isArray(admission.patients) 
                        ? admission.patients[0] 
                        : admission.patients;
                      return (
                        <SelectItem key={admission.id} value={admission.id}>
                          {patient?.name} - {new Date(admission.admission_date).toLocaleDateString()}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedAdmission && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Datos del Paciente</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patient_name">Nombre</Label>
                  <Input {...register("patient_name")} disabled />
                </div>
                <div>
                  <Label htmlFor="patient_rut">RUT</Label>
                  <Input {...register("patient_rut")} disabled />
                </div>
                <div>
                  <Label htmlFor="date_of_birth">Fecha Nacimiento</Label>
                  <Input type="date" {...register("date_of_birth")} disabled />
                </div>
                <div>
                  <Label htmlFor="age_at_discharge">Edad al Egreso</Label>
                  <Input {...register("age_at_discharge")} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Datos de Hospitalización</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="admission_date">Fecha Ingreso</Label>
                  <Input type="datetime-local" {...register("admission_date")} />
                </div>
                <div>
                  <Label htmlFor="admission_weight">Peso Ingreso (kg)</Label>
                  <Input type="number" step="0.1" {...register("admission_weight")} />
                </div>
                <div>
                  <Label htmlFor="discharge_date">Fecha Egreso</Label>
                  <Input type="datetime-local" {...register("discharge_date")} />
                </div>
                <div>
                  <Label htmlFor="discharge_weight">Peso Egreso (kg)</Label>
                  <Input type="number" step="0.1" {...register("discharge_weight")} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Diagnósticos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="admission_diagnosis">Diagnóstico de Ingreso</Label>
                  <Textarea {...register("admission_diagnosis")} rows={3} required />
                </div>
                <div>
                  <Label htmlFor="discharge_diagnosis">Diagnóstico de Egreso</Label>
                  <Textarea {...register("discharge_diagnosis")} rows={3} required />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evolución y Tratamiento</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea 
                  {...register("evolution_and_treatment")} 
                  rows={8} 
                  required
                  placeholder="Describa la evolución del paciente y los tratamientos realizados..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exámenes Realizados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="laboratory_exams">Laboratorios</Label>
                  <Textarea 
                    {...register("laboratory_exams")} 
                    rows={4}
                    placeholder="Detalle los exámenes de laboratorio realizados..."
                  />
                </div>
                <div>
                  <Label htmlFor="imaging_exams">Imagenología</Label>
                  <Textarea 
                    {...register("imaging_exams")} 
                    rows={4}
                    placeholder="Detalle los estudios imagenológicos realizados..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Indicaciones al Alta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="discharge_instructions">Indicaciones</Label>
                  <Textarea 
                    {...register("discharge_instructions")} 
                    rows={6}
                    required
                    placeholder="Indicaciones médicas para el paciente al alta..."
                  />
                </div>
                <div>
                  <Label htmlFor="attending_physician">Médico Tratante</Label>
                  <Input {...register("attending_physician")} required />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate("/epicrisis")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createEpicrisisMutation.isPending}>
                <FileDown className="mr-2 h-4 w-4" />
                {createEpicrisisMutation.isPending ? "Generando..." : "Generar Epicrisis"}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
