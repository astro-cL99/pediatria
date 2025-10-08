import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { importHandoverData } from "@/utils/importHandoverData";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ImportHandoverButton({ onImportComplete }: { onImportComplete: () => void }) {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null);

  const handleImport = async () => {
    setLoading(true);
    setResults(null);

    try {
      const importResults = await importHandoverData();
      setResults(importResults);

      if (importResults.errors.length === 0) {
        toast.success(`${importResults.success} pacientes importados exitosamente`);
        onImportComplete();
        setTimeout(() => setDialogOpen(false), 2000);
      } else {
        toast.warning(
          `${importResults.success} pacientes importados, ${importResults.errors.length} con errores`
        );
      }
    } catch (error: any) {
      console.error("Error importing handover data:", error);
      toast.error("Error al importar datos de entrega de turno");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Importar Entrega de Turno
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Datos de Entrega de Turno</DialogTitle>
          <DialogDescription>
            Esto importará los pacientes y asignaciones de camas desde el archivo Excel de entrega
            de turno.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {results && (
            <div className="space-y-2">
              {results.success > 0 && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    {results.success} pacientes importados correctamente
                  </AlertDescription>
                </Alert>
              )}

              {results.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">
                      {results.errors.length} errores encontrados:
                    </div>
                    <ul className="list-disc pl-4 space-y-1">
                      {results.errors.map((error, index) => (
                        <li key={index} className="text-sm">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">La importación incluye:</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>Creación/actualización de pacientes</li>
              <li>Creación/actualización de ingresos médicos</li>
              <li>Asignación de camas (501-505)</li>
              <li>Diagnósticos, requerimientos de O2, panel viral</li>
              <li>Pendientes y planes de tratamiento</li>
            </ul>
          </div>

          <Button onClick={handleImport} disabled={loading} className="w-full">
            {loading ? "Importando..." : "Iniciar Importación"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
