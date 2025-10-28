// Laboratory Exam Panels for Pediatrics

export interface LabPanel {
  name: string;
  category: string;
  exams: string[];
  indications: string[];
  urgency: 'routine' | 'urgent' | 'stat';
}

export const labPanels: LabPanel[] = [
  // INFECTIOUS WORKUPS
  {
    name: "Sepsis Workup Completo",
    category: "Infeccioso",
    exams: [
      "Hemograma completo con recuento diferencial",
      "PCR cuantitativa",
      "Procalcitonina",
      "Hemocultivos x 2 (previo a ATB)",
      "Urocultivo",
      "Gases arteriales o venosos",
      "Lactato arterial",
      "Glucosa",
      "Electrolitos plasmáticos (Na, K, Cl)",
      "Función renal (Creatinina, BUN)",
      "Pruebas hepáticas (GOT, GPT, Bilirrubina)",
      "Coagulación (TP, TTPA, INR)",
    ],
    indications: [
      "Sospecha de sepsis",
      "Fiebre en <3 meses",
      "Shock séptico",
      "SIRS pediátrico",
    ],
    urgency: "stat",
  },
  {
    name: "Fiebre sin foco <3 meses",
    category: "Infeccioso",
    exams: [
      "Hemograma completo",
      "PCR",
      "Hemocultivos x 2",
      "Orina completa + Urocultivo",
      "Rx tórax (si sintomatología respiratoria)",
    ],
    indications: [
      "Lactante <90 días con fiebre ≥38°C",
      "Criterios de Rochester",
    ],
    urgency: "urgent",
  },
  {
    name: "Fiebre sin foco 3-36 meses",
    category: "Infeccioso",
    exams: [
      "Hemograma",
      "PCR",
      "Orina completa + Urocultivo (si fiebre >39°C)",
      "Hemocultivos (si apariencia tóxica)",
    ],
    indications: [
      "Lactante 3-36 meses con fiebre >39°C",
      "Sin foco clínico evidente",
    ],
    urgency: "urgent",
  },
  {
    name: "Panel Viral Respiratorio",
    category: "Respiratorio",
    exams: [
      "Panel viral respiratorio por PCR (VRS, Influenza A/B, Parainfluenza, Adenovirus, Metapneumovirus)",
      "Hemograma",
      "PCR",
    ],
    indications: [
      "Bronquiolitis",
      "Neumonía viral",
      "Síndrome bronquial obstructivo",
    ],
    urgency: "urgent",
  },

  // RESPIRATORY
  {
    name: "Neumonía Comunitaria",
    category: "Respiratorio",
    exams: [
      "Hemograma",
      "PCR",
      "Rx tórax AP y Lateral",
      "Hemocultivos (si hospitalización)",
      "Gases venosos (si insuficiencia respiratoria)",
    ],
    indications: [
      "Neumonía adquirida en comunidad",
      "Criterios de hospitalización",
    ],
    urgency: "urgent",
  },

  // DEHYDRATION/DIARRHEA
  {
    name: "Deshidratación Moderada-Severa",
    category: "Digestivo",
    exams: [
      "Electrolitos plasmáticos (Na, K, Cl)",
      "Glucosa",
      "BUN, Creatinina",
      "Gases venosos",
      "Hemograma",
      "Orina completa",
    ],
    indications: [
      "Deshidratación moderada (5-10%)",
      "Deshidratación severa (>10%)",
      "Diarrea con trastorno electrolítico",
    ],
    urgency: "urgent",
  },
  {
    name: "Diarrea Aguda con Sangre",
    category: "Digestivo",
    exams: [
      "Hemograma",
      "Función renal (BUN, Creatinina)",
      "Electrolitos plasmáticos",
      "Coprocultivo",
      "Test de toxina Shiga (si sospecha SHU)",
      "Frotis sanguíneo (esquistocitos)",
      "LDH, Bilirrubina",
    ],
    indications: [
      "Diarrea con sangre",
      "Sospecha de síndrome hemolítico urémico",
      "Disentería",
    ],
    urgency: "urgent",
  },

  // NEUROLOGICAL
  {
    name: "Primera Crisis Convulsiva",
    category: "Neurológico",
    exams: [
      "Glicemia capilar (HGT) inmediata",
      "Electrolitos (Na, K, Ca, Mg)",
      "Glucosa plasmática",
      "Hemograma",
      "Función renal",
      "Gases venosos (si alteración de conciencia)",
    ],
    indications: [
      "Primera crisis convulsiva",
      "Convulsión afebril",
      "Status convulsivo",
    ],
    urgency: "stat",
  },
  {
    name: "Meningitis/Meningoencefalitis",
    category: "Neurológico",
    exams: [
      "Hemograma",
      "PCR",
      "Hemocultivos x 2",
      "Punción lumbar (con TAC previo si sospecha HTIC)",
      "LCR: Citoquímico, Gram, cultivo, látex",
      "LCR: Panel viral (HSV, Enterovirus) si disponible",
      "Glucosa y electrolitos plasmáticos",
    ],
    indications: [
      "Sospecha de meningitis bacteriana",
      "Meningoencefalitis viral",
      "Fiebre + signos meníngeos",
    ],
    urgency: "stat",
  },

  // METABOLIC/ENDOCRINE
  {
    name: "Cetoacidosis Diabética",
    category: "Endocrino",
    exams: [
      "Glicemia",
      "Gases venosos",
      "Electrolitos (Na, K, Cl)",
      "BUN, Creatinina",
      "Cetonemia/Cetonuria",
      "HbA1c",
      "Hemograma",
    ],
    indications: [
      "Debut diabético",
      "Cetoacidosis diabética",
      "Hiperglicemia sintomática",
    ],
    urgency: "stat",
  },

  // HEMATOLOGIC
  {
    name: "Anemia - Estudio Inicial",
    category: "Hematología",
    exams: [
      "Hemograma completo con índices",
      "Reticulocitos",
      "Frotis sanguíneo",
      "Ferritina",
      "Fierro sérico",
      "TIBC (capacidad de fijación de hierro)",
      "Bilirrubina total y directa",
    ],
    indications: [
      "Anemia de causa no clara",
      "Hb <10 g/dL",
      "Sospecha anemia ferropriva",
    ],
    urgency: "routine",
  },

  // RENAL
  {
    name: "Infección Urinaria",
    category: "Renal",
    exams: [
      "Orina completa",
      "Urocultivo con antibiograma",
      "Hemograma (si fiebre)",
      "PCR (si fiebre)",
      "Función renal (BUN, Creatinina)",
    ],
    indications: [
      "Sospecha de ITU",
      "Fiebre sin foco en lactante",
      "Síntomas urinarios",
    ],
    urgency: "urgent",
  },

  // TRAUMA
  {
    name: "Trauma Craneoencefálico",
    category: "Trauma",
    exams: [
      "TAC cerebro sin contraste",
      "Hemograma",
      "Coagulación (TP, TTPA)",
      "Grupo y Rh",
    ],
    indications: [
      "TCE moderado-severo",
      "Glasgow <13",
      "Pérdida de conciencia",
      "Signos neurológicos focales",
    ],
    urgency: "stat",
  },

  // GENERAL PREOPERATIVE
  {
    name: "Preoperatorio Básico",
    category: "Preoperatorio",
    exams: [
      "Hemograma",
      "TP, TTPA",
      "Grupo y Rh",
      "Glicemia",
      "Creatinina",
      "Orina completa",
    ],
    indications: [
      "Cirugía electiva",
      "Procedimientos con anestesia general",
    ],
    urgency: "routine",
  },
];

// Function to get panels by category
export function getPanelsByCategory(category: string): LabPanel[] {
  return labPanels.filter(panel => panel.category === category);
}

// Function to format panel for orders
export function formatPanelForOrders(panel: LabPanel): string {
  return panel.exams.join(", ");
}

// Get all unique categories
export function getLabCategories(): string[] {
  return [...new Set(labPanels.map(p => p.category))];
}
