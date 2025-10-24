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
  resumen_ingreso?: string;
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
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  const formatDate = (dateStr: string, formatStr: string = "dd/MM/yyyy") => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), formatStr, { locale: es });
    } catch (error) {
      console.error('Error formatting date:', dateStr, error);
      return 'N/A';
    }
  };

  const addText = (text: string, fontSize: number = 10, isBold: boolean = false, align: 'left' | 'center' | 'right' = 'left') => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    if (align === 'center') {
      pdf.text(text, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += fontSize * 0.35 + 3;
    } else {
      const lines = pdf.splitTextToSize(text, contentWidth);
      pdf.text(lines, margin, yPosition);
      yPosition += lines.length * (fontSize * 0.35) + 3;
    }
  };

  const addLine = () => {
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;
  };

  const addHeader = () => {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MINISTERIO DE SALUD', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SERVICIO DE SALUD LIBERTADOR GENERAL BERNARDO O\'HIGGINS', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    
    pdf.text('HOSPITAL FRANCO RAVERA ZUNINO', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
  };

  const checkPageBreak = (requiredSpace: number = 20) => {
    if (yPosition + requiredSpace > pageHeight - margin - 30) {
      pdf.addPage();
      yPosition = margin;
      addHeader();
      addLine();
    }
  };

  // PÁGINA 1 - Header institucional
  addHeader();
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EPICRISIS', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;
  addLine();

  // Tabla de información del paciente - formato institucional
  const tableY = yPosition;
  const rowHeight = 10;
  const col1Width = contentWidth * 0.25;
  const col2Width = contentWidth * 0.25;
  const col3Width = contentWidth * 0.25;
  const col4Width = contentWidth * 0.25;
  
  // Definir datos de la tabla
  const tableRows = [
    ['NOMBRE', data.patient_name || '', 'EDAD', data.age_at_discharge || 'N/A'],
    ['RUT', data.patient_rut || '', 'FECHA NACIMIENTO', formatDate(data.date_of_birth)],
    ['FECHA INGRESO', formatDate(data.admission_date, "dd/MM/yyyy HH:mm"), 'PESO INGRESO', data.admission_weight ? `${data.admission_weight} kg` : 'N/A'],
    ['FECHA EGRESO', formatDate(data.discharge_date, "dd/MM/yyyy HH:mm"), 'PESO EGRESO', data.discharge_weight ? `${data.discharge_weight} kg` : 'N/A'],
  ];

  // Dibujar tabla
  tableRows.forEach((row, idx) => {
    const currentY = tableY + (idx * rowHeight);
    
    // Dibujar celdas con fondo gris para etiquetas
    pdf.setFillColor(220, 220, 220);
    pdf.rect(margin, currentY, col1Width, rowHeight, 'FD');
    pdf.rect(margin + col1Width + col2Width, currentY, col3Width, rowHeight, 'FD');
    
    // Dibujar celdas de valores
    pdf.setFillColor(255, 255, 255);
    pdf.rect(margin + col1Width, currentY, col2Width, rowHeight, 'D');
    pdf.rect(margin + col1Width + col2Width + col3Width, currentY, col4Width, rowHeight, 'D');
    
    // Texto
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(row[0], margin + 2, currentY + 6.5);
    pdf.text(row[2], margin + col1Width + col2Width + 2, currentY + 6.5);
    
    pdf.setFont('helvetica', 'normal');
    pdf.text(row[1], margin + col1Width + 2, currentY + 6.5);
    pdf.text(row[3], margin + col1Width + col2Width + col3Width + 2, currentY + 6.5);
  });
  
  yPosition = tableY + (tableRows.length * rowHeight) + 8;

  // DIAGNÓSTICO DE INGRESO - formato institucional
  checkPageBreak(25);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DIAGNÓSTICO DE INGRESO', margin, yPosition);
  yPosition += 6;
  
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.3);
  pdf.rect(margin, yPosition, contentWidth, 15);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const admDiagLines = pdf.splitTextToSize(data.admission_diagnosis, contentWidth - 4);
  pdf.text(admDiagLines, margin + 2, yPosition + 5);
  yPosition += 15 + 6;

  // DIAGNÓSTICO DE EGRESO - formato institucional
  checkPageBreak(25);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DIAGNÓSTICO DE EGRESO', margin, yPosition);
  yPosition += 6;
  
  pdf.rect(margin, yPosition, contentWidth, 15);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const disDiagLines = pdf.splitTextToSize(data.discharge_diagnosis, contentWidth - 4);
  pdf.text(disDiagLines, margin + 2, yPosition + 5);
  yPosition += 15 + 8;

  // RESUMEN DE INGRESO - formato institucional
  if (data.resumen_ingreso) {
    checkPageBreak(30);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RESUMEN DE INGRESO', margin, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const resumenLines = pdf.splitTextToSize(data.resumen_ingreso, contentWidth);
    resumenLines.forEach((line: string) => {
      checkPageBreak();
      pdf.text(line, margin, yPosition);
      yPosition += 5;
    });
    yPosition += 5;
  }

  // EVOLUCIÓN Y TRATAMIENTO - Nueva página
  pdf.addPage();
  yPosition = margin;
  addHeader();
  addLine();
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EVOLUCIÓN Y TRATAMIENTO', margin, yPosition);
  yPosition += 7;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const evolutionLines = pdf.splitTextToSize(data.evolution_and_treatment, contentWidth);
  evolutionLines.forEach((line: string) => {
    checkPageBreak();
    pdf.text(line, margin, yPosition);
    yPosition += 5;
  });

  // EXÁMENES - Nueva página
  pdf.addPage();
  yPosition = margin;
  addHeader();
  addLine();

  // EXÁMENES DE LABORATORIO
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EXÁMENES DE LABORATORIO', margin, yPosition);
  yPosition += 7;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const labLines = pdf.splitTextToSize(data.laboratory_exams || 'No se realizaron exámenes de laboratorio', contentWidth);
  labLines.forEach((line: string) => {
    checkPageBreak();
    pdf.text(line, margin, yPosition);
    yPosition += 5;
  });
  yPosition += 8;

  // IMAGENOLOGÍA
  checkPageBreak(30);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('IMAGENOLOGÍA', margin, yPosition);
  yPosition += 7;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const imgLines = pdf.splitTextToSize(data.imaging_exams || 'No se realizaron estudios imagenológicos', contentWidth);
  imgLines.forEach((line: string) => {
    checkPageBreak();
    pdf.text(line, margin, yPosition);
    yPosition += 5;
  });
  yPosition += 8;

  // INDICACIONES - Nueva página si es necesario
  checkPageBreak(60);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INDICACIONES', margin, yPosition);
  yPosition += 7;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const instrLines = pdf.splitTextToSize(data.discharge_instructions, contentWidth);
  instrLines.forEach((line: string) => {
    checkPageBreak(30);
    pdf.text(line, margin, yPosition);
    yPosition += 5;
  });

  // MÉDICO Y FIRMA - formato institucional
  checkPageBreak(50);
  yPosition += 10;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('MÉDICO', margin, yPosition);
  yPosition += 15;
  
  // Línea para firma
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.3);
  pdf.line(margin + 50, yPosition, pageWidth - margin, yPosition);
  
  yPosition += 5;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.attending_physician, margin + 50, yPosition);
  
  yPosition += 2;
  pdf.text('FIRMA', pageWidth - margin - 15, yPosition);

  return pdf.output('blob');
}
