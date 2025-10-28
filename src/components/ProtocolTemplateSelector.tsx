import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProtocolTemplate {
  id: string;
  name: string;
  category: string;
  diagnosis_code: string | null;
  template_data: any;
}

interface ProtocolTemplateSelectorProps {
  onApplyTemplate: (data: any) => void;
}

export function ProtocolTemplateSelector({ onApplyTemplate }: ProtocolTemplateSelectorProps) {
  const [templates, setTemplates] = useState<ProtocolTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("protocol_templates")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Error al cargar plantillas");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = () => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (template) {
      onApplyTemplate(template.template_data);
      toast.success(`Plantilla "${template.name}" aplicada`);
    }
  };

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, ProtocolTemplate[]>);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Cargando plantillas...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-accent/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <div>
            <CardTitle>Plantillas de Protocolos</CardTitle>
            <CardDescription>
              Selecciona una plantilla para autocompletar el ingreso según patología
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Plantilla</Label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar plantilla..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                <div key={category}>
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                    {category}
                  </div>
                  {categoryTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                      {template.diagnosis_code && (
                        <span className="text-muted-foreground ml-2">
                          ({template.diagnosis_code})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleApplyTemplate}
          disabled={!selectedTemplate}
          variant="secondary"
          className="w-full"
        >
          Aplicar Plantilla
        </Button>

        {selectedTemplate && (
          <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
            <p className="font-medium mb-1">Esta plantilla completará automáticamente:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Motivo de consulta</li>
              <li>Enfermedad actual</li>
              <li>Examen físico</li>
              <li>Órdenes de laboratorio</li>
              <li>Medicamentos</li>
              <li>Órdenes de enfermería</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}