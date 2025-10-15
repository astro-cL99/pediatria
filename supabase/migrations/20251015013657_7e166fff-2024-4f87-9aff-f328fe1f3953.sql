-- MEJORA 2: Sistema Automático de Conteo y Tracking

-- Agregar tracking de antibióticos a admissions
ALTER TABLE admissions 
ADD COLUMN IF NOT EXISTS antibiotics_tracking JSONB DEFAULT '[]'::jsonb;

-- Agregar scores respiratorios evolutivos a daily_evolutions
ALTER TABLE daily_evolutions
ADD COLUMN IF NOT EXISTS respiratory_scores JSONB DEFAULT '{}'::jsonb;

-- Agregar cálculos de fluidos guardados a daily_evolutions (MEJORA 4)
ALTER TABLE daily_evolutions
ADD COLUMN IF NOT EXISTS fluid_calculations JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN admissions.antibiotics_tracking IS 'Tracking automático de antibióticos: [{name, start_date, planned_days, current_day, end_date}]';
COMMENT ON COLUMN daily_evolutions.respiratory_scores IS 'Scores respiratorios evolutivos: {pulmonary_score: {at_admission, current, date_measured}, tal_score: {at_admission, current, date_measured}}';
COMMENT ON COLUMN daily_evolutions.fluid_calculations IS 'Cálculos de fluidoterapia: {weight, holliday_segar, body_surface_area, dehydration}';