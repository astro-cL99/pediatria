// Clinical Scores and Scales for Pediatrics

export interface ScoreResult {
  score: number;
  interpretation: string;
  severity: 'normal' | 'leve' | 'moderado' | 'severo' | 'crítico';
  recommendations?: string;
}

// RESPIRATORY SCORES

// Wood-Downes Score (Bronchiolitis)
export interface WoodDownesParams {
  wheezing: 0 | 1 | 2 | 3; // 0=none, 1=end-expiratory, 2=all expiratory, 3=insp+exp
  retractions: 0 | 1 | 2 | 3; // 0=none, 1=subcostal, 2=+intercostal, 3=severe
  cyanosis: 0 | 1 | 2 | 3; // 0=none, 1=peri-oral, 2=generalized, 3=with O2
  airEntry: 0 | 1 | 2 | 3; // 0=normal, 1=decreased, 2=very decreased, 3=inaudible
  respiratoryRate: number;
  ageMonths: number;
}

export function calculateWoodDownes(params: WoodDownesParams): ScoreResult {
  let rrScore = 0;
  const normalRR = params.ageMonths < 12 ? 30 : 24;
  
  if (params.respiratoryRate > normalRR + 20) rrScore = 3;
  else if (params.respiratoryRate > normalRR + 10) rrScore = 2;
  else if (params.respiratoryRate > normalRR) rrScore = 1;

  const total = params.wheezing + params.retractions + params.cyanosis + params.airEntry + rrScore;

  let interpretation = "";
  let severity: ScoreResult['severity'] = 'normal';
  let recommendations = "";

  if (total <= 3) {
    interpretation = "Bronquiolitis leve";
    severity = "leve";
    recommendations = "Manejo ambulatorio, hidratación, aseo nasal";
  } else if (total <= 6) {
    interpretation = "Bronquiolitis moderada";
    severity = "moderado";
    recommendations = "Hospitalización, O2 si SatO2 <92%, hidratación EV";
  } else if (total <= 9) {
    interpretation = "Bronquiolitis grave";
    severity = "severo";
    recommendations = "UCI pediátrica, soporte respiratorio, monitoreo continuo";
  } else {
    interpretation = "Bronquiolitis muy grave";
    severity = "crítico";
    recommendations = "UCI, considerar VM, monitoreo invasivo";
  }

  return { score: total, interpretation, severity, recommendations };
}

// TAL Score (Test de Asma Leve) - Para menores de 3 años
export interface TALParams {
  wheezing: 0 | 1 | 2 | 3; // 0=ninguna, 1=espiratorias, 2=espiratorias e insipiratorias, 3=audibles a distancia
  respiratoryRate: number; // frecuencia respiratoria
  accessoryMuscleUse: 0 | 1 | 2 | 3; // 0=ninguna, 1=subcostal, 2=intercostal, 3=supraclavicular
  oxygenUse: 0 | 1; // 0=sin oxígeno, 1=con oxígeno (reemplaza valoración de cianosis)
  ageMonths: number; // edad en meses
}

export function calculateTAL(params: TALParams): ScoreResult {
  // Validar edad
  if (params.ageMonths >= 36) {
    throw new Error("El score TAL solo es aplicable a menores de 3 años");
  }

  // Calcular puntaje de frecuencia respiratoria según edad
  let rrScore = 0;
  const isUnder6Months = params.ageMonths < 6;
  const normalRR = isUnder6Months ? 50 : 40;
  
  if (params.respiratoryRate > normalRR + 10) rrScore = 3;
  else if (params.respiratoryRate > normalRR + 5) rrScore = 2;
  else if (params.respiratoryRate > normalRR) rrScore = 1;

  // Calcular puntaje total (rango 0-12)
  const total = 
    (params.wheezing ? 3 : 0) + // Sibilancias: 0-3 puntos
    rrScore + // Frecuencia respiratoria: 0-3 puntos
    params.accessoryMuscleUse + // Uso de musculatura accesoria: 0-3 puntos
    (params.oxygenUse ? 3 : 0); // Oxígeno: 0 o 3 puntos (reemplaza cianosis)

  // Interpretación del puntaje
  let interpretation = "";
  let severity: ScoreResult['severity'] = 'normal';
  let recommendations = "";

  if (total <= 3) {
    interpretation = "Obstrucción bronquial leve";
    severity = "leve";
    recommendations = "Manejo ambulatorio con broncodilatadores y control en 24-48h";
  } else if (total <= 6) {
    interpretation = "Obstrucción bronquial moderada";
    severity = "moderado";
    recommendations = "Considerar hospitalización, oxígeno si es necesario, broncodilatadores en dosis frecuentes";
  } else if (total <= 9) {
    interpretation = "Obstrucción bronquial grave";
    severity = "severo";
    recommendations = "Hospitalización, oxigenoterapia, broncodilatadores en dosis frecuentes, considerar corticoides";
  } else {
    interpretation = "Obstrucción bronquial crítica";
    severity = "crítico";
    recommendations = "Ingreso a UCI, soporte ventilatorio si es necesario, tratamiento agresivo";
  }

  return { 
    score: total, 
    interpretation, 
    severity,
    recommendations
  };
}

// NEUROLOGICAL SCORES

// Glasgow Pediatric Coma Scale
export interface GlasgowPediatricParams {
  eyeOpening: 1 | 2 | 3 | 4;
  verbalResponse: 1 | 2 | 3 | 4 | 5;
  motorResponse: 1 | 2 | 3 | 4 | 5 | 6;
  ageMonths: number;
}

export function calculateGlasgowPediatric(params: GlasgowPediatricParams): ScoreResult {
  const total = params.eyeOpening + params.verbalResponse + params.motorResponse;

  let interpretation = "";
  let severity: ScoreResult['severity'] = 'normal';

  if (total >= 13) {
    interpretation = "TCE leve";
    severity = "leve";
  } else if (total >= 9) {
    interpretation = "TCE moderado";
    severity = "moderado";
  } else {
    interpretation = "TCE grave";
    severity = "severo";
  }

  return { score: total, interpretation, severity };
}

// AVPU Scale
export type AVPULevel = 'A' | 'V' | 'P' | 'U';

export function calculateAVPU(level: AVPULevel): ScoreResult {
  let interpretation = "";
  let severity: ScoreResult['severity'] = 'normal';
  let score = 0;

  switch (level) {
    case 'A':
      score = 15;
      interpretation = "Alerta (Alert)";
      severity = "normal";
      break;
    case 'V':
      score = 12;
      interpretation = "Responde a estímulo verbal (Voice)";
      severity = "leve";
      break;
    case 'P':
      score = 8;
      interpretation = "Responde a estímulo doloroso (Pain)";
      severity = "moderado";
      break;
    case 'U':
      score = 3;
      interpretation = "No responde (Unresponsive)";
      severity = "crítico";
      break;
  }

  return { score, interpretation, severity };
}

// INFECTIOUS/SEPSIS SCORES

// qSOFA Pediatric
export interface qSOFAPediatricParams {
  respiratoryRate: number;
  systolicBP: number;
  consciousness: 'normal' | 'altered';
  ageMonths: number;
}

export function calculateQSOFAPediatric(params: qSOFAPediatricParams): ScoreResult {
  let score = 0;

  // RR criteria (age-adjusted)
  const rrThreshold = params.ageMonths < 12 ? 50 : params.ageMonths < 60 ? 40 : 30;
  if (params.respiratoryRate >= rrThreshold) score++;

  // Hypotension (age-adjusted)
  const bpThreshold = params.ageMonths < 12 ? 70 : 70 + Math.floor(params.ageMonths / 12) * 2;
  if (params.systolicBP < bpThreshold) score++;

  // Altered consciousness
  if (params.consciousness === 'altered') score++;

  let interpretation = "";
  let severity: ScoreResult['severity'] = 'normal';
  let recommendations = "";

  if (score >= 2) {
    interpretation = "Sepsis probable - ALTO RIESGO";
    severity = "crítico";
    recommendations = "Activar código sepsis, traslado a UCI, cultivos + ATB empírico inmediato";
  } else if (score === 1) {
    interpretation = "Riesgo moderado de sepsis";
    severity = "moderado";
    recommendations = "Monitorización estrecha, reevaluación frecuente";
  } else {
    interpretation = "Bajo riesgo de sepsis";
    severity = "leve";
    recommendations = "Vigilancia clínica";
  }

  return { score, interpretation, severity, recommendations };
}

// PAIN SCALES

// FLACC Scale (0-3 years)
export interface FLACCParams {
  face: 0 | 1 | 2; // 0=relaxed, 1=grimace, 2=crying
  legs: 0 | 1 | 2; // 0=normal, 1=uneasy, 2=kicking
  activity: 0 | 1 | 2; // 0=quiet, 1=squirming, 2=arched
  cry: 0 | 1 | 2; // 0=no cry, 1=moans, 2=screaming
  consolability: 0 | 1 | 2; // 0=content, 1=reassured, 2=difficult
}

export function calculateFLACC(params: FLACCParams): ScoreResult {
  const total = params.face + params.legs + params.activity + params.cry + params.consolability;

  let interpretation = "";
  let severity: ScoreResult['severity'] = 'normal';

  if (total === 0) {
    interpretation = "Sin dolor";
    severity = "normal";
  } else if (total <= 3) {
    interpretation = "Dolor leve";
    severity = "leve";
  } else if (total <= 6) {
    interpretation = "Dolor moderado";
    severity = "moderado";
  } else {
    interpretation = "Dolor severo";
    severity = "severo";
  }

  return { score: total, interpretation, severity };
}

// Wong-Baker FACES (3-12 years) - Simple numeric
export function calculateWongBaker(faceSelected: 0 | 2 | 4 | 6 | 8 | 10): ScoreResult {
  let interpretation = "";
  let severity: ScoreResult['severity'] = 'normal';

  if (faceSelected === 0) {
    interpretation = "Sin dolor";
    severity = "normal";
  } else if (faceSelected <= 2) {
    interpretation = "Dolor leve";
    severity = "leve";
  } else if (faceSelected <= 6) {
    interpretation = "Dolor moderado";
    severity = "moderado";
  } else {
    interpretation = "Dolor severo";
    severity = "severo";
  }

  return { score: faceSelected, interpretation, severity };
}

// Visual Analog Scale (>12 years)
export function calculateVAS(score: number): ScoreResult {
  let interpretation = "";
  let severity: ScoreResult['severity'] = 'normal';

  if (score === 0) {
    interpretation = "Sin dolor";
    severity = "normal";
  } else if (score <= 3) {
    interpretation = "Dolor leve";
    severity = "leve";
  } else if (score <= 7) {
    interpretation = "Dolor moderado";
    severity = "moderado";
  } else {
    interpretation = "Dolor severo";
    severity = "severo";
  }

  return { score, interpretation, severity };
}

// Silverman-Anderson (Neonatal respiratory distress)
export interface SilvermanAndersonParams {
  upperChestMovement: 0 | 1 | 2;
  lowerChestRetractions: 0 | 1 | 2;
  xiphoidRetractions: 0 | 1 | 2;
  naralFlaring: 0 | 1 | 2;
  expiratoryGrunt: 0 | 1 | 2;
}

export function calculateSilvermanAnderson(params: SilvermanAndersonParams): ScoreResult {
  const total = params.upperChestMovement + params.lowerChestRetractions + 
                params.xiphoidRetractions + params.naralFlaring + params.expiratoryGrunt;

  let interpretation = "";
  let severity: ScoreResult['severity'] = 'normal';

  if (total === 0) {
    interpretation = "Sin dificultad respiratoria";
    severity = "normal";
  } else if (total <= 3) {
    interpretation = "Dificultad respiratoria leve";
    severity = "leve";
  } else if (total <= 6) {
    interpretation = "Dificultad respiratoria moderada";
    severity = "moderado";
  } else {
    interpretation = "Dificultad respiratoria severa";
    severity = "severo";
  }

  return { score: total, interpretation, severity };
}
