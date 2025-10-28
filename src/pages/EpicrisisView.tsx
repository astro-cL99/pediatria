import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

export default function EpicrisisView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: epicrisis, isLoading } = useQuery({
    queryKey: ["epicrisis", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("epicrisis")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handleDownloadPDF = async () => {
    if (!epicrisis?.pdf_file_path) {
      toast.error("No hay PDF disponible para descargar");
      return;
    }
    
    try {
      const { data, error } = await supabase.storage
        .from("medical-documents")
        .download(epicrisis.pdf_file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `epicrisis_${epicrisis.patient_rut}_${format(new Date(epicrisis.discharge_date), "yyyy-MM-dd")}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success("PDF descargado exitosamente");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Error al descargar el PDF");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Cargando epicrisis...</div>
      </div>
    );
  }

  if (!epicrisis) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Epicrisis no encontrada</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/epicrisis")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Epicrisis - {epicrisis.patient_name}</h1>
            <p className="text-muted-foreground">
              RUT: {epicrisis.patient_rut}
            </p>
          </div>
        </div>
        {epicrisis.pdf_file_path && (
          <Button onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
        )}
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del Paciente</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-semibold">Nombre:</span> {epicrisis.patient_name}
            </div>
            <div>
              <span className="font-semibold">RUT:</span> {epicrisis.patient_rut}
            </div>
            <div>
              <span className="font-semibold">Fecha Nacimiento:</span>{" "}
              {format(new Date(epicrisis.date_of_birth), "dd/MM/yyyy", { locale: es })}
            </div>
            <div>
              <span className="font-semibold">Edad al Egreso:</span> {epicrisis.age_at_discharge}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Datos de Hospitalización</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-semibold">Fecha Ingreso:</span>{" "}
              {format(new Date(epicrisis.admission_date), "dd/MM/yyyy HH:mm", { locale: es })}
            </div>
            <div>
              <span className="font-semibold">Peso Ingreso:</span>{" "}
              {epicrisis.admission_weight ? `${epicrisis.admission_weight} kg` : "N/A"}
            </div>
            <div>
              <span className="font-semibold">Fecha Egreso:</span>{" "}
              {format(new Date(epicrisis.discharge_date), "dd/MM/yyyy HH:mm", { locale: es })}
            </div>
            <div>
              <span className="font-semibold">Peso Egreso:</span>{" "}
              {epicrisis.discharge_weight ? `${epicrisis.discharge_weight} kg` : "N/A"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Diagnósticos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="font-semibold">Diagnóstico de Ingreso:</span>
              <p className="mt-2 whitespace-pre-wrap">{epicrisis.admission_diagnosis}</p>
            </div>
            <div>
              <span className="font-semibold">Diagnóstico de Egreso:</span>
              <p className="mt-2 whitespace-pre-wrap">{epicrisis.discharge_diagnosis}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evolución y Tratamiento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{epicrisis.evolution_and_treatment}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exámenes Realizados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="font-semibold">Laboratorios:</span>
              <p className="mt-2 whitespace-pre-wrap">
                {epicrisis.laboratory_exams || "No se realizaron exámenes de laboratorio"}
              </p>
            </div>
            <div>
              <span className="font-semibold">Imagenología:</span>
              <p className="mt-2 whitespace-pre-wrap">
                {epicrisis.imaging_exams || "No se realizaron estudios imagenológicos"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Indicaciones al Alta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{epicrisis.discharge_instructions}</p>
            <div className="mt-4">
              <span className="font-semibold">Médico Tratante:</span> {epicrisis.attending_physician}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
