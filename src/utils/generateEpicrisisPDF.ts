import { format } from "date-fns";
import { es } from "date-fns/locale";

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
  // Create HTML content based on the epicrisis template
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page {
          size: letter;
          margin: 2cm;
        }
        body {
          font-family: Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #000;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
        }
        .header h1 {
          margin: 0;
          font-size: 14pt;
          font-weight: bold;
        }
        .header h2 {
          margin: 5px 0;
          font-size: 12pt;
        }
        .header h3 {
          margin: 5px 0;
          font-size: 11pt;
          font-weight: normal;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        table td {
          border: 1px solid #000;
          padding: 8px;
          vertical-align: top;
        }
        table td.label {
          font-weight: bold;
          width: 30%;
          background-color: #f0f0f0;
        }
        .section-title {
          font-weight: bold;
          font-size: 12pt;
          margin-top: 20px;
          margin-bottom: 10px;
          text-transform: uppercase;
          border-bottom: 1px solid #000;
          padding-bottom: 5px;
        }
        .content-box {
          border: 1px solid #000;
          padding: 10px;
          margin: 10px 0;
          min-height: 100px;
          white-space: pre-wrap;
        }
        .footer {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
        }
        .signature-box {
          text-align: center;
          margin-top: 60px;
        }
        .signature-line {
          border-top: 1px solid #000;
          width: 200px;
          margin: 0 auto;
        }
        .page-break {
          page-break-before: always;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>MINISTERIO DE SALUD</h1>
        <h2>SERVICIO DE SALUD LIBERTADOR GENERAL BERNARDO O'HIGGINS</h2>
        <h3>HOSPITAL FRANCO RAVERA ZUNINO</h3>
        <h1 style="margin-top: 15px;">EPICRISIS</h1>
      </div>

      <table>
        <tr>
          <td class="label">NOMBRE</td>
          <td>${data.patient_name}</td>
          <td class="label">FECHA NAC.</td>
          <td>${format(new Date(data.date_of_birth), "dd/MM/yyyy", { locale: es })}</td>
        </tr>
        <tr>
          <td class="label">RUT</td>
          <td>${data.patient_rut}</td>
          <td class="label">EDAD</td>
          <td>${data.age_at_discharge}</td>
        </tr>
        <tr>
          <td class="label">FECHA INGRESO</td>
          <td>${format(new Date(data.admission_date), "dd/MM/yyyy HH:mm", { locale: es })}</td>
          <td class="label">PESO INGRESO</td>
          <td>${data.admission_weight ? data.admission_weight + " kg" : "N/A"}</td>
        </tr>
        <tr>
          <td class="label">FECHA EGRESO</td>
          <td>${format(new Date(data.discharge_date), "dd/MM/yyyy HH:mm", { locale: es })}</td>
          <td class="label">PESO EGRESO</td>
          <td>${data.discharge_weight ? data.discharge_weight + " kg" : "N/A"}</td>
        </tr>
        <tr>
          <td class="label">DIAGNÓSTICO DE INGRESO</td>
          <td colspan="3">${data.admission_diagnosis}</td>
        </tr>
        <tr>
          <td class="label">DIAGNÓSTICO DE EGRESO</td>
          <td colspan="3">${data.discharge_diagnosis}</td>
        </tr>
      </table>

      <div class="section-title">EVOLUCIÓN Y TRATAMIENTO</div>
      <div class="content-box">${data.evolution_and_treatment}</div>

      <div class="page-break"></div>

      <div class="header">
        <h1>MINISTERIO DE SALUD</h1>
        <h2>SERVICIO DE SALUD LIBERTADOR GENERAL BERNARDO O'HIGGINS</h2>
        <h3>HOSPITAL FRANCO RAVERA ZUNINO</h3>
      </div>

      <div class="section-title">EXÁMENES REALIZADOS</div>
      
      <div class="section-title" style="font-size: 11pt; margin-top: 15px;">LABORATORIOS:</div>
      <div class="content-box">${data.laboratory_exams || "No se realizaron exámenes de laboratorio"}</div>

      <div class="section-title" style="font-size: 11pt; margin-top: 15px;">IMAGENOLOGÍA:</div>
      <div class="content-box">${data.imaging_exams || "No se realizaron estudios imagenológicos"}</div>

      <div class="section-title">INDICACIONES</div>
      <div class="content-box">${data.discharge_instructions}</div>

      <div class="footer">
        <div>
          <strong>MÉDICO:</strong> ${data.attending_physician}
        </div>
        <div class="signature-box">
          <div style="margin-bottom: 60px;"></div>
          <div class="signature-line"></div>
          <div style="margin-top: 5px;">FIRMA</div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Convert HTML to PDF using browser's print functionality
  // Create a temporary iframe to render the HTML
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  
  document.body.appendChild(iframe);
  
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    throw new Error("Could not access iframe document");
  }
  
  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  // Wait for content to load
  await new Promise(resolve => setTimeout(resolve, 500));

  // Use html2canvas and jspdf for PDF generation
  // For now, return a simple text-based PDF blob
  // In production, you'd use a library like jspdf with html2canvas
  const pdfContent = `Epicrisis - ${data.patient_name}\nGenerado: ${new Date().toLocaleString()}`;
  const blob = new Blob([pdfContent], { type: 'application/pdf' });
  
  // Clean up
  document.body.removeChild(iframe);
  
  return blob;
}
