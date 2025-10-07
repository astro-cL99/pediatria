// FASE 10: Indicadores hospitalarios y reportes
export interface HospitalIndicator {
  name: string;
  value: number;
  unit: string;
  target?: number;
  status: 'good' | 'warning' | 'critical';
}

export function calculateAverageLengthOfStay(admissions: any[]): number {
  const discharged = admissions.filter(a => a.discharge_date);
  if (discharged.length === 0) return 0;
  
  const totalDays = discharged.reduce((sum, a) => {
    const days = Math.ceil((new Date(a.discharge_date).getTime() - new Date(a.admission_date).getTime()) / (1000 * 60 * 60 * 24));
    return sum + days;
  }, 0);
  
  return totalDays / discharged.length;
}

export function calculateReadmissionRate(admissions: any[]): number {
  const readmissions = admissions.filter(a => {
    const priorAdmission = admissions.find(prior => 
      prior.patient_id === a.patient_id && 
      prior.discharge_date && 
      new Date(a.admission_date).getTime() - new Date(prior.discharge_date).getTime() < 30 * 24 * 60 * 60 * 1000
    );
    return !!priorAdmission;
  });
  
  return (readmissions.length / admissions.length) * 100;
}
