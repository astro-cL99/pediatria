import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { useExportData } from '@/hooks/useExportData';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type ExportFormat = 'xlsx' | 'pdf' | 'csv';

interface DataExporterProps<T> {
  data: T[];
  columns: {
    header: string;
    accessor: keyof T | ((row: T) => any);
    width?: number;
  }[];
  fileName?: string;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'ghost';
  className?: string;
  showPdf?: boolean;
  showExcel?: boolean;
  showCsv?: boolean;
  disabled?: boolean;
  onExportStart?: () => void;
  onExportComplete?: (format: ExportFormat) => void;
  onExportError?: (error: Error, format: ExportFormat) => void;
}

export function DataExporter<T>({
  data,
  columns,
  fileName = 'export',
  buttonText = 'Exportar',
  buttonVariant = 'outline',
  className = '',
  showPdf = true,
  showExcel = true,
  showCsv = true,
  disabled = false,
  onExportStart,
  onExportComplete,
  onExportError,
}: DataExporterProps<T>) {
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null);
  const { exportToExcel, exportToPDF, exportToCSV } = useExportData();

  const handleExport = async (format: ExportFormat) => {
    if (data.length === 0 || disabled) return;

    try {
      setIsExporting(format);
      onExportStart?.();

      // Preparar los datos para la exportación
      const exportData = data.map((item) => {
        const row: Record<string, any> = {};
        columns.forEach((col) => {
          const value = typeof col.accessor === 'function' 
            ? col.accessor(item)
            : item[col.accessor];
          
          // Formatear fechas y valores nulos/undefined
          if (value instanceof Date) {
            row[col.header] = value.toLocaleString();
          } else if (value === null || value === undefined) {
            row[col.header] = '';
          } else {
            row[col.header] = value;
          }
        });
        return row;
      });

      // Ejecutar la exportación según el formato
      switch (format) {
        case 'xlsx':
          await exportToExcel(exportData, {
            fileName,
            sheetName: 'Datos',
            header: columns.map((col) => col.header),
          });
          break;

        case 'pdf':
          await exportToPDF(exportData, columns, {
            fileName,
            title: fileName,
            subject: `Exportación de datos - ${new Date().toLocaleDateString()}`,
          });
          break;

        case 'csv':
          await exportToCSV(exportData, { fileName });
          break;
      }

      onExportComplete?.(format);
    } catch (error) {
      console.error(`Error al exportar a ${format.toUpperCase()}:`, error);
      onExportError?.(error as Error, format);
    } finally {
      setIsExporting(null);
    }
  };

  // Si solo hay un formato, mostrar un botón simple
  const enabledFormats = [
    showExcel && 'xlsx',
    showPdf && 'pdf',
    showCsv && 'csv',
  ].filter(Boolean) as ExportFormat[];

  if (enabledFormats.length === 0) return null;

  const formatIcon = (format: string) => {
    switch (format) {
      case 'xlsx':
        return <Icons.fileSpreadsheet className="h-4 w-4" />;
      case 'pdf':
        return <Icons.filePdf className="h-4 w-4" />;
      case 'csv':
        return <Icons.fileText className="h-4 w-4" />;
      default:
        return <Icons.download className="h-4 w-4" />;
    }
  };

  const formatLabel = (format: string) => {
    switch (format) {
      case 'xlsx':
        return 'Excel (.xlsx)';
      case 'pdf':
        return 'PDF (.pdf)';
      case 'csv':
        return 'CSV (.csv)';
      default:
        return format;
    }
  };

  if (enabledFormats.length === 1) {
    const format = enabledFormats[0];
    return (
      <Button
        variant={buttonVariant}
        onClick={() => handleExport(format)}
        disabled={disabled || isExporting === format}
        className={className}
      >
        {isExporting === format ? (
          <>
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            Exportando...
          </>
        ) : (
          <>
            {formatIcon(format)}
            <span className="ml-2">{buttonText}</span>
          </>
        )}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={buttonVariant}
          disabled={disabled || isExporting !== null}
          className={className}
        >
          {isExporting ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Icons.download className="h-4 w-4" />
              <span className="ml-2">{buttonText}</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {enabledFormats.map((format) => (
          <DropdownMenuItem
            key={format}
            onSelect={() => handleExport(format)}
            disabled={isExporting === format}
            className="flex items-center"
          >
            {formatIcon(format)}
            <span className="ml-2">{formatLabel(format)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
