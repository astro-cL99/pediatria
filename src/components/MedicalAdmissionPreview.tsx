import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface MedicalAdmissionPreviewProps {
  formData: {
    patientName: string;
    age: string;
    rut: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    contactNumbers: string;
    caregiver: string;
    caregiverRut: string;
    patientWeight?: number;
    patientHeight?: number;
    admissionSource: string;
    chiefComplaint: string;
    presentIllness: string;
    personalHistory: string;
    familyHistory: string;
    allergies: string;
    currentMedications: string;
    physicalExam: string;
    labResults: string;
    imagingResults: string;
    admissionDiagnoses: string[];
    treatmentPlan: string;
    nursingOrders: string;
  };
}

export function MedicalAdmissionPreview({ formData }: MedicalAdmissionPreviewProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const getAdmissionSourceText = (source: string) => {
    const sources: { [key: string]: string } = {
      emergency: "Servicio de Urgencia",
      outpatient: "Policlínico",
      transfer: "Traslado Externo",
      other: "Otro",
    };
    return sources[source] || source;
  };

  const generatePreviewText = () => {
    const sections: string[] = [];

    // Header
    sections.push("INGRESO PEDIATRÍA\n");

    // Patient Data
    sections.push(`Paciente: ${formData.patientName || "N/A"}`);
    sections.push(`Edad: ${formData.age || "N/A"}`);
    sections.push(`Rut: ${formData.rut || "N/A"}`);
    sections.push(`Fecha Nac: ${formData.dateOfBirth || "N/A"}`);
    sections.push(`Sexo: ${formData.gender || "N/A"}`);
    sections.push(`Dirección: ${formData.address || "N/A"}`);
    sections.push(`Números de Contacto: ${formData.contactNumbers || "N/A"}`);
    sections.push(`A cargo de: ${formData.caregiver || "N/A"} - RUT: ${formData.caregiverRut || "N/A"}`);
    sections.push(`Procedencia: ${getAdmissionSourceText(formData.admissionSource)}\n`);

    // Anamnesis
    sections.push("ANAMNESIS PRÓXIMA:");
    sections.push(formData.presentIllness || "N/A");
    sections.push(`\nMotivo de consulta: ${formData.chiefComplaint || "N/A"}\n`);

    // Personal History
    if (formData.personalHistory || formData.allergies || formData.currentMedications) {
      sections.push("ANTECEDENTES PERSONALES:");
      if (formData.personalHistory) sections.push(formData.personalHistory);
      if (formData.allergies) sections.push(`Alergia: ${formData.allergies}`);
      if (formData.currentMedications) sections.push(`Medicamentos: ${formData.currentMedications}`);
      sections.push("");
    }

    // Family History
    if (formData.familyHistory) {
      sections.push("ANTECEDENTES FAMILIARES:");
      sections.push(formData.familyHistory);
      sections.push("");
    }

    // Physical Exam
    if (formData.physicalExam || formData.patientWeight || formData.patientHeight) {
      sections.push("EXAMEN FÍSICO:");
      if (formData.patientWeight || formData.patientHeight) {
        sections.push(
          `Peso: ${formData.patientWeight ? formData.patientWeight + " kg" : "N/A"}   Talla: ${
            formData.patientHeight ? formData.patientHeight + " cm" : "N/A"
          }`
        );
      }
      if (formData.physicalExam) sections.push(formData.physicalExam);
      sections.push("");
    }

    // Lab Results
    if (formData.labResults) {
      sections.push("EXÁMENES COMPLEMENTARIOS:");
      sections.push(formData.labResults);
      sections.push("");
    }

    // Imaging
    if (formData.imagingResults) {
      sections.push("IMAGENOLOGÍA:");
      sections.push(formData.imagingResults);
      sections.push("");
    }

    // Diagnoses
    if (formData.admissionDiagnoses && formData.admissionDiagnoses.length > 0) {
      sections.push("DIAGNÓSTICOS DE INGRESO:");
      formData.admissionDiagnoses.forEach((diagnosis, index) => {
        sections.push(`${index + 1}. ${diagnosis}`);
      });
      sections.push("");
    }

    // Treatment Plan
    if (formData.treatmentPlan) {
      sections.push("EVALUACIÓN POR SISTEMAS Y PLANES:");
      sections.push(formData.treatmentPlan);
      sections.push("");
    }

    // Nursing Orders
    if (formData.nursingOrders) {
      sections.push("INDICACIONES:");
      if (formData.patientWeight || formData.patientHeight) {
        sections.push(
          `Peso: ${formData.patientWeight || "N/A"} kg | Talla: ${formData.patientHeight || "N/A"} cm\n`
        );
      }
      sections.push(formData.nursingOrders);
    }

    return sections.join("\n");
  };

  const handleCopy = async () => {
    const text = generatePreviewText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copiado",
        description: "Ingreso médico copiado al portapapeles",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar al portapapeles",
        variant: "destructive",
      });
    }
  };

  const previewText = generatePreviewText();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Vista Previa del Ingreso Médico</CardTitle>
          <Button onClick={handleCopy} variant="outline" size="sm">
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/30 p-6 rounded-lg border border-border">
          <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">{previewText}</pre>
        </div>
      </CardContent>
    </Card>
  );
}
