import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Activity, 
  Pill, 
  Stethoscope, 
  ClipboardList,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Minus
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AntibioticTracker } from "./AntibioticTracker";
import { 
  calculateDaysHospitalized, 
  getHospitalizationColor,
  calculateScoreDelta,
  type RespiratoryScores,
  type AntibioticTracking 
} from "@/utils/automaticTracking";

interface PatientExpandedViewProps {
  patient: {
    name: string;
    date_of_birth: string;
    allergies: string | null;
  };
  admission: {
    admission_date: string;
    admission_diagnoses: string[];
    oxygen_requirement: any;
    respiratory_score: string | null;
    pending_tasks: string | null;
    antibiotics: any;
    antibiotics_tracking?: AntibioticTracking[];
  };
  bed: {
    room_number: string;
    bed_number: number;
  };
  respiratoryScores?: RespiratoryScores;
}

export function PatientExpandedView({ 
  patient, 
  admission, 
  bed, 
  respiratoryScores 
}: PatientExpandedViewProps) {
  const daysHospitalized = calculateDaysHospitalized(admission.admission_date);
  const age = new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">{patient.name}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{age} años</span>
              <span>•</span>
              <span>Cama {bed.room_number}-{bed.bed_number}</span>
            </div>
          </div>
          <Badge className={`${getHospitalizationColor(daysHospitalized)} text-base px-3 py-1`}>
            🏥 Día {daysHospitalized}
          </Badge>
        </div>
        {patient.allergies && (
          <div className="mt-3 p-2 bg-destructive/10 border border-destructive/30 rounded-md">
            <p className="text-sm font-medium text-destructive">
              ⚠️ Alergias: {patient.allergies}
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="resumen" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="resumen">
              <ClipboardList className="h-4 w-4 mr-2" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="tratamiento">
              <Pill className="h-4 w-4 mr-2" />
              Tratamiento
            </TabsTrigger>
            <TabsTrigger value="scores">
              <Activity className="h-4 w-4 mr-2" />
              Scores
            </TabsTrigger>
            <TabsTrigger value="pendientes">
              <AlertCircle className="h-4 w-4 mr-2" />
              Pendientes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="space-y-4 mt-4">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Diagnósticos de Ingreso
              </h4>
              <ul className="space-y-1">
                {admission.admission_diagnoses?.map((dx, idx) => (
                  <li key={idx} className="text-sm pl-4 border-l-2 border-primary/30">
                    {dx}
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            {admission.oxygen_requirement && (
              <div>
                <h4 className="font-semibold mb-2">🫁 Requerimiento de Oxígeno</h4>
                <div className="bg-secondary/10 p-3 rounded-md text-sm">
                  <p><strong>Tipo:</strong> {admission.oxygen_requirement.type || 'N/A'}</p>
                  {admission.oxygen_requirement.fio2 && (
                    <p><strong>FiO2:</strong> {admission.oxygen_requirement.fio2}%</p>
                  )}
                  {admission.oxygen_requirement.flow && (
                    <p><strong>Flujo:</strong> {admission.oxygen_requirement.flow} L/min</p>
                  )}
                </div>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 inline mr-1" />
              Ingreso: {format(new Date(admission.admission_date), "dd 'de' MMMM, yyyy", { locale: es })}
            </div>
          </TabsContent>

          <TabsContent value="tratamiento" className="mt-4">
            {admission.antibiotics_tracking && admission.antibiotics_tracking.length > 0 ? (
              <AntibioticTracker antibiotics={admission.antibiotics_tracking} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Pill className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Sin antibióticos registrados</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="scores" className="space-y-4 mt-4">
            {respiratoryScores?.pulmonary_score && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">📊 Pulmonary Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScoreDisplay score={respiratoryScores.pulmonary_score} />
                </CardContent>
              </Card>
            )}

            {respiratoryScores?.tal_score && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">📊 Score de Tal Modificado</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScoreDisplay score={respiratoryScores.tal_score} />
                </CardContent>
              </Card>
            )}

            {!respiratoryScores?.pulmonary_score && !respiratoryScores?.tal_score && (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Sin scores respiratorios registrados</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pendientes" className="mt-4">
            {admission.pending_tasks ? (
              <Card className="border-orange-200 bg-orange-50/50">
                <CardContent className="pt-6">
                  <div className="prose prose-sm max-w-none">
                    {admission.pending_tasks.split('\n').map((task, idx) => (
                      <p key={idx} className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span>{task}</span>
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Sin tareas pendientes</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ScoreDisplay({ score }: { score: { at_admission: number; current: number; date_measured: string } }) {
  const { delta, trend, color } = calculateScoreDelta(score);
  
  const TrendIcon = delta < 0 ? TrendingDown : delta > 0 ? TrendingUp : Minus;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Al ingreso</p>
          <p className="text-2xl font-bold">{score.at_admission}</p>
        </div>
        <div className={`flex items-center gap-2 ${color}`}>
          <TrendIcon className="h-6 w-6" />
          <span className="text-xl font-bold">{trend}</span>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Actual</p>
          <p className="text-2xl font-bold">{score.current}</p>
        </div>
      </div>
      
      <div className={`text-center p-2 rounded-md ${delta < 0 ? 'bg-green-50' : delta > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
        <p className={`font-semibold ${color}`}>
          {delta < 0 ? '✅ Mejoría' : delta > 0 ? '⚠️ Empeoramiento' : '→ Sin cambios'} 
          {delta !== 0 && ` (${delta > 0 ? '+' : ''}${delta})`}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Última medición: {format(new Date(score.date_measured), "dd/MM/yyyy")}
        </p>
      </div>
    </div>
  );
}
