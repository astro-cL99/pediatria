// FASE 7: Fluidoterapia Avanzada
export interface DehydrationPlan {
  deficit: number;
  maintenance: number;
  total: number;
  plan: 'A' | 'B' | 'C';
  bolus?: number;
}

export function calculateDehydration(weightKg: number, dehydrationPercent: number): DehydrationPlan {
  const deficit = weightKg * 1000 * (dehydrationPercent / 100);
  const maintenance = weightKg <= 10 ? weightKg * 100 : weightKg <= 20 ? 1000 + (weightKg - 10) * 50 : 1500 + (weightKg - 20) * 20;
  
  let plan: 'A' | 'B' | 'C' = 'A';
  let bolus = 0;
  
  if (dehydrationPercent < 5) plan = 'A';
  else if (dehydrationPercent < 10) plan = 'B';
  else { plan = 'C'; bolus = weightKg * 20; }
  
  return { deficit, maintenance, total: deficit + maintenance, plan, bolus };
}

export function calculateBurnFluid(weightKg: number, bsaPercent: number): number {
  return 4 * weightKg * bsaPercent; // Parkland formula
}
