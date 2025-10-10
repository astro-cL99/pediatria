import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Search, Upload, TrendingUp, Minus, AlertTriangle, LineChart, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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
  extracted_data: any;
}

interface LaboratoryExamsManagerProps {
  patientId: string;
  admissionId?: string;
}

export const LaboratoryExamsManager = ({ patientId, admissionId }: LaboratoryExamsManagerProps) => {
  const [documents, setDocuments] = useState<LabDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<LabDocument | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [currentAdmissionId, setCurrentAdmissionId] = useState<string | null>(admissionId || null);

  useEffect(() => {
    fetchLabDocuments();
    fetchActiveAdmission();
  }, [patientId]);

  const fetchActiveAdmission = async () => {
    if (currentAdmissionId) return; // Ya tenemos admission_id
    
    try {
      const { data, error } = await supabase
        .from("admissions")
        .select("id")
        .eq("patient_id", patientId)
        .eq("status", "active")
        .order("admission_date", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.warn("No active admission found:", error);
        return;
      }

      if (data) {
        setCurrentAdmissionId(data.id);
      }
    } catch (error) {
      console.warn("Error fetching active admission:", error);
    }
  };

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
        setSelectedDoc(data[0]);
      }
    } catch (error: any) {
      console.error("Error fetching lab documents:", error);
      toast.error("Error al cargar exámenes de laboratorio");
    } finally {
      setLoading(false);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);

    try {
      // Subir archivo a Supabase Storage
      const fileName = `${patientId}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("medical-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Llamar a la edge function para procesar el documento
      const { data: processData, error: processError } = await supabase.functions.invoke('classify-and-extract', {
        body: { filePath: uploadData.path }
      });

      if (processError) throw processError;

      // Guardar en la base de datos
      const { error: dbError } = await supabase
        .from("clinical_documents")
        .insert({
          patient_id: patientId,
          admission_id: currentAdmissionId,
          file_name: file.name,
          file_path: uploadData.path,
          document_type: "laboratorio",
          extracted_data: processData?.extractedData || {},
          confidence_score: processData?.confidence || 0.8,
        });

      if (dbError) {
        console.error("Database error:", dbError);
        throw dbError;
      }

      toast.success("Examen cargado y procesado exitosamente");
      fetchLabDocuments();
    } catch (error: any) {
      console.error("Error uploading lab:", error);
      toast.error(error.message || "Error al cargar examen");
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png']
    },
    maxFiles: 1
  });

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

  // Extraer todos los exámenes únicos para el selector de gráficas
  const getAllUniqueExams = () => {
    const examNames = new Set<string>();
    documents.forEach(doc => {
      const sections = doc.extracted_data?.sections || {};
      Object.values(sections).forEach((exams: any) => {
        if (Array.isArray(exams)) {
          exams.forEach((exam: LabExam) => {
            examNames.add(exam.name);
          });
        }
      });
      const directExams = doc.extracted_data?.exams || [];
      directExams.forEach((exam: LabExam) => {
        examNames.add(exam.name);
      });
    });
    return Array.from(examNames).sort();
  };

  // Obtener datos para gráfica de un examen específico
  const getExamTrendData = (examName: string) => {
    const dataPoints: { date: string; value: number; isAbnormal: boolean }[] = [];

    documents.forEach(doc => {
      const sections = doc.extracted_data?.sections || {};
      const directExams = doc.extracted_data?.exams || [];
      
      // Buscar en secciones
      Object.values(sections).forEach((exams: any) => {
        if (Array.isArray(exams)) {
          const exam = exams.find((e: LabExam) => e.name === examName);
          if (exam) {
            dataPoints.push({
              date: format(new Date(doc.uploaded_at), "dd/MM", { locale: es }),
              value: parseFloat(exam.value.toString()),
              isAbnormal: exam.isAbnormal || exam.isCritical || false
            });
          }
        }
      });

      // Buscar en exámenes directos
      const exam = directExams.find((e: LabExam) => e.name === examName);
      if (exam) {
        dataPoints.push({
          date: format(new Date(doc.uploaded_at), "dd/MM", { locale: es }),
          value: parseFloat(exam.value.toString()),
          isAbnormal: exam.isAbnormal || exam.isCritical || false
        });
      }
    });

    return dataPoints.reverse(); // Ordenar cronológicamente
  };

  const renderTrendChart = () => {
    if (!selectedExam) {
      return (
        <div className="text-center py-12">
          <LineChart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">Selecciona un examen</p>
          <p className="text-muted-foreground">
            Elige un examen del menú desplegable para ver su evolución
          </p>
        </div>
      );
    }

    const trendData = getExamTrendData(selectedExam);

    if (trendData.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No hay datos suficientes para mostrar la tendencia de {selectedExam}
          </p>
        </div>
      );
    }

    const chartData = {
      labels: trendData.map(d => d.date),
      datasets: [
        {
          label: selectedExam,
          data: trendData.map(d => d.value),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: trendData.map(d => d.isAbnormal ? 'rgb(239, 68, 68)' : 'rgb(59, 130, 246)'),
          pointBorderColor: trendData.map(d => d.isAbnormal ? 'rgb(239, 68, 68)' : 'rgb(59, 130, 246)'),
          pointRadius: 6,
          pointHoverRadius: 8,
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
        },
        title: {
          display: true,
          text: `Evolución de ${selectedExam}`,
          font: {
            size: 16,
            weight: 'bold' as const
          }
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const value = context.parsed.y;
              const isAbnormal = trendData[context.dataIndex].isAbnormal;
              return `${selectedExam}: ${value}${isAbnormal ? ' ⚠️' : ''}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'Valor'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Fecha'
          }
        }
      }
    };

    // Evaluación de tendencia
    const getTrendEvaluation = () => {
      if (trendData.length < 2) return null;
      
      const firstValue = trendData[0].value;
      const lastValue = trendData[trendData.length - 1].value;
      const change = lastValue - firstValue;
      const percentChange = (change / firstValue) * 100;
      
      const hasAbnormal = trendData.some(d => d.isAbnormal);
      const recentAbnormal = trendData.slice(-2).some(d => d.isAbnormal);

      let evaluation = "";
      let color = "";

      if (!hasAbnormal) {
        evaluation = "Óptimo - Valores dentro del rango normal";
        color = "text-green-600 bg-green-50 border-green-200";
      } else if (recentAbnormal) {
        evaluation = "Deficiente - Valores anormales recientes";
        color = "text-red-600 bg-red-50 border-red-200";
      } else {
        evaluation = "Subóptimo - Mejoría pero requiere seguimiento";
        color = "text-orange-600 bg-orange-50 border-orange-200";
      }

      return (
        <div className={`p-4 rounded-lg border ${color} mt-4`}>
          <p className="font-semibold text-lg mb-2">Evaluación del Tratamiento</p>
          <p className="mb-2">{evaluation}</p>
          <p className="text-sm">
            Cambio: {change > 0 ? '+' : ''}{change.toFixed(2)} ({percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%)
          </p>
          <p className="text-sm">
            Mediciones: {trendData.length} | Valores anormales: {trendData.filter(d => d.isAbnormal).length}
          </p>
        </div>
      );
    };

    return (
      <div className="space-y-4">
        <div style={{ height: '400px' }}>
          <Line data={chartData} options={options} />
        </div>
        {getTrendEvaluation()}
      </div>
    );
  };

  const extractedData = selectedDoc?.extracted_data || {};
  const sections = extractedData.sections || {};
  const exams = extractedData.exams || [];
  const uniqueExams = getAllUniqueExams();

  // Contar alertas
  const allExams = [
    ...exams,
    ...Object.values(sections).flat()
  ];
  const criticalCount = allExams.filter((e: any) => e.isCritical).length;
  const abnormalCount = allExams.filter((e: any) => e.isAbnormal && !e.isCritical).length;

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

      {/* Tabs para diferentes vistas */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Lista de Exámenes</TabsTrigger>
          <TabsTrigger value="trends">Gráficas de Tendencia</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Zona de carga */}
          <Card>
            <CardHeader>
              <CardTitle>Cargar Nuevo Examen</CardTitle>
              <CardDescription>
                Sube un PDF o imagen de exámenes de laboratorio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                {uploading ? (
                  <p className="text-lg">Procesando examen...</p>
                ) : isDragActive ? (
                  <p className="text-lg">Suelta el archivo aquí...</p>
                ) : (
                  <div>
                    <p className="text-lg font-medium">
                      Arrastra un archivo aquí o haz clic para seleccionar
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      PDF o imágenes (JPG, PNG)
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de exámenes */}
          {documents.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-xl font-semibold mb-2">No hay exámenes de laboratorio</p>
                  <p className="text-muted-foreground mb-6">
                    Sube un examen usando el área de carga arriba
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
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
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gráficas de Evolución</CardTitle>
              <CardDescription>
                Visualiza la tendencia de valores específicos para evaluar el tratamiento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selector de examen */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Selecciona un examen para ver su evolución:
                </label>
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Elige un examen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueExams.map((exam) => (
                      <SelectItem key={exam} value={exam}>
                        {exam}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gráfica */}
              {renderTrendChart()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
