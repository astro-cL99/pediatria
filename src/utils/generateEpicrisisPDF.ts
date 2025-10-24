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

  // Cargar fuente Montserrat (usando Helvetica como fallback en jsPDF)
  pdf.setFont('helvetica');

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

  const addHeader = () => {
    // Logo institucional (esquina superior izquierda)
    try {
      const logoUrl = '/images/hospital-logo.png';
      pdf.addImage(logoUrl, 'PNG', margin, yPosition, 35, 15);
    } catch (e) {
      console.warn('Logo no disponible');
    }
    
    yPosition += 5;
    
    // Textos del header - centrados
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MINISTERIO DE SALUD', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    
    pdf.setFontSize(9);
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
      // Línea separadora
      pdf.setDrawColor(0);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;
    }
  };

  // PÁGINA 1 - Header institucional
  addHeader();
  
  // EPICRISIS - título centrado y en negrita
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EPICRISIS', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 8;

  // Tabla de información del paciente - formato IDÉNTICO al PDF
  const startTableY = yPosition;
  const leftColWidth = 40;
  const rightColWidth = contentWidth - leftColWidth;
  const rowHeight = 8;

  // Definir estructura de tabla exactamente como en el PDF
  const tableStructure = [
    { label: 'NOMBRE', value: data.patient_name || '', rowSpan: 2 },
    { label: 'EDAD', value: data.age_at_discharge || 'N/A', row: 0 },
    { label: 'RUT', value: data.patient_rut || '', row: 1 },
    { label: 'FECHA NACIMIENTO', value: formatDate(data.date_of_birth), row: 1 },
    { label: 'FECHA INGRESO', value: formatDate(data.admission_date, "dd/MM/yyyy"), row: 2 },
    { label: 'PESO INGRESO', value: data.admission_weight ? `${data.admission_weight} kg` : 'N/A', row: 2 },
    { label: 'FECHA EGRESO', value: formatDate(data.discharge_date, "dd/MM/yyyy"), row: 3 },
    { label: 'PESO EGRESO', value: data.discharge_weight ? `${data.discharge_weight} kg` : 'N/A', row: 3 },
  ];

  // Dibujar tabla con estructura de 2 columnas
  const numRows = 4;
  
  for (let i = 0; i < numRows; i++) {
    const currentY = startTableY + (i * rowHeight);
    
    if (i === 0) {
      // Primera fila: NOMBRE (ocupa 2 filas) y EDAD
      // Celda NOMBRE (doble altura)
      pdf.setDrawColor(0);
      pdf.setLineWidth(0.3);
      pdf.rect(margin, currentY, leftColWidth, rowHeight * 2);
      
      // Label NOMBRE
      pdf.setFillColor(220, 220, 220);
      pdf.rect(margin, currentY, leftColWidth, 6, 'F');
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('NOMBRE', margin + 2, currentY + 4);
      
      // Valor NOMBRE
      pdf.setFont('helvetica', 'normal');
      pdf.text(data.patient_name || '', margin + 2, currentY + 10);
      
      // Celda EDAD
      pdf.rect(margin + leftColWidth, currentY, rightColWidth, rowHeight);
      pdf.setFillColor(220, 220, 220);
      pdf.rect(margin + leftColWidth, currentY, rightColWidth / 2, 6, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.text('EDAD', margin + leftColWidth + 2, currentY + 4);
      pdf.setFont('helvetica', 'normal');
      pdf.text(data.age_at_discharge || 'N/A', margin + leftColWidth + rightColWidth / 2 + 2, currentY + 4);
      
    } else if (i === 1) {
      // Segunda fila: RUT y FECHA NACIMIENTO (NOMBRE continúa)
      pdf.rect(margin + leftColWidth, currentY, rightColWidth / 2, rowHeight);
      pdf.rect(margin + leftColWidth + rightColWidth / 2, currentY, rightColWidth / 2, rowHeight);
      
      // RUT
      pdf.setFillColor(220, 220, 220);
      pdf.rect(margin + leftColWidth, currentY, rightColWidth / 2, 6, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.text('RUT', margin + leftColWidth + 2, currentY + 4);
      pdf.setFont('helvetica', 'normal');
      pdf.text(data.patient_rut || '', margin + leftColWidth + 2, currentY + 11);
      
      // FECHA NACIMIENTO
      pdf.setFillColor(220, 220, 220);
      pdf.rect(margin + leftColWidth + rightColWidth / 2, currentY, rightColWidth / 2, 6, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.text('FECHA NACIMIENTO', margin + leftColWidth + rightColWidth / 2 + 2, currentY + 4);
      pdf.setFont('helvetica', 'normal');
      pdf.text(formatDate(data.date_of_birth), margin + leftColWidth + rightColWidth / 2 + 2, currentY + 11);
      
    } else {
      // Filas 3 y 4: Formato estándar de 2 columnas
      const isRow3 = i === 2;
      const leftLabel = isRow3 ? 'FECHA INGRESO' : 'FECHA EGRESO';
      const leftValue = isRow3 ? formatDate(data.admission_date, "dd/MM/yyyy") : formatDate(data.discharge_date, "dd/MM/yyyy");
      const rightLabel = isRow3 ? 'PESO INGRESO' : 'PESO EGRESO';
      const rightValue = isRow3 
        ? (data.admission_weight ? `${data.admission_weight} kg` : 'N/A')
        : (data.discharge_weight ? `${data.discharge_weight} kg` : 'N/A');
      
      // Columna izquierda
      pdf.rect(margin, currentY, leftColWidth, rowHeight);
      pdf.setFillColor(220, 220, 220);
      pdf.rect(margin, currentY, leftColWidth, 6, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.text(leftLabel, margin + 2, currentY + 4);
      pdf.setFont('helvetica', 'normal');
      pdf.text(leftValue, margin + 2, currentY + 11);
      
      // Columna derecha
      pdf.rect(margin + leftColWidth, currentY, rightColWidth, rowHeight);
      pdf.setFillColor(220, 220, 220);
      pdf.rect(margin + leftColWidth, currentY, rightColWidth, 6, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.text(rightLabel, margin + leftColWidth + 2, currentY + 4);
      pdf.setFont('helvetica', 'normal');
      pdf.text(rightValue, margin + leftColWidth + 2, currentY + 11);
    }
  }
  
  yPosition = startTableY + (numRows * rowHeight) + 8;

  // DIAGNÓSTICO DE INGRESO
  checkPageBreak(25);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DIAGNÓSTICO DE INGRESO', margin, yPosition);
  yPosition += 6;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const admDiagLines = pdf.splitTextToSize(data.admission_diagnosis, contentWidth);
  admDiagLines.forEach((line: string) => {
    checkPageBreak();
    pdf.text(line, margin, yPosition);
    yPosition += 4.5;
  });
  yPosition += 4;

  // DIAGNÓSTICO DE EGRESO
  checkPageBreak(25);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DIAGNÓSTICO DE EGRESO', margin, yPosition);
  yPosition += 6;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const disDiagLines = pdf.splitTextToSize(data.discharge_diagnosis, contentWidth);
  disDiagLines.forEach((line: string) => {
    checkPageBreak();
    pdf.text(line, margin, yPosition);
    yPosition += 4.5;
  });
  yPosition += 4;

  // RESUMEN DE INGRESO
  if (data.resumen_ingreso) {
    checkPageBreak(30);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RESUMEN DE INGRESO', margin, yPosition);
    yPosition += 6;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const resumenLines = pdf.splitTextToSize(data.resumen_ingreso, contentWidth);
    resumenLines.forEach((line: string) => {
      checkPageBreak();
      pdf.text(line, margin, yPosition);
      yPosition += 4.5;
    });
    yPosition += 4;
  }

  // EVOLUCIÓN Y TRATAMIENTO - Nueva página
  pdf.addPage();
  yPosition = margin;
  addHeader();
  
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EVOLUCIÓN Y TRATAMIENTO', margin, yPosition);
  yPosition += 6;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const evolutionLines = pdf.splitTextToSize(data.evolution_and_treatment, contentWidth);
  evolutionLines.forEach((line: string) => {
    checkPageBreak();
    pdf.text(line, margin, yPosition);
    yPosition += 4.5;
  });

  // EXÁMENES - Nueva página
  pdf.addPage();
  yPosition = margin;
  addHeader();
  
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  // EXÁMENES DE LABORATORIO
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EXÁMENES DE LABORATORIO', margin, yPosition);
  yPosition += 6;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const labLines = pdf.splitTextToSize(data.laboratory_exams || 'No se realizaron exámenes de laboratorio', contentWidth);
  labLines.forEach((line: string) => {
    checkPageBreak();
    pdf.text(line, margin, yPosition);
    yPosition += 4.5;
  });
  yPosition += 6;

  // IMAGENOLOGÍA
  checkPageBreak(30);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('IMAGENOLOGÍA', margin, yPosition);
  yPosition += 6;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const imgLines = pdf.splitTextToSize(data.imaging_exams || 'No se realizaron estudios imagenológicos', contentWidth);
  imgLines.forEach((line: string) => {
    checkPageBreak();
    pdf.text(line, margin, yPosition);
    yPosition += 4.5;
  });
  yPosition += 6;

  // INDICACIONES
  checkPageBreak(60);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INDICACIONES', margin, yPosition);
  yPosition += 6;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const instrLines = pdf.splitTextToSize(data.discharge_instructions, contentWidth);
  instrLines.forEach((line: string) => {
    checkPageBreak(30);
    pdf.text(line, margin, yPosition);
    yPosition += 4.5;
  });

  // MÉDICO Y FIRMA - en la parte inferior
  checkPageBreak(50);
  yPosition += 15;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('MÉDICO', margin, yPosition);
  yPosition += 15;
  
  // Línea para firma
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.3);
  const signatureLineStart = margin + 50;
  const signatureLineEnd = pageWidth - margin;
  pdf.line(signatureLineStart, yPosition, signatureLineEnd, yPosition);
  
  yPosition += 5;
  pdf.setFontSize(8);
  pdf.text(data.attending_physician, signatureLineStart, yPosition);
  
  pdf.text('FIRMA', signatureLineEnd - 15, yPosition);

  return pdf.output('blob');
}
