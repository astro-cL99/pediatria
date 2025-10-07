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

export const nursingCareOptions = [
  { value: "csv-4", label: "CSV cada 4 horas", checked: false },
  { value: "csv-6", label: "CSV cada 6 horas", checked: true },
  { value: "csv-8", label: "CSV cada 8 horas", checked: false },
  { value: "vvp", label: "Cuidados de VVP", checked: true },
  { value: "curva-febril", label: "Curva febril", checked: true },
  { value: "hgt-sos", label: "HGT SOS", checked: false },
  { value: "o2", label: "O2 necesario para saturar ≥ 93%", checked: false },
  { value: "balance-hidrico", label: "Balance hídrico", checked: false },
  { value: "diuresis", label: "Medición de diuresis cada 12 horas", checked: false },
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

export interface MedicalOrder {
  position: string;
  regimen: string;
  customRegimen?: string;
  nursingCare: string[];
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

  // Nursing care
  if (orders.nursingCare.length > 0) {
    text += `${counter}. Cuidados enfermería\n`;
    orders.nursingCare.forEach(care => {
      const careOption = nursingCareOptions.find(n => n.value === care);
      if (careOption) {
        text += `- ${careOption.label}\n`;
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
