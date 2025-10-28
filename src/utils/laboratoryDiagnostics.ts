/**
 * Sistema de Diagnósticos Automáticos Basados en Laboratorios
 * Genera diagnósticos CIE-10 automáticamente según valores de laboratorio
 */

export interface LabValue {
  name: string;
  value: number;
  unit?: string;
}

export interface AutoDiagnosis {
  code: string;
  description: string;
  severity: 'leve' | 'moderada' | 'severa' | 'crítica';
  category: string;
  labValue: string;
  actualValue: number;
  referenceRange?: string;
}

/**
 * Función principal que procesa todos los valores de laboratorio
 * y genera diagnósticos automáticos
 */
export function generateAutoDiagnoses(
  labValues: Record<string, number>,
  patientAge?: number
): AutoDiagnosis[] {
  const diagnoses: AutoDiagnosis[] = [];

  // Electrolitos
  if (labValues['potasio'] !== undefined) {
    const diag = evaluatePotassium(labValues['potasio']);
    if (diag) diagnoses.push(diag);
  }

  if (labValues['sodio'] !== undefined) {
    const diag = evaluateSodium(labValues['sodio']);
    if (diag) diagnoses.push(diag);
  }

  if (labValues['calcio'] !== undefined) {
    const diag = evaluateCalcium(labValues['calcio']);
    if (diag) diagnoses.push(diag);
  }

  if (labValues['magnesio'] !== undefined) {
    const diag = evaluateMagnesium(labValues['magnesio']);
    if (diag) diagnoses.push(diag);
  }

  // Gasometría
  if (labValues['ph'] !== undefined) {
    const diag = evaluatePH(labValues['ph']);
    if (diag) diagnoses.push(diag);
  }

  if (labValues['bicarbonato'] !== undefined || labValues['hco3'] !== undefined) {
    const value = labValues['bicarbonato'] || labValues['hco3'];
    const diag = evaluateBicarbonate(value);
    if (diag) diagnoses.push(diag);
  }

  // Hemograma
  if (labValues['hemoglobina'] !== undefined) {
    const anemiaD = evaluateAnemia(
      labValues['hemoglobina'],
      labValues['vcm'],
      labValues['hcm'],
      patientAge
    );
    diagnoses.push(...anemiaD);
  }

  if (labValues['plaquetas'] !== undefined) {
    const diag = evaluatePlatelets(labValues['plaquetas']);
    if (diag) diagnoses.push(diag);
  }

  if (labValues['leucocitos'] !== undefined) {
    const diag = evaluateLeukocytes(labValues['leucocitos'], patientAge);
    if (diag) diagnoses.push(diag);
  }

  if (labValues['neutrofilos'] !== undefined) {
    const diag = evaluateNeutrophils(labValues['neutrofilos']);
    if (diag) diagnoses.push(diag);
  }

  // Función renal
  if (labValues['creatinina'] !== undefined) {
    const diag = evaluateCreatinine(labValues['creatinina'], patientAge);
    if (diag) diagnoses.push(diag);
  }

  // Función hepática
  if (labValues['alt'] !== undefined && labValues['ast'] !== undefined) {
    const diags = evaluateTransaminases(labValues['alt'], labValues['ast']);
    diagnoses.push(...diags);
  }

  // Inflamación
  if (labValues['pcr'] !== undefined) {
    const diag = evaluateCRP(labValues['pcr']);
    if (diag) diagnoses.push(diag);
  }

  // Glucosa
  if (labValues['glucosa'] !== undefined) {
    const diag = evaluateGlucose(labValues['glucosa']);
    if (diag) diagnoses.push(diag);
  }

  return diagnoses;
}

// POTASIO
function evaluatePotassium(value: number): AutoDiagnosis | null {
  if (value < 3.5) {
    return {
      code: 'E87.6',
      description: value < 2.5 ? 'Hipopotasemia severa' : value < 3.0 ? 'Hipopotasemia moderada' : 'Hipopotasemia leve',
      severity: value < 2.5 ? 'severa' : value < 3.0 ? 'moderada' : 'leve',
      category: 'Hidroelectrolítico',
      labValue: 'Potasio',
      actualValue: value,
      referenceRange: '3.5-5.0 mEq/L'
    };
  }
  if (value > 5.0) {
    return {
      code: 'E87.5',
      description: value > 6.5 ? 'Hiperpotasemia severa' : value > 5.5 ? 'Hiperpotasemia moderada' : 'Hiperpotasemia leve',
      severity: value > 6.5 ? 'crítica' : value > 5.5 ? 'moderada' : 'leve',
      category: 'Hidroelectrolítico',
      labValue: 'Potasio',
      actualValue: value,
      referenceRange: '3.5-5.0 mEq/L'
    };
  }
  return null;
}

// SODIO
function evaluateSodium(value: number): AutoDiagnosis | null {
  if (value < 135) {
    return {
      code: 'E87.1',
      description: value < 125 ? 'Hiponatremia severa' : value < 130 ? 'Hiponatremia moderada' : 'Hiponatremia leve',
      severity: value < 125 ? 'severa' : value < 130 ? 'moderada' : 'leve',
      category: 'Hidroelectrolítico',
      labValue: 'Sodio',
      actualValue: value,
      referenceRange: '135-145 mEq/L'
    };
  }
  if (value > 145) {
    return {
      code: 'E87.0',
      description: value > 160 ? 'Hipernatremia severa' : value > 150 ? 'Hipernatremia moderada' : 'Hipernatremia leve',
      severity: value > 160 ? 'severa' : value > 150 ? 'moderada' : 'leve',
      category: 'Hidroelectrolítico',
      labValue: 'Sodio',
      actualValue: value,
      referenceRange: '135-145 mEq/L'
    };
  }
  return null;
}

// CALCIO
function evaluateCalcium(value: number): AutoDiagnosis | null {
  if (value < 8.5) {
    return {
      code: 'E83.5',
      description: value < 6.5 ? 'Hipocalcemia severa' : value < 7.5 ? 'Hipocalcemia moderada' : 'Hipocalcemia leve',
      severity: value < 6.5 ? 'crítica' : value < 7.5 ? 'moderada' : 'leve',
      category: 'Hidroelectrolítico',
      labValue: 'Calcio',
      actualValue: value,
      referenceRange: '8.5-10.5 mg/dL'
    };
  }
  if (value > 10.5) {
    return {
      code: 'E83.5',
      description: value > 14.0 ? 'Hipercalcemia severa' : value > 12.0 ? 'Hipercalcemia moderada' : 'Hipercalcemia leve',
      severity: value > 14.0 ? 'crítica' : value > 12.0 ? 'moderada' : 'leve',
      category: 'Hidroelectrolítico',
      labValue: 'Calcio',
      actualValue: value,
      referenceRange: '8.5-10.5 mg/dL'
    };
  }
  return null;
}

// MAGNESIO
function evaluateMagnesium(value: number): AutoDiagnosis | null {
  if (value < 1.7) {
    return {
      code: 'E83.4',
      description: value < 1.2 ? 'Hipomagnesemia severa' : 'Hipomagnesemia',
      severity: value < 1.2 ? 'severa' : 'moderada',
      category: 'Hidroelectrolítico',
      labValue: 'Magnesio',
      actualValue: value,
      referenceRange: '1.7-2.4 mg/dL'
    };
  }
  if (value > 2.4) {
    return {
      code: 'E83.4',
      description: value > 4.0 ? 'Hipermagnesemia severa' : 'Hipermagnesemia',
      severity: value > 4.0 ? 'severa' : 'moderada',
      category: 'Hidroelectrolítico',
      labValue: 'Magnesio',
      actualValue: value,
      referenceRange: '1.7-2.4 mg/dL'
    };
  }
  return null;
}

// pH
function evaluatePH(value: number): AutoDiagnosis | null {
  if (value < 7.35) {
    return {
      code: 'E87.2',
      description: value < 7.20 ? 'Acidosis severa' : value < 7.30 ? 'Acidosis moderada' : 'Acidosis leve',
      severity: value < 7.20 ? 'crítica' : value < 7.30 ? 'moderada' : 'leve',
      category: 'Ácido-Base',
      labValue: 'pH',
      actualValue: value,
      referenceRange: '7.35-7.45'
    };
  }
  if (value > 7.45) {
    return {
      code: 'E87.3',
      description: value > 7.55 ? 'Alcalosis severa' : value > 7.50 ? 'Alcalosis moderada' : 'Alcalosis leve',
      severity: value > 7.55 ? 'severa' : value > 7.50 ? 'moderada' : 'leve',
      category: 'Ácido-Base',
      labValue: 'pH',
      actualValue: value,
      referenceRange: '7.35-7.45'
    };
  }
  return null;
}

// BICARBONATO
function evaluateBicarbonate(value: number): AutoDiagnosis | null {
  if (value < 22) {
    return {
      code: 'E87.2',
      description: 'Acidosis metabólica',
      severity: value < 15 ? 'severa' : value < 18 ? 'moderada' : 'leve',
      category: 'Ácido-Base',
      labValue: 'Bicarbonato',
      actualValue: value,
      referenceRange: '22-28 mEq/L'
    };
  }
  if (value > 28) {
    return {
      code: 'E87.3',
      description: 'Alcalosis metabólica',
      severity: value > 35 ? 'severa' : value > 32 ? 'moderada' : 'leve',
      category: 'Ácido-Base',
      labValue: 'Bicarbonato',
      actualValue: value,
      referenceRange: '22-28 mEq/L'
    };
  }
  return null;
}

// ANEMIA
function evaluateAnemia(hb: number, vcm?: number, hcm?: number, age?: number): AutoDiagnosis[] {
  const diagnoses: AutoDiagnosis[] = [];
  let threshold = 12.0;
  if (age !== undefined) {
    if (age < 0.5) threshold = 13.5;
    else if (age < 2) threshold = 11.0;
    else if (age < 6) threshold = 11.5;
    else if (age < 12) threshold = 12.0;
    else threshold = 12.5;
  }
  
  if (hb >= threshold) return diagnoses;
  
  const severity: 'leve' | 'moderada' | 'severa' = hb < 7.0 ? 'severa' : hb < 10.0 ? 'moderada' : 'leve';
  
  if (vcm && hcm) {
    if (vcm < 80 && hcm < 27) {
      diagnoses.push({
        code: 'D50.9',
        description: `Anemia microcítica hipocrómica ${severity}`,
        severity,
        category: 'Hematológico',
        labValue: 'Hemoglobina',
        actualValue: hb,
        referenceRange: `>${threshold} g/dL`
      });
    } else if (vcm > 100) {
      diagnoses.push({
        code: 'D51.9',
        description: `Anemia macrocítica ${severity}`,
        severity,
        category: 'Hematológico',
        labValue: 'Hemoglobina',
        actualValue: hb,
        referenceRange: `>${threshold} g/dL`
      });
    } else {
      diagnoses.push({
        code: 'D64.9',
        description: `Anemia normocítica normocrómica ${severity}`,
        severity,
        category: 'Hematológico',
        labValue: 'Hemoglobina',
        actualValue: hb,
        referenceRange: `>${threshold} g/dL`
      });
    }
  } else {
    diagnoses.push({
      code: 'D64.9',
      description: `Anemia ${severity}`,
      severity,
      category: 'Hematológico',
      labValue: 'Hemoglobina',
      actualValue: hb,
      referenceRange: `>${threshold} g/dL`
    });
  }
  
  return diagnoses;
}

// PLAQUETAS
function evaluatePlatelets(value: number): AutoDiagnosis | null {
  if (value < 150000) {
    return {
      code: 'D69.6',
      description: value < 50000 ? 'Trombocitopenia severa' : value < 100000 ? 'Trombocitopenia moderada' : 'Trombocitopenia leve',
      severity: value < 50000 ? 'crítica' : value < 100000 ? 'moderada' : 'leve',
      category: 'Hematológico',
      labValue: 'Plaquetas',
      actualValue: value,
      referenceRange: '150,000-450,000/μL'
    };
  }
  if (value > 450000) {
    return {
      code: 'D75.8',
      description: value > 1000000 ? 'Trombocitosis severa' : 'Trombocitosis',
      severity: value > 1000000 ? 'severa' : 'moderada',
      category: 'Hematológico',
      labValue: 'Plaquetas',
      actualValue: value,
      referenceRange: '150,000-450,000/μL'
    };
  }
  return null;
}

// LEUCOCITOS
function evaluateLeukocytes(value: number, age?: number): AutoDiagnosis | null {
  let lower = 4500, upper = 11000;
  if (age !== undefined) {
    if (age < 1) { lower = 6000; upper = 17500; }
    else if (age < 2) { lower = 6000; upper = 17000; }
    else if (age < 6) { lower = 5500; upper = 15500; }
    else if (age < 12) { lower = 4500; upper = 13500; }
  }
  
  if (value < lower) {
    return {
      code: 'D72.8',
      description: value < 1000 ? 'Leucopenia severa' : value < lower * 0.75 ? 'Leucopenia moderada' : 'Leucopenia leve',
      severity: value < 1000 ? 'crítica' : value < lower * 0.75 ? 'moderada' : 'leve',
      category: 'Hematológico',
      labValue: 'Leucocitos',
      actualValue: value,
      referenceRange: `${lower}-${upper}/μL`
    };
  }
  if (value > upper) {
    return {
      code: 'D72.8',
      description: value > 30000 ? 'Leucocitosis severa' : value > upper * 1.5 ? 'Leucocitosis moderada' : 'Leucocitosis leve',
      severity: value > 30000 ? 'severa' : value > upper * 1.5 ? 'moderada' : 'leve',
      category: 'Hematológico',
      labValue: 'Leucocitos',
      actualValue: value,
      referenceRange: `${lower}-${upper}/μL`
    };
  }
  return null;
}

// NEUTRÓFILOS
function evaluateNeutrophils(value: number): AutoDiagnosis | null {
  if (value < 1500) {
    return {
      code: 'D70',
      description: value < 500 ? 'Neutropenia severa' : value < 1000 ? 'Neutropenia moderada' : 'Neutropenia leve',
      severity: value < 500 ? 'crítica' : value < 1000 ? 'moderada' : 'leve',
      category: 'Hematológico',
      labValue: 'Neutrófilos',
      actualValue: value,
      referenceRange: '>1500/μL'
    };
  }
  return null;
}

// CREATININA
function evaluateCreatinine(value: number, age?: number): AutoDiagnosis | null {
  let upper = 1.2;
  if (age !== undefined) {
    if (age < 1) upper = 0.4;
    else if (age < 3) upper = 0.5;
    else if (age < 6) upper = 0.6;
    else if (age < 12) upper = 0.8;
  }
  
  if (value > upper) {
    return {
      code: value > upper * 3 ? 'N17.9' : 'N18.9',
      description: value > upper * 3 ? 'Insuficiencia renal aguda severa' : value > upper * 1.5 ? 'Insuficiencia renal moderada' : 'Elevación leve de creatinina',
      severity: value > upper * 3 ? 'severa' : value > upper * 1.5 ? 'moderada' : 'leve',
      category: 'Renal',
      labValue: 'Creatinina',
      actualValue: value,
      referenceRange: `<${upper} mg/dL`
    };
  }
  return null;
}

// TRANSAMINASAS
function evaluateTransaminases(alt: number, ast: number): AutoDiagnosis[] {
  const diagnoses: AutoDiagnosis[] = [];
  if (alt > 40) {
    diagnoses.push({
      code: 'K76.9',
      description: `Elevación de ALT ${alt > 200 ? 'severa' : alt > 100 ? 'moderada' : 'leve'}`,
      severity: alt > 200 ? 'severa' : alt > 100 ? 'moderada' : 'leve',
      category: 'Hepático',
      labValue: 'ALT',
      actualValue: alt,
      referenceRange: '<40 U/L'
    });
  }
  if (ast > 40) {
    diagnoses.push({
      code: 'K76.9',
      description: `Elevación de AST ${ast > 200 ? 'severa' : ast > 100 ? 'moderada' : 'leve'}`,
      severity: ast > 200 ? 'severa' : ast > 100 ? 'moderada' : 'leve',
      category: 'Hepático',
      labValue: 'AST',
      actualValue: ast,
      referenceRange: '<40 U/L'
    });
  }
  return diagnoses;
}

// PCR
function evaluateCRP(value: number): AutoDiagnosis | null {
  if (value > 10) {
    return {
      code: 'R70.0',
      description: value > 50 ? 'Elevación severa de PCR' : 'Elevación moderada de PCR',
      severity: value > 50 ? 'severa' : 'moderada',
      category: 'Inflamatorio',
      labValue: 'PCR',
      actualValue: value,
      referenceRange: '<10 mg/L'
    };
  }
  return null;
}

// GLUCOSA
function evaluateGlucose(value: number): AutoDiagnosis | null {
  if (value < 70) {
    return {
      code: 'E16.2',
      description: value < 40 ? 'Hipoglucemia severa' : value < 54 ? 'Hipoglucemia moderada' : 'Hipoglucemia leve',
      severity: value < 40 ? 'crítica' : value < 54 ? 'moderada' : 'leve',
      category: 'Metabólico',
      labValue: 'Glucosa',
      actualValue: value,
      referenceRange: '70-100 mg/dL'
    };
  }
  if (value > 126) {
    return {
      code: value > 250 ? 'E10.9' : 'R73.9',
      description: value > 250 ? 'Hiperglucemia severa' : 'Hiperglucemia',
      severity: value > 250 ? 'severa' : 'leve',
      category: 'Metabólico',
      labValue: 'Glucosa',
      actualValue: value,
      referenceRange: '70-100 mg/dL'
    };
  }
  return null;
}
