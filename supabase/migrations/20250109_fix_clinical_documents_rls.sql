-- Arreglar políticas RLS para clinical_documents
-- Fecha: 2025-01-09

-- Habilitar RLS si no está habilitado
ALTER TABLE clinical_documents ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view clinical documents" ON clinical_documents;
DROP POLICY IF EXISTS "Users can insert clinical documents" ON clinical_documents;
DROP POLICY IF EXISTS "Users can update clinical documents" ON clinical_documents;
DROP POLICY IF EXISTS "Users can delete clinical documents" ON clinical_documents;

-- Política para VER documentos clínicos
-- Los usuarios autenticados pueden ver todos los documentos
CREATE POLICY "Users can view clinical documents"
ON clinical_documents
FOR SELECT
TO authenticated
USING (true);

-- Política para INSERTAR documentos clínicos
-- Los usuarios autenticados pueden insertar documentos
CREATE POLICY "Users can insert clinical documents"
ON clinical_documents
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para ACTUALIZAR documentos clínicos
-- Los usuarios autenticados pueden actualizar documentos
CREATE POLICY "Users can update clinical documents"
ON clinical_documents
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para ELIMINAR documentos clínicos
-- Los usuarios autenticados pueden eliminar documentos
CREATE POLICY "Users can delete clinical documents"
ON clinical_documents
FOR DELETE
TO authenticated
USING (true);

-- Verificar que el campo uploaded_by tenga un valor por defecto
ALTER TABLE clinical_documents 
ALTER COLUMN uploaded_by SET DEFAULT auth.uid();

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_clinical_documents_patient_id ON clinical_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_admission_id ON clinical_documents(admission_id);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_document_type ON clinical_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_uploaded_at ON clinical_documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_uploaded_by ON clinical_documents(uploaded_by);
