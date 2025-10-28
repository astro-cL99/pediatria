// WHO Growth Tables - Complete Reference Data
// Based on WHO Child Growth Standards (2006) and Growth Reference (2007)

export interface WHOZScore {
  ageMonths: number;
  SD3neg: number;
  SD2neg: number;
  SD1neg: number;
  SD0: number;
  SD1: number;
  SD2: number;
  SD3: number;
}

// Weight-for-Age Tables (0-120 months / 0-10 years)
export const weightForAgeBoys: WHOZScore[] = [
  { ageMonths: 0, SD3neg: 2.1, SD2neg: 2.5, SD1neg: 2.9, SD0: 3.3, SD1: 3.9, SD2: 4.4, SD3: 5.0 },
  { ageMonths: 1, SD3neg: 2.9, SD2neg: 3.4, SD1neg: 3.9, SD0: 4.5, SD1: 5.1, SD2: 5.8, SD3: 6.6 },
  { ageMonths: 2, SD3neg: 3.8, SD2neg: 4.3, SD1neg: 4.9, SD0: 5.6, SD1: 6.3, SD2: 7.1, SD3: 8.0 },
  { ageMonths: 3, SD3neg: 4.4, SD2neg: 5.0, SD1neg: 5.7, SD0: 6.4, SD1: 7.2, SD2: 8.0, SD3: 9.0 },
  { ageMonths: 6, SD3neg: 5.7, SD2neg: 6.4, SD1neg: 7.3, SD0: 7.9, SD1: 8.8, SD2: 9.8, SD3: 10.9 },
  { ageMonths: 12, SD3neg: 7.0, SD2neg: 7.7, SD1neg: 8.6, SD0: 9.6, SD1: 10.8, SD2: 12.0, SD3: 13.3 },
  { ageMonths: 24, SD3neg: 8.6, SD2neg: 9.7, SD1neg: 10.8, SD0: 12.2, SD1: 13.6, SD2: 15.3, SD3: 17.1 },
  { ageMonths: 36, SD3neg: 9.9, SD2neg: 11.1, SD1neg: 12.5, SD0: 14.0, SD1: 15.7, SD2: 17.8, SD3: 20.0 },
  { ageMonths: 48, SD3neg: 10.9, SD2neg: 12.3, SD1neg: 13.9, SD0: 15.7, SD1: 17.8, SD2: 20.3, SD3: 23.3 },
  { ageMonths: 60, SD3neg: 11.8, SD2neg: 13.4, SD1neg: 15.3, SD0: 17.4, SD1: 19.9, SD2: 22.9, SD3: 26.7 },
  { ageMonths: 120, SD3neg: 18.3, SD2neg: 21.1, SD1neg: 24.8, SD0: 29.4, SD1: 35.6, SD2: 44.2, SD3: 56.5 },
];

export const weightForAgeGirls: WHOZScore[] = [
  { ageMonths: 0, SD3neg: 2.0, SD2neg: 2.4, SD1neg: 2.8, SD0: 3.2, SD1: 3.7, SD2: 4.2, SD3: 4.8 },
  { ageMonths: 1, SD3neg: 2.7, SD2neg: 3.2, SD1neg: 3.6, SD0: 4.2, SD1: 4.8, SD2: 5.5, SD3: 6.2 },
  { ageMonths: 2, SD3neg: 3.4, SD2neg: 3.9, SD1neg: 4.5, SD0: 5.1, SD1: 5.8, SD2: 6.6, SD3: 7.5 },
  { ageMonths: 3, SD3neg: 4.0, SD2neg: 4.5, SD1neg: 5.2, SD0: 5.8, SD1: 6.6, SD2: 7.5, SD3: 8.5 },
  { ageMonths: 6, SD3neg: 5.1, SD2neg: 5.7, SD1neg: 6.5, SD0: 7.3, SD1: 8.2, SD2: 9.3, SD3: 10.6 },
  { ageMonths: 12, SD3neg: 6.4, SD2neg: 7.0, SD1neg: 7.8, SD0: 8.9, SD1: 10.1, SD2: 11.5, SD3: 13.1 },
  { ageMonths: 24, SD3neg: 7.8, SD2neg: 8.7, SD1neg: 9.8, SD0: 11.2, SD1: 12.8, SD2: 14.8, SD3: 17.0 },
  { ageMonths: 36, SD3neg: 9.0, SD2neg: 10.1, SD1neg: 11.5, SD0: 13.1, SD1: 15.0, SD2: 17.3, SD3: 20.0 },
  { ageMonths: 48, SD3neg: 10.1, SD2neg: 11.5, SD1neg: 13.1, SD0: 15.0, SD1: 17.2, SD2: 20.0, SD3: 23.5 },
  { ageMonths: 60, SD3neg: 11.1, SD2neg: 12.7, SD1neg: 14.6, SD0: 16.8, SD1: 19.5, SD2: 22.9, SD3: 27.1 },
  { ageMonths: 120, SD3neg: 17.9, SD2neg: 20.8, SD1neg: 24.9, SD0: 30.5, SD1: 38.5, SD2: 50.8, SD3: 71.1 },
];

// Height-for-Age Tables (0-228 months / 0-19 years)
export const heightForAgeBoys: WHOZScore[] = [
  { ageMonths: 0, SD3neg: 44.2, SD2neg: 46.1, SD1neg: 48.0, SD0: 49.9, SD1: 51.8, SD2: 53.7, SD3: 55.6 },
  { ageMonths: 3, SD3neg: 55.3, SD2neg: 57.3, SD1neg: 59.4, SD0: 61.4, SD1: 63.5, SD2: 65.5, SD3: 67.6 },
  { ageMonths: 6, SD3neg: 61.2, SD2neg: 63.3, SD1neg: 65.5, SD0: 67.6, SD1: 69.8, SD2: 71.9, SD3: 74.0 },
  { ageMonths: 12, SD3neg: 69.6, SD2neg: 71.9, SD1neg: 74.2, SD0: 76.1, SD1: 78.7, SD2: 81.0, SD3: 83.6 },
  { ageMonths: 24, SD3neg: 78.0, SD2neg: 81.0, SD1neg: 84.1, SD0: 87.1, SD1: 90.2, SD2: 93.2, SD3: 96.3 },
  { ageMonths: 36, SD3neg: 85.3, SD2neg: 88.7, SD1neg: 92.1, SD0: 95.5, SD1: 98.9, SD2: 102.3, SD3: 105.7 },
  { ageMonths: 60, SD3neg: 98.7, SD2neg: 102.7, SD1neg: 106.7, SD0: 110.7, SD1: 114.7, SD2: 118.7, SD3: 122.8 },
  { ageMonths: 120, SD3neg: 128.0, SD2neg: 133.5, SD1neg: 139.0, SD0: 144.6, SD1: 150.3, SD2: 156.0, SD3: 161.8 },
  { ageMonths: 180, SD3neg: 157.5, SD2neg: 163.3, SD1neg: 169.0, SD0: 174.8, SD1: 180.7, SD2: 186.6, SD3: 192.5 },
  { ageMonths: 228, SD3neg: 164.7, SD2neg: 170.3, SD1neg: 175.8, SD0: 181.4, SD1: 187.0, SD2: 192.6, SD3: 198.2 },
];

export const heightForAgeGirls: WHOZScore[] = [
  { ageMonths: 0, SD3neg: 43.6, SD2neg: 45.4, SD1neg: 47.3, SD0: 49.1, SD1: 51.0, SD2: 52.9, SD3: 54.7 },
  { ageMonths: 3, SD3neg: 53.5, SD2neg: 55.6, SD1neg: 57.7, SD0: 59.8, SD1: 61.9, SD2: 64.0, SD3: 66.1 },
  { ageMonths: 6, SD3neg: 59.8, SD2neg: 61.9, SD1neg: 64.0, SD0: 66.1, SD1: 68.2, SD2: 70.3, SD3: 72.5 },
  { ageMonths: 12, SD3neg: 68.0, SD2neg: 70.3, SD1neg: 72.6, SD0: 74.9, SD1: 77.3, SD2: 79.6, SD3: 81.9 },
  { ageMonths: 24, SD3neg: 76.7, SD2neg: 79.9, SD1neg: 83.0, SD0: 86.2, SD1: 89.3, SD2: 92.5, SD3: 95.7 },
  { ageMonths: 36, SD3neg: 84.1, SD2neg: 87.6, SD1neg: 91.2, SD0: 94.8, SD1: 98.4, SD2: 101.9, SD3: 105.5 },
  { ageMonths: 60, SD3neg: 97.4, SD2neg: 101.5, SD1neg: 105.6, SD0: 109.7, SD1: 113.8, SD2: 117.9, SD3: 122.1 },
  { ageMonths: 120, SD3neg: 127.5, SD2neg: 133.4, SD1neg: 139.3, SD0: 145.2, SD1: 151.2, SD2: 157.2, SD3: 163.2 },
  { ageMonths: 180, SD3neg: 149.9, SD2neg: 155.2, SD1neg: 160.4, SD0: 165.6, SD1: 170.9, SD2: 176.2, SD3: 181.4 },
  { ageMonths: 228, SD3neg: 151.8, SD2neg: 156.7, SD1neg: 161.7, SD0: 166.7, SD1: 171.7, SD2: 176.7, SD3: 181.7 },
];

// BMI-for-Age Tables (0-228 months / 0-19 years)
export const bmiForAgeBoys: WHOZScore[] = [
  { ageMonths: 0, SD3neg: 10.2, SD2neg: 11.1, SD1neg: 12.2, SD0: 13.4, SD1: 14.8, SD2: 16.3, SD3: 18.1 },
  { ageMonths: 3, SD3neg: 12.5, SD2neg: 13.5, SD1neg: 14.6, SD0: 15.8, SD1: 17.2, SD2: 18.8, SD3: 20.6 },
  { ageMonths: 12, SD3neg: 14.2, SD2neg: 15.3, SD1neg: 16.5, SD0: 17.8, SD1: 19.4, SD2: 21.2, SD3: 23.4 },
  { ageMonths: 24, SD3neg: 13.6, SD2neg: 14.6, SD1neg: 15.7, SD0: 16.9, SD1: 18.3, SD2: 19.9, SD3: 21.9 },
  { ageMonths: 60, SD3neg: 12.7, SD2neg: 13.6, SD1neg: 14.5, SD0: 15.5, SD1: 16.7, SD2: 18.0, SD3: 19.6 },
  { ageMonths: 120, SD3neg: 13.2, SD2neg: 14.2, SD1neg: 15.4, SD0: 16.7, SD1: 18.4, SD2: 20.6, SD3: 23.4 },
  { ageMonths: 180, SD3neg: 15.6, SD2neg: 17.0, SD1neg: 18.6, SD0: 20.5, SD1: 22.8, SD2: 25.7, SD3: 29.4 },
  { ageMonths: 228, SD3neg: 16.5, SD2neg: 18.0, SD1neg: 19.8, SD0: 21.9, SD1: 24.5, SD2: 27.6, SD3: 31.7 },
];

export const bmiForAgeGirls: WHOZScore[] = [
  { ageMonths: 0, SD3neg: 9.8, SD2neg: 10.8, SD1neg: 11.9, SD0: 13.1, SD1: 14.6, SD2: 16.1, SD3: 18.1 },
  { ageMonths: 3, SD3neg: 11.8, SD2neg: 12.9, SD1neg: 14.1, SD0: 15.4, SD1: 16.8, SD2: 18.5, SD3: 20.5 },
  { ageMonths: 12, SD3neg: 13.6, SD2neg: 14.8, SD1neg: 16.0, SD0: 17.4, SD1: 19.0, SD2: 20.8, SD3: 23.1 },
  { ageMonths: 24, SD3neg: 13.1, SD2neg: 14.2, SD1neg: 15.3, SD0: 16.5, SD1: 17.9, SD2: 19.6, SD3: 21.6 },
  { ageMonths: 60, SD3neg: 12.4, SD2neg: 13.3, SD1neg: 14.2, SD0: 15.2, SD1: 16.4, SD2: 17.8, SD3: 19.4 },
  { ageMonths: 120, SD3neg: 13.0, SD2neg: 14.0, SD1neg: 15.2, SD0: 16.5, SD1: 18.2, SD2: 20.4, SD3: 23.3 },
  { ageMonths: 180, SD3neg: 15.3, SD2neg: 16.7, SD1neg: 18.3, SD0: 20.3, SD1: 22.8, SD2: 25.9, SD3: 30.3 },
  { ageMonths: 228, SD3neg: 15.7, SD2neg: 17.1, SD1neg: 18.9, SD0: 21.0, SD1: 23.7, SD2: 27.1, SD3: 31.9 },
];

// Head Circumference-for-Age (0-60 months / 0-5 years)
export const headCircumferenceBoys: WHOZScore[] = [
  { ageMonths: 0, SD3neg: 30.7, SD2neg: 31.9, SD1neg: 33.2, SD0: 34.5, SD1: 35.7, SD2: 37.0, SD3: 38.3 },
  { ageMonths: 3, SD3neg: 37.0, SD2neg: 38.1, SD1neg: 39.1, SD0: 40.5, SD1: 41.6, SD2: 42.6, SD3: 43.6 },
  { ageMonths: 6, SD3neg: 40.3, SD2neg: 41.5, SD1neg: 42.6, SD0: 43.9, SD1: 45.0, SD2: 46.0, SD3: 47.4 },
  { ageMonths: 12, SD3neg: 43.3, SD2neg: 44.4, SD1neg: 45.6, SD0: 46.6, SD1: 47.8, SD2: 48.9, SD3: 50.0 },
  { ageMonths: 24, SD3neg: 45.3, SD2neg: 46.4, SD1neg: 47.5, SD0: 48.7, SD1: 49.8, SD2: 51.0, SD3: 52.1 },
  { ageMonths: 36, SD3neg: 46.3, SD2neg: 47.4, SD1neg: 48.6, SD0: 49.7, SD1: 50.8, SD2: 52.0, SD3: 53.1 },
  { ageMonths: 60, SD3neg: 47.6, SD2neg: 48.7, SD1neg: 49.9, SD0: 51.1, SD1: 52.2, SD2: 53.4, SD3: 54.5 },
];

export const headCircumferenceGirls: WHOZScore[] = [
  { ageMonths: 0, SD3neg: 30.3, SD2neg: 31.5, SD1neg: 32.7, SD0: 33.9, SD1: 35.1, SD2: 36.2, SD3: 37.4 },
  { ageMonths: 3, SD3neg: 36.1, SD2neg: 37.2, SD1neg: 38.3, SD0: 39.5, SD1: 40.6, SD2: 41.7, SD3: 42.8 },
  { ageMonths: 6, SD3neg: 39.2, SD2neg: 40.3, SD1neg: 41.5, SD0: 42.6, SD1: 43.7, SD2: 44.8, SD3: 46.0 },
  { ageMonths: 12, SD3neg: 42.0, SD2neg: 43.1, SD1neg: 44.2, SD0: 45.4, SD1: 46.5, SD2: 47.6, SD3: 48.7 },
  { ageMonths: 24, SD3neg: 44.1, SD2neg: 45.3, SD1neg: 46.4, SD0: 47.5, SD1: 48.7, SD2: 49.8, SD3: 50.9 },
  { ageMonths: 36, SD3neg: 45.2, SD2neg: 46.3, SD1neg: 47.4, SD0: 48.6, SD1: 49.7, SD2: 50.8, SD3: 52.0 },
  { ageMonths: 60, SD3neg: 46.4, SD2neg: 47.5, SD1neg: 48.7, SD0: 49.8, SD1: 51.0, SD2: 52.1, SD3: 53.3 },
];

// Calculate Z-score from measurement
export function calculateZScore(
  measurement: number,
  ageMonths: number,
  sex: 'M' | 'F',
  indicator: 'weight' | 'height' | 'bmi' | 'head'
): number {
  let table: WHOZScore[];
  
  switch (indicator) {
    case 'weight':
      table = sex === 'M' ? weightForAgeBoys : weightForAgeGirls;
      break;
    case 'height':
      table = sex === 'M' ? heightForAgeBoys : heightForAgeGirls;
      break;
    case 'bmi':
      table = sex === 'M' ? bmiForAgeBoys : bmiForAgeGirls;
      break;
    case 'head':
      table = sex === 'M' ? headCircumferenceBoys : headCircumferenceGirls;
      break;
  }

  // Find closest age or interpolate
  const closest = table.reduce((prev, curr) => 
    Math.abs(curr.ageMonths - ageMonths) < Math.abs(prev.ageMonths - ageMonths) ? curr : prev
  );

  // Simple Z-score approximation
  if (measurement < closest.SD0) {
    if (measurement < closest.SD2neg) {
      return measurement < closest.SD3neg ? -3.5 : -2.5;
    }
    return measurement < closest.SD1neg ? -1.5 : -0.5;
  } else {
    if (measurement > closest.SD2) {
      return measurement > closest.SD3 ? 3.5 : 2.5;
    }
    return measurement > closest.SD1 ? 1.5 : 0.5;
  }
}

// Classify nutritional status based on BMI Z-score (MINSAL/WHO)
export function classifyNutritionalStatus(bmiZScore: number, heightZScore: number): string {
  let bmiClass = "";
  let heightClass = "";

  // BMI classification
  if (bmiZScore < -3) bmiClass = "Desnutrición severa";
  else if (bmiZScore < -2) bmiClass = "Desnutrición moderada";
  else if (bmiZScore < -1) bmiClass = "Riesgo de desnutrición";
  else if (bmiZScore <= 1) bmiClass = "Eutrófico";
  else if (bmiZScore <= 2) bmiClass = "Sobrepeso";
  else if (bmiZScore <= 3) bmiClass = "Obesidad";
  else bmiClass = "Obesidad severa";

  // Height classification
  if (heightZScore < -2) heightClass = " con talla baja";
  else if (heightZScore < -1) heightClass = " con riesgo de talla baja";
  else heightClass = "";

  return bmiClass + heightClass;
}
