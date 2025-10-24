import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Microscope, Image as ImageIcon, ExternalLink, Copy } from "lucide-react";

interface ExternalLinksPanelProps {
  patientRut?: string;
  variant?: "card" | "inline" | "compact";
  showLabels?: boolean;
}

const EXTERNAL_LINKS = {
  laboratory: {
    name: "Laboratorio",
    url: "http://10.4.199.246:5580/welcome#detalles/index/286",
    icon: Microscope,
    color: "text-blue-600 hover:text-blue-700",
    bgColor: "hover:bg-blue-50 dark:hover:bg-blue-950/20",
  },
  imaging: {
    name: "Imágenes",
    url: "http://10.4.205.10:8080/web/guest/home?p_p_state=maximized&p_p_mode=view&saveLastPath=0&_58_struts_action=%2Flogin%2Flogin&p_p_id=58&p_p_lifecycle=0&_58_redirect=%2Fgroup%2Fmedicoshrr%2Fvisor-examenes%3Fp_p_id%3D15_WAR_ingradrishl7portlet_INSTANCE_R3rN%26p_p_lifecycle%3D1%26p_p_state%3Dnormal%26p_p_mode%3Dview%26p_p_col_id%3Dcolumn-1%26p_p_col_count%3D1%26_15_WAR_ingradrishl7portlet_INSTANCE_R3rN__spage%3D%252Fportlet_action%252Fexamen%252Fexterno%252Flist%26_15_WAR_ingradrishl7portlet_INSTANCE_R3rN__sorig%3D%252Fportlet_action%252Fexamen%252Fexterno%252Flist#a",
    icon: ImageIcon,
    color: "text-purple-600 hover:text-purple-700",
    bgColor: "hover:bg-purple-50 dark:hover:bg-purple-950/20",
  },
};

export function ExternalLinksPanel({ 
  patientRut, 
  variant = "card",
  showLabels = true 
}: ExternalLinksPanelProps) {
  const handleLinkClick = async (linkType: keyof typeof EXTERNAL_LINKS) => {
    const link = EXTERNAL_LINKS[linkType];
    
    // Copiar RUT al portapapeles si está disponible
    if (patientRut) {
      try {
        await navigator.clipboard.writeText(patientRut);
        toast.success(`RUT ${patientRut} copiado al portapapeles`, {
          description: `Abriendo ${link.name}. Puedes pegar el RUT directamente.`,
          icon: <Copy className="h-4 w-4" />,
        });
      } catch (error) {
        console.error("Error copying to clipboard:", error);
        toast.error("No se pudo copiar el RUT al portapapeles");
      }
    } else {
      toast.info(`Abriendo ${link.name}`, {
        description: "No hay RUT de paciente disponible para copiar",
      });
    }
    
    // Abrir enlace en nueva pestaña
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2">
        {Object.entries(EXTERNAL_LINKS).map(([key, link]) => {
          const Icon = link.icon;
          return (
            <Button
              key={key}
              variant="ghost"
              size="sm"
              onClick={() => handleLinkClick(key as keyof typeof EXTERNAL_LINKS)}
              className={`${link.color} ${link.bgColor} transition-colors`}
              title={`Abrir ${link.name}${patientRut ? ` y copiar RUT: ${patientRut}` : ''}`}
            >
              <Icon className="h-4 w-4" />
              {showLabels && <span className="ml-1 text-xs">{link.name}</span>}
              <ExternalLink className="h-3 w-3 ml-1 opacity-50" />
            </Button>
          );
        })}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ExternalLink className="h-4 w-4" />
          <span className="font-medium">Sistemas Externos:</span>
        </div>
        <div className="flex gap-2">
          {Object.entries(EXTERNAL_LINKS).map(([key, link]) => {
            const Icon = link.icon;
            return (
              <Button
                key={key}
                variant="outline"
                size="sm"
                onClick={() => handleLinkClick(key as keyof typeof EXTERNAL_LINKS)}
                className={`${link.color} ${link.bgColor} transition-colors gap-2`}
              >
                <Icon className="h-4 w-4" />
                {link.name}
                <ExternalLink className="h-3 w-3 opacity-50" />
              </Button>
            );
          })}
        </div>
        {patientRut && (
          <Badge variant="secondary" className="ml-auto">
            RUT: {patientRut}
          </Badge>
        )}
      </div>
    );
  }

  // Default: card variant
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Sistemas Externos
        </CardTitle>
        <CardDescription>
          Acceso rápido a consultas de exámenes
          {patientRut && (
            <span className="block mt-1 text-xs">
              📋 El RUT <strong>{patientRut}</strong> se copiará automáticamente al clickear
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(EXTERNAL_LINKS).map(([key, link]) => {
          const Icon = link.icon;
          return (
            <Button
              key={key}
              variant="outline"
              onClick={() => handleLinkClick(key as keyof typeof EXTERNAL_LINKS)}
              className={`${link.color} ${link.bgColor} h-auto py-4 flex flex-col gap-2 transition-all hover:scale-105`}
            >
              <Icon className="h-8 w-8" />
              <div className="flex items-center gap-2">
                <span className="font-semibold">{link.name}</span>
                <ExternalLink className="h-4 w-4 opacity-50" />
              </div>
              <span className="text-xs text-muted-foreground">
                Click para abrir y copiar RUT
              </span>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
