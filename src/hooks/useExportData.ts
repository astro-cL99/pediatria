import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

type ExportFormat = 'xlsx' | 'pdf' | 'csv';

interface ExportOptions {
  fileName?: string;
  sheetName?: string;
  header?: string[];
  footer?: string;
  title?: string;
  subject?: string;
  author?: string;
}

export function useExportData() {
  const exportToExcel = useCallback(
    (data: any[], options: ExportOptions = {}) => {
      try {
        const {
          fileName = 'export',
          sheetName = 'Datos',
          header = [],
        } = options;

        // Crear un nuevo libro de trabajo
        const wb = XLSX.utils.book_new();
        
        // Si hay encabezados personalizados, los usamos
        let ws;
        if (header.length > 0) {
          ws = XLSX.utils.aoa_to_sheet([header, ...data]);
        } else {
          ws = XLSX.utils.json_to_sheet(data);
        }

        // Agregar la hoja al libro
        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        // Generar el archivo Excel
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        
        // Descargar el archivo
        saveAs(blob, `${fileName}.xlsx`);
        
        toast.success('Datos exportados a Excel correctamente');
        return true;
      } catch (error) {
        console.error('Error al exportar a Excel:', error);
        toast.error('Error al exportar los datos a Excel');
        return false;
      }
    },
    []
  );

  const exportToPDF = useCallback(
    (data: any[], columns: any[], options: ExportOptions = {}) => {
      try {
        const {
          fileName = 'export',
          title = 'Informe',
          subject = 'Exportación de datos',
          author = 'PediFlow',
        } = options;

        // Crear un nuevo documento PDF
        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4',
        });

        // Configurar metadatos del documento
        doc.setProperties({
          title,
          subject,
          author,
          creator: 'PediFlow',
        });

        // Agregar título
        doc.setFontSize(20);
        doc.text(title, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);

        // Agregar fecha
        const date = new Date().toLocaleString();
        doc.text(`Generado el: ${date}`, 14, 30);

        // Agregar tabla con los datos
        (doc as any).autoTable({
          head: [columns.map((col) => col.header)],
          body: data.map((row) =>
            columns.map((col) => (col.accessor ? row[col.accessor] : ''))
          ),
          startY: 40,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [41, 128, 185] },
          alternateRowStyles: { fillColor: 245 },
        });

        // Agregar pie de página
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(10);
          doc.setTextColor(150);
          doc.text(
            `Página ${i} de ${pageCount}`,
            doc.internal.pageSize.width - 30,
            doc.internal.pageSize.height - 10
          );
        }

        // Guardar el archivo
        doc.save(`${fileName}.pdf`);
        
        toast.success('Datos exportados a PDF correctamente');
        return true;
      } catch (error) {
        console.error('Error al exportar a PDF:', error);
        toast.error('Error al exportar los datos a PDF');
        return false;
      }
    },
    []
  );

  const exportToCSV = useCallback((data: any[], options: ExportOptions = {}) => {
    try {
      const { fileName = 'export' } = options;
      
      // Convertir los datos a CSV
      const header = Object.keys(data[0] || {}).join(',');
      const csvRows = data.map((row) =>
        Object.values(row)
          .map((value) => {
            // Escapar comillas y comas
            const escaped = ('' + value).replace(/"/g, '\\"');
            return `"${escaped}"`;
          })
          .join(',')
      );
      
      const csvContent = [header, ...csvRows].join('\n');
      
      // Crear y descargar el archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${fileName}.csv`);
      
      toast.success('Datos exportados a CSV correctamente');
      return true;
    } catch (error) {
      console.error('Error al exportar a CSV:', error);
      toast.error('Error al exportar los datos a CSV');
      return false;
    }
  }, []);

  return {
    exportToExcel,
    exportToPDF,
    exportToCSV,
  };
}
