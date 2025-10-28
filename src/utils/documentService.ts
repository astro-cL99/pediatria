import { supabase } from '@/integrations/supabase/client';

interface DocumentUpload {
  file: File;
  patient_id: string;
  admission_id?: string;
  document_type: string;
  metadata?: Record<string, any>;
}

export const uploadClinicalDocument = async ({
  file,
  patient_id,
  admission_id,
  document_type,
  metadata = {},
}: DocumentUpload) => {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    // Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `medical-documents/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('medical-documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Create document record
    const { data: document, error: insertError } = await supabase
      .from('clinical_documents')
      .insert([
        {
          patient_id,
          admission_id,
          document_type,
          file_path: filePath,
          file_name: file.name,
          extracted_data: metadata,
          uploaded_by: user.id,
        },
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    return { data: document, error: null };
  } catch (error) {
    console.error('Error uploading document:', error);
    return { data: null, error };
  }
};

export const getClinicalDocuments = async (patientId: string) => {
  try {
    const { data: documents, error } = await supabase
      .from('clinical_documents')
      .select('*')
      .eq('patient_id', patientId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return { data: documents, error: null };
  } catch (error) {
    console.error('Error fetching documents:', error);
    return { data: null, error };
  }
};

export const deleteClinicalDocument = async (documentId: string) => {
  try {
    // First get the document to check ownership
    const { data: document, error: fetchError } = await supabase
      .from('clinical_documents')
      .select('file_path, uploaded_by')
      .eq('id', documentId)
      .single();

    if (fetchError) throw fetchError;

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    // Only allow deletion if user is the owner or admin
    const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: user.id });
    
    if (document.uploaded_by !== user.id && !isAdmin) {
      throw new Error('Unauthorized: You can only delete your own documents');
    }
    
    // Delete from storage
    const { error: deleteStorageError } = await supabase.storage
      .from('medical-documents')
      .remove([document.file_path]);

    if (deleteStorageError) throw deleteStorageError;

    // Delete from database
    const { error: deleteDbError } = await supabase
      .from('clinical_documents')
      .delete()
      .eq('id', documentId);

    if (deleteDbError) throw deleteDbError;

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Error deleting document:', error);
    return { data: null, error };
  }
};
