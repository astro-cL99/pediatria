-- Crear función RPC para búsqueda semántica vectorial
CREATE OR REPLACE FUNCTION public.search_clinical_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10,
  filter_type text DEFAULT NULL,
  filter_patient_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  patient_id uuid,
  admission_id uuid,
  document_type text,
  file_name text,
  file_path text,
  extracted_data jsonb,
  uploaded_by uuid,
  uploaded_at timestamptz,
  confidence_score float,
  notes text,
  patient_name text,
  patient_rut text,
  admission_date timestamptz,
  similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cd.id,
    cd.patient_id,
    cd.admission_id,
    cd.document_type,
    cd.file_name,
    cd.file_path,
    cd.extracted_data,
    cd.uploaded_by,
    cd.uploaded_at,
    cd.confidence_score,
    cd.notes,
    p.name as patient_name,
    p.rut as patient_rut,
    a.admission_date,
    1 - (cd.embeddings <=> query_embedding) as similarity
  FROM clinical_documents cd
  LEFT JOIN patients p ON cd.patient_id = p.id
  LEFT JOIN admissions a ON cd.admission_id = a.id
  WHERE cd.embeddings IS NOT NULL
    AND 1 - (cd.embeddings <=> query_embedding) > match_threshold
    AND (filter_type IS NULL OR cd.document_type = filter_type)
    AND (filter_patient_id IS NULL OR cd.patient_id = filter_patient_id)
  ORDER BY cd.embeddings <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Crear índice HNSW para búsqueda vectorial rápida
CREATE INDEX IF NOT EXISTS idx_clinical_docs_embeddings_hnsw 
ON public.clinical_documents 
USING hnsw (embeddings vector_cosine_ops)
WITH (m = 16, ef_construction = 64);