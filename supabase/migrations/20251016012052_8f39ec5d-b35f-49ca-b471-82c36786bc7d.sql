-- CRÉDITO 3 y 4: Agregar campos necesarios y políticas de eliminación

-- 1. Agregar campo resumen_ingreso a epicrisis
ALTER TABLE epicrisis ADD COLUMN IF NOT EXISTS resumen_ingreso TEXT;

-- 2. Agregar campo current_diagnoses a admissions para tracking evolutivo
ALTER TABLE admissions ADD COLUMN IF NOT EXISTS current_diagnoses TEXT[];

-- 3. Políticas de eliminación para epicrisis
DROP POLICY IF EXISTS "Users can only delete own epicrisis" ON epicrisis;
CREATE POLICY "Users can only delete own epicrisis"
ON epicrisis FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- 4. Políticas de eliminación para daily_evolutions
DROP POLICY IF EXISTS "Users can only delete own evolutions" ON daily_evolutions;
CREATE POLICY "Users can only delete own evolutions"
ON daily_evolutions FOR DELETE
TO authenticated
USING (created_by = auth.uid());