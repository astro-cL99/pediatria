import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { calculateTAL, calculateWoodDownes, type ScoreResult } from "@/utils/clinicalScoresSOCHIPE";
import { AlertCircle, CheckCircle } from "lucide-react";

interface ScoreSelectorProps {
  scoreType: "TAL" | "Pulmonary";
  onScoreCalculated?: (result: ScoreResult) => void;
}

export function ScoreSelector({ scoreType, onScoreCalculated }: ScoreSelectorProps) {
  const [talParams, setTalParams] = useState({
    age: 24, // default 2 años
    frecuenciaRespiratoria: 0,
    sibilancias: '' as any,
    usoMuscAccesorios: '' as any,
    cianosis: '' as any,
    nivelConciencia: '' as any,
  });

  const [woodParams, setWoodParams] = useState({
    age: 6, // default 6 meses
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
          talParams.cianosis &&
          talParams.nivelConciencia
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

  if (scoreType === "TAL") {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg">Score TAL (Test de Asma Leve)</CardTitle>
          <p className="text-sm text-muted-foreground">Para menores de 3 años con crisis de asma/broncoobstrucción</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Frecuencia Respiratoria */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Frecuencia Respiratoria</Label>
            <RadioGroup
              value={talParams.frecuenciaRespiratoria.toString()}
              onValueChange={(val) => setTalParams({ ...talParams, frecuenciaRespiratoria: parseInt(val) })}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="25" id="fr-0" />
                  <Label htmlFor="fr-0" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">0:</span> {"<30"}
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="38" id="fr-1" />
                  <Label htmlFor="fr-1" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">1:</span> 31-45
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="53" id="fr-2" />
                  <Label htmlFor="fr-2" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">2:</span> 46-60
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="65" id="fr-3" />
                  <Label htmlFor="fr-3" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">3:</span> {">70"}
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Sibilancias */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Sibilancias</Label>
            <RadioGroup
              value={talParams.sibilancias}
              onValueChange={(val) => setTalParams({ ...talParams, sibilancias: val as any })}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="ausentes" id="sib-0" />
                  <Label htmlFor="sib-0" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">0:</span> NO
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="fin_espiracion" id="sib-1" />
                  <Label htmlFor="sib-1" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">1:</span> Fin espir.
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="toda_espiracion" id="sib-2" />
                  <Label htmlFor="sib-2" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">2:</span> Insp+Esp
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="audibles" id="sib-3" />
                  <Label htmlFor="sib-3" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">3:</span> Audibles
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Retracción/Uso de músculos accesorios */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Retracción</Label>
            <RadioGroup
              value={talParams.usoMuscAccesorios}
              onValueChange={(val) => setTalParams({ ...talParams, usoMuscAccesorios: val as any })}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="ausente" id="retr-0" />
                  <Label htmlFor="retr-0" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">0:</span> NO
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="leve" id="retr-1" />
                  <Label htmlFor="retr-1" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">1:</span> Leve (+)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="moderado" id="retr-2" />
                  <Label htmlFor="retr-2" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">2:</span> Subcostal
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="grave" id="retr-3" />
                  <Label htmlFor="retr-3" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">3:</span> Supraclav
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Cianosis */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Cianosis</Label>
            <RadioGroup
              value={talParams.cianosis}
              onValueChange={(val) => setTalParams({ ...talParams, cianosis: val as any })}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="ausente" id="cian-0" />
                  <Label htmlFor="cian-0" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">0:</span> NO
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="perioral_llanto" id="cian-1" />
                  <Label htmlFor="cian-1" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">1:</span> Llanto
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="perioral_reposo" id="cian-2" />
                  <Label htmlFor="cian-2" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">2:</span> Reposo
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="generalizada" id="cian-3" />
                  <Label htmlFor="cian-3" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">3:</span> Generalizada
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Nivel de Conciencia */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Nivel de Conciencia</Label>
            <RadioGroup
              value={talParams.nivelConciencia}
              onValueChange={(val) => setTalParams({ ...talParams, nivelConciencia: val as any })}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="normal" id="conc-0" />
                  <Label htmlFor="conc-0" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">0:</span> Normal
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="hiporeactivo" id="conc-1" />
                  <Label htmlFor="conc-1" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">1:</span> Hiporeact.
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="agitado" id="conc-2" />
                  <Label htmlFor="conc-2" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">2:</span> Agitado
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value="confuso_letargico" id="conc-3" />
                  <Label htmlFor="conc-3" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">3:</span> Confuso
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
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg">Score Pulmonary (Wood-Downes modificado)</CardTitle>
          <p className="text-sm text-muted-foreground">Para evaluar severidad de bronquiolitis</p>
        </CardHeader>
        <CardContent className="space-y-6">
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
