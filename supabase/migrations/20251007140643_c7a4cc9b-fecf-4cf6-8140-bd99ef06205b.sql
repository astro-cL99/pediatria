-- Crear tabla para códigos CIE-10
CREATE TABLE IF NOT EXISTS public.cie10_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX idx_cie10_code ON public.cie10_codes(code);
CREATE INDEX idx_cie10_description ON public.cie10_codes USING gin(to_tsvector('spanish', description));

-- RLS policies
ALTER TABLE public.cie10_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read CIE-10 codes"
ON public.cie10_codes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only authenticated users can insert CIE-10 codes"
ON public.cie10_codes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Insertar algunos códigos CIE-10 comunes en pediatría
INSERT INTO public.cie10_codes (code, description, category) VALUES
('J06.9', 'Infección aguda de las vías respiratorias superiores, no especificada', 'Respiratorio'),
('J18.9', 'Neumonía, no especificada', 'Respiratorio'),
('A09', 'Diarrea y gastroenteritis de presunto origen infeccioso', 'Digestivo'),
('K52.9', 'Gastroenteritis y colitis no infecciosa, no especificada', 'Digestivo'),
('J45.9', 'Asma, no especificada', 'Respiratorio'),
('J20.9', 'Bronquitis aguda, no especificada', 'Respiratorio'),
('B34.9', 'Infección viral, no especificada', 'Infeccioso'),
('R50.9', 'Fiebre, no especificada', 'Síntomas'),
('R11', 'Náuseas y vómitos', 'Síntomas'),
('R10.4', 'Otros dolores abdominales y los no especificados', 'Síntomas'),
('J03.9', 'Amigdalitis aguda, no especificada', 'Respiratorio'),
('H66.9', 'Otitis media, no especificada', 'ORL'),
('L03.90', 'Celulitis, sitio no especificado', 'Dermatológico'),
('N39.0', 'Infección de vías urinarias, sitio no especificado', 'Urológico'),
('E86', 'Depleción de volumen (Deshidratación)', 'Metabólico')
ON CONFLICT (code) DO NOTHING;