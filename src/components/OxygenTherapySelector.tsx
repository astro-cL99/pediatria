import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface OxygenTherapyData {
  type: string;
  flow: string;
  peep?: string;
  fio2?: string;
}

interface OxygenTherapySelectorProps {
  value: OxygenTherapyData;
  onChange: (value: OxygenTherapyData) => void;
}

// Configuración de flujos según tipo de oxigenoterapia
const oxygenFlowRanges: Record<string, { min: number; max: number; step: number; unit: string }> = {
  "Naricera": { min: 0.5, max: 15, step: 0.5, unit: "L/min" },
  "Venturi": { min: 2, max: 15, step: 1, unit: "L/min" },
  "CNAF": { min: 2, max: 60, step: 1, unit: "L/min" },
  "CPAP": { min: 5, max: 15, step: 1, unit: "L/min" },
  "VMI": { min: 5, max: 15, step: 1, unit: "L/min" },
};

export function OxygenTherapySelector({ value, onChange }: OxygenTherapySelectorProps) {
  const [customFlow, setCustomFlow] = useState(false);

  useEffect(() => {
    // Si el valor actual no está en los presets, activar modo custom
    if (value.flow && value.type && oxygenFlowRanges[value.type]) {
      const range = oxygenFlowRanges[value.type];
      const flowNum = parseFloat(value.flow);
      const presetValues = generatePresetValues(range.min, range.max, range.step);
      if (!presetValues.includes(value.flow)) {
        setCustomFlow(true);
      }
    }
  }, [value.flow, value.type]);

  const generatePresetValues = (min: number, max: number, step: number): string[] => {
    const values: string[] = [];
    for (let i = min; i <= max; i += step) {
      values.push(i.toString());
    }
    return values;
  };

  const handleTypeChange = (newType: string) => {
    onChange({
      type: newType,
      flow: "",
      peep: undefined,
      fio2: undefined,
    });
    setCustomFlow(false);
  };

  const handleFlowChange = (newFlow: string) => {
    if (newFlow === "custom") {
      setCustomFlow(true);
      onChange({
        ...value,
        flow: "",
      });
    } else {
      onChange({
        ...value,
        flow: newFlow,
      });
    }
  };

  const handleCustomFlowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      flow: e.target.value,
    });
  };

  const showAdvancedParams = value.type === "CPAP" || value.type === "VMI";
  const showFlowSelector = value.type && value.type !== "Ambiental" && oxygenFlowRanges[value.type];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tipo de Oxigenoterapia */}
        <div className="space-y-2">
          <Label htmlFor="oxygen-type">Tipo de Oxigenoterapia</Label>
          <Select value={value.type} onValueChange={handleTypeChange}>
            <SelectTrigger id="oxygen-type">
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="Ambiental">Ambiental</SelectItem>
              <SelectItem value="Naricera">Naricera</SelectItem>
              <SelectItem value="Venturi">Venturi</SelectItem>
              <SelectItem value="CNAF">CNAF (Cánula Alto Flujo)</SelectItem>
              <SelectItem value="CPAP">CPAP</SelectItem>
              <SelectItem value="VMI">VMI (Ventilación Mecánica)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Flujo de O2 */}
        {showFlowSelector && (
          <div className="space-y-2">
            <Label htmlFor="oxygen-flow">
              Flujo de O₂ ({oxygenFlowRanges[value.type].unit})
            </Label>
            {!customFlow ? (
              <Select value={value.flow} onValueChange={handleFlowChange}>
                <SelectTrigger id="oxygen-flow">
                  <SelectValue placeholder="Seleccionar flujo" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50 max-h-[300px]">
                  {generatePresetValues(
                    oxygenFlowRanges[value.type].min,
                    oxygenFlowRanges[value.type].max,
                    oxygenFlowRanges[value.type].step
                  ).map((flowValue) => (
                    <SelectItem key={flowValue} value={flowValue}>
                      {flowValue} {oxygenFlowRanges[value.type].unit}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">✏️ Valor personalizado</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.1"
                  min={oxygenFlowRanges[value.type].min}
                  max={oxygenFlowRanges[value.type].max}
                  value={value.flow}
                  onChange={handleCustomFlowChange}
                  placeholder={`${oxygenFlowRanges[value.type].min}-${oxygenFlowRanges[value.type].max}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setCustomFlow(false);
                    onChange({ ...value, flow: "" });
                  }}
                  className="px-3 py-2 text-xs bg-secondary hover:bg-secondary/80 rounded-md"
                >
                  Presets
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Parámetros avanzados para CPAP y VMI */}
      {showAdvancedParams && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="space-y-2">
            <Label htmlFor="oxygen-peep">PEEP (cmH₂O)</Label>
            <Select
              value={value.peep || ""}
              onValueChange={(newValue) => onChange({ ...value, peep: newValue })}
            >
              <SelectTrigger id="oxygen-peep">
                <SelectValue placeholder="Seleccionar PEEP" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((peepValue) => (
                  <SelectItem key={peepValue} value={peepValue.toString()}>
                    {peepValue} cmH₂O
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="oxygen-fio2">FiO₂ (%)</Label>
            <Select
              value={value.fio2 || ""}
              onValueChange={(newValue) => onChange({ ...value, fio2: newValue })}
            >
              <SelectTrigger id="oxygen-fio2">
                <SelectValue placeholder="Seleccionar FiO₂" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {[21, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100].map(
                  (fio2Value) => (
                    <SelectItem key={fio2Value} value={fio2Value.toString()}>
                      {fio2Value}%
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Información sobre rangos */}
      {showFlowSelector && (
        <p className="text-xs text-muted-foreground">
          💡 Rango permitido: {oxygenFlowRanges[value.type].min} - {oxygenFlowRanges[value.type].max}{" "}
          {oxygenFlowRanges[value.type].unit}
        </p>
      )}
    </div>
  );
}
