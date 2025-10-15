import { differenceInDays, addDays, format } from "date-fns";

export interface AntibioticTracking {
  name: string;
  start_date: string;
  planned_days: number;
  current_day: number;
  end_date: string;
}

export interface RespiratoryScore {
  at_admission: number;
  current: number;
  date_measured: string;
}

export interface RespiratoryScores {
  pulmonary_score?: RespiratoryScore;
  tal_score?: RespiratoryScore;
}

/**
 * Calcula el día actual de antibiótico basado en fecha de inicio
 */
export function calculateCurrentDay(start_date: string): number {
  return differenceInDays(new Date(), new Date(start_date)) + 1;
}

/**
 * Calcula la fecha de fin del antibiótico
 */
export function calculateEndDate(start_date: string, planned_days: number): string {
  return format(addDays(new Date(start_date), planned_days - 1), "yyyy-MM-dd");
}

/**
 * Actualiza el tracking de antibióticos con días actuales
 */
export function updateAntibioticTracking(antibiotics: AntibioticTracking[]): AntibioticTracking[] {
  return antibiotics.map(atb => ({
    ...atb,
    current_day: calculateCurrentDay(atb.start_date)
  }));
}

/**
 * Calcula el progreso del antibiótico (0-100%)
 */
export function getAntibioticProgress(current_day: number, planned_days: number): number {
  return Math.min((current_day / planned_days) * 100, 100);
}

/**
 * Determina el color del antibiótico basado en progreso
 */
export function getAntibioticColor(current_day: number, planned_days: number): string {
  const progress = getAntibioticProgress(current_day, planned_days);
  if (progress < 50) return "bg-green-500";
  if (progress < 80) return "bg-yellow-500";
  return "bg-orange-500";
}

/**
 * Calcula días de hospitalización
 */
export function calculateDaysHospitalized(admission_date: string | Date): number {
  return differenceInDays(new Date(), new Date(admission_date));
}

/**
 * Determina el color de días hospitalizados
 */
export function getHospitalizationColor(days: number): string {
  if (days < 7) return "text-green-600";
  if (days < 14) return "text-yellow-600";
  if (days < 21) return "text-orange-600";
  return "text-red-600";
}

/**
 * Calcula delta de score respiratorio
 */
export function calculateScoreDelta(score: RespiratoryScore): {
  delta: number;
  trend: "↑" | "↓" | "→";
  color: string;
} {
  const delta = score.current - score.at_admission;
  let trend: "↑" | "↓" | "→" = "→";
  let color = "text-gray-500";

  if (delta < 0) {
    trend = "↓";
    color = "text-green-600"; // Mejoría
  } else if (delta > 0) {
    trend = "↑";
    color = "text-red-600"; // Empeoramiento
  }

  return { delta, trend, color };
}

/**
 * Formatea el tracking de antibiótico para visualización
 */
export function formatAntibioticDisplay(atb: AntibioticTracking): string {
  return `D${atb.current_day}/${atb.planned_days}`;
}

/**
 * Verifica si un antibiótico está por terminar (≤2 días)
 */
export function isAntibioticEndingSoon(atb: AntibioticTracking): boolean {
  const daysRemaining = atb.planned_days - atb.current_day;
  return daysRemaining <= 2 && daysRemaining > 0;
}

/**
 * Verifica si un antibiótico ya terminó
 */
export function hasAntibioticEnded(atb: AntibioticTracking): boolean {
  return atb.current_day >= atb.planned_days;
}
