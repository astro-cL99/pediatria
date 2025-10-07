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

export const commonMedications = [
  {
    name: "Paracetamol",
    routes: ["VO", "EV"],
    dosageCalc: (weightKg: number) => Math.round(15 * weightKg), // 15mg/kg
    frequency: ["cada 4 hrs", "cada 6 hrs", "cada 8 hrs"],
    indication: "SOS fiebre ≥ 38°C",
  },
  {
    name: "Metamizol",
    routes: ["VO", "EV"],
    dosageCalc: (weightKg: number) => Math.round(10 * weightKg), // 10mg/kg
    frequency: ["cada 6 hrs", "cada 8 hrs"],
    indication: "SOS",
  },
  {
    name: "Salbutamol",
    routes: ["INH"],
    dosage: ["2 puff", "3 puff", "4 puff"],
    frequency: ["cada 4 hrs", "cada 6 hrs", "cada 8 hrs"],
    indication: "con AEC",
  },
  {
    name: "Prednisona",
    routes: ["VO"],
    dosageCalc: (weightKg: number) => Math.round(1 * weightKg), // 1mg/kg
    frequency: ["cada 12 hrs", "cada 24 hrs"],
    indication: "",
  },
  {
    name: "Hidrocortisona",
    routes: ["EV"],
    dosage: ["100 mg", "200 mg"],
    frequency: ["cada 6 hrs", "cada 8 hrs", "cada 12 hrs"],
    indication: "",
  },
  {
    name: "Berodual",
    routes: ["INH"],
    dosage: ["2 puff", "3 puff"],
    frequency: ["cada 6 hrs", "cada 8 hrs"],
    indication: "intercalado con Salbutamol",
  },
  {
    name: "Fluticasona",
    routes: ["INH"],
    dosage: ["125 mcg", "250 mcg"],
    frequency: ["cada 12 hrs", "cada 24 hrs"],
    indication: "con AEC",
  },
  {
    name: "Salmeterol/Fluticasona",
    routes: ["INH"],
    dosage: ["250/25 mcg"],
    frequency: ["cada 12 hrs"],
    indication: "",
  },
  {
    name: "Ondansetrón",
    routes: ["EV", "VO"],
    dosageCalc: (weightKg: number) => Math.round(0.15 * weightKg), // 0.15mg/kg
    frequency: ["cada 8 hrs"],
    indication: "SOS vómitos",
  },
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
