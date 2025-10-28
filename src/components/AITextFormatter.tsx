import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Loader2, Sparkles, Mic } from "lucide-react";
import { toast } from "sonner";
import { SpeechToText } from "./SpeechToText";

interface AITextFormatterProps {
  onFormat: (formattedText: string) => void;
  placeholder?: string;
  buttonText?: string;
}

export function AITextFormatter({ 
  onFormat, 
  placeholder = "Escriba o pegue el texto a formatear...",
  buttonText = "Formatear con IA"
}: AITextFormatterProps) {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

  const formatWithAI = async () => {
    if (!inputText.trim()) {
      toast.error("Por favor ingrese un texto para formatear");
      return;
    }

    setLoading(true);
    
    try {
      // TODO: Replace with actual AI API call
      // This is a mock implementation
      const response = await new Promise<{ formattedText: string }>((resolve) => {
        setTimeout(() => {
          // Simulate AI formatting
          const formatted = `EVOLUCIÓN Y TRATAMIENTO:

MOTIVO DE CONSULTA:
- ${inputText.split('.')[0]}.

HISTORIA DE LA ENFERMEDAD ACTUAL:
- ${inputText}.

EXAMEN FÍSICO:
- Estado general: Regular.
- Signos vitales: Estables.
- Otros hallazgos relevantes.

IMPRESIÓN DIAGNÓSTICA:
- Diagnóstico principal.
- Diagnósticos diferenciales.

PLAN DE MANEJO:
- Estudios complementarios.
- Tratamiento farmacológico.
- Recomendaciones generales.`;
          
          resolve({ formattedText: formatted });
        }, 1500);
      });
      
      onFormat(response.formattedText);
      toast.success("Texto formateado con éxito");
    } catch (error) {
      console.error("Error al formatear el texto:", error);
      toast.error("Error al formatear el texto. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSpeechTranscription = (text: string) => {
    setInputText(prev => prev ? `${prev} ${text}` : text);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Asistente de Redacción Médica
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Textarea
            placeholder={placeholder}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="min-h-[100px]"
            disabled={loading}
          />
          
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex-1">
              <SpeechToText onTranscription={handleSpeechTranscription} />
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={formatWithAI} 
                disabled={loading || !inputText.trim()}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {buttonText}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
