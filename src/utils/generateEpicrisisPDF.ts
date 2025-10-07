import { format } from "date-fns";
import { es } from "date-fns/locale";
import jsPDF from "jspdf";

interface EpicrisisData {
  patient_name: string;
  patient_rut: string;
  date_of_birth: string;
  age_at_discharge: string;
  admission_date: string;
  admission_weight: string;
  discharge_date: string;
  discharge_weight: string;
  admission_diagnosis: string;
  discharge_diagnosis: string;
  evolution_and_treatment: string;
  laboratory_exams: string;
  imaging_exams: string;
  discharge_instructions: string;
  attending_physician: string;
}

export async function generateEpicrisisPDF(data: EpicrisisData): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Helper function to add text with wrapping
  const addText = (text: string, fontSize: number = 10, isBold: boolean = false, align: 'left' | 'center' | 'right' = 'left') => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    if (align === 'center') {
      pdf.text(text, pageWidth / 2, yPosition, { align: 'center' });
    } else {
      const lines = pdf.splitTextToSize(text, contentWidth);
      pdf.text(lines, margin, yPosition);
      yPosition += lines.length * (fontSize * 0.35);
    }
    yPosition += 3;
  };

  const addLine = () => {
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;
  };

  const checkPageBreak = (requiredSpace: number = 20) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
      
      // Add header on new page
      addText('MINISTERIO DE SALUD', 12, true, 'center');
      addText('SERVICIO DE SALUD LIBERTADOR GENERAL BERNARDO O\'HIGGINS', 10, false, 'center');
      addText('HOSPITAL FRANCO RAVERA ZUNINO', 10, false, 'center');
      yPosition += 5;
      addLine();
    }
  };

  // Page 1 - Header
  addText('MINISTERIO DE SALUD', 14, true, 'center');
  addText('SERVICIO DE SALUD LIBERTADOR GENERAL BERNARDO O\'HIGGINS', 11, false, 'center');
  addText('HOSPITAL FRANCO RAVERA ZUNINO', 11, false, 'center');
  yPosition += 3;
  addText('EPICRISIS', 16, true, 'center');
  yPosition += 5;
  addLine();

  // Patient Information Table
  const tableData = [
    ['NOMBRE', data.patient_name, 'FECHA NAC.', format(new Date(data.date_of_birth), "dd/MM/yyyy", { locale: es })],
    ['RUT', data.patient_rut, 'EDAD', data.age_at_discharge],
    ['FECHA INGRESO', format(new Date(data.admission_date), "dd/MM/yyyy HH:mm", { locale: es }), 'PESO INGRESO', data.admission_weight ? `${data.admission_weight} kg` : 'N/A'],
    ['FECHA EGRESO', format(new Date(data.discharge_date), "dd/MM/yyyy HH:mm", { locale: es }), 'PESO EGRESO', data.discharge_weight ? `${data.discharge_weight} kg` : 'N/A'],
  ];

  tableData.forEach(row => {
    checkPageBreak(15);
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPosition, contentWidth / 4, 8, 'F');
    pdf.rect(margin + contentWidth / 2, yPosition, contentWidth / 4, 8, 'F');
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(row[0], margin + 2, yPosition + 5);
    pdf.text(row[2], margin + contentWidth / 2 + 2, yPosition + 5);
    
    pdf.setFont('helvetica', 'normal');
    pdf.text(row[1], margin + contentWidth / 4 + 2, yPosition + 5);
    pdf.text(row[3], margin + contentWidth * 3 / 4 + 2, yPosition + 5);
    
    pdf.rect(margin, yPosition, contentWidth, 8);
    yPosition += 8;
  });

  // Diagnoses
  checkPageBreak(20);
  yPosition += 3;
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, yPosition, contentWidth / 3, 8, 'F');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DIAGNÓSTICO DE INGRESO', margin + 2, yPosition + 5);
  pdf.setFont('helvetica', 'normal');
  const admDiagLines = pdf.splitTextToSize(data.admission_diagnosis, contentWidth * 2 / 3 - 4);
  pdf.text(admDiagLines, margin + contentWidth / 3 + 2, yPosition + 5);
  const admDiagHeight = Math.max(8, admDiagLines.length * 4);
  pdf.rect(margin, yPosition, contentWidth, admDiagHeight);
  yPosition += admDiagHeight;

  checkPageBreak(20);
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, yPosition, contentWidth / 3, 8, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.text('DIAGNÓSTICO DE EGRESO', margin + 2, yPosition + 5);
  pdf.setFont('helvetica', 'normal');
  const disDiagLines = pdf.splitTextToSize(data.discharge_diagnosis, contentWidth * 2 / 3 - 4);
  pdf.text(disDiagLines, margin + contentWidth / 3 + 2, yPosition + 5);
  const disDiagHeight = Math.max(8, disDiagLines.length * 4);
  pdf.rect(margin, yPosition, contentWidth, disDiagHeight);
  yPosition += disDiagHeight + 5;

  // Evolution and Treatment
  checkPageBreak(30);
  addText('EVOLUCIÓN Y TRATAMIENTO', 12, true);
  addLine();
  const evolutionLines = pdf.splitTextToSize(data.evolution_and_treatment, contentWidth);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  evolutionLines.forEach((line: string) => {
    checkPageBreak();
    pdf.text(line, margin, yPosition);
    yPosition += 5;
  });

  // Page 2
  pdf.addPage();
  yPosition = margin;
  
  addText('MINISTERIO DE SALUD', 14, true, 'center');
  addText('SERVICIO DE SALUD LIBERTADOR GENERAL BERNARDO O\'HIGGINS', 11, false, 'center');
  addText('HOSPITAL FRANCO RAVERA ZUNINO', 11, false, 'center');
  yPosition += 5;
  addLine();

  // Exams
  addText('EXÁMENES REALIZADOS', 12, true);
  yPosition += 3;
  
  addText('LABORATORIOS:', 11, true);
  const labLines = pdf.splitTextToSize(data.laboratory_exams || 'No se realizaron exámenes de laboratorio', contentWidth);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  labLines.forEach((line: string) => {
    checkPageBreak();
    pdf.text(line, margin, yPosition);
    yPosition += 5;
  });
  yPosition += 5;

  checkPageBreak(30);
  addText('IMAGENOLOGÍA:', 11, true);
  const imgLines = pdf.splitTextToSize(data.imaging_exams || 'No se realizaron estudios imagenológicos', contentWidth);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  imgLines.forEach((line: string) => {
    checkPageBreak();
    pdf.text(line, margin, yPosition);
    yPosition += 5;
  });
  yPosition += 5;

  // Instructions
  checkPageBreak(30);
  addText('INDICACIONES', 12, true);
  addLine();
  const instrLines = pdf.splitTextToSize(data.discharge_instructions, contentWidth);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  instrLines.forEach((line: string) => {
    checkPageBreak();
    pdf.text(line, margin, yPosition);
    yPosition += 5;
  });

  // Footer
  checkPageBreak(40);
  yPosition = pageHeight - 50;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`MÉDICO: ${data.attending_physician}`, margin, yPosition);
  
  yPosition += 30;
  pdf.setDrawColor(0);
  pdf.line(pageWidth - margin - 60, yPosition, pageWidth - margin, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text('FIRMA', pageWidth - margin - 30, yPosition + 5, { align: 'center' });

  return pdf.output('blob');
}
