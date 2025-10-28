import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, ThumbsUp, ThumbsDown, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: any[];
  helpful?: boolean;
}

const ClinicalAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hola! Soy tu asistente clínico pediátrico. Puedo ayudarte a buscar información en los casos clínicos históricos del hospital. ¿En qué puedo ayudarte hoy?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("clinical-assistant", {
        body: { query: input },
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || "Error al procesar consulta");
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        sources: data.sources || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.documentsFound === 0) {
        toast.info("No se encontraron documentos relevantes");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al procesar consulta");
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Lo siento, hubo un error al procesar tu consulta. Por favor intenta de nuevo.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, helpful: boolean) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, helpful } : msg
      )
    );
    toast.success("Gracias por tu feedback");
  };

  const suggestedQueries = [
    "Casos similares de bronquiolitis en lactantes",
    "Protocolos de manejo de crisis asmática",
    "Resultados de laboratorio en sepsis neonatal",
    "Complicaciones frecuentes en neumonía pediátrica",
  ];

  return (
    <AppLayout>
      <div className="container mx-auto p-6 h-[calc(100vh-8rem)]">
        <div className="flex flex-col h-full space-y-4">
          <div>
            <h1 className="text-3xl font-bold">Asistente Clínico IA</h1>
            <p className="text-muted-foreground mt-2">
              Consulta casos clínicos históricos con inteligencia artificial
            </p>
          </div>

          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Conversación
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === "assistant" && (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}

                      <div
                        className={cn(
                          "max-w-[80%] space-y-2",
                          message.role === "user" ? "items-end" : "items-start"
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-lg p-4",
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>

                        {message.sources && message.sources.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {message.sources.map((source, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                {source.type} - {source.patient}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {message.role === "assistant" && message.helpful === undefined && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleFeedback(message.id, true)}
                            >
                              <ThumbsUp className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleFeedback(message.id, false)}
                            >
                              <ThumbsDown className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {message.role === "user" && (
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {messages.length === 1 && (
                <div className="p-6 border-t">
                  <p className="text-sm font-medium mb-3">Consultas sugeridas:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {suggestedQueries.map((query, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="justify-start text-left h-auto py-2 px-3"
                        onClick={() => setInput(query)}
                      >
                        {query}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-6 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Escribe tu consulta aquí..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    disabled={isLoading}
                  />
                  <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default ClinicalAssistant;
