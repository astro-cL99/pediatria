import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, Loader2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface SearchResult {
  id: string;
  document_type: string;
  file_name: string;
  patient_name: string;
  patient_rut: string;
  uploaded_at: string;
  extracted_data: any;
  similarity: number;
}

const SemanticSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState({
    documentType: "",
  });

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error("Por favor ingresa una consulta");
      return;
    }

    setIsSearching(true);
    try {
      // Generar embedding del query
      const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke(
        "generate-embeddings",
        {
          body: { query }
        }
      );

      if (embeddingError) throw embeddingError;

      // Realizar búsqueda semántica usando la función RPC
      const { data, error } = await supabase.rpc('search_clinical_documents', {
        query_embedding: embeddingData.embedding,
        match_threshold: 0.4,
        match_count: 10,
        filter_type: filters.documentType || null,
      });

      if (error) throw error;

      setResults(data || []);
      toast.success(`${data?.length || 0} documentos encontrados`);
    } catch (error: any) {
      console.error("Error en búsqueda:", error);
      toast.error(error.message || "Error al realizar búsqueda");
    } finally {
      setIsSearching(false);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      ingreso: "bg-blue-500",
      evolucion: "bg-green-500",
      epicrisis: "bg-purple-500",
      laboratorio: "bg-yellow-500",
      imagenologia: "bg-orange-500",
      interconsulta: "bg-pink-500",
      dau: "bg-red-500",
      receta: "bg-indigo-500",
      otro: "bg-gray-500",
    };
    return colors[type] || "bg-gray-500";
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Búsqueda Inteligente</h1>
          <p className="text-muted-foreground mt-2">
            Busca documentos clínicos usando lenguaje natural
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Buscar Documentos</CardTitle>
            <CardDescription>
              Ejemplo: "casos de bronquiolitis en lactantes menores de 6 meses"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Escribe tu consulta en lenguaje natural..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Select
                value={filters.documentType}
                onValueChange={(value) =>
                  setFilters({ ...filters, documentType: value })
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tipo de documento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="ingreso">Ingreso</SelectItem>
                  <SelectItem value="evolucion">Evolución</SelectItem>
                  <SelectItem value="epicrisis">Epicrisis</SelectItem>
                  <SelectItem value="laboratorio">Laboratorio</SelectItem>
                  <SelectItem value="imagenologia">Imagenología</SelectItem>
                  <SelectItem value="interconsulta">Interconsulta</SelectItem>
                  <SelectItem value="dau">DAU</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Buscar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">
              Resultados ({results.length})
            </h2>
            {results.map((result) => (
              <Card key={result.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold">{result.file_name}</h3>
                        <Badge className={getTypeColor(result.document_type)}>
                          {result.document_type}
                        </Badge>
                        <Badge variant="outline">
                          {(result.similarity * 100).toFixed(0)}% relevante
                        </Badge>
                      </div>

                      {result.patient_name && (
                        <p className="text-sm text-muted-foreground">
                          Paciente: {result.patient_name} ({result.patient_rut})
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(result.uploaded_at), "dd/MM/yyyy HH:mm")}
                      </div>

                      {result.extracted_data && (
                        <div className="mt-3 p-3 bg-muted rounded-lg text-sm">
                          <p className="font-medium mb-2">Contenido extraído:</p>
                          {result.extracted_data.diagnosticos && (
                            <p>Diagnósticos: {JSON.stringify(result.extracted_data.diagnosticos)}</p>
                          )}
                          {result.extracted_data.hallazgos && (
                            <p>Hallazgos: {result.extracted_data.hallazgos}</p>
                          )}
                          {result.extracted_data.conclusion && (
                            <p>Conclusión: {result.extracted_data.conclusion}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isSearching && results.length === 0 && query && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                No se encontraron documentos relevantes para tu búsqueda
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default SemanticSearch;
