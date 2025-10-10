import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, TrendingUp, Minus, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface LabExam {
  name: string;
  value: string | number;
  unit?: string;
  referenceRange?: string;
  isAbnormal?: boolean;
  isCritical?: boolean;
}

interface LabDocument {
  id: string;
  file_name: string;
  uploaded_at: string;
  extracted_data: any; // JSON from Supabase
}

interface LaboratoryExamsViewerProps {
  patientId: string;
}

export const LaboratoryExamsViewer = ({ patientId }: LaboratoryExamsViewerProps) => {
  const [documents, setDocuments] = useState<LabDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<LabDocument | null>(null);

  useEffect(() => {
    fetchLabDocuments();
  }, [patientId]);

  const fetchLabDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("clinical_documents")
        .select("*")
        .eq("patient_id", patientId)
        .eq("document_type", "laboratorio")
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
      if (data && data.length > 0) {
        setSelectedDoc(data[0]); // Seleccionar el más reciente por defecto
      }
    } catch (error: any) {
      console.error("Error fetching lab documents:", error);
      toast.error("Error al cargar exámenes de laboratorio");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (exam: LabExam) => {
    if (exam.isCritical) {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
    if (exam.isAbnormal) {
      return <TrendingUp className="h-4 w-4 text-orange-500" />;
    }
    return <Minus className="h-4 w-4 text-green-600" />;
  };

  const getStatusBadge = (exam: LabExam) => {
    if (exam.isCritical) {
      return <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        Crítico
      </Badge>;
    }
    if (exam.isAbnormal) {
      return <Badge className="bg-orange-500 hover:bg-orange-600 gap-1">
        <TrendingUp className="h-3 w-3" />
        Anormal
      </Badge>;
    }
    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
      Normal
    </Badge>;
  };

  // Función para formatear exámenes en formato compacto
  const formatCompactExams = (exams: LabExam[]) => {
    return exams.map(exam => {
      const valueStr = `${exam.value}${exam.unit ? ' ' + exam.unit : ''}`;
      const alert = exam.isCritical || exam.isAbnormal ? ' ⚠️' : '';
      return `${exam.name} ${valueStr}${alert}`;
    }).join(' // ');
  };

  const renderExamSection = (sectionName: string, exams: LabExam[]) => {
    const filteredExams = exams.filter(exam =>
      exam.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredExams.length === 0) return null;

    // Formato compacto
    const compactText = formatCompactExams(filteredExams);

    return (
      <div key={sectionName} className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">
          {sectionName}:
        </h3>
        <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg font-mono">
          {compactText}
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
            <p className="text-lg font-medium">Cargando exámenes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-xl font-semibold mb-2">No hay exámenes de laboratorio</p>
            <p className="text-muted-foreground">
              Los exámenes cargados en "Carga Documentos" aparecerán aquí
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const extractedData = selectedDoc?.extracted_data || {};
  const sections = extractedData.sections || {};
  const exams = extractedData.exams || [];

  // Contar alertas
  const allExams = [
    ...exams,
    ...Object.values(sections).flat()
  ];
  const criticalCount = allExams.filter(e => e.isCritical).length;
  const abnormalCount = allExams.filter(e => e.isAbnormal && !e.isCritical).length;

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Documentos</CardDescription>
            <CardTitle className="text-2xl">{documents.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Exámenes</CardDescription>
            <CardTitle className="text-2xl">{allExams.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardDescription>Valores Críticos</CardDescription>
            <CardTitle className="text-2xl text-red-600">{criticalCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardDescription>Valores Anormales</CardDescription>
            <CardTitle className="text-2xl text-orange-600">{abnormalCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Selector de documento y búsqueda */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <CardTitle>Exámenes de Laboratorio</CardTitle>
              <CardDescription>
                Formato compacto para revisión rápida
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <select
                className="px-3 py-2 border rounded-md text-sm"
                value={selectedDoc?.id || ""}
                onChange={(e) => {
                  const doc = documents.find(d => d.id === e.target.value);
                  setSelectedDoc(doc || null);
                }}
              >
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.file_name} - {format(new Date(doc.uploaded_at), "dd/MM/yyyy", { locale: es })}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar examen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Fecha del examen */}
          {extractedData.date && (
            <div className="bg-primary/10 border-l-4 border-primary p-3 rounded">
              <p className="text-lg font-bold text-primary">
                {extractedData.date}
              </p>
            </div>
          )}

          {/* Exámenes por sección */}
          <div className="space-y-6">
            {Object.entries(sections).map(([sectionName, sectionExams]) =>
              renderExamSection(sectionName, sectionExams as LabExam[])
            )}
            {exams.length > 0 && renderExamSection("Otros Exámenes", exams)}
          </div>

          {allExams.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No se pudieron extraer datos estructurados de este documento
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
