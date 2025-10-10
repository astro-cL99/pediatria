-- ============================================
-- SETUP COMPLETO PARA NUEVO PROYECTO SUPABASE
-- Ejecutar TODO este script en SQL Editor
-- ============================================

-- PARTE 1: CREAR TABLAS BÁSICAS
-- ============================================

-- Tabla de pacientes
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rut VARCHAR(12) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(10),
  blood_type VARCHAR(5),
  allergies TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de admisiones
CREATE TABLE IF NOT EXISTS admissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  admission_date TIMESTAMP NOT NULL,
  discharge_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  admission_diagnosis TEXT,
  discharge_diagnosis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de evoluciones diarias
CREATE TABLE IF NOT EXISTS daily_evolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  admission_id UUID REFERENCES admissions(id) ON DELETE CASCADE,
  evolution_date TIMESTAMP DEFAULT NOW(),
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de datos antropométricos
CREATE TABLE IF NOT EXISTS anthropometric_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  admission_id UUID REFERENCES admissions(id) ON DELETE CASCADE,
  weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,2),
  head_circumference_cm DECIMAL(5,2),
  bmi DECIMAL(5,2),
  body_surface_area DECIMAL(5,3),
  systolic_bp INTEGER,
  diastolic_bp INTEGER,
  measured_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de documentos clínicos
CREATE TABLE IF NOT EXISTS clinical_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  admission_id UUID REFERENCES admissions(id) ON DELETE SET NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  document_type VARCHAR(50),
  extracted_data JSONB,
  confidence_score DECIMAL(3,2),
  uploaded_by UUID,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de códigos CIE-10
CREATE TABLE IF NOT EXISTS cie10_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de diagnósticos de pacientes
CREATE TABLE IF NOT EXISTS patient_diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  admission_id UUID REFERENCES admissions(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(20),
  category VARCHAR(50),
  source VARCHAR(20) DEFAULT 'manual',
  lab_value VARCHAR(50),
  actual_value DECIMAL,
  reference_range VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  UNIQUE(patient_id, code, source)
);

-- PARTE 2: CREAR ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_patients_rut ON patients(rut);
CREATE INDEX IF NOT EXISTS idx_admissions_patient_id ON admissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_admissions_status ON admissions(status);
CREATE INDEX IF NOT EXISTS idx_daily_evolutions_patient_id ON daily_evolutions(patient_id);
CREATE INDEX IF NOT EXISTS idx_daily_evolutions_admission_id ON daily_evolutions(admission_id);
CREATE INDEX IF NOT EXISTS idx_anthropometric_data_patient_id ON anthropometric_data(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_patient_id ON clinical_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_admission_id ON clinical_documents(admission_id);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_document_type ON clinical_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_uploaded_at ON clinical_documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_cie10_codes_code ON cie10_codes(code);
CREATE INDEX IF NOT EXISTS idx_cie10_codes_category ON cie10_codes(category);
CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_patient_id ON patient_diagnoses(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_admission_id ON patient_diagnoses(admission_id);
CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_source ON patient_diagnoses(source);

-- PARTE 3: HABILITAR RLS Y CREAR POLÍTICAS
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_evolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE anthropometric_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE cie10_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_diagnoses ENABLE ROW LEVEL SECURITY;

-- Políticas para patients
CREATE POLICY "Enable read access for authenticated users" ON patients
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON patients
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for authenticated users" ON patients
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete access for authenticated users" ON patients
  FOR DELETE TO authenticated USING (true);

-- Políticas para admissions
CREATE POLICY "Enable read access for authenticated users" ON admissions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON admissions
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for authenticated users" ON admissions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete access for authenticated users" ON admissions
  FOR DELETE TO authenticated USING (true);

-- Políticas para daily_evolutions
CREATE POLICY "Enable read access for authenticated users" ON daily_evolutions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON daily_evolutions
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for authenticated users" ON daily_evolutions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete access for authenticated users" ON daily_evolutions
  FOR DELETE TO authenticated USING (true);

-- Políticas para anthropometric_data
CREATE POLICY "Enable read access for authenticated users" ON anthropometric_data
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON anthropometric_data
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for authenticated users" ON anthropometric_data
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete access for authenticated users" ON anthropometric_data
  FOR DELETE TO authenticated USING (true);

-- Políticas para clinical_documents
CREATE POLICY "Enable read access for authenticated users" ON clinical_documents
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON clinical_documents
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for authenticated users" ON clinical_documents
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete access for authenticated users" ON clinical_documents
  FOR DELETE TO authenticated USING (true);

-- Políticas para cie10_codes
CREATE POLICY "Enable read access for authenticated users" ON cie10_codes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON cie10_codes
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for authenticated users" ON cie10_codes
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete access for authenticated users" ON cie10_codes
  FOR DELETE TO authenticated USING (true);

-- Políticas para patient_diagnoses
CREATE POLICY "Enable read access for authenticated users" ON patient_diagnoses
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON patient_diagnoses
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for authenticated users" ON patient_diagnoses
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete access for authenticated users" ON patient_diagnoses
  FOR DELETE TO authenticated USING (true);

-- PARTE 4: CREAR BUCKET DE STORAGE
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-documents', 'medical-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage
CREATE POLICY "Authenticated users can upload files" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'medical-documents');
CREATE POLICY "Authenticated users can read files" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'medical-documents');
CREATE POLICY "Authenticated users can update files" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'medical-documents') WITH CHECK (bucket_id = 'medical-documents');
CREATE POLICY "Authenticated users can delete files" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'medical-documents');

-- PARTE 5: POBLAR CÓDIGOS CIE-10 PEDIÁTRICOS
-- ============================================

INSERT INTO cie10_codes (code, description, category) VALUES
-- RESPIRATORIO
('J21.0', 'Bronquiolitis aguda debida a virus sincicial respiratorio', 'Respiratorio'),
('J21.8', 'Bronquiolitis aguda debida a otros microorganismos especificados', 'Respiratorio'),
('J21.9', 'Bronquiolitis aguda, no especificada', 'Respiratorio'),
('J45.0', 'Asma predominantemente alérgica', 'Respiratorio'),
('J45.9', 'Asma, no especificada', 'Respiratorio'),
('J18.9', 'Neumonía, no especificada', 'Respiratorio'),
('J06.9', 'Infección aguda de las vías respiratorias superiores, no especificada', 'Respiratorio'),
('J00', 'Rinofaringitis aguda (resfriado común)', 'Respiratorio'),
('J02.9', 'Faringitis aguda, no especificada', 'Respiratorio'),
('J03.9', 'Amigdalitis aguda, no especificada', 'Respiratorio'),
('J05.0', 'Laringitis obstructiva aguda (crup)', 'Respiratorio'),
('J96.0', 'Insuficiencia respiratoria aguda', 'Respiratorio'),

-- INFECCIOSO
('A09', 'Diarrea y gastroenteritis de presunto origen infeccioso', 'Infeccioso'),
('A08.0', 'Enteritis debida a rotavirus', 'Infeccioso'),
('A41.9', 'Septicemia, no especificada', 'Infeccioso'),
('R57.2', 'Shock séptico', 'Infeccioso'),
('B01.9', 'Varicela sin complicación', 'Infeccioso'),
('B05.9', 'Sarampión sin complicación', 'Infeccioso'),

-- UROLÓGICO
('N39.0', 'Infección de vías urinarias, sitio no especificado', 'Urológico'),
('N10', 'Nefritis tubulointersticial aguda (pielonefritis aguda)', 'Urológico'),
('N30.0', 'Cistitis aguda', 'Urológico'),

-- NEUROLÓGICO
('G03.9', 'Meningitis, no especificada', 'Neurológico'),
('G04.9', 'Encefalitis, mielitis y encefalomielitis, no especificadas', 'Neurológico'),
('G40.9', 'Epilepsia, no especificada', 'Neurológico'),
('R56.0', 'Convulsiones febriles', 'Neurológico'),

-- GASTROINTESTINAL
('K59.0', 'Constipación', 'Gastrointestinal'),
('K21.9', 'Enfermedad por reflujo gastroesofágico sin esofagitis', 'Gastrointestinal'),
('K35.8', 'Apendicitis aguda, no especificada', 'Gastrointestinal'),

-- DERMATOLÓGICO
('L20.9', 'Dermatitis atópica, no especificada', 'Dermatológico'),
('L22', 'Dermatitis del pañal', 'Dermatológico'),
('L03.9', 'Celulitis, de sitio no especificado', 'Dermatológico'),

-- HEMATOLÓGICO
('D50.9', 'Anemia por deficiencia de hierro, sin otra especificación', 'Hematológico'),
('D64.9', 'Anemia, no especificada', 'Hematológico'),
('D69.6', 'Trombocitopenia, no especificada', 'Hematológico'),
('D72.8', 'Otros trastornos especificados de los leucocitos', 'Hematológico'),
('D70', 'Agranulocitosis', 'Hematológico'),

-- METABÓLICO
('E86.0', 'Deshidratación', 'Metabólico'),
('E87.1', 'Hiposmolalidad e hiponatremia', 'Metabólico'),
('E87.0', 'Hiperosmolalidad e hipernatremia', 'Metabólico'),
('E87.5', 'Hiperpotasemia', 'Metabólico'),
('E87.6', 'Hipopotasemia', 'Metabólico'),
('E87.2', 'Acidosis', 'Metabólico'),
('E87.3', 'Alcalosis', 'Metabólico'),
('E16.2', 'Hipoglucemia, no especificada', 'Metabólico'),
('E83.5', 'Trastornos del metabolismo del calcio', 'Metabólico'),
('E83.4', 'Trastornos del metabolismo del magnesio', 'Metabólico'),

-- RENAL
('N17.9', 'Insuficiencia renal aguda, no especificada', 'Renal'),
('N18.9', 'Enfermedad renal crónica, no especificada', 'Renal'),

-- HEPÁTICO
('K76.9', 'Enfermedad hepática, no especificada', 'Hepático'),

-- INFLAMATORIO
('R70.0', 'Velocidad de sedimentación globular elevada', 'Inflamatorio'),

-- SÍNTOMAS
('R50.9', 'Fiebre, no especificada', 'Síntoma'),
('R51', 'Cefalea', 'Síntoma'),
('R10.4', 'Otros dolores abdominales y los no especificados', 'Síntoma'),
('R11', 'Náusea y vómito', 'Síntoma'),

-- NEONATAL
('P22.0', 'Síndrome de dificultad respiratoria del recién nacido', 'Neonatal'),
('P59.9', 'Ictericia neonatal, no especificada', 'Neonatal'),

-- OTORRINOLARINGOLÓGICO
('H66.9', 'Otitis media, no especificada', 'Otorrinolaringológico'),
('H10.9', 'Conjuntivitis, no especificada', 'Oftalmológico')

ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  category = EXCLUDED.category;

-- PARTE 6: VERIFICACIÓN FINAL
-- ============================================

SELECT 'Tablas creadas' as verificacion, COUNT(*) as total
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('patients', 'admissions', 'daily_evolutions', 'anthropometric_data', 'clinical_documents', 'cie10_codes', 'patient_diagnoses');

SELECT 'Políticas RLS' as verificacion, COUNT(*) as total
FROM pg_policies 
WHERE schemaname = 'public';

SELECT 'Códigos CIE-10' as verificacion, COUNT(*) as total
FROM cie10_codes;

SELECT 'Bucket Storage' as verificacion, 
  CASE WHEN EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'medical-documents') 
    THEN 'Creado ✅' 
    ELSE 'No creado ❌' 
  END as estado;

-- ============================================
-- RESULTADO ESPERADO:
-- - 7 tablas creadas
-- - 28+ políticas RLS
-- - 60+ códigos CIE-10
-- - Bucket medical-documents creado
-- ============================================
