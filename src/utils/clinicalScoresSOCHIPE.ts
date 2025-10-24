/**
 * Scores clínicos pediátricos basados en directrices SOCHIPE
 * Ref: https://www.scielo.cl/scielo.php?script=sci_arttext&pid=S0717-73482020000300176
 */

export interface ScoreResult {
  score: number;
  interpretation: string;
  severity: 'leve' | 'moderado' | 'grave' | 'crítico';
  recommendations: string[];
}

/**
 * Score TAL (Test de Asma Leve)
 * Para niños menores de 3 años con crisis de asma/broncoobstrucción
 * 
 * Parámetros:
 * - Frecuencia Respiratoria (0-3 puntos)
 * - Sibilancias (0-3 puntos)
 * - Uso de músculos accesorios (0-3 puntos)
 * - Cianosis (0-3 puntos)
 * - Nivel de conciencia (0-3 puntos)
 */
export interface TALParams {
  age: number; // en meses o años
  frecuenciaRespiratoria: number;
  sibilancias: 'ausentes' | 'fin_espiracion' | 'toda_espiracion' | 'insp_y_esp' | 'audibles';
  usoMuscAccesorios: 'ausente' | 'leve' | 'moderado' | 'grave';
  cianosis: 'ausente' | 'perioral_llanto' | 'perioral_reposo' | 'generalizada';
  nivelConciencia: 'normal' | 'hiporeactivo' | 'agitado' | 'confuso_letargico';
}

export function calculateTAL(params: TALParams): ScoreResult {
  if (params.age >= 36) {
    throw new Error('El score TAL está indicado para niños menores de 3 años');
  }

  let score = 0;

  // Frecuencia Respiratoria
  if (params.frecuenciaRespiratoria < 30) score += 0;
  else if (params.frecuenciaRespiratoria <= 45) score += 1;
  else if (params.frecuenciaRespiratoria <= 60) score += 2;
  else score += 3;

  // Sibilancias
  const sibilanciasScore: Record<string, number> = {
    'ausentes': 0,
    'fin_espiracion': 1,
    'toda_espiracion': 2,
    'insp_y_esp': 3,
    'audibles': 3
  };
  score += sibilanciasScore[params.sibilancias];

  // Uso de músculos accesorios
  const musculosScore: Record<string, number> = {
    'ausente': 0,
    'leve': 1,
    'moderado': 2,
    'grave': 3
  };
  score += musculosScore[params.usoMuscAccesorios];

  // Cianosis
  const cianosisScore: Record<string, number> = {
    'ausente': 0,
    'perioral_llanto': 1,
    'perioral_reposo': 2,
    'generalizada': 3
  };
  score += cianosisScore[params.cianosis];

  // Nivel de conciencia
  const concienciaScore: Record<string, number> = {
    'normal': 0,
    'hiporeactivo': 1,
    'agitado': 2,
    'confuso_letargico': 3
  };
  score += concienciaScore[params.nivelConciencia];

  // Interpretación
  let severity: 'leve' | 'moderado' | 'grave' | 'crítico';
  let interpretation: string;
  let recommendations: string[];

  if (score <= 5) {
    severity = 'leve';
    interpretation = 'Crisis leve de asma/broncoobstrucción';
    recommendations = [
      'Broncodilatador beta-2 agonista (Salbutamol) en dosis habituales',
      'Puede manejarse ambulatoriamente',
      'Reevaluar en 1 hora'
    ];
  } else if (score <= 8) {
    severity = 'moderado';
    interpretation = 'Crisis moderada de asma/broncoobstrucción';
    recommendations = [
      'Broncodilatador beta-2 agonista (Salbutamol) cada 20 minutos x 3 dosis',
      'Considerar corticoides sistémicos (Prednisona 1-2 mg/kg)',
      'Observación por 1-2 horas',
      'Valorar hospitalización si no hay respuesta'
    ];
  } else if (score <= 11) {
    severity = 'grave';
    interpretation = 'Crisis grave de asma/broncoobstrucción';
    recommendations = [
      'Hospitalización',
      'Oxígeno para mantener SatO2 > 92%',
      'Salbutamol nebulizado continuo',
      'Corticoides sistémicos IV (Metilprednisolona 1-2 mg/kg)',
      'Considerar sulfato de magnesio IV',
      'Monitoreo continuo'
    ];
  } else {
    severity = 'crítico';
    interpretation = 'Crisis crítica/Paro respiratorio inminente';
    recommendations = [
      'Manejo en UCI pediátrica',
      'Preparar para ventilación mecánica',
      'Salbutamol nebulizado continuo',
      'Corticoides IV dosis altas',
      'Sulfato de magnesio IV',
      'Considerar broncodilatadores alternativos',
      'Monitoreo hemodinámico continuo'
    ];
  }

  return {
    score,
    interpretation,
    severity,
    recommendations
  };
}

/**
 * Score Pulmonary/Wood-Downes modificado por Ferrés
 * Para evaluar severidad de bronquiolitis
 * 
 * Parámetros (0-3 puntos cada uno):
 * - Cianosis
 * - Tiraje/Retracción
 * - Sibilancias
 * - Frecuencia Respiratoria
 * - Frecuencia Cardíaca
 */
export interface WoodDownesParams {
  age: number; // en meses
  cianosis: 'ausente' | 'aire_ambiente' | 'fio2_40';
  tiraje: 'ausente' | 'leve' | 'moderado' | 'grave';
  sibilancias: 'ausentes' | 'fin_espiracion' | 'toda_espiracion' | 'insp_y_esp_audibles';
  frecuenciaRespiratoria: number;
  frecuenciaCardiaca: number;
}

export function calculateWoodDownes(params: WoodDownesParams): ScoreResult {
  let score = 0;

  // Cianosis
  if (params.cianosis === 'ausente') score += 0;
  else if (params.cianosis === 'aire_ambiente') score += 2;
  else score += 3;

  // Tiraje/Retracción
  const tirajeScore: Record<string, number> = {
    'ausente': 0,
    'leve': 1,
    'moderado': 2,
    'grave': 3
  };
  score += tirajeScore[params.tiraje];

  // Sibilancias
  const sibilanciasScore: Record<string, number> = {
    'ausentes': 0,
    'fin_espiracion': 1,
    'toda_espiracion': 2,
    'insp_y_esp_audibles': 3
  };
  score += sibilanciasScore[params.sibilancias];

  // Frecuencia Respiratoria (ajustada por edad)
  let frLimite: number;
  if (params.age < 6) frLimite = 60;
  else if (params.age < 12) frLimite = 50;
  else frLimite = 40;

  if (params.frecuenciaRespiratoria < frLimite) score += 0;
  else if (params.frecuenciaRespiratoria < frLimite + 10) score += 1;
  else if (params.frecuenciaRespiratoria < frLimite + 20) score += 2;
  else score += 3;

  // Frecuencia Cardíaca
  let fcLimite: number;
  if (params.age < 6) fcLimite = 160;
  else if (params.age < 12) fcLimite = 150;
  else fcLimite = 140;

  if (params.frecuenciaCardiaca < fcLimite) score += 0;
  else if (params.frecuenciaCardiaca < fcLimite + 20) score += 1;
  else if (params.frecuenciaCardiaca < fcLimite + 40) score += 2;
  else score += 3;

  // Interpretación
  let severity: 'leve' | 'moderado' | 'grave' | 'crítico';
  let interpretation: string;
  let recommendations: string[];

  if (score <= 3) {
    severity = 'leve';
    interpretation = 'Bronquiolitis leve';
    recommendations = [
      'Manejo ambulatorio',
      'Aseo nasal con suero fisiológico',
      'Alimentación fraccionada',
      'Posición semi-sentado para dormir',
      'Control en 24-48 horas',
      'Educación a padres sobre signos de alarma'
    ];
  } else if (score <= 6) {
    severity = 'moderado';
    interpretation = 'Bronquiolitis moderada';
    recommendations = [
      'Hospitalización',
      'Oxígeno para mantener SatO2 > 92%',
      'Hidratación adecuada (oral o IV según tolerancia)',
      'Aseo nasal frecuente',
      'Monitoreo de frecuencia respiratoria y saturación',
      'Alimentación por SNG si hay dificultad respiratoria importante'
    ];
  } else if (score <= 9) {
    severity = 'grave';
    interpretation = 'Bronquiolitis grave';
    recommendations = [
      'Hospitalización en unidad de cuidados intermedios',
      'Oxígeno de alto flujo o CPAP nasal',
      'Hidratación IV',
      'Monitoreo continuo de signos vitales',
      'Considerar prueba terapéutica con salbutamol',
      'Evaluación frecuente para traslado a UCI si no hay respuesta'
    ];
  } else {
    severity = 'crítico';
    interpretation = 'Bronquiolitis muy grave/Insuficiencia respiratoria';
    recommendations = [
      'Manejo en UCI pediátrica',
      'Soporte ventilatorio (CPAP, ventilación mecánica)',
      'Hidratación IV',
      'Monitoreo hemodinámico continuo',
      'Considerar surfactante en casos seleccionados',
      'Vigilar complicaciones (apneas, atelectasias, neumonía)'
    ];
  }

  return {
    score,
    interpretation,
    severity,
    recommendations
  };
}

/**
 * Dosis máximas de medicamentos pediátricos según SOCHIPE
 */
export const DOSIS_MAXIMAS_PEDIATRICAS = {
  // Broncodilatadores
  salbutamol: {
    nebulizado: '0.15 mg/kg/dosis (máx 5 mg)',
    inh_presurizado: '2-4 puff cada 4-6h',
    oral: '0.1-0.2 mg/kg/dosis c/6-8h (máx 4 mg)',
  },
  ipratropio: {
    nebulizado: '250-500 mcg cada 6-8h',
    inh_presurizado: '20-40 mcg cada 6-8h',
  },
  
  // Corticoides inhalados (dosis alta diaria)
  budesonida: {
    '6-11años': '>400 μg/día',
    '>12años': '>800 μg/día',
  },
  fluticasona_propionato: {
    '6-11años': '>500 μg/día',
    '>12años': '>500 μg/día',
  },
  
  // Corticoides sistémicos
  prednisona: '1-2 mg/kg/día (máx 60 mg/día)',
  metilprednisolona: '1-2 mg/kg/día IV (máx 125 mg/dosis)',
  hidrocortisona: '5-10 mg/kg/dosis IV c/6h (máx 100 mg/dosis)',
  
  // Broncodilatadores de acción prolongada
  formoterol: '12-24 mcg cada 12h',
  salmeterol: '50 mcg cada 12h',
  
  // Antileucotrienos
  montelukast: {
    '6m-5años': '4 mg/día',
    '6-14años': '5 mg/día',
    '>15años': '10 mg/día',
  },
  
  // Crisis asmática
  sulfato_magnesio: '25-75 mg/kg IV (máx 2g) en 20-30 min',
  
  // Bronquiolitis
  adrenalina_nebulizada: '3-5 ml de solución 1:1000 (3-5 mg)',
};

/**
 * Función para obtener dosis máxima según edad y peso
 */
export function getDosisMaxima(
  medicamento: string,
  edad: number, // en meses
  peso?: number // en kg
): string {
  const edadAnios = Math.floor(edad / 12);
  
  // Lógica para obtener dosis según edad
  if (medicamento === 'montelukast') {
    if (edad < 60) return DOSIS_MAXIMAS_PEDIATRICAS.montelukast['6m-5años'];
    if (edadAnios <= 14) return DOSIS_MAXIMAS_PEDIATRICAS.montelukast['6-14años'];
    return DOSIS_MAXIMAS_PEDIATRICAS.montelukast['>15años'];
  }
  
  if (medicamento === 'budesonida') {
    if (edadAnios < 12) return DOSIS_MAXIMAS_PEDIATRICAS.budesonida['6-11años'];
    return DOSIS_MAXIMAS_PEDIATRICAS.budesonida['>12años'];
  }
  
  if (medicamento === 'fluticasona_propionato') {
    if (edadAnios < 12) return DOSIS_MAXIMAS_PEDIATRICAS.fluticasona_propionato['6-11años'];
    return DOSIS_MAXIMAS_PEDIATRICAS.fluticasona_propionato['>12años'];
  }
  
  return 'Dosis no encontrada';
}
