-- Primero: Crear extensión pgvector para búsqueda semántica
CREATE EXTENSION IF NOT EXISTS vector;

-- Crear tabla clinical_documents para almacenar documentos procesados
CREATE TABLE IF NOT EXISTS public.clinical_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  admission_id UUID REFERENCES public.admissions(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'ingreso', 'evolucion', 'epicrisis', 'interconsulta', 
    'laboratorio', 'imagenologia', 'dau', 'receta', 'otro'
  )),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  extracted_data JSONB DEFAULT '{}',
  embeddings vector(1536),
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed BOOLEAN DEFAULT false,
  confidence_score FLOAT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_clinical_docs_patient ON public.clinical_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_docs_type ON public.clinical_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_clinical_docs_admission ON public.clinical_documents(admission_id);
CREATE INDEX IF NOT EXISTS idx_clinical_docs_uploaded_at ON public.clinical_documents(uploaded_at DESC);

-- Habilitar RLS
ALTER TABLE public.clinical_documents ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Authenticated users can view documents"
ON public.clinical_documents FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can upload documents"
ON public.clinical_documents FOR INSERT
TO authenticated
WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update own uploads"
ON public.clinical_documents FOR UPDATE
TO authenticated
USING (uploaded_by = auth.uid() OR is_admin(auth.uid()));

-- Trigger para actualizar updated_at
CREATE TRIGGER update_clinical_documents_updated_at
BEFORE UPDATE ON public.clinical_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Crear tabla para queries del asistente clínico (Fase 3)
CREATE TABLE IF NOT EXISTS public.clinical_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  response TEXT,
  sources JSONB,
  helpful BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_queries_user ON public.clinical_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_queries_created ON public.clinical_queries(created_at DESC);

ALTER TABLE public.clinical_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own queries"
ON public.clinical_queries FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Users can create queries"
ON public.clinical_queries FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own queries"
ON public.clinical_queries FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Crear tabla para insights clínicos (Fase 4)
CREATE TABLE IF NOT EXISTS public.clinical_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type TEXT NOT NULL,
  data JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_insights_type ON public.clinical_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_insights_generated ON public.clinical_insights(generated_at DESC);

ALTER TABLE public.clinical_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view insights"
ON public.clinical_insights FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage insights"
ON public.clinical_insights FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));