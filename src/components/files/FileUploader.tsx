import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { Progress } from '@/components/ui/progress';

type FileType = 'image' | 'document' | 'any';

interface FileUploaderProps {
  onUploadSuccess: (url: string, file: File) => void;
  onUploadError?: (error: Error) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
  className?: string;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'ghost';
  preview?: boolean;
  disabled?: boolean;
}

const DEFAULT_ACCEPT: Record<string, string[]> = {
  'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/plain': ['.txt'],
};

export function FileUploader({
  onUploadSuccess,
  onUploadError,
  maxFiles = 1,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = DEFAULT_ACCEPT,
  className = '',
  buttonText = 'Seleccionar archivos',
  buttonVariant = 'default',
  preview = true,
  disabled = false,
}: FileUploaderProps) {
  const [files, setFiles] = useState<Array<File & { preview?: string }>>([]);
  const [isDragging, setIsDragging] = useState(false);

  const { uploadFile, progress, isUploading } = useFileUpload({
    maxSize,
    onSuccess: (url, file) => {
      onUploadSuccess(url, file);
      setFiles([]);
    },
    onError: (error) => {
      onUploadError?.(error);
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: file.type.startsWith('image/')
            ? URL.createObjectURL(file)
            : undefined,
        })
      );

      setFiles((prev) => {
        const updatedFiles = [...prev, ...newFiles].slice(0, maxFiles);
        return updatedFiles;
      });

      setIsDragging(false);
    },
    [maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
    disabled: isUploading || disabled,
    noClick: true,
    noKeyboard: true,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const removed = newFiles.splice(index, 1)[0];
      if (removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return newFiles;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    for (const file of files) {
      try {
        await uploadFile(file);
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
  };

  // Limpiar las URLs de vista previa al desmontar
  const cleanUp = useCallback(() => {
    files.forEach((file) => file.preview && URL.revokeObjectURL(file.preview));
  }, [files]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-300 bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <Icons.upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="text-sm text-gray-600">
            {isDragActive ? (
              <p>Suelta los archivos aquí...</p>
            ) : (
              <div className="space-y-1">
                <p>
                  <button
                    type="button"
                    onClick={open}
                    className="font-medium text-primary-600 hover:text-primary-500 focus:outline-none"
                  >
                    Haz clic para subir
                  </button>{' '}
                  o arrastra y suelta
                </p>
                <p className="text-xs text-gray-500">
                  {maxFiles > 1
                    ? `Máximo ${maxFiles} archivos, hasta ${maxSize / 1024 / 1024}MB cada uno`
                    : `Máximo ${maxSize / 1024 / 1024}MB`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {files.map((file, index) => (
              <div
                key={index}
                className="relative group border rounded-md overflow-hidden bg-white"
              >
                {file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 h-32 bg-gray-50">
                    <Icons.file className="h-10 w-10 text-gray-400" />
                    <span className="mt-2 text-xs text-gray-500 truncate w-full text-center px-2">
                      {file.name}
                    </span>
                  </div>
                )}
                <div className="p-2 text-xs">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors"
                >
                  <Icons.x className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setFiles([])}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading || files.length === 0}
            >
              {isUploading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                `Subir ${files.length} archivo${files.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>

          {isUploading && progress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso de carga</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
