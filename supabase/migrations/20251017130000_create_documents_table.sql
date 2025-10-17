-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    signature_data TEXT,
    signed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    signed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'error')),
    processed_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Enable read access for authenticated users"
ON public.documents
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for document owners and admins"
ON public.documents
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- Create index for better performance
CREATE INDEX idx_documents_patient_id ON public.documents(patient_id);
CREATE INDEX idx_documents_created_by ON public.documents(created_by);

-- Add comments
COMMENT ON TABLE public.documents IS 'Stores metadata for patient documents';
COMMENT ON COLUMN public.documents.status IS 'Document processing status: pending, processing, processed, error';
COMMENT ON COLUMN public.documents.processed_data IS 'Structured data extracted from the document';

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
