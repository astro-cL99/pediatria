-- Fix RLS policies for clinical_documents table
-- Date: 2025-10-15

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view documents" ON public.clinical_documents;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON public.clinical_documents;
DROP POLICY IF EXISTS "Users can update own uploads" ON public.clinical_documents;

-- Create new policies
-- Allow all authenticated users to view all documents
CREATE POLICY "Allow all authenticated users to view documents" 
ON public.clinical_documents 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow all authenticated users to insert documents
CREATE POLICY "Allow all authenticated users to insert documents" 
ON public.clinical_documents 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow users to update their own documents
CREATE POLICY "Allow users to update their own documents" 
ON public.clinical_documents 
FOR UPDATE 
TO authenticated 
USING (uploaded_by = auth.uid())
WITH CHECK (uploaded_by = auth.uid());

-- Add comment to document the changes
COMMENT ON TABLE public.clinical_documents IS 'Contains clinical documents with RLS for access control';

-- Verify the policies were created
SELECT * FROM pg_policies WHERE tablename = 'clinical_documents';
