import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Minus, Plus, Maximize2, Minimize2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PresentationModeProps {
  patients: any[];
}

export function PresentationMode({ patients }: PresentationModeProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(100);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const isNewAdmission = (patient: any) => {
    const admissionDate = new Date(patient.admission_date);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return admissionDate > yesterday;
  };

  return (
    <div 
      className={`presentation-mode ${isFullscreen ? 'fullscreen' : ''} bg-background`}
      style={{ fontSize: `${fontSize}%` }}
    >
      {/* Controles de presentación */}
      <div className="fixed top-4 right-4 z-50 flex gap-2 bg-card border rounded-lg p-2 shadow-lg">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setFontSize(Math.max(80, fontSize - 10))}
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <Badge variant="outline" className="px-3 flex items-center">
          {fontSize}%
        </Badge>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setFontSize(Math.min(150, fontSize + 10))}
        >
          <Plus className="h-4 w-4" />
        </Button>
        
        <Button
          variant="default"
          size="sm"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* Vista optimizada para proyección */}
      <div className="presentation-content p-8 space-y-6">
        {/* Header grande y visible */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2">ENTREGA DE TURNO</h1>
          <p className="text-2xl text-muted-foreground">
            {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
          </p>
          <Badge className="mt-4 text-lg px-4 py-2">
            Total Pacientes: {patients.length}
          </Badge>
        </div>

        {/* Grid de pacientes optimizado para TV */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((patient) => (
            <Card key={patient.id} className="border-2 hover:border-primary transition-colors">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-1">{patient.patient?.name || 'Sin nombre'}</CardTitle>
                    <p className="text-lg text-muted-foreground">{patient.room || 'Sin sala'}</p>
                  </div>
                  {isNewAdmission(patient) && (
                    <Badge variant="destructive" className="text-lg px-3 py-1">
                      NUEVO
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-lg space-y-1">
                  <p><strong>Edad:</strong> {patient.age || 'N/A'}</p>
                  <p><strong>Días:</strong> {patient.daysHospitalized || 0}</p>
                  <p><strong>Dx:</strong> {patient.admission_diagnoses?.[0] || 'Sin diagnóstico'}</p>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  {patient.oxygen_requirement && Object.keys(patient.oxygen_requirement).length > 0 && (
                    <Badge variant="destructive" className="text-base">O₂</Badge>
                  )}
                  {patient.antibiotics && Array.isArray(patient.antibiotics) && patient.antibiotics.length > 0 && (
                    <Badge variant="secondary" className="text-base">ATB: {patient.antibiotics.length}</Badge>
                  )}
                  {patient.pending_tasks && patient.pending_tasks.trim() && (
                    <Badge variant="outline" className="text-base" style={{ backgroundColor: 'hsl(var(--warning) / 0.1)', borderColor: 'hsl(var(--warning))' }}>
                      Pendientes
                    </Badge>
                  )}
                </div>

                {patient.criticalInfo && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-5 w-5" />
                    <AlertDescription className="text-base">
                      {patient.criticalInfo}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {patients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-2xl text-muted-foreground">No hay pacientes para mostrar</p>
          </div>
        )}
      </div>
    </div>
  );
}
