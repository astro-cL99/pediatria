-- Agregar campos de alimentación y sueroterapia a la tabla admissions
ALTER TABLE admissions 
ADD COLUMN IF NOT EXISTS diet jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS iv_therapy jsonb DEFAULT NULL;

COMMENT ON COLUMN admissions.diet IS 'Información sobre el régimen alimenticio del paciente: {type: string, notes: string}';
COMMENT ON COLUMN admissions.iv_therapy IS 'Información sobre sueroterapia endovenosa: {active: boolean, percentage: string, corrections: string}';