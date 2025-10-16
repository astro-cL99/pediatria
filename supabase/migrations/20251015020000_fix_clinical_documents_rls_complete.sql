-- Complete RLS and trigger fix for clinical_documents
-- Date: 2025-10-15

-- Enable RLS if not already enabled
ALTER TABLE public.clinical_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all authenticated users to view documents" ON public.clinical_documents;
DROP POLICY IF EXISTS "Allow all authenticated users to insert documents" ON public.clinical_documents;
DROP POLICY IF EXISTS "Allow users to update their own documents" ON public.clinical_documents;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = user_id AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle document uploads
CREATE OR REPLACE FUNCTION public.handle_document_upload()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.uploaded_by = auth.uid();
    NEW.uploaded_at = NOW();
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for document uploads
DROP TRIGGER IF EXISTS on_document_upload ON public.clinical_documents;
CREATE TRIGGER on_document_upload
  BEFORE INSERT OR UPDATE ON public.clinical_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_document_upload();

-- Create new policies
-- Allow viewing documents if user is the owner, has access via document_access, or is admin
CREATE POLICY "View documents if owner or has access" 
ON public.clinical_documents 
FOR SELECT 
TO authenticated 
USING (
  uploaded_by = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.document_access 
    WHERE document_id = id AND user_id = auth.uid()
  )
  OR is_admin(auth.uid())
);

-- Allow inserting documents with proper ownership
CREATE POLICY "Insert documents with ownership" 
ON public.clinical_documents 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow updating documents if user is the owner or admin
CREATE POLICY "Update own documents or admin" 
ON public.clinical_documents 
FOR UPDATE 
TO authenticated 
USING (uploaded_by = auth.uid() OR is_admin(auth.uid()))
WITH CHECK (uploaded_by = auth.uid() OR is_admin(auth.uid()));

-- Allow deleting documents if user is the owner or admin
CREATE POLICY "Delete own documents or admin" 
ON public.clinical_documents 
FOR DELETE 
TO authenticated 
USING (uploaded_by = auth.uid() OR is_admin(auth.uid()));

-- Add comments for documentation
COMMENT ON TABLE public.clinical_documents IS 'Contains clinical documents with RLS for access control';
COMMENT ON COLUMN public.clinical_documents.uploaded_by IS 'User ID who uploaded the document';
COMMENT ON COLUMN public.clinical_documents.uploaded_at IS 'Timestamp when the document was uploaded';
COMMENT ON COLUMN public.clinical_documents.updated_at IS 'Timestamp when the document was last updated';

-- Verify the policies were created
SELECT * FROM pg_policies WHERE tablename = 'clinical_documents';
