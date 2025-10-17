import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { processDocument } from './documentProcessingService';
import type { 
  DocumentMetadata, 
  DocumentInsert, 
  DocumentResponse, 
  DocumentListResponse,
  DocumentDeleteResponse
} from '@/types/documents';

declare module '@supabase/supabase-js' {
  interface Database {
    public: {
      Tables: {
        clinical_documents: {
          Row: DocumentMetadata;
          Insert: DocumentInsert;
          Update: Partial<DocumentInsert>;
        };
      };
    };
  }
}

/**
 * Sube un documento al almacenamiento y guarda sus metadatos en la base de datos
 */
export const uploadDocument = async (
  file: File,
  patientId: string,
  metadata: Omit<DocumentInsert, 'file_name' | 'file_type' | 'file_size' | 'file_path' | 'patient_id' | 'uploaded_by'>
): Promise<DocumentResponse> => {
  try {
    // Validar el tipo de archivo
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

    // Generar un nombre de archivo único
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `patient-${patientId}/${fileName}`;

    // Subir el archivo a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('patient-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser();

    // Preparar los datos del documento
    const documentData: DocumentInsert = {
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

    // Guardar los metadatos en la base de datos
    const { data: document, error: dbError } = await supabase
      .from('clinical_documents')
      .insert(documentData)
      .select()
      .single();

    if (dbError) {
      // Si hay un error, eliminar el archivo subido
      await supabase.storage
        .from('patient-documents')
        .remove([filePath]);
      
      throw dbError;
    }

    // Iniciar el procesamiento del documento en segundo plano
    if (document) {
      try {
        await processDocument({
          documentId: document.id,
          fileInfo: {
            name: file.name,
            type: file.type,
            size: file.size
          }
        });
      } catch (processError) {
        console.error('Error en el procesamiento en segundo plano:', processError);
        // No fallar la carga si el procesamiento falla
      }
    }

    return { 
      data: document as DocumentMetadata, 
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
      data: data as unknown as DocumentMetadata[], 
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
      data: data as unknown as DocumentMetadata, 
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
    // Eliminar el archivo del almacenamiento
    const { error: storageError } = await supabase.storage
      .from('patient-documents')
      .remove([storagePath]);

    if (storageError) {
      console.error('Error al eliminar el archivo del almacenamiento:', storageError);
      throw storageError;
    }

    // Eliminar el registro de la base de datos
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
      data: data as unknown as DocumentMetadata, 
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

/**
 * Actualiza la firma de un documento
 */
export const updateDocumentSignature = async (
  documentId: string, 
  signatureData: string,
  signedBy: string
): Promise<DocumentResponse> => {
  try {
    const { data, error } = await supabase
      .from('clinical_documents')
      .update({
        signature_data: signatureData,
        signed_by: signedBy,
        signed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;
    
    if (!data) {
      throw new Error('No se pudo actualizar la firma del documento');
    }
    
    return { 
      data: data as unknown as DocumentMetadata, 
      error: null 
    };
  } catch (error) {
    console.error('Error al actualizar la firma del documento:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Error al actualizar la firma del documento' 
    };
  }
};

/**
 * Obtiene los documentos firmados por un usuario
 */
export const getSignedDocumentsByUser = async (userId: string): Promise<DocumentListResponse> => {
  try {
    const { data, error } = await supabase
      .from('clinical_documents')
      .select('*')
      .eq('signed_by', userId)
      .order('signed_at', { ascending: false });

    if (error) throw error;
    
    return { 
      data: data as unknown as DocumentMetadata[], 
      error: null 
    };
  } catch (error) {
    console.error('Error al obtener los documentos firmados:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Error al obtener los documentos firmados' 
    };
  }
};

/**
 * Obtiene los documentos pendientes de firma para un paciente
 */
export const getPendingSignatureDocuments = async (patientId: string): Promise<DocumentListResponse> => {
  try {
    const { data, error } = await supabase
      .from('clinical_documents')
      .select('*')
      .eq('patient_id', patientId)
      .is('signed_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return { 
      data: data as unknown as DocumentMetadata[], 
      error: null 
    };
  } catch (error) {
    console.error('Error al obtener los documentos pendientes de firma:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Error al obtener los documentos pendientes de firma' 
    };
  }
};
