import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Droplets, Copy, Calculator } from "lucide-react";
import { toast } from "sonner";
import { calculateFluidTherapy, type FluidTherapyCalculation } from "@/utils/fluidTherapy";

interface FluidTherapyCalculatorProps {
  initialWeight?: number;
  initialHeight?: number;
  onCalculationComplete?: (calculation: FluidTherapyCalculation) => void;
}

export function FluidTherapyCalculator({
  initialWeight = 0,
  initialHeight,
  onCalculationComplete,
}: FluidTherapyCalculatorProps) {
  const [weight, setWeight] = useState<number>(initialWeight);
  const [height, setHeight] = useState<number>(initialHeight || 0);
  const [hasDehydration, setHasDehydration] = useState(false);
  const [dehydrationPercent, setDehydrationPercent] = useState<number>(0);
  const [calculation, setCalculation] = useState<FluidTherapyCalculation | null>(null);

  useEffect(() => {
    if (weight > 0) {
      const calc = calculateFluidTherapy(
        weight,
        height > 0 ? height : undefined,
        hasDehydration ? dehydrationPercent : undefined
      );
      setCalculation(calc);
      onCalculationComplete?.(calc);
    }
  }, [weight, height, hasDehydration, dehydrationPercent, onCalculationComplete]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  const generateFluidOrder = () => {
    if (!calculation) return "";

    const { holliday_segar, dehydration } = calculation;
    const totalMl = dehydration ? dehydration.total : holliday_segar.maintenance_ml_day;
    const mlPerHour = Math.round(totalMl / 24);

    let order = `Fleboclisis: Suero Ringer Lactato ${totalMl} ml/día (${mlPerHour} ml/h)\n`;
    order += `Calculado por Holliday-Segar: ${holliday_segar.formula_breakdown}\n`;

    if (dehydration) {
      order += `\nPlan ${dehydration.plan} - Deshidratación ${dehydrationPercent}%\n`;
      order += `Déficit: ${Math.round(dehydration.deficit)} ml\n`;
      if (dehydration.bolus) {
        order += `Bolo inicial: ${Math.round(dehydration.bolus)} ml\n`;
      }
    }

    return order;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-5 w-5" />
          Calculadora de Fluidoterapia
        </CardTitle>
        <CardDescription>
          Cálculo automático de requerimientos hídricos según Holliday-Segar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Peso (kg) *</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              value={weight || ""}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              placeholder="Ej: 15.5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Talla (cm)</Label>
            <Input
              id="height"
              type="number"
              step="0.1"
              value={height || ""}
              onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
              placeholder="Ej: 110"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="dehydration"
            checked={hasDehydration}
            onCheckedChange={(checked) => setHasDehydration(checked as boolean)}
          />
          <Label htmlFor="dehydration" className="cursor-pointer">
            Paciente con deshidratación
          </Label>
        </div>

        {hasDehydration && (
          <div className="space-y-2">
            <Label htmlFor="dehydration-percent">Porcentaje de deshidratación (%)</Label>
            <Input
              id="dehydration-percent"
              type="number"
              step="1"
              max="15"
              value={dehydrationPercent || ""}
              onChange={(e) => setDehydrationPercent(parseFloat(e.target.value) || 0)}
              placeholder="Ej: 5"
            />
          </div>
        )}

        {calculation && weight > 0 && (
          <Tabs defaultValue="holliday" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="holliday">
                <Calculator className="h-4 w-4 mr-2" />
                Holliday-Segar
              </TabsTrigger>
              <TabsTrigger value="bsa">
                <Calculator className="h-4 w-4 mr-2" />
                Superficie Corporal
              </TabsTrigger>
            </TabsList>

            <TabsContent value="holliday" className="space-y-4">
              <div className="bg-primary/5 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold">📊 Método Holliday-Segar</h4>
                <div>
                  <p className="text-3xl font-bold text-primary">
                    {calculation.holliday_segar.maintenance_ml_day} ml/día
                  </p>
                  <p className="text-xl text-muted-foreground">
                    {calculation.holliday_segar.maintenance_ml_hour} ml/hora
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {calculation.holliday_segar.formula_breakdown}
                </p>
              </div>

              {calculation.dehydration && (
                <Alert>
                  <AlertDescription className="space-y-2">
                    <p className="font-semibold">
                      Plan {calculation.dehydration.plan} - Deshidratación {dehydrationPercent}%
                    </p>
                    <div className="text-sm space-y-1">
                      <p>Déficit: {Math.round(calculation.dehydration.deficit)} ml</p>
                      <p>Mantenimiento: {Math.round(calculation.dehydration.maintenance)} ml</p>
                      <p className="font-bold">
                        Total: {Math.round(calculation.dehydration.total)} ml/día (
                        {Math.round(calculation.dehydration.total / 24)} ml/h)
                      </p>
                      {calculation.dehydration.bolus && (
                        <p className="text-destructive font-medium">
                          Bolo inicial: {Math.round(calculation.dehydration.bolus)} ml
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="bsa" className="space-y-4">
              {height > 0 ? (
                <div className="bg-secondary/5 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold">📐 Superficie Corporal</h4>
                  <div>
                    <p className="text-3xl font-bold text-secondary">
                      {calculation.body_surface_area.maintenance_ml_day} ml/día
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      SC: {calculation.body_surface_area.bsa_m2.toFixed(2)} m²
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {calculation.body_surface_area.formula}
                  </p>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    Ingresa la talla del paciente para calcular por superficie corporal
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        )}

        {calculation && weight > 0 && (
          <div className="flex gap-2">
            <Button
              onClick={() => copyToClipboard(generateFluidOrder())}
              className="flex-1"
              variant="default"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar a Indicaciones
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
