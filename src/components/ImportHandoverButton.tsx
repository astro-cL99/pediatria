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
import { Upload, AlertCircle, CheckCircle2, FileSpreadsheet, X } from "lucide-react";
import { importHandoverData } from "@/utils/importHandoverData";
import { parseHandoverExcel } from "@/utils/parseHandoverExcel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDropzone } from "react-dropzone";

export function ImportHandoverButton({ onImportComplete }: { onImportComplete: () => void }) {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [patientsCount, setPatientsCount] = useState<number>(0);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      setResults(null);
      
      try {
        const patients = await parseHandoverExcel(file);
        setPatientsCount(patients.length);
        toast.success(`${patients.length} pacientes detectados en el archivo`);
      } catch (error: any) {
        console.error("Error parsing Excel:", error);
        toast.error("Error al leer el archivo Excel");
        setSelectedFile(null);
        setPatientsCount(0);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Por favor selecciona un archivo Excel");
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const patientsData = await parseHandoverExcel(selectedFile);
      const importResults = await importHandoverData(patientsData);
      setResults(importResults);

      if (importResults.errors.length === 0) {
        toast.success(`${importResults.success} pacientes importados exitosamente`);
        onImportComplete();
        setTimeout(() => {
          setDialogOpen(false);
          setSelectedFile(null);
          setPatientsCount(0);
        }, 2000);
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

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPatientsCount(0);
    setResults(null);
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
          {!selectedFile ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
            >
              <input {...getInputProps()} />
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                {isDragActive
                  ? "Suelta el archivo aquí"
                  : "Arrastra tu archivo Excel aquí"}
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                o haz clic para seleccionar
              </p>
              <Button type="button" variant="outline" size="sm">
                Seleccionar archivo
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {patientsCount} pacientes detectados
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

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
                    <ul className="list-disc pl-4 space-y-1 max-h-40 overflow-y-auto">
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
              <li>Asignación de camas</li>
              <li>Diagnósticos, requerimientos de O2, panel viral</li>
              <li>Pendientes y planes de tratamiento</li>
            </ul>
          </div>

          <Button
            onClick={handleImport}
            disabled={loading || !selectedFile}
            className="w-full"
          >
            {loading ? "Importando..." : "Iniciar Importación"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
