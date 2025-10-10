-- ============================================
-- SCRIPT PARA CORREGIR RLS EN CLINICAL_DOCUMENTS
-- Copiar y pegar TODO este contenido en Supabase SQL Editor
-- ============================================

-- 1. DESHABILITAR RLS TEMPORALMENTE PARA VERIFICAR
ALTER TABLE clinical_documents DISABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Users can view clinical documents" ON clinical_documents;
DROP POLICY IF EXISTS "Users can insert clinical documents" ON clinical_documents;
DROP POLICY IF EXISTS "Users can update clinical documents" ON clinical_documents;
DROP POLICY IF EXISTS "Users can delete clinical documents" ON clinical_documents;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON clinical_documents;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON clinical_documents;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON clinical_documents;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON clinical_documents;

-- 3. VERIFICAR ESTRUCTURA DE LA TABLA
-- Si admission_id es NOT NULL, cambiarlo a nullable
ALTER TABLE clinical_documents 
ALTER COLUMN admission_id DROP NOT NULL;

-- Si uploaded_by es NOT NULL y no tiene default, arreglarlo
ALTER TABLE clinical_documents 
ALTER COLUMN uploaded_by DROP NOT NULL;

ALTER TABLE clinical_documents 
ALTER COLUMN uploaded_by SET DEFAULT auth.uid();

-- 4. HABILITAR RLS
ALTER TABLE clinical_documents ENABLE ROW LEVEL SECURITY;

-- 5. CREAR POLÍTICAS PERMISIVAS (TODOS LOS USUARIOS AUTENTICADOS)
CREATE POLICY "Enable read access for authenticated users"
ON clinical_documents
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for authenticated users"
ON clinical_documents
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
ON clinical_documents
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users"
ON clinical_documents
FOR DELETE
TO authenticated
USING (true);

-- 6. CREAR ÍNDICES PARA RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_clinical_documents_patient_id ON clinical_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_admission_id ON clinical_documents(admission_id);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_document_type ON clinical_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_uploaded_at ON clinical_documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_uploaded_by ON clinical_documents(uploaded_by);

-- 7. VERIFICAR BUCKET DE STORAGE
-- Asegurarse de que el bucket "medical-documents" existe y tiene las políticas correctas
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-documents', 'medical-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 8. POLÍTICAS DE STORAGE PARA EL BUCKET
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;

CREATE POLICY "Authenticated users can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'medical-documents');

CREATE POLICY "Authenticated users can read files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'medical-documents');

CREATE POLICY "Authenticated users can update files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'medical-documents')
WITH CHECK (bucket_id = 'medical-documents');

CREATE POLICY "Authenticated users can delete files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'medical-documents');

-- 9. VERIFICACIÓN FINAL
-- Ejecutar estas queries para verificar que todo está correcto
SELECT 
  'Políticas RLS en clinical_documents' as verificacion,
  COUNT(*) as total_politicas
FROM pg_policies 
WHERE tablename = 'clinical_documents';

SELECT 
  'Políticas Storage en medical-documents' as verificacion,
  COUNT(*) as total_politicas
FROM pg_policies 
WHERE tablename = 'objects';

SELECT 
  'Bucket medical-documents existe' as verificacion,
  EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'medical-documents') as existe;

-- ============================================
-- RESULTADO ESPERADO:
-- - 4 políticas en clinical_documents
-- - 4 políticas en storage.objects
-- - Bucket medical-documents existe: true
-- ============================================
