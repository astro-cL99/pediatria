import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface AllergyAlertProps {
  allergies: string | null;
}

export function AllergyAlert({ allergies }: AllergyAlertProps) {
  if (!allergies || allergies.trim() === "") {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="text-lg font-bold">⚠️ ALERTA DE ALERGIAS</AlertTitle>
      <AlertDescription className="text-base mt-2">
        <strong>El paciente tiene las siguientes alergias:</strong>
        <p className="mt-2 font-medium">{allergies}</p>
      </AlertDescription>
    </Alert>
  );
}