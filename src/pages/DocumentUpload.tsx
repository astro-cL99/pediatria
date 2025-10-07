import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useUploadDocument } from "@/hooks/useClinicalDocuments";
import { cn } from "@/lib/utils";

interface FileWithStatus {
  file: File;
  status: "pending" | "processing" | "success" | "error";
  result?: any;
  error?: string;
}

const DocumentUpload = () => {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const uploadMutation = useUploadDocument();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      status: "pending" as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
  });

  const processAllFiles = async () => {
    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== "pending") continue;

      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: "processing" as const } : f
        )
      );

      try {
        const result = await uploadMutation.mutateAsync({
          file: files[i].file,
        });

        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? { ...f, status: "success" as const, result }
              : f
          )
        );
      } catch (error: any) {
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: "error" as const,
                  error: error.message,
                }
              : f
          )
        );
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const successCount = files.filter((f) => f.status === "success").length;
  const errorCount = files.filter((f) => f.status === "error").length;
  const processingCount = files.filter((f) => f.status === "processing").length;

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Carga Masiva de Documentos</h1>
          <p className="text-muted-foreground mt-2">
            Sube múltiples documentos médicos para procesamiento automático con IA
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pendientes</CardDescription>
              <CardTitle className="text-2xl">{pendingCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Procesando</CardDescription>
              <CardTitle className="text-2xl">{processingCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Exitosos</CardDescription>
              <CardTitle className="text-2xl text-green-600">{successCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Errores</CardDescription>
              <CardTitle className="text-2xl text-destructive">{errorCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Subir Archivos</CardTitle>
            <CardDescription>
              Formatos soportados: PDF, Word (.docx), Excel (.xls, .xlsx)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              )}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-lg">Suelta los archivos aquí...</p>
              ) : (
                <div>
                  <p className="text-lg font-medium">
                    Arrastra archivos aquí o haz clic para seleccionar
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Puedes subir múltiples archivos a la vez
                  </p>
                </div>
              )}
            </div>

            {files.length > 0 && (
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">
                    Archivos cargados ({files.length})
                  </h3>
                  {pendingCount > 0 && (
                    <Button onClick={processAllFiles} disabled={processingCount > 0}>
                      {processingCount > 0 ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          Procesar Todos ({pendingCount})
                        </>
                      )}
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  {files.map((fileItem, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            {getStatusIcon(fileItem.status)}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {fileItem.file.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {(fileItem.file.size / 1024).toFixed(2)} KB
                              </p>
                              {fileItem.result && (
                                <div className="flex gap-2 mt-2">
                                  <Badge variant="outline">
                                    {fileItem.result.document_type}
                                  </Badge>
                                  <Badge variant="secondary">
                                    Confianza: {(fileItem.result.confidence_score * 100).toFixed(0)}%
                                  </Badge>
                                </div>
                              )}
                              {fileItem.error && (
                                <p className="text-sm text-destructive mt-1">
                                  Error: {fileItem.error}
                                </p>
                              )}
                            </div>
                          </div>
                          {fileItem.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                            >
                              Eliminar
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default DocumentUpload;
