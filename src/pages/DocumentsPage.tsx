import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';
import DocumentUploader from '@/components/documents/DocumentUploader';
import DocumentList from '@/components/documents/DocumentList';
import { useQueryClient } from '@tanstack/react-query';

const DocumentsPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  if (!patientId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No se ha seleccionado ningún paciente.</p>
      </div>
    );
  }

  const handleUploadSuccess = () => {
    // Invalidate the documents query to refetch the list
    queryClient.invalidateQueries({ queryKey: ['documents', patientId] });
    
    toast({
      title: '¡Éxito!',
      description: 'El documento se ha subido correctamente.',
    });
  };

  const handleDocumentDeleted = () => {
    // Invalidate the documents query to refetch the list
    queryClient.invalidateQueries({ queryKey: ['documents', patientId] });
    
    toast({
      title: 'Documento eliminado',
      description: 'El documento ha sido eliminado correctamente.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documentos del Paciente</h1>
          <p className="text-muted-foreground">
            Gestione los documentos médicos y firmas digitales del paciente.
          </p>
        </div>
        <Button onClick={() => setIsUploading(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Documento
        </Button>
      </div>

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
          <TabsTrigger value="signatures" disabled>Firmas Guardadas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentos del Paciente</CardTitle>
              <CardDescription>
                Lista de documentos médicos asociados a este paciente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentList 
                patientId={patientId} 
                onDocumentDeleted={handleDocumentDeleted}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Plantillas de Documentos</CardTitle>
              <CardDescription>
                Seleccione una plantilla para generar un nuevo documento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Button variant="outline" className="h-32 flex-col items-center justify-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span>Consentimiento Informado</span>
                </Button>
                <Button variant="outline" className="h-32 flex-col items-center justify-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span>Informe Médico</span>
                </Button>
                <Button variant="outline" className="h-32 flex-col items-center justify-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span>Receta Médica</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de carga de documentos */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Subir nuevo documento</CardTitle>
              <CardDescription>
                Seleccione un archivo para cargar y complete la información requerida.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUploader 
                patientId={patientId}
                onUploadSuccess={() => {
                  handleUploadSuccess();
                  setIsUploading(false);
                }}
                userId={user?.id || 'unknown'}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
