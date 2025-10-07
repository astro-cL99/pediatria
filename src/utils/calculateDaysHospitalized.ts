export function calculateDaysHospitalized(admissionDate: string, dischargeDate?: string | null): number {
  const admission = new Date(admissionDate);
  const end = dischargeDate ? new Date(dischargeDate) : new Date();
  
  const diffTime = Math.abs(end.getTime() - admission.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

export function formatDaysHospitalized(days: number): string {
  if (days === 0) return "Hoy";
  if (days === 1) return "1 día";
  return `${days} días`;
}