-- Agregar categorías principales de CIE-10 organizadas por capítulos
-- Solo agregamos códigos que no existan ya para evitar duplicados

-- A00-B99: CIERTAS ENFERMEDADES INFECCIOSAS Y PARASITARIAS
INSERT INTO cie10_codes (code, description, category)
SELECT * FROM (VALUES
  ('A00', 'Cólera', 'A00-B99 ENFERMEDADES INFECCIOSAS Y PARASITARIAS'),
  ('A09', 'Diarrea y gastroenteritis de presunto origen infeccioso', 'A00-B99 ENFERMEDADES INFECCIOSAS Y PARASITARIAS'),
  ('B34', 'Infección viral de sitio no especificado', 'A00-B99 ENFERMEDADES INFECCIOSAS Y PARASITARIAS'),
  ('B97', 'Virus como causa de enfermedades clasificadas en otros capítulos', 'A00-B99 ENFERMEDADES INFECCIOSAS Y PARASITARIAS')
) AS v(code, description, category)
WHERE NOT EXISTS (
  SELECT 1 FROM cie10_codes WHERE cie10_codes.code = v.code
);

-- C00-D48: NEOPLASIAS
INSERT INTO cie10_codes (code, description, category)
SELECT * FROM (VALUES
  ('C00', 'Tumor maligno del labio', 'C00-D48 NEOPLASIAS'),
  ('C22', 'Tumor maligno del hígado y de las vías biliares intrahepáticas', 'C00-D48 NEOPLASIAS'),
  ('D10', 'Tumor benigno de la boca y de la faringe', 'C00-D48 NEOPLASIAS')
) AS v(code, description, category)
WHERE NOT EXISTS (
  SELECT 1 FROM cie10_codes WHERE cie10_codes.code = v.code
);

-- D50-D89: ENFERMEDADES DE LA SANGRE
INSERT INTO cie10_codes (code, description, category)
SELECT * FROM (VALUES
  ('D50', 'Anemia por deficiencia de hierro', 'D50-D89 ENFERMEDADES DE LA SANGRE'),
  ('D64', 'Otras anemias', 'D50-D89 ENFERMEDADES DE LA SANGRE'),
  ('D68', 'Otros defectos de la coagulación', 'D50-D89 ENFERMEDADES DE LA SANGRE')
) AS v(code, description, category)
WHERE NOT EXISTS (
  SELECT 1 FROM cie10_codes WHERE cie10_codes.code = v.code
);

-- E00-E89: ENFERMEDADES ENDOCRINAS, NUTRICIONALES Y METABÓLICAS
INSERT INTO cie10_codes (code, description, category)
SELECT * FROM (VALUES
  ('E10', 'Diabetes mellitus tipo 1', 'E00-E89 ENFERMEDADES ENDOCRINAS Y METABÓLICAS'),
  ('E11', 'Diabetes mellitus tipo 2', 'E00-E89 ENFERMEDADES ENDOCRINAS Y METABÓLICAS'),
  ('E66', 'Obesidad', 'E00-E89 ENFERMEDADES ENDOCRINAS Y METABÓLICAS'),
  ('E87', 'Otros trastornos del equilibrio hidroelectrolítico y ácido-base', 'E00-E89 ENFERMEDADES ENDOCRINAS Y METABÓLICAS')
) AS v(code, description, category)
WHERE NOT EXISTS (
  SELECT 1 FROM cie10_codes WHERE cie10_codes.code = v.code
);

-- F01-F99: TRASTORNOS MENTALES
INSERT INTO cie10_codes (code, description, category)
SELECT * FROM (VALUES
  ('F32', 'Episodio depresivo', 'F01-F99 TRASTORNOS MENTALES Y DEL COMPORTAMIENTO'),
  ('F41', 'Otros trastornos de ansiedad', 'F01-F99 TRASTORNOS MENTALES Y DEL COMPORTAMIENTO'),
  ('F90', 'Trastornos hipercinéticos', 'F01-F99 TRASTORNOS MENTALES Y DEL COMPORTAMIENTO')
) AS v(code, description, category)
WHERE NOT EXISTS (
  SELECT 1 FROM cie10_codes WHERE cie10_codes.code = v.code
);

-- G00-G99: ENFERMEDADES DEL SISTEMA NERVIOSO
INSERT INTO cie10_codes (code, description, category)
SELECT * FROM (VALUES
  ('G40', 'Epilepsia', 'G00-G99 ENFERMEDADES DEL SISTEMA NERVIOSO'),
  ('G43', 'Migraña', 'G00-G99 ENFERMEDADES DEL SISTEMA NERVIOSO'),
  ('G47', 'Trastornos del sueño', 'G00-G99 ENFERMEDADES DEL SISTEMA NERVIOSO')
) AS v(code, description, category)
WHERE NOT EXISTS (
  SELECT 1 FROM cie10_codes WHERE cie10_codes.code = v.code
);

-- H00-H59: ENFERMEDADES DEL OJO
INSERT INTO cie10_codes (code, description, category)
SELECT * FROM (VALUES
  ('H10', 'Conjuntivitis', 'H00-H59 ENFERMEDADES DEL OJO Y SUS ANEXOS'),
  ('H52', 'Trastornos de la refracción y de la acomodación', 'H00-H59 ENFERMEDADES DEL OJO Y SUS ANEXOS')
) AS v(code, description, category)
WHERE NOT EXISTS (
  SELECT 1 FROM cie10_codes WHERE cie10_codes.code = v.code
);

-- H60-H95: ENFERMEDADES DEL OÍDO
INSERT INTO cie10_codes (code, description, category)
SELECT * FROM (VALUES
  ('H66', 'Otitis media supurativa y la no especificada', 'H60-H95 ENFERMEDADES DEL OÍDO'),
  ('H90', 'Hipoacusia conductiva y neurosensorial', 'H60-H95 ENFERMEDADES DEL OÍDO')
) AS v(code, description, category)
WHERE NOT EXISTS (
  SELECT 1 FROM cie10_codes WHERE cie10_codes.code = v.code
);

-- I00-I99: ENFERMEDADES DEL APARATO CIRCULATORIO
INSERT INTO cie10_codes (code, description, category)
SELECT * FROM (VALUES
  ('I10', 'Hipertensión esencial (primaria)', 'I00-I99 ENFERMEDADES DEL APARATO CIRCULATORIO'),
  ('I50', 'Insuficiencia cardíaca', 'I00-I99 ENFERMEDADES DEL APARATO CIRCULATORIO')
) AS v(code, description, category)
WHERE NOT EXISTS (
  SELECT 1 FROM cie10_codes WHERE cie10_codes.code = v.code
);

-- K00-K95: ENFERMEDADES DEL APARATO DIGESTIVO
INSERT INTO cie10_codes (code, description, category)
SELECT * FROM (VALUES
  ('K29', 'Gastritis y duodenitis', 'K00-K95 ENFERMEDADES DEL APARATO DIGESTIVO'),
  ('K52', 'Otras gastroenteritis y colitis no infecciosas', 'K00-K95 ENFERMEDADES DEL APARATO DIGESTIVO'),
  ('K59', 'Otros trastornos funcionales del intestino', 'K00-K95 ENFERMEDADES DEL APARATO DIGESTIVO')
) AS v(code, description, category)
WHERE NOT EXISTS (
  SELECT 1 FROM cie10_codes WHERE cie10_codes.code = v.code
);

-- L00-L99: ENFERMEDADES DE LA PIEL
INSERT INTO cie10_codes (code, description, category)
SELECT * FROM (VALUES
  ('L20', 'Dermatitis atópica', 'L00-L99 ENFERMEDADES DE LA PIEL'),
  ('L30', 'Otras dermatitis', 'L00-L99 ENFERMEDADES DE LA PIEL'),
  ('L50', 'Urticaria', 'L00-L99 ENFERMEDADES DE LA PIEL')
) AS v(code, description, category)
WHERE NOT EXISTS (
  SELECT 1 FROM cie10_codes WHERE cie10_codes.code = v.code
);

-- M00-M99: ENFERMEDADES DEL APARATO MUSCULOESQUELÉTICO
INSERT INTO cie10_codes (code, description, category)
SELECT * FROM (VALUES
  ('M15', 'Poliartrosis', 'M00-M99 ENFERMEDADES DEL APARATO MUSCULOESQUELÉTICO'),
  ('M25', 'Otros trastornos articulares', 'M00-M99 ENFERMEDADES DEL APARATO MUSCULOESQUELÉTICO')
) AS v(code, description, category)
WHERE NOT EXISTS (
  SELECT 1 FROM cie10_codes WHERE cie10_codes.code = v.code
);

-- N00-N99: ENFERMEDADES DEL APARATO GENITOURINARIO
INSERT INTO cie10_codes (code, description, category)
SELECT * FROM (VALUES
  ('N10', 'Nefritis tubulointersticial aguda', 'N00-N99 ENFERMEDADES DEL APARATO GENITOURINARIO'),
  ('N30', 'Cistitis', 'N00-N99 ENFERMEDADES DEL APARATO GENITOURINARIO'),
  ('N39', 'Otros trastornos del sistema urinario', 'N00-N99 ENFERMEDADES DEL APARATO GENITOURINARIO')
) AS v(code, description, category)
WHERE NOT EXISTS (
  SELECT 1 FROM cie10_codes WHERE cie10_codes.code = v.code
);

-- P00-P96: AFECCIONES PERINATALES
INSERT INTO cie10_codes (code, description, category)
SELECT * FROM (VALUES
  ('P07', 'Trastornos relacionados con duración corta de la gestación y peso bajo al nacer', 'P00-P96 AFECCIONES ORIGINADAS EN PERÍODO PERINATAL'),
  ('P22', 'Dificultad respiratoria del recién nacido', 'P00-P96 AFECCIONES ORIGINADAS EN PERÍODO PERINATAL'),
  ('P59', 'Ictericia neonatal por otras causas y las no especificadas', 'P00-P96 AFECCIONES ORIGINADAS EN PERÍODO PERINATAL')
) AS v(code, description, category)
WHERE NOT EXISTS (
  SELECT 1 FROM cie10_codes WHERE cie10_codes.code = v.code
);

-- Q00-Q99: MALFORMACIONES CONGÉNITAS
INSERT INTO cie10_codes (code, description, category)
SELECT * FROM (VALUES
  ('Q21', 'Malformaciones congénitas de los tabiques cardíacos', 'Q00-Q99 MALFORMACIONES CONGÉNITAS'),
  ('Q38', 'Otras malformaciones congénitas de la lengua, de la boca y de la faringe', 'Q00-Q99 MALFORMACIONES CONGÉNITAS'),
  ('Q90', 'Síndrome de Down', 'Q00-Q99 MALFORMACIONES CONGÉNITAS')
) AS v(code, description, category)
WHERE NOT EXISTS (
  SELECT 1 FROM cie10_codes WHERE cie10_codes.code = v.code
);

-- R00-R99: SÍNTOMAS Y SIGNOS
INSERT INTO cie10_codes (code, description, category)
SELECT * FROM (VALUES
  ('R05', 'Tos', 'R00-R99 SÍNTOMAS Y SIGNOS'),
  ('R50', 'Fiebre de origen desconocido', 'R00-R99 SÍNTOMAS Y SIGNOS'),
  ('R51', 'Cefalea', 'R00-R99 SÍNTOMAS Y SIGNOS'),
  ('R10', 'Dolor abdominal y pélvico', 'R00-R99 SÍNTOMAS Y SIGNOS')
) AS v(code, description, category)
WHERE NOT EXISTS (
  SELECT 1 FROM cie10_codes WHERE cie10_codes.code = v.code
);

-- S00-T88: LESIONES TRAUMÁTICAS
INSERT INTO cie10_codes (code, description, category)
SELECT * FROM (VALUES
  ('S06', 'Traumatismo intracraneal', 'S00-T88 LESIONES TRAUMÁTICAS Y ENVENENAMIENTOS'),
  ('S52', 'Fractura del antebrazo', 'S00-T88 LESIONES TRAUMÁTICAS Y ENVENENAMIENTOS'),
  ('T78', 'Efectos adversos, no clasificados en otra parte', 'S00-T88 LESIONES TRAUMÁTICAS Y ENVENENAMIENTOS')
) AS v(code, description, category)
WHERE NOT EXISTS (
  SELECT 1 FROM cie10_codes WHERE cie10_codes.code = v.code
);

-- Z00-Z99: FACTORES QUE INFLUYEN EN EL ESTADO DE SALUD
INSERT INTO cie10_codes (code, description, category)
SELECT * FROM (VALUES
  ('Z00', 'Examen general e investigación de personas sin quejas o sin diagnóstico informado', 'Z00-Z99 FACTORES QUE INFLUYEN EN EL ESTADO DE SALUD'),
  ('Z23', 'Necesidad de inmunización contra enfermedad bacteriana única', 'Z00-Z99 FACTORES QUE INFLUYEN EN EL ESTADO DE SALUD'),
  ('Z71', 'Personas en contacto con los servicios de salud por otras consultas y consejos médicos', 'Z00-Z99 FACTORES QUE INFLUYEN EN EL ESTADO DE SALUD')
) AS v(code, description, category)
WHERE NOT EXISTS (
  SELECT 1 FROM cie10_codes WHERE cie10_codes.code = v.code
);