import { differenceInDays, differenceInMonths, differenceInYears } from "date-fns";

/**
 * Calcula la edad en formato pediátrico según la fecha de nacimiento
 * - 0-28 días: retorna días
 * - 29 días - 24 meses: retorna meses
 * - >24 meses: retorna años y meses
 */
export function calculatePediatricAge(dateOfBirth: string | Date): string {
  const birthDate = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();
  
  const totalDays = differenceInDays(today, birthDate);
  
  // 0-28 días: usar días
  if (totalDays <= 28) {
    return totalDays === 0 ? "Recién nacido" : `${totalDays} ${totalDays === 1 ? 'día' : 'días'}`;
  }
  
  const totalMonths = differenceInMonths(today, birthDate);
  
  // 29 días - 24 meses: usar meses
  if (totalMonths <= 24) {
    return `${totalMonths} ${totalMonths === 1 ? 'mes' : 'meses'}`;
  }
  
  // >24 meses: usar años y meses
  const years = differenceInYears(today, birthDate);
  const monthsRemainder = totalMonths - (years * 12);
  
  if (monthsRemainder === 0) {
    return `${years} ${years === 1 ? 'año' : 'años'}`;
  }
  
  return `${years} ${years === 1 ? 'año' : 'años'} y ${monthsRemainder} ${monthsRemainder === 1 ? 'mes' : 'meses'}`;
}

/**
 * Calcula la edad en formato corto (solo número) para gráficos o espacios reducidos
 */
export function calculatePediatricAgeShort(dateOfBirth: string | Date): string {
  const birthDate = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();
  
  const totalDays = differenceInDays(today, birthDate);
  
  if (totalDays <= 28) {
    return totalDays === 0 ? "RN" : `${totalDays}d`;
  }
  
  const totalMonths = differenceInMonths(today, birthDate);
  
  if (totalMonths <= 24) {
    return `${totalMonths}m`;
  }
  
  const years = differenceInYears(today, birthDate);
  const monthsRemainder = totalMonths - (years * 12);
  
  if (monthsRemainder === 0) {
    return `${years}a`;
  }
  
  return `${years}a ${monthsRemainder}m`;
}
