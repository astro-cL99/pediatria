import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ClinicalProtocol {
  id: string;
  protocol_name: string;
  category: string;
  source: string;
  content: string;
  criteria: any;
  indications: string[];
  contraindications: string[];
  procedure_steps: any;
  monitoring_parameters: any;
  complications: string[];
  clinical_references: string[];
  version: string;
  last_updated: string;
}

export default function ClinicalProtocols() {
  const navigate = useNavigate();
  const [protocols, setProtocols] = useState<ClinicalProtocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProtocol, setSelectedProtocol] = useState<ClinicalProtocol | null>(null);

  useEffect(() => {
    fetchProtocols();
  }, []);

  const fetchProtocols = async () => {
    try {
      const { data, error } = await supabase
        .from("clinical_protocols")
        .select("*")
        .order("category", { ascending: true });

      if (error) throw error;
      setProtocols(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Neonatología": "bg-blue-500/10 text-blue-600 border-blue-500/20",
      "Nutrición": "bg-green-500/10 text-green-600 border-green-500/20",
      "Respiratorio": "bg-purple-500/10 text-purple-600 border-purple-500/20",
      "Cardiovascular": "bg-red-500/10 text-red-600 border-red-500/20",
    };
    return colors[category] || "bg-gray-500/10 text-gray-600 border-gray-500/20";
  };

  return (
    <div className="p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Protocolos Clínicos</h1>
          <p className="text-muted-foreground">
            Basados en guías MINSAL Chile y Academia Española de Pediatría (AEP)
          </p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Cargando protocolos...
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Lista de protocolos */}
            <div className="space-y-4">
              {protocols.map((protocol) => (
                <Card
                  key={protocol.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedProtocol?.id === protocol.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedProtocol(protocol)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{protocol.protocol_name}</CardTitle>
                        <CardDescription className="text-sm">
                          {protocol.source}
                        </CardDescription>
                      </div>
                      <Badge className={getCategoryColor(protocol.category)} variant="outline">
                        {protocol.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {protocol.content}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <BookOpen className="h-3 w-3" />
                      <span>Versión {protocol.version}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Detalle del protocolo seleccionado */}
            <div className="md:sticky md:top-6 h-fit">
              {selectedProtocol ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {selectedProtocol.protocol_name}
                    </CardTitle>
                    <CardDescription>{selectedProtocol.content}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {selectedProtocol.criteria && (
                      <div>
                        <h3 className="font-semibold mb-2">Criterios</h3>
                        <div className="bg-muted/50 rounded-lg p-3 text-sm">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(selectedProtocol.criteria, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {selectedProtocol.indications && selectedProtocol.indications.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Indicaciones
                        </h3>
                        <ul className="space-y-1">
                          {selectedProtocol.indications.map((indication, idx) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <span className="text-green-600">•</span>
                              <span>{indication}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedProtocol.contraindications && selectedProtocol.contraindications.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          Contraindicaciones
                        </h3>
                        <ul className="space-y-1">
                          {selectedProtocol.contraindications.map((contraindication, idx) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <span className="text-destructive">•</span>
                              <span>{contraindication}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedProtocol.procedure_steps && (
                      <div>
                        <h3 className="font-semibold mb-2">Pasos del Procedimiento</h3>
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="steps">
                            <AccordionTrigger>Ver pasos detallados</AccordionTrigger>
                            <AccordionContent>
                              <ol className="space-y-2">
                                {selectedProtocol.procedure_steps.steps?.map((step: any, idx: number) => (
                                  <li key={idx} className="text-sm flex gap-3">
                                    <span className="font-semibold text-primary">{step.order}.</span>
                                    <span>{step.description}</span>
                                  </li>
                                ))}
                              </ol>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    )}

                    {selectedProtocol.monitoring_parameters && (
                      <div>
                        <h3 className="font-semibold mb-2">Monitorización</h3>
                        <div className="bg-muted/50 rounded-lg p-3 text-sm">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(selectedProtocol.monitoring_parameters, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {selectedProtocol.complications && selectedProtocol.complications.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Complicaciones Potenciales</h3>
                        <ul className="space-y-1">
                          {selectedProtocol.complications.map((complication, idx) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <span className="text-yellow-600">⚠</span>
                              <span>{complication}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedProtocol.clinical_references && selectedProtocol.clinical_references.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Referencias</h3>
                        <ul className="space-y-2">
                          {selectedProtocol.clinical_references.map((reference, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground">
                              {idx + 1}. {reference}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="pt-4 border-t text-xs text-muted-foreground">
                      <p>Versión: {selectedProtocol.version}</p>
                      <p>Última actualización: {new Date(selectedProtocol.last_updated).toLocaleDateString("es-CL")}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Selecciona un protocolo para ver los detalles</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}