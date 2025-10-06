-- Create clinical protocols table
CREATE TABLE IF NOT EXISTS public.clinical_protocols (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  protocol_name TEXT NOT NULL,
  category TEXT NOT NULL,
  source TEXT NOT NULL,
  content TEXT NOT NULL,
  criteria JSONB,
  indications TEXT[],
  contraindications TEXT[],
  procedure_steps JSONB,
  monitoring_parameters JSONB,
  complications TEXT[],
  clinical_references TEXT[],
  version TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.clinical_protocols ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view protocols"
  ON public.clinical_protocols FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create protocols"
  ON public.clinical_protocols FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update protocols"
  ON public.clinical_protocols FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Insert CPAP protocol based on Chilean public health system
INSERT INTO public.clinical_protocols (
  protocol_name,
  category,
  source,
  content,
  criteria,
  indications,
  contraindications,
  procedure_steps,
  monitoring_parameters,
  complications,
  clinical_references,
  version
) VALUES (
  'Protocolo CPAP Nasal en Neonatología',
  'Neonatología',
  'Hospital Franco Ravera Zunino / MINSAL',
  'Protocolo de aplicación de presión positiva continua en vía aérea (CPAP) para recién nacidos con dificultad respiratoria',
  '{"peso_minimo": "1000g", "edad_gestacional_minima": "28 semanas", "fio2_maximo_inicial": "0.4"}',
  ARRAY['Síndrome de dificultad respiratoria (SDR)', 'Taquipnea transitoria del recién nacido (TTRN)', 'Apnea del prematuro', 'Destete de ventilación mecánica', 'Enfermedad de membrana hialina leve-moderada'],
  ARRAY['Neumotórax no drenado', 'Malformaciones congénitas de vía aérea', 'Atresia de coanas bilateral', 'Hernia diafragmática', 'Fístula traqueoesofágica', 'Inestabilidad hemodinámica severa'],
  '{"steps": [{"order": 1, "description": "Valorar indicación según criterios clínicos y gasométricos"}, {"order": 2, "description": "Explicar procedimiento a familia y obtener consentimiento"}, {"order": 3, "description": "Seleccionar interfaz adecuada (nasal prongs, mascarilla nasal)"}, {"order": 4, "description": "Iniciar con PEEP de 5-6 cmH2O"}, {"order": 5, "description": "Titular FiO2 para mantener SpO2 objetivo según edad gestacional"}, {"order": 6, "description": "Monitorizar signos vitales continuamente"}, {"order": 7, "description": "Evaluar respuesta clínica a los 30-60 minutos"}]}',
  '{"vitales": ["FC", "FR", "SpO2", "Temperatura"], "respiratorios": ["Trabajo respiratorio", "Score de Silverman-Anderson", "Auscultación pulmonar"], "ventilatorios": ["PEEP", "FiO2", "Fugas"], "gases": ["pH", "pCO2", "pO2", "HCO3", "EB"], "frecuencia_controles": "c/4-6 hrs o según evolución"}',
  ARRAY['Neumotórax', 'Distensión abdominal', 'Lesiones nasales', 'Intolerancia oral', 'Aspiración', 'Hipercapnia'],
  ARRAY['Protocolos SENEO 2023 - Academia Española de Pediatría', 'Guías Clínicas MINSAL Chile', 'Protocolo Hospital Franco Ravera Zunino', 'Sweet DG, et al. European Consensus Guidelines on the Management of Respiratory Distress Syndrome. Neonatology 2019'],
  '1.0'
),
(
  'Evaluación Nutricional Pediátrica',
  'Nutrición',
  'MINSAL / AEP',
  'Protocolo de evaluación y clasificación del estado nutricional en pediatría según patrones OMS y guías MINSAL',
  '{"edad_aplicacion": "0-18 años", "metodos": ["antropometría", "percentiles_OMS", "desviaciones_estandar"]}',
  NULL,
  NULL,
  '{"steps": [{"order": 1, "description": "Medición de peso con balanza calibrada"}, {"order": 2, "description": "Medición de talla/longitud con tallímetro o infantómetro"}, {"order": 3, "description": "Medición de perímetro cefálico en menores de 2 años"}, {"order": 4, "description": "Cálculo de IMC (peso/talla²)"}, {"order": 5, "description": "Comparación con tablas OMS según edad y sexo"}, {"order": 6, "description": "Clasificación según percentiles o puntaje Z"}, {"order": 7, "description": "Registro en curvas de crecimiento"}]}',
  '{"clasificacion_peso_talla": {"obesidad": "> +2 DE o > p95", "sobrepeso": "+1 a +2 DE o p85-p95", "normal": "-1 a +1 DE o p15-p85", "riesgo_desnutricion": "-1 a -2 DE o p5-p15", "desnutricion": "< -2 DE o < p5", "desnutricion_severa": "< -3 DE"}, "imc_clasificacion": {"bajo_peso": "< -2 DE", "normal": "-2 a +1 DE", "sobrepeso": "+1 a +2 DE", "obesidad": "> +2 DE"}}',
  NULL,
  ARRAY['OMS - Patrones de crecimiento infantil 2006', 'MINSAL Chile - Norma Técnica de Evaluación Nutricional 2016', 'AEP - Manual de Nutrición 2021', 'Sociedad Chilena de Pediatría - Consenso Obesidad Infantil'],
  '1.0'
);