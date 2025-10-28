import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { calculateTAL, calculateWoodDownes, type ScoreResult } from "@/utils/clinicalScoresSOCHIPE";
import { AlertCircle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreSelectorProps {
  scoreType: "TAL" | "Pulmonary";
  onScoreCalculated?: (result: ScoreResult) => void;
  patientAge?: number; // edad en meses
  hasSupplementalOxygen?: boolean;
}

export function ScoreSelector({ 
  scoreType, 
  onScoreCalculated,
  patientAge = 24,
  hasSupplementalOxygen = false 
}: ScoreSelectorProps) {
  const [talParams, setTalParams] = useState({
    age: patientAge,
    frecuenciaRespiratoria: 0,
    sibilancias: '' as any,
    usoMuscAccesorios: '' as any,
    cianosis: '' as any,
  });

  const [usesSupplementalOxygen, setUsesSupplementalOxygen] = useState(hasSupplementalOxygen);

  // Actualizar la edad cuando cambie el prop
  useEffect(() => {
    setTalParams(prev => ({ ...prev, age: patientAge }));
    setWoodParams(prev => ({ ...prev, age: patientAge }));
  }, [patientAge]);

  // Actualizar oxígeno suplementario cuando cambie el prop
  useEffect(() => {
    setUsesSupplementalOxygen(hasSupplementalOxygen);
  }, [hasSupplementalOxygen]);

  // Auto-ajuste de cianosis cuando hay O2 suplementario
  useEffect(() => {
    if (scoreType === "TAL" && usesSupplementalOxygen) {
      setTalParams(prev => ({ ...prev, cianosis: 'generalizada' }));
      setSelectedRows(prev => ({ ...prev, cianosis: 3 }));
    }
  }, [usesSupplementalOxygen, scoreType]);

  // Estado para rastrear qué fila está seleccionada por cada columna
  const [selectedRows, setSelectedRows] = useState({
    frecuenciaRespiratoria: -1, // -1 = no seleccionado, 0-3 = fila seleccionada
    sibilancias: -1,
    cianosis: -1,
    retencion: -1,
  });

  const [woodParams, setWoodParams] = useState({
    age: patientAge,
    cianosis: '' as any,
    tiraje: '' as any,
    sibilancias: '' as any,
    frecuenciaRespiratoria: 0,
    frecuenciaCardiaca: 0,
  });

  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  

  useEffect(() => {
    calculateScore();
  }, [talParams, woodParams, scoreType]);

  const calculateScore = () => {
    try {
      setError(null);
      let calculatedResult: ScoreResult | null = null;

      if (scoreType === "TAL") {
        // Validar que todos los campos estén completos
        if (
          talParams.frecuenciaRespiratoria > 0 &&
          talParams.sibilancias &&
          talParams.usoMuscAccesorios &&
          talParams.cianosis
        ) {
          calculatedResult = calculateTAL(talParams);
        }
      } else if (scoreType === "Pulmonary") {
        // Validar que todos los campos estén completos
        if (
          woodParams.cianosis &&
          woodParams.tiraje &&
          woodParams.sibilancias &&
          woodParams.frecuenciaRespiratoria > 0 &&
          woodParams.frecuenciaCardiaca > 0
        ) {
          calculatedResult = calculateWoodDownes(woodParams);
        }
      }

      setResult(calculatedResult);
      if (calculatedResult && onScoreCalculated) {
        onScoreCalculated(calculatedResult);
      }
    } catch (err: any) {
      setError(err.message);
      setResult(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'leve': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'moderado': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'grave': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'crítico': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  // Función para manejar el clic en una celda de la tabla TAL
  const handleCellClick = (column: string, rowIndex: number, isUnder6Months: boolean) => {
    // Bloquear cianosis si hay oxígeno suplementario
    if (column === 'cianosis' && usesSupplementalOxygen) {
      return;
    }

    setSelectedRows(prev => ({ ...prev, [column]: rowIndex }));
    
    // Actualizar talParams basado en la celda seleccionada
    const newParams = { ...talParams };
    
    // Mapear el rowIndex a los valores correspondientes
    if (column === 'frecuenciaRespiratoria') {
      if (rowIndex === 0) {
        newParams.frecuenciaRespiratoria = isUnder6Months ? 40 : 30;
      } else if (rowIndex === 1) {
        newParams.frecuenciaRespiratoria = isUnder6Months ? 41 : 31;
      } else if (rowIndex === 2) {
        newParams.frecuenciaRespiratoria = isUnder6Months ? 56 : 46;
      } else if (rowIndex === 3) {
        newParams.frecuenciaRespiratoria = isUnder6Months ? 71 : 61;
      }
    } else if (column === 'sibilancias') {
      const values = ['ausentes', 'fin_espiracion', 'toda_espiracion', 'audibles'];
      newParams.sibilancias = values[rowIndex];
    } else if (column === 'cianosis') {
      const values = ['ausente', 'perioral_llanto', 'perioral_reposo', 'generalizada'];
      newParams.cianosis = values[rowIndex];
    } else if (column === 'retencion') {
      const values = ['ausente', 'leve', 'moderado', 'grave'];
      newParams.usoMuscAccesorios = values[rowIndex];
    }
    
    setTalParams(newParams);
  };

  if (scoreType === "TAL") {
    const isUnder6Months = talParams.age < 6;
    
    return (
      <Card className="mt-4 border-2">
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-lg">Score TAL Modificado (menores de 3 años)</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>Edad del paciente: {talParams.age} meses</span>
            {hasSupplementalOxygen && (
              <Badge variant="destructive" className="ml-2">
                ⚠️ Cianosis ajustada por O₂ suplementario
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-1">
          {/* Tabla Score TAL */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-2 text-sm font-semibold">Puntaje</th>
                  <th className="border border-border p-2 text-sm font-semibold">
                    <div>Frecuencia Respiratoria</div>
                    <div className="text-xs font-normal mt-1">
                      <span className="font-medium">&lt;6 meses</span> | <span className="font-medium">≥6 meses</span>
                    </div>
                  </th>
                  <th className="border border-border p-2 text-sm font-semibold">Sibilancias</th>
                  <th className="border border-border p-2 text-sm font-semibold">Cianosis</th>
                  <th className="border border-border p-2 text-sm font-semibold">Retracción</th>
                </tr>
              </thead>
              <tbody>
                {/* Score 0 */}
                <tr>
                  <td className="border border-border p-2 text-center font-bold bg-muted/50">0</td>
                  <td 
                    className={cn(
                      "border border-border p-2 text-center text-sm cursor-pointer hover:bg-accent transition-colors",
                      selectedRows.frecuenciaRespiratoria === 0 && "bg-primary/20 font-semibold"
                    )}
                    onClick={() => handleCellClick('frecuenciaRespiratoria', 0, isUnder6Months)}
                  >
                    {isUnder6Months ? '≤40' : '≤30'}
                  </td>
                  <td 
                    className={cn(
                      "border border-border p-2 text-xs cursor-pointer hover:bg-accent transition-colors",
                      selectedRows.sibilancias === 0 && "bg-primary/20 font-semibold"
                    )}
                    onClick={() => handleCellClick('sibilancias', 0, isUnder6Months)}
                  >
                    NO
                  </td>
                  <td 
                    className={cn(
                      "border border-border p-2 text-xs transition-colors",
                      usesSupplementalOxygen 
                        ? "bg-muted/50 cursor-not-allowed opacity-50" 
                        : "cursor-pointer hover:bg-accent",
                      selectedRows.cianosis === 0 && !usesSupplementalOxygen && "bg-primary/20 font-semibold"
                    )}
                    onClick={() => !usesSupplementalOxygen && handleCellClick('cianosis', 0, isUnder6Months)}
                  >
                    NO
                  </td>
                  <td 
                    className={cn(
                      "border border-border p-2 text-xs cursor-pointer hover:bg-accent transition-colors",
                      selectedRows.retencion === 0 && "bg-primary/20 font-semibold"
                    )}
                    onClick={() => handleCellClick('retencion', 0, isUnder6Months)}
                  >
                    NO
                  </td>
                </tr>
                
                {/* Score 1 */}
                <tr>
                  <td className="border border-border p-2 text-center font-bold bg-muted/50">1</td>
                  <td 
                    className={cn(
                      "border border-border p-2 text-center text-sm cursor-pointer hover:bg-accent transition-colors",
                      selectedRows.frecuenciaRespiratoria === 1 && "bg-primary/20 font-semibold"
                    )}
                    onClick={() => handleCellClick('frecuenciaRespiratoria', 1, isUnder6Months)}
                  >
                    {isUnder6Months ? '41-55' : '31-45'}
                  </td>
                  <td 
                    className={cn(
                      "border border-border p-2 text-xs cursor-pointer hover:bg-accent transition-colors",
                      selectedRows.sibilancias === 1 && "bg-primary/20 font-semibold"
                    )}
                    onClick={() => handleCellClick('sibilancias', 1, isUnder6Months)}
                  >
                    Fin de espir. c/fonendoscopio
                  </td>
                  <td 
                    className={cn(
                      "border border-border p-2 text-xs transition-colors",
                      usesSupplementalOxygen 
                        ? "bg-muted/50 cursor-not-allowed opacity-50" 
                        : "cursor-pointer hover:bg-accent",
                      selectedRows.cianosis === 1 && !usesSupplementalOxygen && "bg-primary/20 font-semibold"
                    )}
                    onClick={() => !usesSupplementalOxygen && handleCellClick('cianosis', 1, isUnder6Months)}
                  >
                    Peri-oral al llorar
                  </td>
                  <td 
                    className={cn(
                      "border border-border p-2 text-xs cursor-pointer hover:bg-accent transition-colors",
                      selectedRows.retencion === 1 && "bg-primary/20 font-semibold"
                    )}
                    onClick={() => handleCellClick('retencion', 1, isUnder6Months)}
                  >
                    Subcostal (+)
                  </td>
                </tr>
                
                {/* Score 2 */}
                <tr>
                  <td className="border border-border p-2 text-center font-bold bg-muted/50">2</td>
                  <td 
                    className={cn(
                      "border border-border p-2 text-center text-sm cursor-pointer hover:bg-accent transition-colors",
                      selectedRows.frecuenciaRespiratoria === 2 && "bg-primary/20 font-semibold"
                    )}
                    onClick={() => handleCellClick('frecuenciaRespiratoria', 2, isUnder6Months)}
                  >
                    {isUnder6Months ? '56-70' : '46-60'}
                  </td>
                  <td 
                    className={cn(
                      "border border-border p-2 text-xs cursor-pointer hover:bg-accent transition-colors",
                      selectedRows.sibilancias === 2 && "bg-primary/20 font-semibold"
                    )}
                    onClick={() => handleCellClick('sibilancias', 2, isUnder6Months)}
                  >
                    Insp. y espir. c/fonendoscopio
                  </td>
                  <td 
                    className={cn(
                      "border border-border p-2 text-xs transition-colors",
                      usesSupplementalOxygen 
                        ? "bg-muted/50 cursor-not-allowed opacity-50" 
                        : "cursor-pointer hover:bg-accent",
                      selectedRows.cianosis === 2 && !usesSupplementalOxygen && "bg-primary/20 font-semibold"
                    )}
                    onClick={() => !usesSupplementalOxygen && handleCellClick('cianosis', 2, isUnder6Months)}
                  >
                    Peri-oral en reposo
                  </td>
                  <td 
                    className={cn(
                      "border border-border p-2 text-xs cursor-pointer hover:bg-accent transition-colors",
                      selectedRows.retencion === 2 && "bg-primary/20 font-semibold"
                    )}
                    onClick={() => handleCellClick('retencion', 2, isUnder6Months)}
                  >
                    Intercostal (++)
                  </td>
                </tr>
                
                {/* Score 3 */}
                <tr>
                  <td className="border border-border p-2 text-center font-bold bg-muted/50">3</td>
                  <td 
                    className={cn(
                      "border border-border p-2 text-center text-sm cursor-pointer hover:bg-accent transition-colors",
                      selectedRows.frecuenciaRespiratoria === 3 && "bg-primary/20 font-semibold"
                    )}
                    onClick={() => handleCellClick('frecuenciaRespiratoria', 3, isUnder6Months)}
                  >
                    {isUnder6Months ? '>70' : '>60'}
                  </td>
                  <td 
                    className={cn(
                      "border border-border p-2 text-xs cursor-pointer hover:bg-accent transition-colors",
                      selectedRows.sibilancias === 3 && "bg-primary/20 font-semibold"
                    )}
                    onClick={() => handleCellClick('sibilancias', 3, isUnder6Months)}
                  >
                    Audibles a distancia
                  </td>
                  <td 
                    className={cn(
                      "border border-border p-2 text-xs transition-colors",
                      usesSupplementalOxygen 
                        ? "bg-destructive/20 cursor-not-allowed font-semibold border-destructive/50" 
                        : "cursor-pointer hover:bg-accent",
                      selectedRows.cianosis === 3 && !usesSupplementalOxygen && "bg-primary/20 font-semibold",
                      selectedRows.cianosis === 3 && usesSupplementalOxygen && "bg-destructive/30"
                    )}
                    onClick={() => !usesSupplementalOxygen && handleCellClick('cianosis', 3, isUnder6Months)}
                  >
                    Generalizada en reposo
                  </td>
                  <td 
                    className={cn(
                      "border border-border p-2 text-xs cursor-pointer hover:bg-accent transition-colors",
                      selectedRows.retencion === 3 && "bg-primary/20 font-semibold"
                    )}
                    onClick={() => handleCellClick('retencion', 3, isUnder6Months)}
                  >
                    Supraclavicular (+++)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Oxígeno Suplementario */}
          <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-start gap-3">
              <span className="text-destructive font-bold text-lg">*</span>
              <div className="flex-1">
                <Label className="text-sm font-semibold mb-2 block">
                  ¿El paciente utiliza oxígeno suplementario?
                </Label>
                <RadioGroup
                  value={usesSupplementalOxygen ? "si" : "no"}
                  onValueChange={(value) => setUsesSupplementalOxygen(value === "si")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="oxygen-no" />
                    <Label htmlFor="oxygen-no" className="cursor-pointer">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="si" id="oxygen-si" />
                    <Label htmlFor="oxygen-si" className="cursor-pointer">Sí</Label>
                  </div>
                </RadioGroup>
                {usesSupplementalOxygen && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    La columna de cianosis se ha bloqueado automáticamente con puntaje máximo (3 puntos)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Resultado */}
          {result && (
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Resultado Score TAL</CardTitle>
                  <Badge className={`text-lg px-4 py-1 ${getSeverityColor(result.severity)}`}>
                    {result.score} puntos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  {result.severity === 'leve' || result.severity === 'moderado' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <p className="font-semibold text-lg">{result.interpretation}</p>
                </div>
                <div>
                  <p className="font-medium mb-2">Recomendaciones:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (scoreType === "Pulmonary") {
    const isUnder6Years = (woodParams.age / 12) < 6;
    
    return (
      <Card className="mt-4 border-2">
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-lg">Pulmonary Score (evaluación clínica de crisis de asma)</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>Edad del paciente: {(woodParams.age / 12).toFixed(1)} años</span>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-1">
          {/* Tabla Score Pulmonary */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-2 text-sm font-semibold">Puntaje</th>
                  <th className="border border-border p-2 text-sm font-semibold">
                    <div>Frecuencia Respiratoria</div>
                    <div className="text-xs font-normal mt-1">
                      <span className="font-medium">&lt;6 años</span> | <span className="font-medium">≥6 años</span>
                    </div>
                  </th>
                  <th className="border border-border p-2 text-sm font-semibold">Frecuencia Cardíaca</th>
                  <th className="border border-border p-2 text-sm font-semibold">Uso músculos accesorios/estertores/sibilancias</th>
                  <th className="border border-border p-2 text-sm font-semibold">Cianosis</th>
                </tr>
              </thead>
              <tbody>
                {/* Score 0 */}
                <tr 
                  className={cn(
                    "transition-colors",
                    woodParams.frecuenciaRespiratoria > 0 && woodParams.frecuenciaRespiratoria <= (isUnder6Years ? 30 : 20) &&
                    woodParams.frecuenciaCardiaca > 0 && woodParams.frecuenciaCardiaca <= 80 &&
                    woodParams.tiraje === 'ausente' &&
                    woodParams.sibilancias === 'ausentes' &&
                    woodParams.cianosis === 'ausente' &&
                    "bg-green-100 dark:bg-green-900/20"
                  )}
                >
                  <td className="border border-border p-2 text-center font-bold">0</td>
                  <td className="border border-border p-2 text-center text-sm">
                    {isUnder6Years ? '≤30' : '≤20'}
                  </td>
                  <td className="border border-border p-2 text-center text-sm">≤80</td>
                  <td className="border border-border p-2 text-xs">No</td>
                  <td className="border border-border p-2 text-xs">No</td>
                </tr>
                
                {/* Score 1 */}
                <tr 
                  className={cn(
                    "transition-colors",
                    ((isUnder6Years && woodParams.frecuenciaRespiratoria >= 31 && woodParams.frecuenciaRespiratoria <= 45) ||
                    (!isUnder6Years && woodParams.frecuenciaRespiratoria >= 21 && woodParams.frecuenciaRespiratoria <= 35)) &&
                    woodParams.frecuenciaCardiaca >= 81 && woodParams.frecuenciaCardiaca <= 100 &&
                    woodParams.tiraje === 'leve' &&
                    woodParams.sibilancias === 'fin_espiracion' &&
                    woodParams.cianosis === 'ausente' &&
                    "bg-yellow-100 dark:bg-yellow-900/20"
                  )}
                >
                  <td className="border border-border p-2 text-center font-bold">1</td>
                  <td className="border border-border p-2 text-center text-sm">
                    {isUnder6Years ? '31-45' : '21-35'}
                  </td>
                  <td className="border border-border p-2 text-center text-sm">81-100</td>
                  <td className="border border-border p-2 text-xs">Fin espiración (estetoscopio)</td>
                  <td className="border border-border p-2 text-xs">No</td>
                </tr>
                
                {/* Score 2 */}
                <tr 
                  className={cn(
                    "transition-colors",
                    ((isUnder6Years && woodParams.frecuenciaRespiratoria >= 46 && woodParams.frecuenciaRespiratoria <= 60) ||
                    (!isUnder6Years && woodParams.frecuenciaRespiratoria >= 36 && woodParams.frecuenciaRespiratoria <= 50)) &&
                    woodParams.frecuenciaCardiaca >= 101 && woodParams.frecuenciaCardiaca <= 120 &&
                    woodParams.tiraje === 'moderado' &&
                    woodParams.sibilancias === 'toda_espiracion' &&
                    woodParams.cianosis === 'aire_ambiente' &&
                    "bg-orange-100 dark:bg-orange-900/20"
                  )}
                >
                  <td className="border border-border p-2 text-center font-bold">2</td>
                  <td className="border border-border p-2 text-center text-sm">
                    {isUnder6Years ? '46-60' : '36-50'}
                  </td>
                  <td className="border border-border p-2 text-center text-sm">101-120</td>
                  <td className="border border-border p-2 text-xs">Toda espiración (estetoscopio)</td>
                  <td className="border border-border p-2 text-xs">Aumentada</td>
                </tr>
                
                {/* Score 3 */}
                <tr 
                  className={cn(
                    "transition-colors",
                    woodParams.frecuenciaRespiratoria > (isUnder6Years ? 60 : 50) &&
                    woodParams.frecuenciaCardiaca > 120 &&
                    woodParams.tiraje === 'grave' &&
                    woodParams.sibilancias === 'audibles' &&
                    woodParams.cianosis === 'fio2_40' &&
                    "bg-red-100 dark:bg-red-900/20"
                  )}
                >
                  <td className="border border-border p-2 text-center font-bold">3</td>
                  <td className="border border-border p-2 text-center text-sm">
                    {isUnder6Years ? '>60' : '>50'}
                  </td>
                  <td className="border border-border p-2 text-center text-sm">&gt;120</td>
                  <td className="border border-border p-2 text-xs">Insp. y espir. sin estetoscopio</td>
                  <td className="border border-border p-2 text-xs">Activa</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Cianosis */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Cianosis</Label>
            <RadioGroup
              value={woodParams.cianosis}
              onValueChange={(val) => setWoodParams({ ...woodParams, cianosis: val as any })}
            >
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="ausente" id="wood-cian-0" />
                  <Label htmlFor="wood-cian-0" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">0:</span> Ausente
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="aire_ambiente" id="wood-cian-2" />
                  <Label htmlFor="wood-cian-2" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">2:</span> Aire amb.
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="fio2_40" id="wood-cian-3" />
                  <Label htmlFor="wood-cian-3" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">3:</span> FiO₂ {"≥"}40%
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Tiraje/Retracción */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Tiraje/Retracción</Label>
            <RadioGroup
              value={woodParams.tiraje}
              onValueChange={(val) => setWoodParams({ ...woodParams, tiraje: val as any })}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="ausente" id="wood-tir-0" />
                  <Label htmlFor="wood-tir-0" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">0:</span> Ausente
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="leve" id="wood-tir-1" />
                  <Label htmlFor="wood-tir-1" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">1:</span> Leve (+)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="moderado" id="wood-tir-2" />
                  <Label htmlFor="wood-tir-2" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">2:</span> Intercost.
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="grave" id="wood-tir-3" />
                  <Label htmlFor="wood-tir-3" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">3:</span> Supraclav.
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Sibilancias */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Sibilancias</Label>
            <RadioGroup
              value={woodParams.sibilancias}
              onValueChange={(val) => setWoodParams({ ...woodParams, sibilancias: val as any })}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="ausentes" id="wood-sib-0" />
                  <Label htmlFor="wood-sib-0" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">0:</span> Ausentes
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="fin_espiracion" id="wood-sib-1" />
                  <Label htmlFor="wood-sib-1" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">1:</span> Fin espir.
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="toda_espiracion" id="wood-sib-2" />
                  <Label htmlFor="wood-sib-2" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">2:</span> Toda espir.
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="insp_y_esp_audibles" id="wood-sib-3" />
                  <Label htmlFor="wood-sib-3" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">3:</span> Insp+Esp
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Frecuencia Respiratoria */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Frecuencia Respiratoria (rpm)</Label>
            <RadioGroup
              value={woodParams.frecuenciaRespiratoria.toString()}
              onValueChange={(val) => setWoodParams({ ...woodParams, frecuenciaRespiratoria: parseInt(val) })}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="35" id="wood-fr-0" />
                  <Label htmlFor="wood-fr-0" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">0:</span> {"<40/<30"}
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="48" id="wood-fr-1" />
                  <Label htmlFor="wood-fr-1" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">1:</span> 41-55/31-45
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="63" id="wood-fr-2" />
                  <Label htmlFor="wood-fr-2" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">2:</span> 56-70/46-60
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="75" id="wood-fr-3" />
                  <Label htmlFor="wood-fr-3" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">3:</span> {">70/>60"}
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Frecuencia Cardíaca */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Frecuencia Cardíaca (lpm)</Label>
            <RadioGroup
              value={woodParams.frecuenciaCardiaca.toString()}
              onValueChange={(val) => setWoodParams({ ...woodParams, frecuenciaCardiaca: parseInt(val) })}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="120" id="wood-fc-0" />
                  <Label htmlFor="wood-fc-0" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">0:</span> Normal
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="165" id="wood-fc-1" />
                  <Label htmlFor="wood-fc-1" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">1:</span> +20 lpm
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="185" id="wood-fc-2" />
                  <Label htmlFor="wood-fc-2" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">2:</span> +40 lpm
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="205" id="wood-fc-3" />
                  <Label htmlFor="wood-fc-3" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">3:</span> {">+40 lpm"}
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Resultado */}
          {result && (
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Resultado Score Pulmonary</CardTitle>
                  <Badge className={`text-lg px-4 py-1 ${getSeverityColor(result.severity)}`}>
                    {result.score} puntos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  {result.severity === 'leve' || result.severity === 'moderado' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <p className="font-semibold text-lg">{result.interpretation}</p>
                </div>
                <div>
                  <p className="font-medium mb-2">Recomendaciones:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}
