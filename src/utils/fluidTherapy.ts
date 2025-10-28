// FASE 7: Fluidoterapia Avanzada
export interface DehydrationPlan {
  deficit: number;
  maintenance: number;
  total: number;
  plan: 'A' | 'B' | 'C';
  bolus?: number;
}

export interface HollidaySegarCalculation {
  maintenance_ml_day: number;
  maintenance_ml_hour: number;
  formula_breakdown: string;
}

export interface BodySurfaceAreaCalculation {
  bsa_m2: number;
  maintenance_ml_day: number;
  formula: string;
}

export interface FluidTherapyCalculation {
  weight: number;
  holliday_segar: HollidaySegarCalculation;
  body_surface_area: BodySurfaceAreaCalculation;
  dehydration?: DehydrationPlan;
}

/**
 * Calcula la superficie corporal usando la fórmula de Mosteller
 */
export function calculateBSA(weightKg: number, heightCm: number): number {
  return Math.sqrt((weightKg * heightCm) / 3600);
}

/**
 * Calcula los requerimientos hídricos según Holliday-Segar
 */
export function calculateHollidaySegar(weightKg: number): HollidaySegarCalculation {
  let maintenance_ml_day: number;
  let formula_breakdown: string;

  if (weightKg <= 10) {
    maintenance_ml_day = weightKg * 100;
    formula_breakdown = `100ml × ${weightKg}kg = ${maintenance_ml_day}ml/día`;
  } else if (weightKg <= 20) {
    const first10 = 10 * 100;
    const remaining = (weightKg - 10) * 50;
    maintenance_ml_day = first10 + remaining;
    formula_breakdown = `100ml × 10kg + 50ml × ${weightKg - 10}kg = ${maintenance_ml_day}ml/día`;
  } else {
    const first10 = 10 * 100;
    const next10 = 10 * 50;
    const remaining = (weightKg - 20) * 20;
    maintenance_ml_day = first10 + next10 + remaining;
    formula_breakdown = `100ml × 10kg + 50ml × 10kg + 20ml × ${weightKg - 20}kg = ${maintenance_ml_day}ml/día`;
  }

  return {
    maintenance_ml_day,
    maintenance_ml_hour: Math.round(maintenance_ml_day / 24),
    formula_breakdown,
  };
}

/**
 * Calcula requerimientos por superficie corporal (1500-1800 ml/m²/día)
 */
export function calculateBSAMaintenance(
  weightKg: number,
  heightCm: number
): BodySurfaceAreaCalculation {
  const bsa = calculateBSA(weightKg, heightCm);
  const maintenance_ml_day = Math.round(bsa * 1650); // Promedio 1650 ml/m²/día

  return {
    bsa_m2: parseFloat(bsa.toFixed(2)),
    maintenance_ml_day,
    formula: `SC ${bsa.toFixed(2)}m² × 1650ml/m²/día = ${maintenance_ml_day}ml/día`,
  };
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

/**
 * Función principal que calcula toda la fluidoterapia
 */
export function calculateFluidTherapy(
  weightKg: number,
  heightCm?: number,
  dehydrationPercent?: number
): FluidTherapyCalculation {
  const holliday_segar = calculateHollidaySegar(weightKg);

  let body_surface_area: BodySurfaceAreaCalculation;
  if (heightCm && heightCm > 0) {
    body_surface_area = calculateBSAMaintenance(weightKg, heightCm);
  } else {
    // Valores por defecto si no hay talla
    body_surface_area = {
      bsa_m2: 0,
      maintenance_ml_day: 0,
      formula: "Talla requerida para cálculo por SC",
    };
  }

  let dehydration: DehydrationPlan | undefined;
  if (dehydrationPercent && dehydrationPercent > 0) {
    dehydration = calculateDehydration(weightKg, dehydrationPercent);
  }

  return {
    weight: weightKg,
    holliday_segar,
    body_surface_area,
    dehydration,
  };
}

export function calculateBurnFluid(weightKg: number, bsaPercent: number): number {
  return 4 * weightKg * bsaPercent; // Parkland formula
}
