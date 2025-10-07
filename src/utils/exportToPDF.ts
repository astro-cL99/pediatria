export async function exportAdmissionToPDF(admissionId: string) {
  // Open print dialog for the admission
  const printWindow = window.open(`/admission/${admissionId}/print`, '_blank');
  
  if (printWindow) {
    printWindow.addEventListener('load', () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    });
  }
}

export async function exportPatientDataToCSV(patientData: any[]) {
  const headers = ['Nombre', 'RUT', 'Fecha Nacimiento', 'Grupo Sanguíneo', 'Estado', 'Fecha Ingreso'];
  
  const csvContent = [
    headers.join(','),
    ...patientData.map(patient => [
      `"${patient.name}"`,
      patient.rut,
      patient.date_of_birth,
      patient.blood_type || '',
      patient.status,
      patient.admission_date
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `pacientes_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}