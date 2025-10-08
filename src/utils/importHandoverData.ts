import { supabase } from "@/integrations/supabase/client";

// Datos extraídos del Excel de entrega de turno
const patientsData = [
  // Cama 501
  {
    room: "501",
    bed: 1,
    name: "Aymara Urrea",
    dateOfBirth: "2025-04-27",
    rut: "28831430-6",
    diagnoses: ["DBP Severa O2 dependiente (fio2 30%)", "Sd Dismorfico", "Hepatoonfalocele operado (05/06/25)", "Coleccion suprahepatica", "pielectasia renal izquierda leve (5mm)"],
    admissionDate: "2025-04-14",
    viralPanel: "Negativo (20/09)",
    oxygen: { type: "CPAP", peep: 4, fio2: 30 },
    respiratoryScore: null,
    pending: "Bradicardia + desaturación 23/09",
    plan: "Mantener BH -10,-20. CPAP 4. RX torax lista. Eco abdominal: Persistencia de colección líquida suprahepática",
  },
  {
    room: "501",
    bed: 3,
    name: "Richar Ygaiman",
    dateOfBirth: "2022-10-02", // 3 años
    rut: "27688977-K",
    diagnoses: ["Enfermedad por anticuerpos anti MOG", "Compromiso frontoparietal occipito temporal", "Edema cerebral", "Microhemorragia cerebelosa izquierda", "Sx piramidal hemicuerpo izquierdo"],
    admissionDate: "2025-05-31",
    viralPanel: "Negativo",
    oxygen: { type: "CPAP", peep: 5, fio2: 21, uso: "Nocturno" },
    respiratoryScore: null,
    pending: null,
    plan: "Enteral 50% en progresión. En proceso de decanulación. Polisomnografía en la noche",
  },
  // Cama 502
  {
    room: "502",
    bed: 1,
    name: "Damian Caceres",
    dateOfBirth: "2025-02-28",
    rut: "28729622-3",
    diagnoses: ["Encefalopatia hipoxico isquemica", "LET", "GTT (26/08)"],
    admissionDate: "2025-02-28",
    viralPanel: null,
    oxygen: { type: "CPAP", peep: 4, fio2: 21 },
    respiratoryScore: null,
    pending: "ventana x 12 hrs",
    plan: "PNI 6m, FAE, cefadroxilo, atropina SL, LET firmado",
  },
  {
    room: "502",
    bed: 2,
    name: "Iann Chandia",
    dateOfBirth: "2024-11-20",
    rut: "28611858-5",
    diagnoses: ["Síndrome hipotónico central", "Síndrome Convulsivo en estudio", "Hidronefrosis derecha severa en uroprofilaxis", "DBP O2 dependiente severa"],
    admissionDate: "2024-11-20",
    viralPanel: null,
    oxygen: { type: "CPAP", peep: 4, fio2: 22 },
    respiratoryScore: null,
    pending: "ventanas 0,1-0,2",
    plan: "Gastroclisis, revisar hidratación, fiebre. ATB completo",
  },
  {
    room: "502",
    bed: 3,
    name: "Maximiliano Bustamante",
    dateOfBirth: "2018-10-02", // 7 años
    rut: "26119762-6",
    diagnoses: ["GTT disfuncional (Julio/2025)", "RNPT extremo", "Paralisis cerebral espástica"],
    admissionDate: "2025-09-28",
    viralPanel: null,
    oxygen: null,
    respiratoryScore: null,
    pending: "Alpar desde 29/09, GTT caida libre. Pendiente requiere SNY",
    plan: "D3 Ampi-sulbactam. GGT junio 25 Tx deglucion",
  },
  // Cama 503
  {
    room: "503",
    bed: 3,
    name: "Matilda Abaitua",
    dateOfBirth: "2017-10-02", // 8 años
    rut: "25573146-7",
    diagnoses: ["TPSV", "Epilepsia descompensada", "WPW", "Epilepsia"],
    admissionDate: "2025-09-28",
    viralPanel: "RNV +",
    oxygen: { type: "AM" },
    respiratoryScore: null,
    pending: null,
    plan: "Cardiologia: Control con Holter, Mantener Atenolol, No DAR Risperidona ni samexid",
  },
  // Cama 504
  {
    room: "504",
    bed: 1,
    name: "Renato Rivera",
    dateOfBirth: "2014-10-02", // 11 años
    rut: "24634911-8",
    diagnoses: ["Polirradiculoneuropatia", "Obs. Sd. Guillian Barre"],
    admissionDate: "2025-10-01",
    viralPanel: null,
    oxygen: null,
    respiratoryScore: null,
    pending: null,
    plan: "Ev x neurologia, lab control",
  },
  {
    room: "504",
    bed: 2,
    name: "Lucrecia Vergara",
    dateOfBirth: "2019-10-02", // 6 años
    rut: "26577711-2",
    diagnoses: ["Glomerulopatia en estudio", "Obs Sd nefrotico impuro", "Hipertensión arterial secundaria", "Hipercolesterolemia", "Doble sistema excretor derecho operado"],
    admissionDate: "2025-09-26",
    viralPanel: null,
    oxygen: null,
    respiratoryScore: null,
    pending: "nefro 30/09 ajustó tratamiento. PA P95 + 12. BH neutro a negativo",
    plan: "Furosemida 20mg c/8hrs VO + Amlodipino. Biopsia renal 09/10. Control lab completo",
  },
  // Cama 505
  {
    room: "505",
    bed: 1,
    name: "Antonella Morales",
    dateOfBirth: "2021-10-02", // 4 años
    rut: "27566042-6",
    diagnoses: ["Sepsis foco urinario", "Nefronia derecha", "Disfuncion vesical", "Hipotonia", "RDSM"],
    admissionDate: "2025-09-21",
    viralPanel: "Negativo",
    oxygen: null,
    respiratoryScore: null,
    pending: "MAL CONTROL DE ESFINTER",
    plan: "D10/14 EV Cefotaxima. Eco renal Pre y Post Miccional. IC nefrología e infectología",
  },
];

export async function importHandoverData() {
  const results = {
    success: 0,
    errors: [] as string[],
  };

  for (const patientData of patientsData) {
    try {
      // 1. Create or find patient
      const { data: existingPatient } = await supabase
        .from("patients")
        .select("id")
        .eq("rut", patientData.rut)
        .single();

      let patientId: string;

      if (existingPatient) {
        patientId = existingPatient.id;
      } else {
        const { data: newPatient, error: patientError } = await supabase
          .from("patients")
          .insert({
            name: patientData.name,
            rut: patientData.rut,
            date_of_birth: patientData.dateOfBirth,
            status: "active",
            admission_date: patientData.admissionDate,
          })
          .select()
          .single();

        if (patientError) throw patientError;
        patientId = newPatient.id;
      }

      // 2. Create or find admission
      const { data: existingAdmission } = await supabase
        .from("admissions")
        .select("id")
        .eq("patient_id", patientId)
        .eq("status", "active")
        .single();

      let admissionId: string;

      if (existingAdmission) {
        admissionId = existingAdmission.id;
        
        // Update admission with new data
        await supabase
          .from("admissions")
          .update({
            admission_diagnoses: patientData.diagnoses,
            oxygen_requirement: patientData.oxygen,
            respiratory_score: patientData.respiratoryScore,
            viral_panel: patientData.viralPanel,
            pending_tasks: patientData.pending,
            treatment_plan: patientData.plan,
          })
          .eq("id", admissionId);
      } else {
        const { data: newAdmission, error: admissionError } = await supabase
          .from("admissions")
          .insert({
            patient_id: patientId,
            admission_date: patientData.admissionDate,
            status: "active",
            admission_diagnoses: patientData.diagnoses,
            oxygen_requirement: patientData.oxygen,
            respiratory_score: patientData.respiratoryScore,
            viral_panel: patientData.viralPanel,
            pending_tasks: patientData.pending,
            treatment_plan: patientData.plan,
          })
          .select()
          .single();

        if (admissionError) throw admissionError;
        admissionId = newAdmission.id;
      }

      // 3. Create bed assignment
      // First, deactivate any existing bed assignment for this patient
      await supabase
        .from("bed_assignments")
        .update({ is_active: false, discharged_at: new Date().toISOString() })
        .eq("patient_id", patientId)
        .eq("is_active", true);

      // Create new bed assignment
      const { error: bedError } = await supabase
        .from("bed_assignments")
        .insert({
          patient_id: patientId,
          admission_id: admissionId,
          room_number: patientData.room,
          bed_number: patientData.bed,
          is_active: true,
        });

      if (bedError) throw bedError;

      results.success++;
    } catch (error: any) {
      results.errors.push(`${patientData.name}: ${error.message}`);
      console.error(`Error processing ${patientData.name}:`, error);
    }
  }

  return results;
}
