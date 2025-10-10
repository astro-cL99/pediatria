import { supabase } from "@/integrations/supabase/client";
import { ParsedPatient } from "./parseHandoverExcel";

export async function importHandoverData(patientsData: ParsedPatient[]) {
  const results = {
    success: 0,
    errors: [] as string[],
  };

  console.log(`Starting import of ${patientsData.length} patients`);
  console.log('Rooms to import:', [...new Set(patientsData.map(p => p.room))].sort());

  for (let idx = 0; idx < patientsData.length; idx++) {
    const patientData = patientsData[idx];
    console.log(`[${idx + 1}/${patientsData.length}] Importing ${patientData.name} (${patientData.rut}) in room ${patientData.room}`);
    
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
      console.log(`[${idx + 1}/${patientsData.length}] ✓ Successfully imported ${patientData.name} in room ${patientData.room}`);
    } catch (error: any) {
      const errorMsg = `Sala ${patientData.room} - ${patientData.name}: ${error.message}`;
      results.errors.push(errorMsg);
      console.error(`[${idx + 1}/${patientsData.length}] ✗ Error processing ${patientData.name}:`, error);
    }
  }

  console.log(`Import complete: ${results.success} successful, ${results.errors.length} errors`);
  return results;
}
