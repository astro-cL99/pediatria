import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Upload, FileSignature, FileCheck, X, Loader2 } from 'lucide-react';
import SignatureModal, { SignatureModalHandle } from './SignatureModal';
import { uploadDocument } from '@/services/documentService';

interface DocumentUploaderProps {
  patientId: string;
  onUploadSuccess?: (document: any) => void;
  maxSizeMB?: number;
  acceptedFileTypes?: string[];
  userId: string;
  className?: string;
  style?: React.CSSProperties;
}

const defaultAcceptedTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain',
];

const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  patientId,
  onUploadSuccess,
  maxSizeMB = 10,
  acceptedFileTypes = defaultAcceptedTypes,
  userId,
  className = '',
  style = {},
}) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const signatureModalRef = useRef<SignatureModalHandle>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFileToUpload(file);
      // Establecer el título por defecto como el nombre del archivo sin la extensión
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setDocumentTitle(fileNameWithoutExt);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: Object.fromEntries(acceptedFileTypes.map(type => [type, []])),
    maxSize: maxSizeMB * 1024 * 1024, // Convertir MB a bytes
    multiple: false,
  });

  const handleRemoveFile = () => {
    setFileToUpload(null);
    setDocumentTitle('');
    setDocumentDescription('');
    setSignatureData(null);
  };

  const handleSignatureSave = (signature: string) => {
    setSignatureData(signature);
    setIsSignatureModalOpen(false);
  };

  const handleUpload = async () => {
    if (!fileToUpload) return;
    if (!documentTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor ingrese un título para el documento.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const { data, error } = await uploadDocument(
        fileToUpload,
        patientId,
        {
          title: documentTitle,
          description: documentDescription || undefined,
          document_type: 'general',
        }
      );

      if (error) throw error;

      toast({
        title: '¡Éxito!',
        description: 'El documento se ha subido correctamente.',
      });

      if (onUploadSuccess) {
        onUploadSuccess(data);
      }

      // Resetear el formulario
      handleRemoveFile();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Error',
        description: 'No se pudo subir el documento. Por favor, inténtelo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`} style={style}>
      {!fileToUpload ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-2">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isDragActive
                ? 'Suelte el archivo aquí...'
                : 'Arrastra y suelta un archivo aquí, o haz clic para seleccionar'}
            </p>
            <p className="text-xs text-muted-foreground">
              Formatos soportados: PDF, DOC, DOCX, JPG, PNG, GIF, TXT (Máx. {maxSizeMB}MB)
            </p>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium">{fileToUpload.name}</h4>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(fileToUpload.size)} • {fileToUpload.type}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemoveFile}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <div>
              <label htmlFor="documentTitle" className="block text-sm font-medium mb-1">
                Título del documento <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                id="documentTitle"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Ej: Informe médico, Receta, etc."
                required
              />
            </div>

            <div>
              <label htmlFor="documentDescription" className="block text-sm font-medium mb-1">
                Descripción (opcional)
              </label>
              <textarea
                id="documentDescription"
                value={documentDescription}
                onChange={(e) => setDocumentDescription(e.target.value)}
                className="w-full p-2 border rounded-md min-h-[80px]"
                placeholder="Agregue una descripción del documento..."
                rows={3}
              />
            </div>

            <div className="pt-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Firma digital</span>
                {signatureData ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-green-600">Firma agregada</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => signatureModalRef.current?.open()}
                    >
                      <FileSignature className="h-4 w-4 mr-2" />
                      Cambiar firma
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => signatureModalRef.current?.open()}
                  >
                    <FileSignature className="h-4 w-4 mr-2" />
                    Agregar firma
                  </Button>
                )}
              </div>
              
              {signatureData && (
                <div className="border rounded p-2 flex justify-center bg-white">
                  <img 
                    src={signatureData} 
                    alt="Vista previa de la firma" 
                    className="h-16 object-contain"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleRemoveFile}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || !documentTitle.trim()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <FileCheck className="mr-2 h-4 w-4" />
                  Subir documento
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <SignatureModal
        ref={signatureModalRef}
        onSave={handleSignatureSave}
        title={signatureData ? "Editar Firma" : "Agregar Firma"}
        description="Por favor, firme en el área designada"
        confirmButtonText={signatureData ? "Actualizar Firma" : "Guardar Firma"}
      />
    </div>
  );
};

export default DocumentUploader;
