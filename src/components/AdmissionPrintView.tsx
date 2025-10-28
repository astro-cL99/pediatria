import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface AdmissionPrintViewProps {
  admissionId: string;
}

export function AdmissionPrintView({ admissionId }: AdmissionPrintViewProps) {
  const [admission, setAdmission] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [admissionId]);

  const fetchData = async () => {
    const { data: admissionData } = await supabase
      .from("admissions")
      .select("*")
      .eq("id", admissionId)
      .single();

    if (admissionData) {
      setAdmission(admissionData);
      
      const { data: patientData } = await supabase
        .from("patients")
        .select("*")
        .eq("id", admissionData.patient_id)
        .single();
      
      setPatient(patientData);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!admission || !patient) return null;

  return (
    <div>
      <Button onClick={handlePrint} className="mb-4 gap-2 print:hidden">
        <Printer className="w-4 h-4" />
        Imprimir Ingreso
      </Button>

      <div className="print:block bg-white text-black p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold text-center mb-2">INGRESO HOSPITALARIO PEDIÁTRICO</h1>
          <div className="text-center text-sm">
            Fecha: {new Date(admission.admission_date).toLocaleDateString("es-CL")}
          </div>
        </div>

        {/* Patient Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Datos del Paciente</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Nombre:</strong> {patient.name}</div>
            <div><strong>RUT:</strong> {patient.rut}</div>
            <div><strong>Fecha Nac:</strong> {new Date(patient.date_of_birth).toLocaleDateString("es-CL")}</div>
            {patient.blood_type && <div><strong>Grupo:</strong> {patient.blood_type}</div>}
            {patient.allergies && (
              <div className="col-span-2 text-red-600">
                <strong>⚠️ ALERGIAS:</strong> {patient.allergies}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admission Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Motivo de Ingreso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {admission.chief_complaint && (
              <div>
                <strong>Motivo de Consulta:</strong>
                <p className="ml-4">{admission.chief_complaint}</p>
              </div>
            )}
            {admission.present_illness && (
              <div>
                <strong>Enfermedad Actual:</strong>
                <p className="ml-4 whitespace-pre-wrap">{admission.present_illness}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Diagnoses */}
        {admission.admission_diagnoses && admission.admission_diagnoses.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Diagnósticos de Ingreso</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-sm space-y-1">
                {admission.admission_diagnoses.map((dx: string, idx: number) => (
                  <li key={idx}>{dx}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Physical Exam */}
        {admission.physical_exam && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Examen Físico</CardTitle>
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap">
              {admission.physical_exam}
            </CardContent>
          </Card>
        )}

        {/* Treatment Plan */}
        {admission.treatment_plan && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Plan de Tratamiento</CardTitle>
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap">
              {admission.treatment_plan}
            </CardContent>
          </Card>
        )}

        {/* Medications */}
        {admission.medications && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Medicamentos</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {typeof admission.medications === 'string' ? (
                <p className="whitespace-pre-wrap">{admission.medications}</p>
              ) : (
                <ul className="space-y-2">
                  {Object.entries(admission.medications).map(([key, value]: [string, any]) => (
                    <li key={key}>
                      <strong>{value.name}:</strong> {value.dose} - {value.route} - {value.frequency}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {/* Nursing Orders */}
        {admission.nursing_orders && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Órdenes de Enfermería</CardTitle>
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap">
              {admission.nursing_orders}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-600 text-center">
          Documento generado el {new Date().toLocaleDateString("es-CL")} a las {new Date().toLocaleTimeString("es-CL")}
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}