// Utilities for pediatric medical orders

export const positionOptions = [
  { value: "fowler-30", label: "Fowler 30°" },
  { value: "fowler-45", label: "Fowler 45°" },
  { value: "reposo-relativo", label: "Reposo relativo" },
  { value: "decubito-supino", label: "Decúbito supino" },
];

export const regimenOptions = [
  { value: "lactante", label: "Régimen lactante" },
  { value: "preescolar", label: "Régimen preescolar" },
  { value: "escolar", label: "Régimen escolar" },
  { value: "habitual", label: "Régimen habitual a tolerancia" },
  { value: "ayuno", label: "Ayuno" },
  { value: "custom", label: "Personalizado..." },
];

export const nursingCareItems = [
  { value: "csv", label: "Control de signos vitales" },
  { value: "vvp", label: "Cuidados de VVP" },
  { value: "curva-febril", label: "Curva febril" },
  { value: "hgt", label: "HGT" },
  { value: "o2", label: "O2 necesario para saturar ≥ 93%" },
  { value: "balance-hidrico", label: "Balance hídrico" },
  { value: "diuresis", label: "Medición de diuresis" },
  { value: "vigilar", label: "Vigilar" },
];

export const frequencyOptions = [
  { value: "4h", label: "cada 4 horas" },
  { value: "6h", label: "cada 6 horas" },
  { value: "8h", label: "cada 8 horas" },
  { value: "12h", label: "cada 12 horas" },
  { value: "24h", label: "cada 24 horas" },
  { value: "sos", label: "SOS" },
];

export const vigilarOptions = [
  "satO2",
  "mecánica ventilatoria",
  "cianosis",
  "fiebre",
  "tolerancia enteral",
];

// Medication interfaces
interface MedicationDose {
  dose: string;
  frequency: string;
  maxDose: string;
  dilution?: string;
  infusionRate?: string;
  notes?: string;
}

interface Medication {
  name: string;
  routes: string[];
  category: string;
  dosageCalc?: (weightKg: number, bsa?: number) => MedicationDose | number;
  dosage?: string[];
  frequency?: string[];
  indication?: string;
  standardDilution?: string;
}

// Expanded pediatric medications (~80 essential MINSAL medications)
export const commonMedications: Medication[] = [
  // A. RESPIRATORY SYSTEM
  {
    name: "Salbutamol nebulizado",
    routes: ["INH"],
    category: "Respiratorio",
    dosageCalc: (weightKg) => ({
      dose: weightKg < 20 ? "0.25 mg (2.5 ml al 0.01%)" : "0.5 mg (5 ml al 0.01%)",
      frequency: "cada 20 min x3, luego cada 4-6h",
      maxDose: "5 mg/dosis"
    })
  },
  {
    name: "Salbutamol INH (puff)",
    routes: ["INH"],
    category: "Respiratorio",
    dosage: ["2 puff", "3 puff", "4 puff"],
    frequency: ["cada 4 hrs", "cada 6 hrs", "cada 8 hrs"],
    indication: "con AEC"
  },
  {
    name: "Budesonida nebulizada",
    routes: ["INH"],
    category: "Respiratorio",
    dosageCalc: (weightKg) => ({
      dose: weightKg < 20 ? "0.25 mg" : "0.5 mg",
      frequency: "cada 12 horas",
      maxDose: "1 mg/día",
      notes: "Uso con nebulizador"
    })
  },
  {
    name: "Fluticasona",
    routes: ["INH"],
    category: "Respiratorio",
    dosage: ["125 mcg", "250 mcg"],
    frequency: ["cada 12 hrs", "cada 24 hrs"],
    indication: "con AEC"
  },
  {
    name: "Montelukast",
    routes: ["VO"],
    category: "Respiratorio",
    dosageCalc: (weightKg) => {
      if (weightKg < 15) return { dose: "4 mg", frequency: "cada 24h", maxDose: "4 mg/día" };
      if (weightKg < 40) return { dose: "5 mg", frequency: "cada 24h", maxDose: "5 mg/día" };
      return { dose: "10 mg", frequency: "cada 24h", maxDose: "10 mg/día" };
    }
  },
  {
    name: "Berodual",
    routes: ["INH"],
    category: "Respiratorio",
    dosage: ["2 puff", "3 puff"],
    frequency: ["cada 6 hrs", "cada 8 hrs"],
    indication: "intercalado con Salbutamol"
  },
  {
    name: "Bromuro de Ipratropio",
    routes: ["INH"],
    category: "Respiratorio",
    dosageCalc: () => ({
      dose: "250 mcg (1 ml)",
      frequency: "cada 6-8 horas",
      maxDose: "1 mg/día",
      notes: "Puede combinarse con salbutamol"
    })
  },
  {
    name: "Dexametasona",
    routes: ["EV", "VO"],
    category: "Respiratorio",
    dosageCalc: (weightKg) => ({
      dose: `${(0.6 * weightKg).toFixed(1)} mg`,
      frequency: "dosis única o cada 12-24h",
      maxDose: "10 mg/dosis",
      notes: "Crup: 0.6 mg/kg dosis única"
    })
  },
  {
    name: "Prednisona",
    routes: ["VO"],
    category: "Respiratorio",
    dosageCalc: (weightKg) => Math.round(1 * weightKg),
    frequency: ["cada 12 hrs", "cada 24 hrs"],
    indication: ""
  },
  {
    name: "Hidrocortisona",
    routes: ["EV"],
    category: "Respiratorio",
    dosage: ["100 mg", "200 mg"],
    frequency: ["cada 6 hrs", "cada 8 hrs", "cada 12 hrs"],
    indication: ""
  },
  {
    name: "Aminofilina",
    routes: ["EV"],
    category: "Respiratorio",
    dosageCalc: (weightKg) => ({
      dose: `Carga: ${(6 * weightKg).toFixed(1)} mg en 20 min`,
      frequency: "Infusión: 0.5-1 mg/kg/h",
      maxDose: "25 mg/kg/día",
      dilution: "Diluir en SF o SG 5%",
      infusionRate: "0.5-1 mg/kg/h"
    })
  },
  {
    name: "Adrenalina nebulizada",
    routes: ["INH"],
    category: "Respiratorio",
    dosageCalc: () => ({
      dose: "3-5 ml de adrenalina 1:1000",
      frequency: "cada 20 min PRN",
      maxDose: "5 ml/dosis",
      notes: "Para crup moderado-severo"
    })
  },

  // B. CARDIOLOGY
  {
    name: "Furosemida",
    routes: ["EV", "VO"],
    category: "Cardiología",
    dosageCalc: (weightKg) => ({
      dose: `${(1 * weightKg).toFixed(1)} mg`,
      frequency: "cada 12-24 horas",
      maxDose: "6 mg/kg/día",
      notes: "EV: bolo lento en 2-5 min"
    })
  },
  {
    name: "Espironolactona",
    routes: ["VO"],
    category: "Cardiología",
    dosageCalc: (weightKg) => ({
      dose: `${(1 * weightKg).toFixed(1)} mg`,
      frequency: "cada 12 horas",
      maxDose: "3 mg/kg/día"
    })
  },
  {
    name: "Enalapril",
    routes: ["VO"],
    category: "Cardiología",
    dosageCalc: (weightKg) => ({
      dose: `${(0.1 * weightKg).toFixed(2)} mg`,
      frequency: "cada 12-24 horas",
      maxDose: "0.5 mg/kg/día",
      notes: "Iniciar con dosis baja, titular"
    })
  },
  {
    name: "Captopril",
    routes: ["VO"],
    category: "Cardiología",
    dosageCalc: (weightKg) => ({
      dose: `${(0.5 * weightKg).toFixed(1)} mg`,
      frequency: "cada 8 horas",
      maxDose: "6 mg/kg/día"
    })
  },
  {
    name: "Digoxina",
    routes: ["EV", "VO"],
    category: "Cardiología",
    dosageCalc: (weightKg) => ({
      dose: `Digitalización: ${(10 * weightKg).toFixed(1)} mcg en 3 dosis`,
      frequency: "Mantenimiento: 5-10 mcg/kg/día c/12h",
      maxDose: "250 mcg/día",
      notes: "Monitorizar niveles y FC"
    })
  },
  {
    name: "Dopamina",
    routes: ["EV"],
    category: "Cardiología",
    dosageCalc: (weightKg) => ({
      dose: "2-5 mcg/kg/min (renal), 5-10 (inotrópico)",
      frequency: "Infusión continua",
      maxDose: "20 mcg/kg/min",
      dilution: `${(6 * weightKg).toFixed(0)} mg en 100 ml = 1 ml/h = 1 mcg/kg/min`,
      infusionRate: "5-20 mcg/kg/min",
      notes: "Monitorizar PA y FC"
    })
  },
  {
    name: "Dobutamina",
    routes: ["EV"],
    category: "Cardiología",
    dosageCalc: (weightKg) => ({
      dose: "5-10 mcg/kg/min",
      frequency: "Infusión continua",
      maxDose: "20 mcg/kg/min",
      dilution: `${(6 * weightKg).toFixed(0)} mg en 100 ml = 1 ml/h = 1 mcg/kg/min`,
      infusionRate: "5-20 mcg/kg/min"
    })
  },
  {
    name: "Milrinona",
    routes: ["EV"],
    category: "Cardiología",
    dosageCalc: (weightKg) => ({
      dose: `Carga: ${(50 * weightKg).toFixed(0)} mcg en 10-60 min`,
      frequency: "Infusión: 0.25-0.75 mcg/kg/min",
      maxDose: "1 mcg/kg/min",
      dilution: "Diluir en SF o SG 5%",
      infusionRate: "0.25-0.75 mcg/kg/min"
    })
  },

  // C. ANTIBIOTICS
  {
    name: "Amoxicilina",
    routes: ["VO"],
    category: "Antibiótico",
    dosageCalc: (weightKg) => ({
      dose: `${(25 * weightKg).toFixed(1)} mg`,
      frequency: "cada 8-12 horas",
      maxDose: "90 mg/kg/día (máx 3g/día)"
    })
  },
  {
    name: "Amoxicilina/Clavulánico",
    routes: ["EV", "VO"],
    category: "Antibiótico",
    dosageCalc: (weightKg) => ({
      dose: `${(25 * weightKg).toFixed(1)} mg (amoxicilina)`,
      frequency: "cada 8 horas",
      maxDose: "90 mg/kg/día"
    })
  },
  {
    name: "Penicilina sódica",
    routes: ["EV"],
    category: "Antibiótico",
    dosageCalc: (weightKg) => ({
      dose: `${(50000 * weightKg).toFixed(0)} UI`,
      frequency: "cada 6 horas",
      maxDose: "24 millones UI/día",
      dilution: "Diluir en SF o SG 5%, pasar en 30 min"
    })
  },
  {
    name: "Cloxacilina",
    routes: ["EV", "VO"],
    category: "Antibiótico",
    dosageCalc: (weightKg) => ({
      dose: `${(50 * weightKg).toFixed(1)} mg`,
      frequency: "cada 6 horas",
      maxDose: "200 mg/kg/día (máx 12g/día)"
    })
  },
  {
    name: "Ceftriaxona",
    routes: ["EV", "IM"],
    category: "Antibiótico",
    dosageCalc: (weightKg) => ({
      dose: `${(50 * weightKg).toFixed(1)} mg`,
      frequency: "cada 24h o c/12h en meningitis",
      maxDose: "4 g/día",
      dilution: "Diluir en SF, pasar en 30 min"
    })
  },
  {
    name: "Cefotaxima",
    routes: ["EV"],
    category: "Antibiótico",
    dosageCalc: (weightKg) => ({
      dose: `${(50 * weightKg).toFixed(1)} mg`,
      frequency: "cada 6-8 horas",
      maxDose: "12 g/día",
      notes: "Meningitis: 300 mg/kg/día"
    })
  },
  {
    name: "Vancomicina",
    routes: ["EV"],
    category: "Antibiótico",
    dosageCalc: (weightKg) => ({
      dose: `${(15 * weightKg).toFixed(1)} mg`,
      frequency: "cada 6-8 horas",
      maxDose: "60 mg/kg/día",
      dilution: "Diluir en SF o SG 5%, pasar en 60 min",
      notes: "Monitorizar niveles valle: 10-20 mcg/ml"
    })
  },
  {
    name: "Gentamicina",
    routes: ["EV", "IM"],
    category: "Antibiótico",
    dosageCalc: (weightKg) => ({
      dose: `${(5 * weightKg).toFixed(1)} mg`,
      frequency: "cada 24h (dosis única diaria)",
      maxDose: "7.5 mg/kg/día",
      notes: "Monitorizar función renal"
    })
  },
  {
    name: "Amikacina",
    routes: ["EV", "IM"],
    category: "Antibiótico",
    dosageCalc: (weightKg) => ({
      dose: `${(15 * weightKg).toFixed(1)} mg`,
      frequency: "cada 24 horas",
      maxDose: "1500 mg/día",
      notes: "Monitorizar función renal y auditiva"
    })
  },
  {
    name: "Clindamicina",
    routes: ["EV", "VO"],
    category: "Antibiótico",
    dosageCalc: (weightKg) => ({
      dose: `${(10 * weightKg).toFixed(1)} mg`,
      frequency: "cada 6-8 horas",
      maxDose: "40 mg/kg/día (máx 2.7g/día)"
    })
  },
  {
    name: "Metronidazol",
    routes: ["EV", "VO"],
    category: "Antibiótico",
    dosageCalc: (weightKg) => ({
      dose: `${(7.5 * weightKg).toFixed(1)} mg`,
      frequency: "cada 8 horas",
      maxDose: "30 mg/kg/día (máx 4g/día)"
    })
  },
  {
    name: "Meropenem",
    routes: ["EV"],
    category: "Antibiótico",
    dosageCalc: (weightKg) => ({
      dose: `${(20 * weightKg).toFixed(1)} mg`,
      frequency: "cada 8 horas",
      maxDose: "120 mg/kg/día (máx 6g/día)",
      notes: "Meningitis: 40 mg/kg c/8h"
    })
  },
  {
    name: "Azitromicina",
    routes: ["EV", "VO"],
    category: "Antibiótico",
    dosageCalc: (weightKg) => ({
      dose: `Día 1: ${(10 * weightKg).toFixed(1)} mg, luego ${(5 * weightKg).toFixed(1)} mg`,
      frequency: "cada 24h x 5 días",
      maxDose: "500 mg/día"
    })
  },
  {
    name: "Claritromicina",
    routes: ["VO"],
    category: "Antibiótico",
    dosageCalc: (weightKg) => ({
      dose: `${(7.5 * weightKg).toFixed(1)} mg`,
      frequency: "cada 12 horas",
      maxDose: "1 g/día"
    })
  },

  // D. ANTICONVULSANTS
  {
    name: "Fenitoína",
    routes: ["EV", "VO"],
    category: "Anticonvulsivante",
    dosageCalc: (weightKg) => ({
      dose: `Carga: ${(20 * weightKg).toFixed(1)} mg EV lento`,
      frequency: "Mant: 5 mg/kg/día c/12h",
      maxDose: "300 mg/día",
      dilution: "Diluir en SF, pasar en 30-60 min (máx 1 mg/kg/min)",
      notes: "Monitorizar niveles: 10-20 mcg/ml"
    })
  },
  {
    name: "Fenobarbital",
    routes: ["EV", "VO"],
    category: "Anticonvulsivante",
    dosageCalc: (weightKg) => ({
      dose: `Carga: ${(20 * weightKg).toFixed(1)} mg EV`,
      frequency: "Mant: 3-5 mg/kg/día c/12-24h",
      maxDose: "200 mg/día",
      notes: "Monitorizar niveles: 15-40 mcg/ml"
    })
  },
  {
    name: "Ácido Valproico",
    routes: ["EV", "VO"],
    category: "Anticonvulsivante",
    dosageCalc: (weightKg) => ({
      dose: `${(15 * weightKg).toFixed(1)} mg`,
      frequency: "cada 8-12 horas",
      maxDose: "60 mg/kg/día",
      notes: "Monitorizar niveles: 50-100 mcg/ml"
    })
  },
  {
    name: "Levetiracetam",
    routes: ["EV", "VO"],
    category: "Anticonvulsivante",
    dosageCalc: (weightKg) => ({
      dose: `${(20 * weightKg).toFixed(1)} mg`,
      frequency: "cada 12 horas",
      maxDose: "60 mg/kg/día (máx 3g/día)"
    })
  },
  {
    name: "Diazepam",
    routes: ["EV", "Rectal"],
    category: "Anticonvulsivante",
    dosageCalc: (weightKg) => ({
      dose: `EV: ${(0.2 * weightKg).toFixed(2)} mg / Rectal: ${(0.5 * weightKg).toFixed(1)} mg`,
      frequency: "dosis única, repetir en 5-10 min PRN",
      maxDose: "10 mg/dosis",
      notes: "EV: pasar lento en 2-3 min"
    })
  },
  {
    name: "Midazolam",
    routes: ["EV", "IN", "IM"],
    category: "Anticonvulsivante",
    dosageCalc: (weightKg) => ({
      dose: `EV: ${(0.1 * weightKg).toFixed(2)} mg / IN: ${(0.2 * weightKg).toFixed(2)} mg`,
      frequency: "dosis única, repetir PRN",
      maxDose: "10 mg/dosis",
      notes: "Intranasal: 0.2 mg/kg (máx 10 mg)"
    })
  },

  // E. ANALGESIA/SEDATION
  {
    name: "Paracetamol",
    routes: ["VO", "EV"],
    category: "Analgesia",
    dosageCalc: (weightKg) => Math.round(15 * weightKg),
    frequency: ["cada 4 hrs", "cada 6 hrs", "cada 8 hrs"],
    indication: "SOS fiebre ≥ 38°C"
  },
  {
    name: "Metamizol",
    routes: ["VO", "EV"],
    category: "Analgesia",
    dosageCalc: (weightKg) => Math.round(10 * weightKg),
    frequency: ["cada 6 hrs", "cada 8 hrs"],
    indication: "SOS"
  },
  {
    name: "Ibuprofeno",
    routes: ["VO"],
    category: "Analgesia",
    dosageCalc: (weightKg) => ({
      dose: `${(10 * weightKg).toFixed(1)} mg`,
      frequency: "cada 6-8 horas",
      maxDose: "40 mg/kg/día (máx 2.4g/día)"
    })
  },
  {
    name: "Morfina",
    routes: ["EV", "SC"],
    category: "Analgesia",
    dosageCalc: (weightKg) => ({
      dose: `Bolo: ${(0.05 * weightKg).toFixed(2)} mg EV lento`,
      frequency: "cada 4-6h PRN o infusión continua",
      maxDose: "0.1 mg/kg/dosis",
      infusionRate: "0.01-0.04 mg/kg/h",
      notes: "Titular según dolor, monitorizar respiración"
    })
  },
  {
    name: "Fentanilo",
    routes: ["EV"],
    category: "Analgesia",
    dosageCalc: (weightKg) => ({
      dose: `${(1 * weightKg).toFixed(1)} mcg EV lento`,
      frequency: "cada 2-4h PRN o infusión continua",
      maxDose: "2 mcg/kg/dosis",
      infusionRate: "0.5-2 mcg/kg/h",
      notes: "100x más potente que morfina"
    })
  },
  {
    name: "Ketamina",
    routes: ["EV", "IM"],
    category: "Analgesia/Sedación",
    dosageCalc: (weightKg) => ({
      dose: `EV: ${(0.5 * weightKg).toFixed(1)} mg / IM: ${(4 * weightKg).toFixed(1)} mg`,
      frequency: "dosis única para procedimientos",
      maxDose: "EV: 2 mg/kg, IM: 5 mg/kg",
      notes: "Efecto disociativo, preserva vía aérea"
    })
  },
  {
    name: "Tramadol",
    routes: ["EV", "VO"],
    category: "Analgesia",
    dosageCalc: (weightKg) => ({
      dose: `${(1 * weightKg).toFixed(1)} mg`,
      frequency: "cada 6-8 horas",
      maxDose: "8 mg/kg/día (máx 400 mg/día)"
    })
  },
  {
    name: "Propofol",
    routes: ["EV"],
    category: "Sedación",
    dosageCalc: (weightKg) => ({
      dose: `Inducción: ${(2.5 * weightKg).toFixed(1)} mg`,
      frequency: "Infusión: 50-200 mcg/kg/min",
      maxDose: "4 mg/kg inducción",
      infusionRate: "50-200 mcg/kg/min",
      notes: "Solo UCI/Pabellón, monitoreo avanzado"
    })
  },

  // F. GASTROINTESTINAL
  {
    name: "Omeprazol",
    routes: ["EV", "VO"],
    category: "Digestivo",
    dosageCalc: (weightKg) => ({
      dose: weightKg < 20 ? "10 mg" : "20 mg",
      frequency: "cada 24 horas",
      maxDose: "40 mg/día"
    })
  },
  {
    name: "Ranitidina",
    routes: ["EV", "VO"],
    category: "Digestivo",
    dosageCalc: (weightKg) => ({
      dose: `${(2 * weightKg).toFixed(1)} mg`,
      frequency: "cada 12 horas",
      maxDose: "300 mg/día"
    })
  },
  {
    name: "Ondansetrón",
    routes: ["EV", "VO"],
    category: "Digestivo",
    dosageCalc: (weightKg) => Math.round(0.15 * weightKg),
    frequency: ["cada 8 hrs"],
    indication: "SOS vómitos"
  },
  {
    name: "Metoclopramida",
    routes: ["EV", "VO"],
    category: "Digestivo",
    dosageCalc: (weightKg) => ({
      dose: `${(0.1 * weightKg).toFixed(2)} mg`,
      frequency: "cada 6-8 horas",
      maxDose: "0.5 mg/kg/día",
      notes: "Precaución: efectos extrapiramidales"
    })
  },
  {
    name: "Domperidona",
    routes: ["VO"],
    category: "Digestivo",
    dosageCalc: (weightKg) => ({
      dose: `${(0.25 * weightKg).toFixed(2)} mg`,
      frequency: "cada 6-8h antes de comidas",
      maxDose: "2.4 mg/kg/día (máx 80 mg/día)"
    })
  },
  {
    name: "Sales Rehidratación Oral",
    routes: ["VO"],
    category: "Digestivo",
    dosageCalc: (weightKg) => ({
      dose: `${(50 * weightKg).toFixed(0)} ml`,
      frequency: "cada evacuación líquida o vómito",
      maxDose: "No aplica",
      notes: "Plan A/B según deshidratación"
    })
  },
  {
    name: "Zinc elemental",
    routes: ["VO"],
    category: "Digestivo",
    dosageCalc: (weightKg) => ({
      dose: weightKg < 10 ? "10 mg" : "20 mg",
      frequency: "cada 24h x 10-14 días",
      maxDose: "20 mg/día",
      notes: "En diarrea aguda"
    })
  },
  {
    name: "Lactulosa",
    routes: ["VO"],
    category: "Digestivo",
    dosageCalc: (weightKg) => ({
      dose: `${(1 * weightKg).toFixed(1)} ml`,
      frequency: "cada 12-24 horas",
      maxDose: "60 ml/día",
      notes: "Ajustar según respuesta"
    })
  },
  {
    name: "Polietilenglicol",
    routes: ["VO"],
    category: "Digestivo",
    dosageCalc: (weightKg) => ({
      dose: `${(0.4 * weightKg).toFixed(1)} g`,
      frequency: "cada 24 horas",
      maxDose: "17 g/día",
      notes: "Disolver en agua o jugo"
    })
  },
  {
    name: "Salmeterol/Fluticasona",
    routes: ["INH"],
    category: "Respiratorio",
    dosage: ["250/25 mcg"],
    frequency: ["cada 12 hrs"],
    indication: ""
  }
];

export const kineOptions = [
  { value: "x1", label: "KTR x 1" },
  { value: "x2", label: "KTR x 2" },
  { value: "x3", label: "KTR x 3" },
  { value: "x3-sos", label: "KTR x 3 + SOS" },
];

export interface NursingCareItem {
  item: string;
  frequency?: string;
  details?: string;
}

export interface IVFluidTherapy {
  baseVolume: number;
  glucoseConcentration: "2.5" | "5";
  naClVolume: number;
  kClVolume: number;
  rate: number;
}

export interface MedicalOrder {
  position: string;
  regimen: string;
  customRegimen?: string;
  nursingCare: NursingCareItem[];
  ivFluidTherapy?: IVFluidTherapy;
  medications: Array<{
    name: string;
    dosage: string;
    route: string;
    frequency: string;
    indication?: string;
  }>;
  exams: string;
  interconsults: string;
  kine: string;
  observations: string;
}

// Holliday formula for fluid requirements
export const calculateHollidayFluid = (weightKg: number): number => {
  let fluid = 0;
  if (weightKg <= 10) {
    fluid = weightKg * 100;
  } else if (weightKg <= 20) {
    fluid = 1000 + (weightKg - 10) * 50;
  } else {
    fluid = 1500 + (weightKg - 20) * 20;
  }
  return Math.round(fluid);
};

// Body Surface Area formula (Mosteller)
export const calculateBSA = (heightCm: number, weightKg: number): number => {
  return Math.sqrt((heightCm * weightKg) / 3600);
};

// Fluid requirement by BSA (1500-1800 ml/m²/day)
export const calculateFluidByBSA = (bsa: number): { min: number; max: number } => {
  return {
    min: Math.round(bsa * 1500),
    max: Math.round(bsa * 1800),
  };
};

// Calculate IV fluid therapy composition
export const calculateIVFluidComposition = (therapy: IVFluidTherapy) => {
  const totalVolume = therapy.baseVolume + therapy.naClVolume + therapy.kClVolume;
  
  // Glucose content
  const glucosePercent = parseFloat(therapy.glucoseConcentration);
  const glucoseGrams = (therapy.baseVolume * glucosePercent) / 100;
  const glucoseCalories = glucoseGrams * 4; // 4 kcal/g
  
  // Sodium content (NaCl 10% = 1.7 mEq Na/ml)
  const sodiumMEq = therapy.naClVolume * 1.7;
  
  // Potassium content (KCl 10% = 1.3 mEq K/ml)
  const potassiumMEq = therapy.kClVolume * 1.3;
  
  return {
    totalVolume,
    glucoseGrams: Math.round(glucoseGrams * 10) / 10,
    calories: Math.round(glucoseCalories),
    sodiumMEq: Math.round(sodiumMEq * 10) / 10,
    potassiumMEq: Math.round(potassiumMEq * 10) / 10,
    ratePerHour: therapy.rate,
    volumePerDay: therapy.rate * 24,
  };
};

export const generateOrdersText = (orders: MedicalOrder, patientWeight?: number): string => {
  let text = "";
  let counter = 1;

  // Position
  if (orders.position) {
    const posOption = positionOptions.find(p => p.value === orders.position);
    text += `${counter}. ${posOption?.label || orders.position}\n\n`;
    counter++;
  }

  // Regimen
  if (orders.regimen) {
    const regOption = regimenOptions.find(r => r.value === orders.regimen);
    const regimenText = orders.regimen === "custom" && orders.customRegimen 
      ? orders.customRegimen 
      : regOption?.label || orders.regimen;
    text += `${counter}. Régimen: ${regimenText}\n\n`;
    counter++;
  }

  // IV Fluid Therapy
  if (orders.ivFluidTherapy) {
    const composition = calculateIVFluidComposition(orders.ivFluidTherapy);
    text += `${counter}. Fleboclisis: Suero glucosado al ${orders.ivFluidTherapy.glucoseConcentration}% ${orders.ivFluidTherapy.baseVolume} ml + NaCl 10% ${orders.ivFluidTherapy.naClVolume} ml + KCl 10% ${orders.ivFluidTherapy.kClVolume} ml a ${orders.ivFluidTherapy.rate} ml/hora\n`;
    text += `   (${composition.totalVolume} ml/día, ${composition.calories} kcal, Na+ ${composition.sodiumMEq} mEq, K+ ${composition.potassiumMEq} mEq)\n\n`;
    counter++;
  }

  // Nursing care
  if (orders.nursingCare.length > 0) {
    text += `${counter}. Cuidados enfermería\n`;
    orders.nursingCare.forEach(care => {
      const careItem = nursingCareItems.find(n => n.value === care.item);
      if (careItem) {
        const freqText = care.frequency ? ` ${frequencyOptions.find(f => f.value === care.frequency)?.label || care.frequency}` : "";
        const details = care.details ? ` (${care.details})` : "";
        text += `- ${careItem.label}${freqText}${details}\n`;
      }
    });
    text += "\n";
    counter++;
  }

  // Medications
  if (orders.medications.length > 0) {
    text += `${counter}. Medicamentos\n`;
    orders.medications.forEach(med => {
      const indication = med.indication ? ` ${med.indication}` : "";
      text += `- ${med.name} ${med.dosage} ${med.frequency} ${med.route}${indication}\n`;
    });
    text += "\n";
    counter++;
  }

  // Exams
  if (orders.exams) {
    text += `${counter}. Exámenes: ${orders.exams}\n\n`;
    counter++;
  }

  // Interconsults
  if (orders.interconsults) {
    text += `${counter}. Interconsultas: ${orders.interconsults}\n\n`;
    counter++;
  }

  // Kine
  if (orders.kine) {
    const kineOption = kineOptions.find(k => k.value === orders.kine);
    text += `${counter}. ${kineOption?.label || orders.kine}\n\n`;
    counter++;
  }

  // Observations
  if (orders.observations) {
    text += `${counter}. ${orders.observations}\n`;
    counter++;
  }

  return text.trim();
};
