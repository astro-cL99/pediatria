import * as XLSX from "xlsx";

export function exportHandoverToExcel(bedAssignments: any[]) {
  const today = new Date().toLocaleDateString("es-CL");

  // Organize beds by room
  const roomMap = new Map<string, any[]>();
  bedAssignments.forEach((bed) => {
    const room = bed.room_number;
    if (!roomMap.has(room)) {
      roomMap.set(room, []);
    }
    roomMap.get(room)!.push(bed);
  });

  // Prepare data for Excel
  const excelData: any[] = [];

  // Sort rooms
  const sortedRooms = Array.from(roomMap.keys()).sort();

  sortedRooms.forEach((room) => {
    const beds = roomMap.get(room)!.sort((a, b) => a.bed_number - b.bed_number);

    beds.forEach((bed) => {
      const patient = bed.patient;
      const admission = bed.admission;

      const calculateAge = (dateOfBirth: string) => {
        const today = new Date();
        const birth = new Date(dateOfBirth);
        const years = today.getFullYear() - birth.getFullYear();
        const months = today.getMonth() - birth.getMonth();
        
        if (years < 1) {
          return `${months + (years * 12)} meses`;
        }
        return `${years} años`;
      };

      const getDaysHospitalized = (admissionDate: string) => {
        const today = new Date();
        const admission = new Date(admissionDate);
        const diffTime = Math.abs(today.getTime() - admission.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
      };

      excelData.push({
        Cama: `${room}-${bed.bed_number}`,
        Nombre: patient.name,
        Edad: calculateAge(patient.date_of_birth),
        RUT: patient.rut,
        "Días Hospitalizado": getDaysHospitalized(admission.admission_date),
        "Fecha Ingreso": new Date(admission.admission_date).toLocaleDateString("es-CL"),
        "Diagnóstico Principal": admission.admission_diagnoses?.[0] || "",
        "Panel Viral": admission.viral_panel || "No realizado",
        "Requerimiento O2": admission.oxygen_requirement
          ? (() => {
              try {
                return typeof admission.oxygen_requirement === 'string' 
                  ? admission.oxygen_requirement 
                  : JSON.stringify(admission.oxygen_requirement);
              } catch (e) {
                console.error('Error stringifying oxygen_requirement:', e);
                return 'Error al procesar';
              }
            })()
          : "No",
        "Score Respiratorio": admission.respiratory_score || "",
        Antibióticos: admission.antibiotics
          ? (() => {
              try {
                return typeof admission.antibiotics === 'string'
                  ? admission.antibiotics
                  : JSON.stringify(admission.antibiotics);
              } catch (e) {
                console.error('Error stringifying antibiotics:', e);
                return 'Error al procesar';
              }
            })()
          : "No",
        Pendientes: admission.pending_tasks || "",
        Alergias: patient.allergies || "Ninguna",
      });
    });
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const colWidths = [
    { wch: 10 }, // Cama
    { wch: 25 }, // Nombre
    { wch: 10 }, // Edad
    { wch: 15 }, // RUT
    { wch: 15 }, // Días
    { wch: 15 }, // Fecha Ingreso
    { wch: 40 }, // Diagnóstico
    { wch: 20 }, // Panel Viral
    { wch: 20 }, // O2
    { wch: 15 }, // Score
    { wch: 25 }, // Antibióticos
    { wch: 40 }, // Pendientes
    { wch: 20 }, // Alergias
  ];
  worksheet["!cols"] = colWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Entrega ${today}`);

  // Download
  XLSX.writeFile(
    workbook,
    `entrega_turno_${new Date().toISOString().split("T")[0]}.xlsx`
  );
}
