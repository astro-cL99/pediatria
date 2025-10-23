import { AlertTriangle, AlertCircle, CheckCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LabExam {
  name: string;
  value: string | number;
  unit?: string;
  referenceRange?: string;
  isAbnormal?: boolean;
  isCritical?: boolean;
}

interface CriticalThreshold {
  parameter: string;
  lowCritical?: number;
  highCritical?: number;
  lowAlert?: number;
  highAlert?: number;
  clinicalSignificance: string;
}

// Umbrales críticos pediátricos
const CRITICAL_THRESHOLDS: CriticalThreshold[] = [
  {
    parameter: "hemoglobina",
    lowCritical: 7.0,
    lowAlert: 10.0,
    clinicalSignificance: "Hb <7.0: Considerar transfusión de glóbulos rojos"
  },
  {
    parameter: "plaquetas",
    lowCritical: 10000,
    lowAlert: 50000,
    clinicalSignificance: "PLT <10,000: Alto riesgo de sangrado espontáneo"
  },
  {
    parameter: "leucocitos",
    lowCritical: 1000,
    highCritical: 50000,
    lowAlert: 4000,
    highAlert: 15000,
    clinicalSignificance: "Leucopenia severa o leucocitosis marcada"
  },
  {
    parameter: "glucosa",
    lowCritical: 40,
    highCritical: 500,
    lowAlert: 70,
    highAlert: 200,
    clinicalSignificance: "Hipoglicemia severa o cetoacidosis diabética"
  },
  {
    parameter: "potasio",
    lowCritical: 2.5,
    highCritical: 6.5,
    lowAlert: 3.0,
    highAlert: 5.5,
    clinicalSignificance: "Riesgo de arritmias cardíacas"
  },
  {
    parameter: "sodio",
    lowCritical: 120,
    highCritical: 160,
    lowAlert: 130,
    highAlert: 150,
    clinicalSignificance: "Alteraciones neurológicas graves"
  },
  {
    parameter: "creatinina",
    highCritical: 2.0,
    highAlert: 1.2,
    clinicalSignificance: "Insuficiencia renal aguda"
  },
  {
    parameter: "bilirrubina",
    highCritical: 15.0,
    highAlert: 10.0,
    clinicalSignificance: "Ictericia severa, considerar fototerapia/exanguinotransfusión"
  },
  {
    parameter: "pcr",
    highAlert: 10,
    highCritical: 20,
    clinicalSignificance: "Inflamación/infección severa"
  }
];

interface LabResultsVisualizerProps {
  exams: LabExam[];
  sectionName: string;
}

export const LabResultsVisualizer = ({ exams, sectionName }: LabResultsVisualizerProps) => {
  const evaluateExam = (exam: LabExam) => {
    const numericValue = parseFloat(exam.value.toString().replace(/[^0-9.-]/g, ''));
    if (isNaN(numericValue)) return null;

    const examNameLower = exam.name.toLowerCase();
    const threshold = CRITICAL_THRESHOLDS.find(t => 
      examNameLower.includes(t.parameter)
    );

    if (!threshold) return null;

    let status: "critical" | "alert" | "normal" = "normal";
    let message = "";
    let icon = null;

    if (threshold.lowCritical && numericValue < threshold.lowCritical) {
      status = "critical";
      message = threshold.clinicalSignificance;
      icon = <AlertTriangle className="h-5 w-5" />;
    } else if (threshold.highCritical && numericValue > threshold.highCritical) {
      status = "critical";
      message = threshold.clinicalSignificance;
      icon = <AlertTriangle className="h-5 w-5" />;
    } else if (threshold.lowAlert && numericValue < threshold.lowAlert) {
      status = "alert";
      message = "Valor bajo - Requiere monitoreo";
      icon = <AlertCircle className="h-5 w-5" />;
    } else if (threshold.highAlert && numericValue > threshold.highAlert) {
      status = "alert";
      message = "Valor elevado - Requiere monitoreo";
      icon = <AlertCircle className="h-5 w-5" />;
    } else {
      icon = <CheckCircle className="h-5 w-5" />;
    }

    return { status, message, icon };
  };

  const getTrendIcon = (exam: LabExam) => {
    // Esta función se mejorará cuando tengamos datos históricos
    if (exam.isCritical) return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (exam.isAbnormal) return <AlertCircle className="h-4 w-4 text-orange-500" />;
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  const criticalExams = exams.filter(e => {
    const evaluation = evaluateExam(e);
    return evaluation?.status === "critical";
  });

  const alertExams = exams.filter(e => {
    const evaluation = evaluateExam(e);
    return evaluation?.status === "alert";
  });

  const normalExams = exams.filter(e => {
    const evaluation = evaluateExam(e);
    return !evaluation || evaluation.status === "normal";
  });

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{sectionName}</CardTitle>
          <div className="flex gap-2">
            {criticalExams.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {criticalExams.length} Crítico{criticalExams.length > 1 ? 's' : ''}
              </Badge>
            )}
            {alertExams.length > 0 && (
              <Badge variant="secondary" className="gap-1 bg-orange-100 text-orange-700">
                <AlertCircle className="h-3 w-3" />
                {alertExams.length} Alerta{alertExams.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Valores Críticos */}
        {criticalExams.map((exam, idx) => {
          const evaluation = evaluateExam(exam);
          return (
            <div key={`critical-${idx}`} className="border-l-4 border-red-600 bg-red-50 p-4 rounded-r-lg">
              <div className="flex items-start gap-3">
                <div className="text-red-600 mt-0.5">
                  {evaluation?.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-red-900">{exam.name}</span>
                    <span className="text-2xl font-bold text-red-600">
                      {exam.value} {exam.unit}
                    </span>
                  </div>
                  {exam.referenceRange && (
                    <p className="text-xs text-red-700 mb-2">
                      Rango de referencia: {exam.referenceRange}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-red-800">
                    ⚠️ {evaluation?.message}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {/* Valores en Alerta */}
        {alertExams.map((exam, idx) => {
          const evaluation = evaluateExam(exam);
          return (
            <div key={`alert-${idx}`} className="border-l-4 border-orange-500 bg-orange-50 p-3 rounded-r-lg">
              <div className="flex items-start gap-3">
                <div className="text-orange-600 mt-0.5">
                  {evaluation?.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-orange-900">{exam.name}</span>
                    <span className="text-xl font-bold text-orange-700">
                      {exam.value} {exam.unit}
                    </span>
                  </div>
                  {exam.referenceRange && (
                    <p className="text-xs text-orange-700 mb-1">
                      Rango: {exam.referenceRange}
                    </p>
                  )}
                  <p className="text-sm text-orange-800">
                    {evaluation?.message}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {/* Valores Normales - Vista Compacta */}
        {normalExams.length > 0 && (
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {normalExams.map((exam, idx) => (
                <div key={`normal-${idx}`} className="flex items-center justify-between text-sm">
                  <span className="text-foreground/80">{exam.name}:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-foreground">
                      {exam.value} {exam.unit}
                    </span>
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
