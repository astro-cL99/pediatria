-- Tabla para evoluciones diarias médicas
CREATE TABLE IF NOT EXISTS public.daily_evolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id UUID REFERENCES public.admissions(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  evolution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  evolution_time TIME NOT NULL DEFAULT CURRENT_TIME,
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  vital_signs JSONB,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de auditoría
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para plantillas de protocolos por patología
CREATE TABLE IF NOT EXISTS public.protocol_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  diagnosis_code TEXT,
  template_data JSONB NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Tabla para mediciones de crecimiento (para gráficas)
CREATE TABLE IF NOT EXISTS public.growth_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  measurement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  weight_kg NUMERIC,
  height_cm NUMERIC,
  head_circumference_cm NUMERIC,
  bmi NUMERIC,
  measured_by UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_daily_evolutions_admission ON public.daily_evolutions(admission_id);
CREATE INDEX idx_daily_evolutions_patient ON public.daily_evolutions(patient_id);
CREATE INDEX idx_daily_evolutions_date ON public.daily_evolutions(evolution_date DESC);
CREATE INDEX idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX idx_growth_measurements_patient ON public.growth_measurements(patient_id);
CREATE INDEX idx_growth_measurements_date ON public.growth_measurements(measurement_date DESC);
CREATE INDEX idx_protocol_templates_category ON public.protocol_templates(category);

-- RLS Policies
ALTER TABLE public.daily_evolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocol_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_measurements ENABLE ROW LEVEL SECURITY;

-- Daily evolutions policies
CREATE POLICY "Authenticated users can view evolutions"
ON public.daily_evolutions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create evolutions"
ON public.daily_evolutions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update own evolutions"
ON public.daily_evolutions FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

-- Audit logs policies (read-only for users)
CREATE POLICY "Authenticated users can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Protocol templates policies
CREATE POLICY "Authenticated users can view templates"
ON public.protocol_templates FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Authenticated users can create templates"
ON public.protocol_templates FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update own templates"
ON public.protocol_templates FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

-- Growth measurements policies
CREATE POLICY "Authenticated users can view measurements"
ON public.growth_measurements FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create measurements"
ON public.growth_measurements FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Triggers para updated_at
CREATE TRIGGER update_daily_evolutions_updated_at
BEFORE UPDATE ON public.daily_evolutions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_protocol_templates_updated_at
BEFORE UPDATE ON public.protocol_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar algunas plantillas de ejemplo
INSERT INTO public.protocol_templates (name, category, diagnosis_code, template_data, created_by) VALUES
('Neumonía adquirida en comunidad', 'Respiratorio', 'J18.9', 
'{"chief_complaint":"Tos, fiebre y dificultad respiratoria","present_illness":"Paciente con cuadro de [X] días de evolución caracterizado por tos, fiebre hasta [X]°C, y dificultad respiratoria progresiva","physical_exam":"Taquipnea, tiraje, crepitaciones en [campo pulmonar]","lab_orders":"Hemograma, PCR, Rx tórax AP y lateral","medications":"Ampicilina 200mg/kg/día IV c/6h, Paracetamol 15mg/kg/dosis PRN","nursing_orders":"Control de signos vitales c/4h, Saturación de O2 continua, Balance hídrico estricto"}'::jsonb,
'00000000-0000-0000-0000-000000000000'),
('Gastroenteritis aguda', 'Digestivo', 'A09',
'{"chief_complaint":"Vómitos y diarrea","present_illness":"Paciente con cuadro de [X] horas/días de evolución de vómitos y deposiciones líquidas","physical_exam":"Mucosas [húmedas/secas], signo del pliegue [presente/ausente], abdomen [blando/distendido]","lab_orders":"Hemograma, electrolitos, gases venosos","medications":"Hidratación EV según déficit, Ondansetrón 0.15mg/kg/dosis IV PRN","nursing_orders":"Balance hídrico estricto, pesaje diario, control de deposiciones"}'::jsonb,
'00000000-0000-0000-0000-000000000000'),
('Crisis asmática', 'Respiratorio', 'J45.9',
'{"chief_complaint":"Dificultad respiratoria y sibilancias","present_illness":"Paciente asmático conocido con crisis de [X] horas caracterizada por disnea, tos y sibilancias","physical_exam":"Taquipnea, tiraje, sibilancias difusas, saturación [X]%","lab_orders":"Gases arteriales si severidad moderada-grave","medications":"Salbutamol 2 puff c/20min x 3 dosis, luego c/4h. Prednisona 1-2mg/kg/día VO","nursing_orders":"Monitoreo continuo de saturación, control de frecuencia respiratoria c/2h"}'::jsonb,
'00000000-0000-0000-0000-000000000000'
)
ON CONFLICT DO NOTHING;