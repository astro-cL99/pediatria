import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface DocumentMetadata {
  id?: string;
  patient_id: string;
  title: string;
  description?: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  signature_data?: string | null;
  signed_by?: string | null;
  signed_at?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export const uploadDocument = async (
  file: File, 
  patientId: string, 
  metadata: Omit<DocumentMetadata, 'id' | 'patient_id' | 'file_name' | 'file_type' | 'file_size' | 'storage_path' | 'created_at' | 'updated_at'>
): Promise<{ data: DocumentMetadata | null; error: Error | null }> => {
  try {
    // Generar un nombre de archivo único
    const fileExt = file.name.split('.').pop();
    const fileName = `${patientId}/${uuidv4()}.${fileExt}`;
    
    // Subir el archivo al almacenamiento de Supabase
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('patient-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Obtener la URL pública del archivo
    const { data: { publicUrl } } = supabase.storage
      .from('patient-documents')
      .getPublicUrl(fileName);

    // Guardar los metadatos en la base de datos
    const documentData: Omit<DocumentMetadata, 'id' | 'created_at' | 'updated_at'> = {
      patient_id: patientId,
      title: metadata.title,
      description: metadata.description,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: fileName,
      signature_data: metadata.signature_data || null,
      signed_by: metadata.signed_by || null,
      signed_at: metadata.signature_data ? new Date().toISOString() : null,
      created_by: metadata.created_by || 'system',
    };

    const { data: dbData, error: dbError } = await supabase
      .from('documents')
      .insert([documentData])
      .select()
      .single();

    if (dbError) {
      // Si hay un error al guardar en la base de datos, eliminar el archivo subido
      await supabase.storage
        .from('patient-documents')
        .remove([fileName]);
      
      throw dbError;
    }

    return { data: dbData, error: null };
  } catch (error) {
    console.error('Error uploading document:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Error al subir el documento') 
    };
  }
};

export const getPatientDocuments = async (patientId: string): Promise<{ data: DocumentMetadata[] | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching documents:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Error al obtener los documentos') 
    };
  }
};

export const getDocumentUrl = (storagePath: string): string => {
  const { data: { publicUrl } } = supabase.storage
    .from('patient-documents')
    .getPublicUrl(storagePath);
  
  return publicUrl;
};

export const deleteDocument = async (documentId: string, storagePath: string): Promise<{ error: Error | null }> => {
  try {
    // Eliminar el archivo del almacenamiento
    const { error: storageError } = await supabase.storage
      .from('patient-documents')
      .remove([storagePath]);

    if (storageError) throw storageError;

    // Eliminar el registro de la base de datos
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (dbError) throw dbError;

    return { error: null };
  } catch (error) {
    console.error('Error deleting document:', error);
    return { 
      error: error instanceof Error ? error : new Error('Error al eliminar el documento') 
    };
  }
};

export const updateDocumentSignature = async (
  documentId: string, 
  signatureData: string,
  signedBy: string
): Promise<{ data: DocumentMetadata | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('documents')
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
    
    return { data, error: null };
  } catch (error) {
    console.error('Error updating document signature:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Error al actualizar la firma del documento') 
    };
  }
};
