export interface Medication {
  id: string;
  name: string;
  minDoseMgKg?: number;
  maxDoseMgKg?: number;
  maxDoseMg?: number;
  commonDosage?: string;
  route: string;
  frequency: string;
  interactions: {
    withMedication: string;
    severity: 'leve' | 'moderada' | 'grave';
    description: string;
  }[];
}

export interface DiagnosisTemplate {
  id: string;
  name: string;
  diagnosisCode: string;
  medications: string[];
  duration: number;
  description?: string;
}

export const medications: Medication[] = [
  {
    id: 'amox',
    name: 'Amoxicilina',
    minDoseMgKg: 40,
    maxDoseMgKg: 80,
    maxDoseMg: 3000,
    commonDosage: '250mg/5ml',
    route: 'Oral',
    frequency: 'Cada 8 horas',
    interactions: [
      {
        withMedication: 'Macrólidos',
        severity: 'moderada',
        description: 'Puede disminuir la eficacia de la amoxicilina.'
      },
      {
        withMedication: 'Metotrexato',
        severity: 'grave',
        description: 'Aumenta la toxicidad del metotrexato.'
      }
    ]
  },
  {
    id: 'amox_clav',
    name: 'Amoxicilina/Ácido Clavulánico',
    minDoseMgKg: 40,
    maxDoseMgKg: 80,
    maxDoseMg: 2000,
    commonDosage: '400mg/57mg/5ml',
    route: 'Oral',
    frequency: 'Cada 12 horas',
    interactions: [
      {
        withMedication: 'Anticoagulantes',
        severity: 'moderada',
        description: 'Puede aumentar el riesgo de sangrado.'
      },
      {
        withMedication: 'Metotrexato',
        severity: 'grave',
        description: 'Aumenta la toxicidad del metotrexato.'
      }
    ]
  },
  {
    id: 'azitromicina',
    name: 'Azitromicina',
    minDoseMgKg: 10,
    maxDoseMg: 500,
    commonDosage: '200mg/5ml',
    route: 'Oral',
    frequency: '1 vez al día',
    interactions: [
      {
        withMedication: 'Antiácidos',
        severity: 'leve',
        description: 'Disminuye la absorción. Tomar 1 hora antes o 2 horas después.'
      },
      {
        withMedication: 'Anticoagulantes',
        severity: 'moderada',
        description: 'Puede aumentar el efecto anticoagulante.'
      }
    ]
  },
  {
    id: 'ibuprofeno',
    name: 'Ibuprofeno',
    minDoseMgKg: 5,
    maxDoseMgKg: 10,
    maxDoseMg: 40,
    commonDosage: '100mg/5ml',
    route: 'Oral',
    frequency: 'Cada 6-8 horas',
    interactions: [
      {
        withMedication: 'Corticoides',
        severity: 'moderada',
        description: 'Aumenta el riesgo de sangrado gastrointestinal.'
      },
      {
        withMedication: 'Antihipertensivos',
        severity: 'moderada',
        description: 'Puede disminuir el efecto antihipertensivo.'
      }
    ]
  },
  {
    id: 'paracetamol',
    name: 'Paracetamol',
    minDoseMgKg: 10,
    maxDoseMgKg: 15,
    maxDoseMg: 60,
    commonDosage: '120mg/5ml',
    route: 'Oral',
    frequency: 'Cada 6 horas',
    interactions: [
      {
        withMedication: 'Alcohol',
        severity: 'grave',
        description: 'Aumenta el riesgo de daño hepático.'
      },
      {
        withMedication: 'Warfarina',
        severity: 'moderada',
        description: 'Puede aumentar el efecto anticoagulante.'
      }
    ]
  },
  {
    id: 'salbutamol',
    name: 'Salbutamol',
    minDoseMgKg: 0.1,
    maxDoseMgKg: 0.15,
    maxDoseMg: 8,
    commonDosage: '100mcg/dosis',
    route: 'Inhalación',
    frequency: 'Cada 4-6 horas',
    interactions: [
      {
        withMedication: 'Betabloqueadores',
        severity: 'moderada',
        description: 'Puede disminuir el efecto broncodilatador.'
      }
    ]
  },
  {
    id: 'prednisona',
    name: 'Prednisona',
    minDoseMgKg: 1,
    maxDoseMgKg: 2,
    maxDoseMg: 60,
    commonDosis: '5mg tableta',
    route: 'Oral',
    frequency: '1 vez al día en la mañana',
    interactions: [
      {
        withMedication: 'AINEs',
        severity: 'moderada',
        description: 'Aumenta el riesgo de úlcera gastrointestinal.'
      },
      {
        withMedication: 'Vacunas de virus vivos',
        severity: 'grave',
        description: 'Puede causar infección por la vacuna.'
      }
    ]
  }
];

export const diagnosisTemplates: DiagnosisTemplate[] = [
  {
    id: 'oma',
    name: 'Otitis Media Aguda',
    diagnosisCode: 'H66.9',
    description: 'Tratamiento estándar para otitis media aguda en niños',
    medications: ['amox', 'ibuprofeno'],
    duration: 10
  },
  {
    id: 'faringo',
    name: 'Faringoamigdalitis',
    diagnosisCode: 'J02.0',
    description: 'Tratamiento para faringoamigdalitis estreptocócica',
    medications: ['amox', 'paracetamol'],
    duration: 10
  },
  {
    id: 'crisis_asmatica',
    name: 'Crisis Asmática',
    diagnosisCode: 'J45.901',
    description: 'Manejo inicial de crisis asmática leve a moderada',
    medications: ['salbutamol', 'prednisona'],
    duration: 5
  },
  {
    id: 'neumonia',
    name: 'Neumonía Adquirida en la Comunidad',
    diagnosisCode: 'J18.9',
    description: 'Tratamiento ambulatorio para neumonía en niños',
    medications: ['amox_clav', 'ibuprofeno'],
    duration: 7
  },
  {
    id: 'sinusitis',
    name: 'Sinusitis Aguda',
    diagnosisCode: 'J01.90',
    description: 'Tratamiento para sinusitis bacteriana aguda',
    medications: ['amox_clav', 'paracetamol'],
    duration: 10
  }
];
