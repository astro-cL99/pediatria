import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  FileSignature, 
  Loader2, 
  FileIcon,
  FileImage,
  FileArchive,
  FileType2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getPatientDocuments, deleteDocument, getDocumentUrl } from '@/services/documentService';
import { DocumentMetadata } from '@/services/documentService';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DocumentListProps {
  patientId: string;
  onDocumentDeleted?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const DocumentList: React.FC<DocumentListProps> = ({
  patientId,
  onDocumentDeleted,
  className = '',
  style = {},
}) => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [documentToView, setDocumentToView] = useState<DocumentMetadata | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [signatureToView, setSignatureToView] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await getPatientDocuments(patientId);
      
      if (error) throw error;
      
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los documentos. Por favor, intente de nuevo más tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchDocuments();
    }
  }, [patientId]);

  const handleDeleteClick = (documentId: string) => {
    setDocumentToDelete(documentId);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    
    setIsDeleting(true);
    try {
      const document = documents.find(doc => doc.id === documentToDelete);
      if (!document) return;
      
      const { error } = await deleteDocument(document.id!, document.storage_path);
      
      if (error) throw error;
      
      toast({
        title: 'Documento eliminado',
        description: 'El documento ha sido eliminado correctamente.',
      });
      
      // Actualizar la lista de documentos
      await fetchDocuments();
      
      // Notificar al componente padre si es necesario
      if (onDocumentDeleted) {
        onDocumentDeleted();
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el documento. Por favor, intente de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDocumentToDelete(null);
    }
  };

  const handleDownload = async (doc: DocumentMetadata) => {
    try {
      const url = getDocumentUrl(doc.storage_path);
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      
      // Limpiar
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Error',
        description: 'No se pudo descargar el documento. Por favor, intente de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const handleViewDocument = (document: DocumentMetadata) => {
    setDocumentToView(document);
  };

  const handleViewSignature = (signatureData: string) => {
    setSignatureToView(signatureData);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (fileType.includes('image')) {
      return <FileImage className="h-5 w-5 text-blue-500" />;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <FileText className="h-5 w-5 text-blue-600" />;
    } else if (fileType.includes('zip') || fileType.includes('compressed')) {
      return <FileArchive className="h-5 w-5 text-amber-500" />;
    } else if (fileType.includes('text')) {
      return <FileText className="h-5 w-5 text-gray-500" />;
    } else {
      return <FileType2 className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="mx-auto h-12 w-12 text-gray-300" />
        <h3 className="mt-2 text-sm font-medium">No hay documentos</h3>
        <p className="mt-1 text-sm">Comience cargando un nuevo documento.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`} style={style}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Tamaño</TableHead>
              <TableHead>Fecha de carga</TableHead>
              <TableHead>Firma</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((document) => (
              <TableRow key={document.id}>
                <TableCell>
                  {getFileIcon(document.file_type)}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{document.title}</span>
                    {document.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {document.description}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {document.file_type}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatFileSize(document.file_size)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {document.created_at ? (
                    <>
                      <div>{format(new Date(document.created_at), 'PPP', { locale: es })}</div>
                      <div className="text-xs">
                        {format(new Date(document.created_at), 'HH:mm', { locale: es })}
                      </div>
                    </>
                  ) : 'N/A'}
                </TableCell>
                <TableCell>
                  {document.signature_data ? (
                    <button
                      type="button"
                      onClick={() => handleViewSignature(document.signature_data!)}
                      className="text-primary hover:text-primary/80 transition-colors"
                      title="Ver firma"
                    >
                      <FileSignature className="h-5 w-5" />
                    </button>
                  ) : (
                    <span className="text-muted-foreground text-xs">Sin firma</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewDocument(document)}
                      title="Vista previa"
                      className="h-8 w-8"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(document)}
                      title="Descargar"
                      className="h-8 w-8"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(document.id!)}
                      title="Eliminar"
                      className="h-8 w-8 text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog
        open={!!documentToDelete}
        onOpenChange={(open) => !open && setDocumentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El documento se eliminará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo para ver el documento */}
      <Dialog
        open={!!documentToView}
        onOpenChange={(open) => !open && setDocumentToView(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{documentToView?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {documentToView?.file_type.includes('pdf') ? (
              <iframe 
                src={documentToView ? getDocumentUrl(documentToView.storage_path) : ''}
                className="w-full h-[70vh] border rounded"
                title={documentToView?.title}
              />
            ) : documentToView?.file_type.includes('image') ? (
              <div className="flex justify-center">
                <img 
                  src={documentToView ? getDocumentUrl(documentToView.storage_path) : ''} 
                  alt={documentToView?.title}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>
            ) : (
              <div className="h-[70vh] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <FileIcon className="mx-auto h-12 w-12 mb-2" />
                  <p>Vista previa no disponible para este tipo de archivo.</p>
                  <p className="text-sm">Por favor, descargue el archivo para ver su contenido.</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para ver la firma */}
      <Dialog
        open={!!signatureToView}
        onOpenChange={(open) => !open && setSignatureToView(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Firma digital</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <img 
              src={signatureToView || ''} 
              alt="Firma digital" 
              className="max-w-full h-auto border rounded"
            />
          </div>
          <div className="flex justify-end">
            <Button 
              onClick={() => setSignatureToView(null)}
              variant="outline"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentList;
