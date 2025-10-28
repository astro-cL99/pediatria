import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";

export interface PhysicalExamFindings {
  [system: string]: string[];
}

interface PhysicalExamFormProps {
  value: string;
  onChange: (value: string) => void;
}

const physicalExamSystems = {
  "Piel y mucosas": [
    "Rosadas, hidratadas, sin lesiones",
    "Pálidas",
    "Ictéricas",
    "Cianóticas",
    "Deshidratadas",
    "Con exantema",
    "Con petequias",
    "Con hematomas",
    "Con lesiones activas",
  ],
  "Cabeza y cuello": [
    "Normocéfalo, sin adenopatías",
    "Fontanela anterior normotensa",
    "Fontanela anterior abombada",
    "Fontanela anterior deprimida",
    "Con adenopatías cervicales",
    "Con adenopatías submandibulares",
    "Cuello móvil, sin rigidez",
    "Signos meníngeos negativos",
    "Signos meníngeos positivos",
  ],
  "Tórax": [
    "Simétrico, expansibilidad conservada",
    "Uso de musculatura accesoria",
    "Retracciones intercostales",
    "Retracciones subcostales",
    "Tiraje supraesternal",
    "Aleteo nasal",
  ],
  "Cardiovascular": [
    "Ruidos cardíacos rítmicos, normofonéticos",
    "Pulsos periféricos palpables y simétricos",
    "Llene capilar < 2 segundos",
    "Llene capilar > 2 segundos",
    "Soplo sistólico",
    "Soplo diastólico",
    "Taquicardia",
    "Bradicardia",
  ],
  "Respiratorio": [
    "Murmullo pulmonar conservado bilateral",
    "Crepitaciones bilaterales",
    "Crepitaciones en base derecha",
    "Crepitaciones en base izquierda",
    "Sibilancias bilaterales",
    "Sibilancias espiratorias",
    "Hipoventilación en base derecha",
    "Hipoventilación en base izquierda",
    "Roncus",
  ],
  "Abdomen": [
    "Blando, depresible, indoloro",
    "Ruidos hidroaéreos presentes",
    "Sin visceromegalias",
    "Hepatomegalia",
    "Esplenomegalia",
    "Distendido",
    "Doloroso a la palpación",
    "Globoso",
    "Defensa muscular",
  ],
  "Neurológico": [
    "Alerta, reactivo",
    "Glasgow 15/15",
    "Somnoliento",
    "Irritable",
    "Letárgico",
    "Reflejo pupilar conservado",
    "Pupilas isocóricas reactivas",
    "Pupilas anisocóricas",
    "Fuerza muscular conservada",
    "Sensibilidad conservada",
    "Reflejos osteotendinosos presentes",
  ],
  "Extremidades": [
    "Simétricas, móviles",
    "Sin edema",
    "Edema en miembros inferiores",
    "Edema generalizado",
    "Perfusión distal conservada",
    "Lesiones en piel",
  ],
};

export function PhysicalExamForm({ value, onChange }: PhysicalExamFormProps) {
  const [selectedFindings, setSelectedFindings] = useState<PhysicalExamFindings>({});
  const [selectValues, setSelectValues] = useState<{ [key: string]: string }>({});

  const handleAddFinding = (system: string, finding: string) => {
    const updated = { ...selectedFindings };
    if (!updated[system]) {
      updated[system] = [];
    }
    if (!updated[system].includes(finding)) {
      updated[system].push(finding);
      setSelectedFindings(updated);
      updateTextValue(updated);
    }
    // Reset the select value to allow selecting another option
    setSelectValues(prev => ({ ...prev, [system]: "" }));
  };

  const handleRemoveFinding = (system: string, finding: string) => {
    const updated = { ...selectedFindings };
    if (updated[system]) {
      updated[system] = updated[system].filter(f => f !== finding);
      if (updated[system].length === 0) {
        delete updated[system];
      }
      setSelectedFindings(updated);
      updateTextValue(updated);
    }
  };

  const updateTextValue = (findings: PhysicalExamFindings) => {
    const text = Object.entries(findings)
      .map(([system, items]) => `${system}: ${items.join(', ')}`)
      .join('\n');
    onChange(text);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Examen Físico</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Grid layout for better visual organization */}
        <div className="grid md:grid-cols-2 gap-6">
          {Object.entries(physicalExamSystems).map(([system, options]) => (
            <div key={system} className="space-y-2">
              <Label className="font-semibold">{system}</Label>
              <Select 
                value={selectValues[system] || ""} 
                onValueChange={(value) => handleAddFinding(system, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar hallazgo..." />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  {options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedFindings[system] && selectedFindings[system].length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedFindings[system].map((finding) => (
                    <div
                      key={finding}
                      className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs"
                    >
                      <span>{finding}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-3 w-3 p-0 hover:bg-primary/20"
                        onClick={() => handleRemoveFinding(system, finding)}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {Object.keys(selectedFindings).length > 0 && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
            <Label className="text-sm font-semibold mb-2 block">📋 Resumen del Examen Físico:</Label>
            <div className="text-sm space-y-1">
              {Object.entries(selectedFindings).map(([system, items]) => (
                <div key={system}>
                  <span className="font-medium">{system}:</span> {items.join(', ')}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
