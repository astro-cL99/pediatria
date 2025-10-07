import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, FileText, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ClinicalDocument } from "@/hooks/useClinicalDocuments";

interface DocumentDetailDialogProps {
  document: ClinicalDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DocumentDetailDialog = ({ document, open, onOpenChange }: DocumentDetailDialogProps) => {
  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {document.file_name}
          </DialogTitle>
          <DialogDescription>
            Detalles del documento procesado con IA
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Metadatos */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Tipo de Documento</p>
                <Badge variant="outline">
                  {document.document_type}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Confianza del Procesamiento</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${(document.confidence_score || 0) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {((document.confidence_score || 0) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Fecha de Carga
                </p>
                <p className="text-sm">
                  {format(new Date(document.uploaded_at), "dd/MM/yyyy HH:mm", { locale: es })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Estado
                </p>
                <Badge variant={document.processed ? "default" : "secondary"}>
                  {document.processed ? "Procesado" : "Pendiente"}
                </Badge>
              </div>
            </div>

            {/* Datos Extraídos */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Datos Extraídos por IA</h3>
              <div className="bg-muted/30 rounded-lg p-4">
                {document.extracted_data && Object.keys(document.extracted_data).length > 0 ? (
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(document.extracted_data, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No se extrajeron datos de este documento
                  </p>
                )}
              </div>
            </div>

            {/* Notas */}
            {document.notes && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Notas</h3>
                <p className="text-sm text-muted-foreground">{document.notes}</p>
              </div>
            )}

            {/* Paciente Asignado */}
            {document.patient_id && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Paciente Asignado</h3>
                <p className="text-sm">ID: {document.patient_id}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
