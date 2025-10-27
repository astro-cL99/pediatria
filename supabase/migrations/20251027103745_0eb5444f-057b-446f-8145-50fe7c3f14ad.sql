-- Extender enum app_role para incluir enfermería
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'nurse';

-- Crear tabla para registros de enfermería
CREATE TABLE IF NOT EXISTS nursing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL CHECK (record_type IN ('care_plan', 'activity_log', 'braden_scale', 'humpty_dumpty_scale')),
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  record_time TIME NOT NULL DEFAULT CURRENT_TIME,
  
  -- Escalas de prevención
  braden_score JSONB, -- {sensory_perception, moisture, activity, mobility, nutrition, friction_shear, total_score}
  humpty_dumpty_score JSONB, -- {age, gender, diagnosis, cognitive_impairment, environmental_factors, response_to_surgery, medication_usage, total_score}
  
  -- Cuidados y actividades
  care_plan TEXT,
  activities_performed TEXT,
  observations TEXT,
  
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_score_data CHECK (
    (record_type = 'braden_scale' AND braden_score IS NOT NULL) OR
    (record_type = 'humpty_dumpty_scale' AND humpty_dumpty_score IS NOT NULL) OR
    (record_type IN ('care_plan', 'activity_log'))
  )
);

-- Habilitar RLS
ALTER TABLE nursing_records ENABLE ROW LEVEL SECURITY;

-- Políticas: Solo enfermería puede CREAR/EDITAR, todos pueden VER
CREATE POLICY "Anyone can view nursing records"
ON nursing_records FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only nurses can create nursing records"
ON nursing_records FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'nurse'
  ) OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Only nurses can update nursing records"
ON nursing_records FOR UPDATE
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'nurse'
  ) OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Only nurses can delete nursing records"
ON nursing_records FOR DELETE
USING (
  created_by = auth.uid() OR has_role(auth.uid(), 'admin')
);

-- Índices para mejor performance
CREATE INDEX idx_nursing_records_patient ON nursing_records(patient_id);
CREATE INDEX idx_nursing_records_admission ON nursing_records(admission_id);
CREATE INDEX idx_nursing_records_type ON nursing_records(record_type);
CREATE INDEX idx_nursing_records_date ON nursing_records(record_date DESC);

-- Trigger para updated_at
CREATE TRIGGER update_nursing_records_updated_at
BEFORE UPDATE ON nursing_records
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Agregar columna pain_scores a daily_evolutions para registrar escalas de dolor
ALTER TABLE daily_evolutions 
ADD COLUMN IF NOT EXISTS pain_scores JSONB DEFAULT '{}'::jsonb;