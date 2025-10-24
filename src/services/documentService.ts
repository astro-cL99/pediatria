import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import type { 
  DocumentMetadata, 
  DocumentInsert, 
  DocumentResponse, 
  DocumentListResponse,
  DocumentDeleteResponse
} from '@/types/documents';

export type { 
  DocumentMetadata, 
  DocumentInsert, 
  DocumentResponse, 
  DocumentListResponse,
  DocumentDeleteResponse
};

/**
 * Sube un documento al almacenamiento y guarda sus metadatos en la base de datos
 */
export const uploadDocument = async (
  file: File,
  patientId: string,
  metadata: Partial<DocumentInsert>
): Promise<DocumentResponse> => {
  try {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de archivo no permitido');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `patient-${patientId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('patient-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: { user } } = await supabase.auth.getUser();

    const documentData: any = {
      patient_id: patientId,
      title: metadata.title || file.name,
      description: metadata.description || null,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      file_path: filePath,
      document_type: metadata.document_type || 'other',
      extracted_data: null,
      confidence_score: null,
      admission_id: metadata.admission_id || null,
      uploaded_by: user?.id || null,
      status: 'pending'
    };

    const { data: document, error: dbError } = await supabase
      .from('clinical_documents')
      .insert(documentData)
      .select()
      .single();

    if (dbError) {
      await supabase.storage
        .from('patient-documents')
        .remove([filePath]);
      throw dbError;
    }

    return { 
      data: document as any, 
      error: null 
    };
  } catch (error) {
    console.error('Error al subir el documento:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Error al subir el documento' 
    };
  }
};

/**
 * Obtiene todos los documentos de un paciente
 */
export const getPatientDocuments = async (patientId: string): Promise<DocumentListResponse> => {
  try {
    const { data, error } = await supabase
      .from('clinical_documents')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return { 
      data: data as any, 
      error: null 
    };
  } catch (error) {
    console.error('Error al obtener los documentos del paciente:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Error al obtener los documentos' 
    };
  }
};

/**
 * Obtiene un documento por su ID
 */
export const getDocumentById = async (documentId: string): Promise<DocumentResponse> => {
  try {
    const { data, error } = await supabase
      .from('clinical_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error) throw error;
    
    if (!data) {
      throw new Error('Documento no encontrado');
    }
    
    return { 
      data: data as any, 
      error: null 
    };
  } catch (error) {
    console.error('Error al obtener el documento:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Error al obtener el documento' 
    };
  }
};

/**
 * Obtiene la URL pública de un documento
 */
export const getDocumentUrl = (storagePath: string): string => {
  const { data: { publicUrl } } = supabase.storage
    .from('patient-documents')
    .getPublicUrl(storagePath, {
      download: false
    });
  
  return publicUrl;
};

/**
 * Elimina un documento del almacenamiento y su registro de la base de datos
 */
export const deleteDocument = async (documentId: string, storagePath: string): Promise<DocumentDeleteResponse> => {
  try {
    const { error: storageError } = await supabase.storage
      .from('patient-documents')
      .remove([storagePath]);

    if (storageError) {
      console.error('Error al eliminar el archivo del almacenamiento:', storageError);
      throw storageError;
    }

    const { error: dbError } = await supabase
      .from('clinical_documents')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      console.error('Error al eliminar el registro de la base de datos:', dbError);
      throw dbError;
    }

    return { 
      success: true, 
      error: undefined 
    };
  } catch (error) {
    console.error('Error al eliminar el documento:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al eliminar el documento' 
    };
  }
};

/**
 * Actualiza los metadatos de un documento
 */
export const updateDocument = async (
  documentId: string, 
  updates: Partial<DocumentMetadata>
): Promise<DocumentResponse> => {
  try {
    const { data, error } = await supabase
      .from('clinical_documents')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;
    
    return { 
      data: data as any, 
      error: null 
    };
  } catch (error) {
    console.error('Error al actualizar el documento:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Error al actualizar el documento' 
    };
  }
};
