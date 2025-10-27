-- Crear enum para estamentos profesionales
CREATE TYPE professional_position AS ENUM (
  'medico',
  'medico_becado',
  'interno',
  'enfermera',
  'tens'
);

-- Crear enum para sexo biológico
CREATE TYPE biological_sex AS ENUM ('masculino', 'femenino');

-- Agregar columnas a profiles
ALTER TABLE profiles 
ADD COLUMN position professional_position,
ADD COLUMN biological_sex biological_sex,
ADD COLUMN position_configured_at TIMESTAMPTZ;

-- Función para obtener el título con género correcto
CREATE OR REPLACE FUNCTION get_position_label(pos professional_position, sex biological_sex)
RETURNS TEXT AS $$
BEGIN
  CASE pos
    WHEN 'medico' THEN
      RETURN CASE WHEN sex = 'femenino' THEN 'Médica' ELSE 'Médico' END;
    WHEN 'medico_becado' THEN
      RETURN CASE WHEN sex = 'femenino' THEN 'Médica Becada' ELSE 'Médico Becado' END;
    WHEN 'interno' THEN
      RETURN CASE WHEN sex = 'femenino' THEN 'Interna' ELSE 'Interno' END;
    WHEN 'enfermera' THEN
      RETURN CASE WHEN sex = 'femenino' THEN 'Enfermera' ELSE 'Enfermero' END;
    WHEN 'tens' THEN
      RETURN 'TENS';
    ELSE
      RETURN NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Política: Solo el propio usuario puede configurar su estamento por primera vez
-- Una vez configurado, solo admins pueden modificarlo
CREATE POLICY "Users can set position once, admins can always modify"
ON profiles FOR UPDATE
USING (
  auth.uid() = id AND (
    -- Si no está configurado, el usuario puede hacerlo
    position_configured_at IS NULL
    -- O si es admin, siempre puede
    OR is_admin(auth.uid())
  )
);

-- Trigger para marcar cuándo se configuró el estamento
CREATE OR REPLACE FUNCTION mark_position_configured()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.position IS NOT NULL AND OLD.position IS NULL THEN
    NEW.position_configured_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_position_configured_timestamp
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION mark_position_configured();