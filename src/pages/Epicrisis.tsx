import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Eye, Search, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EpicrisisRecord {
  id: string;
  patient_name: string;
  patient_rut: string;
  admission_date: string;
  discharge_date: string;
  admission_diagnosis: string;
  discharge_diagnosis: string;
  attending_physician: string;
  created_at: string;
  created_by: string;
  pdf_file_path?: string;
}

export default function Epicrisis() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [epicrisisToDelete, setEpicrisisToDelete] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const { data: epicrisisList, isLoading, refetch } = useQuery({
    queryKey: ["epicrisis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("epicrisis")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as EpicrisisRecord[];
    },
  });

  const filteredEpicrisis = epicrisisList?.filter((epi) =>
    epi.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    epi.patient_rut.includes(searchQuery) ||
    epi.admission_diagnosis.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canDelete = (epicrisis: EpicrisisRecord) => {
    return currentUserId && epicrisis.created_by === currentUserId;
  };

  const handleDeleteClick = (id: string) => {
    setEpicrisisToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!epicrisisToDelete) return;

    try {
      const { error } = await supabase
        .from("epicrisis")
        .delete()
        .eq("id", epicrisisToDelete)
        .eq("created_by", currentUserId!);

      if (error) throw error;

      toast.success("Epicrisis eliminada exitosamente");
      refetch();
    } catch (error: any) {
      console.error("Error deleting epicrisis:", error);
      toast.error("Error al eliminar epicrisis: " + error.message);
    } finally {
      setDeleteDialogOpen(false);
      setEpicrisisToDelete(null);
    }
  };

  const handleDownloadPDF = async (epicrisis: EpicrisisRecord) => {
    if (!epicrisis.pdf_file_path) return;
    
    const { data, error } = await supabase.storage
      .from("medical-documents")
      .download(epicrisis.pdf_file_path);

    if (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Error al descargar PDF");
      return;
    }

    const url = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = `epicrisis_${epicrisis.patient_rut}_${format(new Date(epicrisis.discharge_date), "yyyy-MM-dd")}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Epicrisis</h1>
          <p className="text-muted-foreground">
            Gestión de epicrisis hospitalarias
          </p>
        </div>
        <Button onClick={() => navigate("/epicrisis/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Epicrisis
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Epicrisis</CardTitle>
          <CardDescription>
            Listado de todas las epicrisis generadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por paciente, RUT o diagnóstico..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando epicrisis...
            </div>
          ) : filteredEpicrisis && filteredEpicrisis.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>RUT</TableHead>
                  <TableHead>Fecha Egreso</TableHead>
                  <TableHead>Diagnóstico Egreso</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEpicrisis.map((epi) => (
                  <TableRow key={epi.id}>
                    <TableCell className="font-medium">{epi.patient_name}</TableCell>
                    <TableCell>{epi.patient_rut}</TableCell>
                    <TableCell>
                      {format(new Date(epi.discharge_date), "dd/MM/yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={epi.discharge_diagnosis}>
                        {epi.discharge_diagnosis}
                      </div>
                    </TableCell>
                    <TableCell>{epi.attending_physician}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/epicrisis/${epi.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {epi.pdf_file_path && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPDF(epi)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete(epi) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(epi.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No se encontraron resultados" : "No hay epicrisis registradas"}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la epicrisis seleccionada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
