import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Droplets, Copy, Calculator, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { calculateFluidTherapy, calculateBSA, type FluidTherapyCalculation } from "@/utils/fluidTherapy";

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
  const [administeredVolume, setAdministeredVolume] = useState<number>(0);

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

  const calculateInsensibleLosses = () => {
    if (!height || height <= 0 || !weight || weight <= 0) return 0;
    const bsa = calculateBSA(weight, height);
    return Math.round(bsa * 400); // SC (m²) × 400 ml/m²/día
  };

  const getVolumePercentage = () => {
    if (!calculation) return 0;
    const totalMl = calculation.dehydration 
      ? calculation.dehydration.total 
      : calculation.holliday_segar.maintenance_ml_day;
    return totalMl > 0 ? Math.round((administeredVolume / totalMl) * 100) : 0;
  };

  const generateFluidOrder = () => {
    if (!calculation) return "";

    const { holliday_segar, dehydration } = calculation;
    const totalMl = dehydration ? dehydration.total : holliday_segar.maintenance_ml_day;
    const mlPerHour = Math.round(totalMl / 24);
    const insensibleLosses = calculateInsensibleLosses();

    let order = `💧 FLUIDOTERAPIA\n`;
    order += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    order += `Fleboclisis: Suero Ringer Lactato ${totalMl} ml/día (${mlPerHour} ml/h)\n`;
    order += `Calculado por Holliday-Segar: ${holliday_segar.formula_breakdown}\n\n`;

    if (dehydration) {
      order += `Plan ${dehydration.plan} - Deshidratación ${dehydrationPercent}%\n`;
      order += `• Déficit: ${Math.round(dehydration.deficit)} ml\n`;
      order += `• Mantenimiento: ${Math.round(dehydration.maintenance)} ml\n`;
      if (dehydration.bolus) {
        order += `• Bolo inicial: ${Math.round(dehydration.bolus)} ml\n`;
      }
      order += `\n`;
    }

    if (insensibleLosses > 0) {
      order += `Pérdidas insensibles estimadas: ${insensibleLosses} ml/día\n`;
      order += `(SC ${calculateBSA(weight, height).toFixed(2)} m² × 400 ml/m²/día)\n\n`;
    }

    if (administeredVolume > 0) {
      const percentage = getVolumePercentage();
      order += `Volumen administrado: ${administeredVolume} ml (${percentage}% del total calculado)\n`;
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
              <div className="bg-primary/5 p-4 rounded-lg space-y-3">
                <h4 className="font-semibold">📊 Método Holliday-Segar</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Volumen Total</p>
                    <p className="text-3xl font-bold text-primary">
                      {calculation.holliday_segar.maintenance_ml_day} ml/día
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Velocidad de Infusión</p>
                    <p className="text-3xl font-bold text-primary">
                      {calculation.holliday_segar.maintenance_ml_hour} ml/h
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-primary/20">
                  <p className="text-xs text-muted-foreground">Cálculo:</p>
                  <p className="text-sm font-mono bg-background/50 p-2 rounded mt-1">
                    {calculation.holliday_segar.formula_breakdown}
                  </p>
                </div>
              </div>

              {calculation.dehydration && (
                <Alert className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
                  <AlertDescription className="space-y-3">
                    <p className="font-semibold text-orange-900 dark:text-orange-100">
                      Plan {calculation.dehydration.plan} - Deshidratación {dehydrationPercent}%
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Déficit</p>
                        <p className="font-bold">{Math.round(calculation.dehydration.deficit)} ml</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Mantenimiento</p>
                        <p className="font-bold">{Math.round(calculation.dehydration.maintenance)} ml</p>
                      </div>
                      <div className="col-span-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground">Volumen Total Requerido</p>
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {Math.round(calculation.dehydration.total)} ml/día
                        </p>
                        <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                          {Math.round(calculation.dehydration.total / 24)} ml/h
                        </p>
                      </div>
                      {calculation.dehydration.bolus && (
                        <div className="col-span-2 pt-2 border-t border-destructive/20">
                          <p className="text-xs text-muted-foreground">Bolo Inicial</p>
                          <p className="text-destructive font-bold text-lg">
                            {Math.round(calculation.dehydration.bolus)} ml
                          </p>
                          <p className="text-xs text-destructive/80">
                            (Administrar en 15-30 min)
                          </p>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="bsa" className="space-y-4">
              {height > 0 ? (
                <div className="bg-secondary/5 p-4 rounded-lg space-y-3">
                  <h4 className="font-semibold">📐 Superficie Corporal</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Volumen Total</p>
                      <p className="text-3xl font-bold text-secondary">
                        {calculation.body_surface_area.maintenance_ml_day} ml/día
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Velocidad de Infusión</p>
                      <p className="text-3xl font-bold text-secondary">
                        {Math.round(calculation.body_surface_area.maintenance_ml_day / 24)} ml/h
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-secondary/20">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Superficie Corporal:</span>
                      <span className="font-bold text-secondary">
                        {calculation.body_surface_area.bsa_m2.toFixed(2)} m²
                      </span>
                    </div>
                    <p className="text-xs font-mono bg-background/50 p-2 rounded mt-2">
                      {calculation.body_surface_area.formula}
                    </p>
                  </div>
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
          <>
            {/* Insensible Losses Display */}
            {height > 0 && (
              <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-semibold">Pérdidas Insensibles</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {calculateInsensibleLosses()} ml/día
                    </p>
                    <p className="text-xs text-muted-foreground">
                      SC {calculateBSA(weight, height).toFixed(2)} m² × 400 ml/m²/día
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Volume Administration Tracker */}
            <div className="space-y-3 p-4 border rounded-lg bg-accent/50">
              <Label htmlFor="administered-volume" className="font-semibold">
                Volumen Administrado (ml)
              </Label>
              <Input
                id="administered-volume"
                type="number"
                value={administeredVolume || ""}
                onChange={(e) => setAdministeredVolume(parseFloat(e.target.value) || 0)}
                placeholder="Ej: 800"
              />
              
              {administeredVolume > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Porcentaje del total calculado:</span>
                    <Badge variant={getVolumePercentage() >= 80 ? "default" : "secondary"}>
                      {getVolumePercentage()}%
                    </Badge>
                  </div>
                  <Progress value={getVolumePercentage()} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {administeredVolume} ml de {calculation.dehydration 
                      ? Math.round(calculation.dehydration.total) 
                      : calculation.holliday_segar.maintenance_ml_day} ml calculados
                  </p>
                </div>
              )}
            </div>

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
          </>
        )}
      </CardContent>
    </Card>
  );
}
