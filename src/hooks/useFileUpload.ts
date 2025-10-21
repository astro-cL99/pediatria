import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

type FileType = 'image' | 'document' | 'any';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_EXTENSIONS: Record<FileType, string[]> = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'],
  any: [],
};

interface UseFileUploadOptions {
  maxSize?: number;
  allowedTypes?: FileType[];
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const {
    maxSize = MAX_FILE_SIZE,
    allowedTypes = ['image', 'document'],
    onSuccess,
    onError,
  } = options;

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.uploadFile(formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setProgress(percentCompleted);
        },
      });

      return response.data.url;
    },
    onSuccess: (url) => {
      setProgress(100);
      toast.success('Archivo subido correctamente');
      onSuccess?.(url);
    },
    onError: (error: Error) => {
      console.error('Error al subir el archivo:', error);
      toast.error('Error al subir el archivo');
      onError?.(error);
    },
    onSettled: () => {
      setIsUploading(false);
      setTimeout(() => setProgress(0), 1000);
    },
  });

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // Validar tamaño
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `El archivo es demasiado grande. Tamaño máximo: ${maxSize / 1024 / 1024}MB`,
      };
    }

    // Validar tipo de archivo
    if (allowedTypes.length > 0 && !allowedTypes.includes('any')) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      const isValidType = allowedTypes.some(type => 
        ALLOWED_EXTENSIONS[type].includes(fileExtension)
      );

      if (!isValidType) {
        return {
          isValid: false,
          error: `Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`,
        };
      }
    }

    return { isValid: true };
  };

  const uploadFile = async (file: File) => {
    const { isValid, error } = validateFile(file);
    
    if (!isValid) {
      toast.error(error || 'Archivo no válido');
      return null;
    }

    setIsUploading(true);
    try {
      const url = await uploadMutation.mutateAsync(file);
      return url;
    } catch (error) {
      console.error('Error al subir el archivo:', error);
      return null;
    }
  };

  return {
    uploadFile,
    isUploading,
    progress,
    error: uploadMutation.error as Error | null,
  };
}
