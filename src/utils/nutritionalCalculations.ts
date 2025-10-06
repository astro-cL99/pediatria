// Cálculos antropométricos y diagnósticos nutricionales según OMS y guías MINSAL/AEP

export interface NutritionalData {
  weight: number;
  height: number;
  age: number; // en meses
  sex: 'M' | 'F';
}

export interface NutritionalResults {
  bmi: number;
  bodySurfaceArea: number;
  weightForAge: {
    zScore: number;
    percentile: number;
    classification: string;
  };
  heightForAge: {
    zScore: number;
    percentile: number;
    classification: string;
  };
  bmiForAge: {
    zScore: number;
    percentile: number;
    classification: string;
  };
  nutritionalDiagnosis: string;
}

// Fórmula de Mosteller para superficie corporal
export function calculateBodySurfaceArea(weight: number, height: number): number {
  return Math.sqrt((weight * height) / 3600);
}

// Cálculo de IMC
export function calculateBMI(weight: number, height: number): number {
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
}

// Conversión de puntaje Z a percentil aproximado
export function zScoreToPercentile(zScore: number): number {
  // Aproximación usando la función de distribución normal estándar
  const t = 1 / (1 + 0.2316419 * Math.abs(zScore));
  const d = 0.3989423 * Math.exp(-zScore * zScore / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  
  if (zScore >= 0) {
    return (1 - p) * 100;
  } else {
    return p * 100;
  }
}

// Clasificación peso/edad según OMS
export function classifyWeightForAge(zScore: number): string {
  if (zScore < -3) return "Desnutrición severa";
  if (zScore < -2) return "Bajo peso";
  if (zScore <= 1) return "Peso normal";
  if (zScore <= 2) return "Riesgo de sobrepeso";
  return "Sobrepeso";
}

// Clasificación talla/edad según OMS
export function classifyHeightForAge(zScore: number): string {
  if (zScore < -3) return "Talla baja severa";
  if (zScore < -2) return "Talla baja";
  if (zScore <= 2) return "Talla normal";
  return "Talla alta";
}

// Clasificación IMC/edad según OMS - CRÍTICO para diagnóstico nutricional
export function classifyBMIForAge(zScore: number): string {
  if (zScore < -3) return "Desnutrición severa";
  if (zScore < -2) return "Desnutrición";
  if (zScore < -1) return "Riesgo de desnutrición";
  if (zScore <= 1) return "Eutrófico";
  if (zScore <= 2) return "Sobrepeso";
  if (zScore <= 3) return "Obesidad";
  return "Obesidad severa";
}

// Aproximación simple de puntaje Z para IMC/edad
// En producción, usar tablas OMS completas
export function estimateBMIZScore(bmi: number, ageMonths: number, sex: 'M' | 'F'): number {
  // Valores aproximados de referencia OMS para 2-5 años
  // En producción, usar las tablas completas de la OMS
  
  const referenceData: { [key: string]: { mean: number, sd: number } } = {
    'M_24': { mean: 16.5, sd: 1.3 },
    'M_36': { mean: 16.0, sd: 1.2 },
    'M_48': { mean: 15.8, sd: 1.3 },
    'M_60': { mean: 15.6, sd: 1.4 },
    'F_24': { mean: 16.3, sd: 1.4 },
    'F_36': { mean: 15.8, sd: 1.3 },
    'F_48': { mean: 15.5, sd: 1.3 },
    'F_60': { mean: 15.4, sd: 1.4 },
  };

  // Encontrar el rango de edad más cercano
  let closestAge = 24;
  if (ageMonths >= 24 && ageMonths < 30) closestAge = 24;
  else if (ageMonths >= 30 && ageMonths < 42) closestAge = 36;
  else if (ageMonths >= 42 && ageMonths < 54) closestAge = 48;
  else if (ageMonths >= 54) closestAge = 60;

  const key = `${sex}_${closestAge}`;
  const reference = referenceData[key] || { mean: 16.0, sd: 1.3 };

  return (bmi - reference.mean) / reference.sd;
}

// Diagnóstico nutricional integral
export function getNutritionalDiagnosis(
  bmiZScore: number,
  heightZScore: number
): string {
  const bmiClass = classifyBMIForAge(bmiZScore);
  const heightClass = classifyHeightForAge(heightZScore);

  // Diagnóstico principal basado en IMC
  if (bmiZScore < -2) {
    if (heightZScore < -2) {
      return `${bmiClass} con talla baja (desnutrición crónica)`;
    }
    return `${bmiClass}`;
  }

  if (bmiZScore >= 2) {
    return bmiClass;
  }

  // Eutrófico
  if (heightZScore < -2) {
    return `Eutrófico con ${heightClass.toLowerCase()}`;
  }

  return "Eutrófico";
}

// Función principal de cálculo
export function calculateNutritionalAssessment(
  data: NutritionalData
): NutritionalResults {
  const bmi = calculateBMI(data.weight, data.height);
  const bodySurfaceArea = calculateBodySurfaceArea(data.weight, data.height);
  
  // Estimación de puntajes Z (en producción usar tablas OMS completas)
  const bmiZScore = estimateBMIZScore(bmi, data.age, data.sex);
  
  // Para peso/edad y talla/edad, usar aproximaciones simples
  // En producción, implementar tablas OMS completas
  const weightZScore = (data.weight / (10 + data.age * 0.3)) - 5; // Aproximación
  const heightZScore = (data.height / (75 + data.age * 0.5)) - 3; // Aproximación

  const results: NutritionalResults = {
    bmi: Math.round(bmi * 10) / 10,
    bodySurfaceArea: Math.round(bodySurfaceArea * 100) / 100,
    weightForAge: {
      zScore: Math.round(weightZScore * 10) / 10,
      percentile: Math.round(zScoreToPercentile(weightZScore) * 10) / 10,
      classification: classifyWeightForAge(weightZScore),
    },
    heightForAge: {
      zScore: Math.round(heightZScore * 10) / 10,
      percentile: Math.round(zScoreToPercentile(heightZScore) * 10) / 10,
      classification: classifyHeightForAge(heightZScore),
    },
    bmiForAge: {
      zScore: Math.round(bmiZScore * 10) / 10,
      percentile: Math.round(zScoreToPercentile(bmiZScore) * 10) / 10,
      classification: classifyBMIForAge(bmiZScore),
    },
    nutritionalDiagnosis: getNutritionalDiagnosis(bmiZScore, heightZScore),
  };

  return results;
}