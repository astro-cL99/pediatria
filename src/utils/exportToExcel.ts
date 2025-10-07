import * as XLSX from "xlsx";

export function exportPatientsToExcel(patients: any[]) {
  const worksheet = XLSX.utils.json_to_sheet(
    patients.map((p) => ({
      Nombre: p.name,
      RUT: p.rut,
      "Fecha Nacimiento": p.date_of_birth,
      "Grupo Sanguíneo": p.blood_type || "",
      Estado: p.status,
      "Fecha Ingreso": p.admission_date || "",
      Alergias: p.allergies || "",
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Pacientes");

  XLSX.writeFile(workbook, `pacientes_${new Date().toISOString().split("T")[0]}.xlsx`);
}

export function exportAdmissionsToExcel(admissions: any[]) {
  const worksheet = XLSX.utils.json_to_sheet(
    admissions.map((a) => ({
      "ID Admisión": a.id,
      Paciente: a.patient_name,
      "Fecha Ingreso": a.admission_date,
      "Fecha Egreso": a.discharge_date || "Activo",
      "Diagnóstico Principal": a.admission_diagnoses?.[0] || "",
      Estado: a.status,
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Ingresos");

  XLSX.writeFile(workbook, `ingresos_${new Date().toISOString().split("T")[0]}.xlsx`);
}

export function exportDailyCensusToExcel(patients: any[]) {
  const today = new Date().toLocaleDateString("es-CL");
  const activePatients = patients.filter((p) => p.status === "active");

  const worksheet = XLSX.utils.json_to_sheet(
    activePatients.map((p, index) => ({
      "#": index + 1,
      Nombre: p.name,
      RUT: p.rut,
      Edad: p.age || "",
      "Días Hospitalizado": p.days_hospitalized || "",
      "Diagnóstico Principal": p.main_diagnosis || "",
      Alergias: p.allergies || "Ninguna",
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Censo ${today}`);

  XLSX.writeFile(workbook, `censo_diario_${new Date().toISOString().split("T")[0]}.xlsx`);
}
