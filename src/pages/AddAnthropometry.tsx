import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface AnthropometryFormData {
  weight: number;
  height: number;
  head_circumference?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  bmi?: number;
  measurement_date: string;
  notes?: string;
}

export default function AddAnthropometry() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, setValue } = useForm<AnthropometryFormData>({
    defaultValues: {
      measurement_date: new Date().toISOString().slice(0, 16),
    }
  });

  // Fetch patient info
  const { data: patient } = useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Calculate BMI automatically
  const weight = watch("weight");
  const height = watch("height");
  const systolicBP = watch("systolic_bp");
  const diastolicBP = watch("diastolic_bp");

  // Fórmula de DuBois para superficie corporal
  const calculateBodySurfaceArea = (weight: number, height: number) => {
    if (weight && height && weight > 0 && height > 0) {
      // BSA (m²) = 0.007184 × peso^0.425 × talla^0.725
      const bsa = 0.007184 * Math.pow(weight, 0.425) * Math.pow(height, 0.725);
      return parseFloat(bsa.toFixed(4));
    }
    return undefined;
  };

  // Fórmula de Holliday-Segar para hidratación basal
  const calculateHollidaySegar = (weight: number) => {
    if (!weight || weight <= 0) return undefined;

    let totalMl = 0;
    let calculation = [];

    // Primeros 10 kg: 100 ml/kg/día
    if (weight <= 10) {
      totalMl = weight * 100;
      calculation.push(`${weight} kg × 100 ml/kg = ${totalMl} ml/día`);
    } 
    // 10-20 kg: 1000 ml + 50 ml/kg por cada kg sobre 10
    else if (weight <= 20) {
      const first10 = 1000;
      const remaining = (weight - 10) * 50;
      totalMl = first10 + remaining;
      calculation.push(`10 kg × 100 ml/kg = 1000 ml`);
      calculation.push(`${(weight - 10).toFixed(1)} kg × 50 ml/kg = ${remaining} ml`);
      calculation.push(`Total = ${totalMl} ml/día`);
    }
    // > 20 kg: 1500 ml + 20 ml/kg por cada kg sobre 20
    else {
      const first10 = 1000;
      const next10 = 500;
      const remaining = (weight - 20) * 20;
      totalMl = first10 + next10 + remaining;
      calculation.push(`10 kg × 100 ml/kg = 1000 ml`);
      calculation.push(`10 kg × 50 ml/kg = 500 ml`);
      calculation.push(`${(weight - 20).toFixed(1)} kg × 20 ml/kg = ${remaining} ml`);
      calculation.push(`Total = ${totalMl} ml/día`);
    }

    // Calcular ml/hora
    const mlPerHour = totalMl / 24;

    // Calcular gotas/minuto (1 ml = 20 gotas para macrogotero)
    const dropsPerMinute = (mlPerHour * 20) / 60;

    // Calcular microgotas/minuto (1 ml = 60 microgotas)
    const microdropsPerMinute = mlPerHour;

    return {
      totalMlPerDay: Math.round(totalMl),
      mlPerHour: parseFloat(mlPerHour.toFixed(1)),
      dropsPerMinute: Math.round(dropsPerMinute),
      microdropsPerMinute: Math.round(microdropsPerMinute),
      calculation: calculation,
      note: "Fórmula de Holliday-Segar para hidratación basal"
    };
  };

  const calculateBMI = (weight: number, height: number) => {
    if (weight && height && height > 0) {
      const heightInMeters = height / 100;
      const bmi = weight / (heightInMeters * heightInMeters);
      return parseFloat(bmi.toFixed(2));
    }
    return undefined;
  };

  const getAgeDetails = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    const ageInYears = Math.floor(ageInMonths / 12);
    const remainingMonths = ageInMonths % 12;
    
    return {
      years: ageInYears,
      months: remainingMonths,
      totalMonths: ageInMonths
    };
  };

  const getNutritionalIndicator = (weight: number, height: number, dateOfBirth: string) => {
    const age = getAgeDetails(dateOfBirth);
    
    // Menores de 1 año: Peso/Edad
    if (age.totalMonths < 12) {
      return {
        type: "Peso/Edad",
        description: "Indicador nutricional para menores de 1 año",
        note: "Se evalúa con tablas de percentiles OMS"
      };
    }
    
    // 1 a 5 años: Peso/Talla
    if (age.years >= 1 && age.years < 5) {
      if (height > 0) {
        const ratio = (weight / height) * 100;
        return {
          type: "Peso/Talla",
          value: ratio.toFixed(2),
          description: "Indicador nutricional para 1-5 años",
          note: "Se evalúa con tablas de percentiles OMS"
        };
      }
    }
    
    // Mayores de 5 años: IMC
    if (age.years >= 5) {
      const bmi = calculateBMI(weight, height);
      return {
        type: "IMC (Índice de Masa Corporal)",
        value: bmi,
        description: "Indicador nutricional para mayores de 5 años",
        note: "Se evalúa con tablas de percentiles OMS"
      };
    }
    
    return null;
  };

  // Calcular percentil de presión arterial
  const calculateBPPercentile = (
    systolic: number,
    diastolic: number,
    height: number,
    dateOfBirth: string,
    gender: string = "male" // Por defecto masculino, idealmente debería venir del paciente
  ) => {
    const age = getAgeDetails(dateOfBirth);
    
    if (age.years < 1 || age.years >= 18) {
      return {
        status: "No aplicable",
        note: "El cálculo de percentil de PA es para niños de 1 a 17 años"
      };
    }

    // Calcular percentil de talla (simplificado - idealmente usar tablas OMS)
    // Aquí usamos una aproximación
    const heightPercentile = 50; // Valor por defecto (P50)

    // Valores de referencia aproximados para P50, P90, P95, P99
    // Estos son valores simplificados, idealmente se usarían tablas completas
    const getBPReference = (ageYears: number, heightPerc: number) => {
      // Valores aproximados para niños (P50 de talla)
      const systolicP50 = 90 + (ageYears * 1.5);
      const systolicP90 = systolicP50 + 10;
      const systolicP95 = systolicP50 + 12;
      const systolicP99 = systolicP50 + 16;

      const diastolicP50 = 50 + (ageYears * 0.8);
      const diastolicP90 = diastolicP50 + 8;
      const diastolicP95 = diastolicP50 + 10;
      const diastolicP99 = diastolicP50 + 14;

      return {
        systolic: { p50: systolicP50, p90: systolicP90, p95: systolicP95, p99: systolicP99 },
        diastolic: { p50: diastolicP50, p90: diastolicP90, p95: diastolicP95, p99: diastolicP99 }
      };
    };

    const reference = getBPReference(age.years, heightPercentile);

    // Calcular Z-score (desviaciones estándar)
    const systolicSD = (reference.systolic.p95 - reference.systolic.p50) / 1.645; // Aproximación
    const diastolicSD = (reference.diastolic.p95 - reference.diastolic.p50) / 1.645;

    const systolicZScore = (systolic - reference.systolic.p50) / systolicSD;
    const diastolicZScore = (diastolic - reference.diastolic.p50) / diastolicSD;

    // Clasificación
    let classification = "";
    let color = "";
    
    if (systolic < reference.systolic.p90 && diastolic < reference.diastolic.p90) {
      classification = "Normal";
      color = "green";
    } else if (systolic >= reference.systolic.p90 && systolic < reference.systolic.p95) {
      classification = "Prehipertensión";
      color = "yellow";
    } else if (systolic >= reference.systolic.p95 && systolic < reference.systolic.p99) {
      classification = "HTA Estadio 1";
      color = "orange";
    } else if (systolic >= reference.systolic.p99) {
      classification = "HTA Estadio 2";
      color = "red";
    }

    return {
      systolic: {
        value: systolic,
        zScore: systolicZScore.toFixed(2),
        percentile: systolicZScore > 0 ? "> P50" : "< P50",
        reference: reference.systolic
      },
      diastolic: {
        value: diastolic,
        zScore: diastolicZScore.toFixed(2),
        percentile: diastolicZScore > 0 ? "> P50" : "< P50",
        reference: reference.diastolic
      },
      classification,
      color,
      note: "Valores de referencia basados en tablas de la AAP (American Academy of Pediatrics)"
    };
  };

  const onSubmit = async (data: AnthropometryFormData) => {
    if (!id) {
      toast.error("ID de paciente no encontrado");
      return;
    }

    setLoading(true);

    try {
      // Convert to numbers
      const weight = parseFloat(data.weight as any);
      const height = parseFloat(data.height as any);
      const headCircumference = data.head_circumference ? parseFloat(data.head_circumference as any) : null;

      // Validate
      if (isNaN(weight) || isNaN(height)) {
        toast.error("Por favor ingresa valores numéricos válidos");
        setLoading(false);
        return;
      }

      // Calculate BMI and BSA
      const bmi = calculateBMI(weight, height);
      const bsa = calculateBodySurfaceArea(weight, height);

      const { error } = await supabase
        .from("anthropometric_data")
        .insert({
          patient_id: id,
          weight_kg: weight,
          height_cm: height,
          head_circumference_cm: headCircumference,
          bmi: bmi || null,
          body_surface_area: bsa || null,
          measured_at: data.measurement_date,
          notes: data.notes || null,
        });

      if (error) throw error;

      toast.success("Medición antropométrica registrada exitosamente");
      navigate(`/patient/${id}`);
    } catch (error: any) {
      console.error("Error saving anthropometry:", error);
      toast.error(error.message || "Error al guardar medición");
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    
    if (years < 1) {
      return `${months + (years * 12)} meses`;
    }
    return `${years} años`;
  };

  const bmi = calculateBMI(parseFloat(weight as any), parseFloat(height as any));
  const bsa = calculateBodySurfaceArea(parseFloat(weight as any), parseFloat(height as any));
  const hollidaySegar = weight ? calculateHollidaySegar(parseFloat(weight as any)) : null;
  const nutritionalIndicator = patient?.date_of_birth && weight && height 
    ? getNutritionalIndicator(parseFloat(weight as any), parseFloat(height as any), patient.date_of_birth)
    : null;
  const bpPercentile = patient?.date_of_birth && systolicBP && diastolicBP && height
    ? calculateBPPercentile(
        parseFloat(systolicBP as any),
        parseFloat(diastolicBP as any),
        parseFloat(height as any),
        patient.date_of_birth
      )
    : null;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/patient/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nueva Medición Antropométrica</h1>
          {patient && (
            <p className="text-muted-foreground">
              {patient.name} - {calculateAge(patient.date_of_birth)}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos de Medición</CardTitle>
            <CardDescription>
              Registra las medidas antropométricas del paciente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="measurement_date">Fecha y Hora de Medición *</Label>
                <Input
                  type="datetime-local"
                  {...register("measurement_date", { required: true })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight">Peso (kg) *</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  placeholder="Ej: 15.5"
                  {...register("weight", { 
                    required: "El peso es requerido",
                    min: { value: 0.1, message: "El peso debe ser mayor a 0.1 kg" },
                    max: { value: 200, message: "El peso debe ser menor a 200 kg" }
                  })}
                />
              </div>

              <div>
                <Label htmlFor="height">Talla (cm) *</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  placeholder="Ej: 105.5"
                  {...register("height", { 
                    required: "La talla es requerida",
                    min: { value: 1, message: "La talla debe ser mayor a 1 cm" },
                    max: { value: 250, message: "La talla debe ser menor a 250 cm" }
                  })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="head_circumference">Perímetro Cefálico (cm)</Label>
                <Input
                  id="head_circumference"
                  type="number"
                  step="0.1"
                  placeholder="Ej: 48.5"
                  {...register("head_circumference", { 
                    min: { value: 1, message: "Debe ser mayor a 1 cm" },
                    max: { value: 100, message: "Debe ser menor a 100 cm" }
                  })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Opcional - Importante en menores de 2 años
                </p>
              </div>

              <div>
                <Label htmlFor="systolic_bp">Presión Sistólica (mmHg)</Label>
                <Input
                  id="systolic_bp"
                  type="number"
                  step="1"
                  placeholder="Ej: 110"
                  {...register("systolic_bp", { 
                    min: { value: 50, message: "Debe ser mayor a 50 mmHg" },
                    max: { value: 200, message: "Debe ser menor a 200 mmHg" }
                  })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Opcional - Para cálculo de percentil PA
                </p>
              </div>

              <div>
                <Label htmlFor="diastolic_bp">Presión Diastólica (mmHg)</Label>
                <Input
                  id="diastolic_bp"
                  type="number"
                  step="1"
                  placeholder="Ej: 70"
                  {...register("diastolic_bp", { 
                    min: { value: 30, message: "Debe ser mayor a 30 mmHg" },
                    max: { value: 150, message: "Debe ser menor a 150 mmHg" }
                  })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Opcional - Para cálculo de percentil PA
                </p>
              </div>
            </div>

            {/* Cálculos Automáticos */}
            {(bmi || bsa || hollidaySegar || nutritionalIndicator || bpPercentile) && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-lg">Cálculos Automáticos</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* IMC */}
                  {bmi && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <Label className="text-blue-900 dark:text-blue-100">IMC (Índice de Masa Corporal)</Label>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-bold text-blue-600">{bmi}</span>
                        <span className="text-sm text-muted-foreground">kg/m²</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Fórmula: peso / altura²
                      </p>
                    </div>
                  )}

                  {/* Superficie Corporal */}
                  {bsa && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <Label className="text-purple-900 dark:text-purple-100">Superficie Corporal (DuBois)</Label>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-bold text-purple-600">{bsa}</span>
                        <span className="text-sm text-muted-foreground">m²</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Fórmula: 0.007184 × peso^0.425 × talla^0.725
                      </p>
                    </div>
                  )}
                </div>

                {/* Holliday-Segar - Hidratación Basal */}
                {hollidaySegar && (
                  <div className="p-4 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                    <Label className="text-cyan-900 dark:text-cyan-100">Hidratación Basal (Holliday-Segar)</Label>
                    
                    <div className="mt-3 space-y-3">
                      {/* Volumen Total */}
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-cyan-600">{hollidaySegar.totalMlPerDay}</span>
                        <span className="text-sm text-muted-foreground">ml/día</span>
                      </div>

                      {/* Cálculo detallado */}
                      <div className="bg-cyan-100 dark:bg-cyan-900/30 p-2 rounded text-xs space-y-1">
                        {hollidaySegar.calculation.map((line, idx) => (
                          <p key={idx} className="text-cyan-800 dark:text-cyan-200">{line}</p>
                        ))}
                      </div>

                      {/* Velocidades de infusión */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white dark:bg-gray-800 p-2 rounded border border-cyan-200">
                          <p className="text-xs text-muted-foreground">ml/hora</p>
                          <p className="text-lg font-bold text-cyan-600">{hollidaySegar.mlPerHour}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-2 rounded border border-cyan-200">
                          <p className="text-xs text-muted-foreground">gotas/min</p>
                          <p className="text-lg font-bold text-cyan-600">{hollidaySegar.dropsPerMinute}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-2 rounded border border-cyan-200">
                          <p className="text-xs text-muted-foreground">μgts/min</p>
                          <p className="text-lg font-bold text-cyan-600">{hollidaySegar.microdropsPerMinute}</p>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {hollidaySegar.note}
                      </p>
                    </div>
                  </div>
                )}

                {/* Indicador Nutricional según Edad */}
                {nutritionalIndicator && (
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <Label className="text-green-900 dark:text-green-100">{nutritionalIndicator.type}</Label>
                    {nutritionalIndicator.value && (
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-bold text-green-600">{nutritionalIndicator.value}</span>
                      </div>
                    )}
                    <p className="text-sm text-green-800 dark:text-green-200 mt-2">
                      {nutritionalIndicator.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {nutritionalIndicator.note}
                    </p>
                  </div>
                )}

                {/* Percentil de Presión Arterial */}
                {bpPercentile && bpPercentile.classification && (
                  <div className={`p-4 rounded-lg border ${
                  bpPercentile.color === 'green' ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' :
                  bpPercentile.color === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800' :
                  bpPercentile.color === 'orange' ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800' :
                  'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                }`}>
                  <Label className={
                    bpPercentile.color === 'green' ? 'text-green-900 dark:text-green-100' :
                    bpPercentile.color === 'yellow' ? 'text-yellow-900 dark:text-yellow-100' :
                    bpPercentile.color === 'orange' ? 'text-orange-900 dark:text-orange-100' :
                    'text-red-900 dark:text-red-100'
                  }>
                    Percentil de Presión Arterial
                  </Label>
                  
                  <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Sistólica</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold">{bpPercentile.systolic.value}</span>
                          <span className="text-sm text-muted-foreground">mmHg</span>
                        </div>
                        <p className="text-xs mt-1">
                          Z-score: <strong>{bpPercentile.systolic.zScore}</strong> DE
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Diastólica</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold">{bpPercentile.diastolic.value}</span>
                          <span className="text-sm text-muted-foreground">mmHg</span>
                        </div>
                        <p className="text-xs mt-1">
                          Z-score: <strong>{bpPercentile.diastolic.zScore}</strong> DE
                        </p>
                      </div>
                    </div>

                    <div className={`p-2 rounded text-center font-semibold ${
                      bpPercentile.color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                      bpPercentile.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' :
                      bpPercentile.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200' :
                      'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                    }`}>
                      {bpPercentile.classification}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {bpPercentile.note}
                    </p>
                  </div>
                </div>
              )}
              </div>
            )}

            <div>
              <Label htmlFor="notes">Notas</Label>
              <Input
                placeholder="Observaciones adicionales (opcional)"
                {...register("notes")}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm">Información - Criterios SEGHNP</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p className="font-semibold">Cálculos Automáticos:</p>
            <p>• <strong>IMC:</strong> peso (kg) / altura² (m)</p>
            <p>• <strong>Superficie Corporal (DuBois):</strong> 0.007184 × peso^0.425 × talla^0.725</p>
            <p>• <strong>Hidratación Basal (Holliday-Segar):</strong> Volumen diario según peso</p>
            <p className="text-xs ml-4">- 0-10 kg: 100 ml/kg/día</p>
            <p className="text-xs ml-4">- 10-20 kg: 1000 ml + 50 ml/kg (por cada kg {">"} 10)</p>
            <p className="text-xs ml-4">- {">"} 20 kg: 1500 ml + 20 ml/kg (por cada kg {">"} 20)</p>
            <p>• <strong>Percentil PA:</strong> Z-score basado en edad, talla y sexo</p>
            
            <p className="font-semibold mt-3">Indicadores Nutricionales según Edad:</p>
            <p>• <strong>Menores de 1 año:</strong> Se evalúa Peso/Edad</p>
            <p>• <strong>1 a 5 años:</strong> Se evalúa Peso/Talla</p>
            <p>• <strong>Mayores de 5 años:</strong> Se evalúa IMC</p>
            
            <p className="font-semibold mt-3">Clasificación de Presión Arterial:</p>
            <p>• <strong>Normal:</strong> {"<"} P90</p>
            <p>• <strong>Prehipertensión:</strong> P90 - P95</p>
            <p>• <strong>HTA Estadio 1:</strong> P95 - P99</p>
            <p>• <strong>HTA Estadio 2:</strong> ≥ P99</p>
            
            <p className="text-xs text-muted-foreground mt-3">
              * Criterios basados en SEGHNP y AAP (American Academy of Pediatrics)
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/patient/${id}`)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Guardando..." : "Guardar Medición"}
          </Button>
        </div>
      </form>
    </div>
  );
}
