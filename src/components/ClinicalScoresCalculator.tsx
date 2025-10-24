import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  calculateTAL, 
  calculateWoodDownes, 
  type TALParams, 
  type WoodDownesParams,
  type ScoreResult,
  DOSIS_MAXIMAS_PEDIATRICAS
} from '@/utils/clinicalScoresSOCHIPE';
import { Calculator, AlertCircle, CheckCircle2, Info } from 'lucide-react';

export function ClinicalScoresCalculator() {
  const [talParams, setTalParams] = useState<TALParams>({
    age: 24,
    frecuenciaRespiratoria: 40,
    sibilancias: 'ausentes',
    usoMuscAccesorios: 'ausente',
    cianosis: 'ausente',
    nivelConciencia: 'normal'
  });

  const [woodParams, setWoodParams] = useState<WoodDownesParams>({
    age: 6,
    cianosis: 'ausente',
    tiraje: 'ausente',
    sibilancias: 'ausentes',
    frecuenciaRespiratoria: 40,
    frecuenciaCardiaca: 120
  });

  const [talResult, setTalResult] = useState<ScoreResult | null>(null);
  const [woodResult, setWoodResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculateTAL = () => {
    try {
      setError(null);
      const result = calculateTAL(talParams);
      setTalResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al calcular score TAL');
      setTalResult(null);
    }
  };

  const handleCalculateWood = () => {
    try {
      setError(null);
      const result = calculateWoodDownes(woodParams);
      setWoodResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al calcular score Wood-Downes');
      setWoodResult(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'leve': return 'bg-green-100 text-green-800 border-green-300';
      case 'moderado': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'grave': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'crítico': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'leve': return <CheckCircle2 className="h-5 w-5" />;
      case 'moderado': return <Info className="h-5 w-5" />;
      case 'grave': return <AlertCircle className="h-5 w-5" />;
      case 'crítico': return <AlertCircle className="h-5 w-5" />;
      default: return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Scores Clínicos Pediátricos SOCHIPE
        </CardTitle>
        <CardDescription>
          Calculadora de scores respiratorios basados en directrices de la Sociedad Chilena de Neumología Pediátrica
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="tal" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tal">Score TAL</TabsTrigger>
            <TabsTrigger value="wood">Wood-Downes</TabsTrigger>
            <TabsTrigger value="dosis">Dosis Máximas</TabsTrigger>
          </TabsList>

          {/* TAL Score */}
          <TabsContent value="tal" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Edad (meses)</Label>
                  <Input
                    type="number"
                    value={talParams.age}
                    onChange={(e) => setTalParams({ ...talParams, age: Number(e.target.value) })}
                    max={35}
                  />
                  <p className="text-xs text-muted-foreground">Máx 35 meses (menor a 3 años)</p>
                </div>
                <div className="space-y-2">
                  <Label>Frecuencia Respiratoria</Label>
                  <Input
                    type="number"
                    value={talParams.frecuenciaRespiratoria}
                    onChange={(e) => setTalParams({ ...talParams, frecuenciaRespiratoria: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sibilancias</Label>
                <Select
                  value={talParams.sibilancias}
                  onValueChange={(value: any) => setTalParams({ ...talParams, sibilancias: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ausentes">Ausentes</SelectItem>
                    <SelectItem value="fin_espiracion">Fin de espiración</SelectItem>
                    <SelectItem value="toda_espiracion">Toda la espiración</SelectItem>
                    <SelectItem value="insp_y_esp">Inspiración y espiración</SelectItem>
                    <SelectItem value="audibles">Audibles sin estetoscopio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Uso de músculos accesorios</Label>
                <Select
                  value={talParams.usoMuscAccesorios}
                  onValueChange={(value: any) => setTalParams({ ...talParams, usoMuscAccesorios: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ausente">Ausente</SelectItem>
                    <SelectItem value="leve">Leve</SelectItem>
                    <SelectItem value="moderado">Moderado</SelectItem>
                    <SelectItem value="grave">Grave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cianosis</Label>
                <Select
                  value={talParams.cianosis}
                  onValueChange={(value: any) => setTalParams({ ...talParams, cianosis: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ausente">Ausente</SelectItem>
                    <SelectItem value="perioral_llanto">Perioral al llanto</SelectItem>
                    <SelectItem value="perioral_reposo">Perioral en reposo</SelectItem>
                    <SelectItem value="generalizada">Generalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nivel de conciencia</Label>
                <Select
                  value={talParams.nivelConciencia}
                  onValueChange={(value: any) => setTalParams({ ...talParams, nivelConciencia: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="hiporeactivo">Hiporeactivo</SelectItem>
                    <SelectItem value="agitado">Agitado</SelectItem>
                    <SelectItem value="confuso_letargico">Confuso/Letárgico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleCalculateTAL} className="w-full">
                Calcular Score TAL
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {talResult && (
                <Card className={`border-2 ${getSeverityColor(talResult.severity)}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getSeverityIcon(talResult.severity)}
                      Score TAL: {talResult.score} puntos
                    </CardTitle>
                    <CardDescription>{talResult.interpretation}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Badge className={getSeverityColor(talResult.severity)}>
                        {talResult.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">Recomendaciones:</p>
                      <ul className="space-y-1">
                        {talResult.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm flex gap-2">
                            <span>•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Wood-Downes Score */}
          <TabsContent value="wood" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Edad (meses)</Label>
                  <Input
                    type="number"
                    value={woodParams.age}
                    onChange={(e) => setWoodParams({ ...woodParams, age: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frecuencia Respiratoria</Label>
                  <Input
                    type="number"
                    value={woodParams.frecuenciaRespiratoria}
                    onChange={(e) => setWoodParams({ ...woodParams, frecuenciaRespiratoria: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Frecuencia Cardíaca</Label>
                <Input
                  type="number"
                  value={woodParams.frecuenciaCardiaca}
                  onChange={(e) => setWoodParams({ ...woodParams, frecuenciaCardiaca: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Cianosis</Label>
                <Select
                  value={woodParams.cianosis}
                  onValueChange={(value: any) => setWoodParams({ ...woodParams, cianosis: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ausente">Ausente</SelectItem>
                    <SelectItem value="aire_ambiente">Con aire ambiente</SelectItem>
                    <SelectItem value="fio2_40">Con FiO2 40%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tiraje/Retracción</Label>
                <Select
                  value={woodParams.tiraje}
                  onValueChange={(value: any) => setWoodParams({ ...woodParams, tiraje: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ausente">Ausente</SelectItem>
                    <SelectItem value="leve">Leve</SelectItem>
                    <SelectItem value="moderado">Moderado</SelectItem>
                    <SelectItem value="grave">Grave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sibilancias</Label>
                <Select
                  value={woodParams.sibilancias}
                  onValueChange={(value: any) => setWoodParams({ ...woodParams, sibilancias: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ausentes">Ausentes</SelectItem>
                    <SelectItem value="fin_espiracion">Fin de espiración</SelectItem>
                    <SelectItem value="toda_espiracion">Toda la espiración</SelectItem>
                    <SelectItem value="insp_y_esp_audibles">Insp y esp audibles</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleCalculateWood} className="w-full">
                Calcular Score Wood-Downes
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {woodResult && (
                <Card className={`border-2 ${getSeverityColor(woodResult.severity)}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getSeverityIcon(woodResult.severity)}
                      Score Wood-Downes: {woodResult.score} puntos
                    </CardTitle>
                    <CardDescription>{woodResult.interpretation}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Badge className={getSeverityColor(woodResult.severity)}>
                        {woodResult.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">Recomendaciones:</p>
                      <ul className="space-y-1">
                        {woodResult.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm flex gap-2">
                            <span>•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Dosis Máximas */}
          <TabsContent value="dosis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dosis Máximas Pediátricas</CardTitle>
                <CardDescription>Basado en directrices SOCHIPE</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Broncodilatadores</h3>
                  <div className="space-y-1 text-sm">
                    <p>• <strong>Salbutamol nebulizado:</strong> {DOSIS_MAXIMAS_PEDIATRICAS.salbutamol.nebulizado}</p>
                    <p>• <strong>Ipratropio nebulizado:</strong> {DOSIS_MAXIMAS_PEDIATRICAS.ipratropio.nebulizado}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Corticoides Sistémicos</h3>
                  <div className="space-y-1 text-sm">
                    <p>• <strong>Prednisona:</strong> {DOSIS_MAXIMAS_PEDIATRICAS.prednisona}</p>
                    <p>• <strong>Metilprednisolona:</strong> {DOSIS_MAXIMAS_PEDIATRICAS.metilprednisolona}</p>
                    <p>• <strong>Hidrocortisona:</strong> {DOSIS_MAXIMAS_PEDIATRICAS.hidrocortisona}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Crisis Asmática</h3>
                  <div className="space-y-1 text-sm">
                    <p>• <strong>Sulfato de Magnesio IV:</strong> {DOSIS_MAXIMAS_PEDIATRICAS.sulfato_magnesio}</p>
                    <p>• <strong>Adrenalina nebulizada:</strong> {DOSIS_MAXIMAS_PEDIATRICAS.adrenalina_nebulizada}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Montelukast (según edad)</h3>
                  <div className="space-y-1 text-sm">
                    <p>• <strong>6 meses - 5 años:</strong> {DOSIS_MAXIMAS_PEDIATRICAS.montelukast['6m-5años']}</p>
                    <p>• <strong>6-14 años:</strong> {DOSIS_MAXIMAS_PEDIATRICAS.montelukast['6-14años']}</p>
                    <p>• <strong>Mayor de 15 años:</strong> {DOSIS_MAXIMAS_PEDIATRICAS.montelukast['>15años']}</p>
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Estas dosis son orientativas. Siempre ajustar según peso, edad y condición clínica del paciente.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
