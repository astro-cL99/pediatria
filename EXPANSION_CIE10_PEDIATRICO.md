# Expansión de Códigos CIE-10 Pediátricos

## Fecha: 2025-01-09

## Problema Identificado

El sistema no incluía muchos diagnósticos pediátricos comunes en la base de datos CIE-10, como:
- ❌ Bronquiolitis
- ❌ Encefalitis
- ❌ Síndrome bronquial obstructivo recurrente
- ❌ Shock séptico
- ❌ Infección del tracto urinario
- ❌ Y muchos más...

## Solución Implementada

Se ha creado una migración SQL que agrega **más de 200 códigos CIE-10** específicos para pediatría, organizados por categorías.

## Categorías Agregadas

### 1. 🫁 ENFERMEDADES RESPIRATORIAS (35 códigos)

**Bronquiolitis:**
- J21.0 - Bronquiolitis aguda debida a VSR
- J21.8 - Bronquiolitis aguda debida a otros microorganismos
- J21.9 - Bronquiolitis aguda, no especificada

**Asma y Broncoespasmo:**
- J45.0 - Asma predominantemente alérgica
- J45.1 - Asma no alérgica
- J45.8 - Asma mixta
- J45.9 - Asma, no especificada
- J44.0 - EPOC con infección respiratoria aguda
- J44.1 - EPOC con exacerbación aguda

**Neumonías:**
- J18.9 - Neumonía, no especificada
- J18.0 - Bronconeumonía
- J18.1 - Neumonía lobar
- J12.0 - Neumonía por adenovirus
- J12.1 - Neumonía por VSR
- J13 - Neumonía por Streptococcus pneumoniae
- J15.0 - Neumonía por Klebsiella
- J15.1 - Neumonía por Pseudomonas
- J15.7 - Neumonía por Mycoplasma

**Infecciones Respiratorias Altas:**
- J00 - Rinofaringitis aguda (resfriado común)
- J02.9 - Faringitis aguda
- J03.9 - Amigdalitis aguda
- J04.0 - Laringitis aguda
- J04.1 - Traqueítis aguda
- J04.2 - Laringotraqueítis aguda
- J05.0 - Laringitis obstructiva aguda (crup)
- J05.1 - Epiglotitis aguda

**Insuficiencia Respiratoria:**
- J96.0 - Insuficiencia respiratoria aguda
- J96.9 - Insuficiencia respiratoria, no especificada

### 2. 🦠 ENFERMEDADES INFECCIOSAS (30 códigos)

**Gastroenteritis:**
- A09 - Diarrea y gastroenteritis de presunto origen infeccioso
- A08.0 - Enteritis por rotavirus
- A08.1 - Gastroenteritis por Norwalk
- A08.2 - Enteritis por adenovirus
- A08.4 - Infección intestinal viral
- A09.0 - Gastroenteritis y colitis de origen infeccioso
- A09.9 - Gastroenteritis de origen no especificado

**Sepsis y Shock Séptico:**
- A41.9 - Septicemia, no especificada
- A41.0 - Septicemia por Staphylococcus aureus
- A41.1 - Septicemia por otros estafilococos
- A41.5 - Septicemia por gramnegativos
- R57.2 - Shock séptico ⭐

**Infecciones Virales:**
- B34.9 - Infección viral, no especificada
- B00.9 - Infección por virus del herpes
- B01.9 - Varicela sin complicación
- B05.9 - Sarampión sin complicación
- B06.9 - Rubéola sin complicación
- B26.9 - Parotiditis sin complicación
- B27.9 - Mononucleosis infecciosa

**Otras Infecciones:**
- A49.9 - Infección bacteriana, no especificada
- B37.9 - Candidiasis, no especificada
- B86 - Escabiosis
- A69.2 - Enfermedad de Lyme

### 3. 🚽 INFECCIONES DEL TRACTO URINARIO (6 códigos)

- N39.0 - Infección de vías urinarias, sitio no especificado ⭐
- N10 - Pielonefritis aguda ⭐
- N12 - Nefritis tubulointersticial
- N30.0 - Cistitis aguda
- N30.9 - Cistitis, no especificada
- N34.1 - Uretritis inespecífica

### 4. 🧠 ENFERMEDADES NEUROLÓGICAS (20 códigos)

**Meningitis y Encefalitis:**
- G03.9 - Meningitis, no especificada
- G00.9 - Meningitis bacteriana
- G02.0 - Meningitis viral
- G04.9 - Encefalitis, no especificada ⭐
- G04.0 - Encefalitis aguda diseminada ⭐
- G04.2 - Meningoencefalitis bacteriana ⭐
- G05.1 - Encefalitis viral ⭐

**Epilepsia y Convulsiones:**
- G40.9 - Epilepsia, no especificada
- G40.0 - Epilepsia focal idiopática
- G40.1 - Epilepsia focal sintomática
- G40.3 - Epilepsia generalizada idiopática
- G41.9 - Estado epiléptico, no especificado
- G41.0 - Estado de gran mal epiléptico
- R56.0 - Convulsiones febriles
- R56.8 - Otras convulsiones

**Otras Condiciones Neurológicas:**
- G93.6 - Edema cerebral
- G93.5 - Compresión del encéfalo
- G91.9 - Hidrocefalia, no especificada

### 5. 🍽️ ENFERMEDADES GASTROINTESTINALES (15 códigos)

- K52.9 - Gastroenteritis no infecciosa
- K59.0 - Constipación
- K59.1 - Diarrea funcional
- K21.9 - Reflujo gastroesofágico sin esofagitis
- K21.0 - Reflujo gastroesofágico con esofagitis
- K29.7 - Gastritis, no especificada
- K35.8 - Apendicitis aguda
- K40.9 - Hernia inguinal
- K42.9 - Hernia umbilical
- K56.0 - Íleo paralítico
- K56.6 - Obstrucción intestinal
- K80.2 - Cálculo de vesícula biliar
- K81.0 - Colecistitis aguda

### 6. 🩹 ENFERMEDADES DERMATOLÓGICAS (11 códigos)

- L20.9 - Dermatitis atópica
- L21.9 - Dermatitis seborreica
- L22 - Dermatitis del pañal
- L23.9 - Dermatitis alérgica de contacto
- L30.9 - Dermatitis, no especificada
- L50.9 - Urticaria
- L03.9 - Celulitis
- L01.0 - Impétigo
- L02.9 - Absceso cutáneo
- L08.9 - Infección cutánea

### 7. 🩸 ENFERMEDADES HEMATOLÓGICAS (14 códigos)

**Anemias:**
- D50.9 - Anemia por deficiencia de hierro
- D50.0 - Anemia ferropénica secundaria
- D51.9 - Anemia por deficiencia de vitamina B12
- D52.9 - Anemia por deficiencia de folato
- D53.9 - Anemia nutricional
- D64.9 - Anemia, no especificada
- D57.1 - Enfermedad de células falciformes

**Trastornos de Coagulación:**
- D69.6 - Trombocitopenia
- D69.3 - Púrpura trombocitopénica idiopática
- D68.9 - Trastorno de la coagulación
- D66 - Hemofilia A
- D67 - Hemofilia B

### 8. ⚡ ENFERMEDADES METABÓLICAS Y ENDOCRINAS (20 códigos)

**Trastornos Hidroelectrolíticos:**
- E86.0 - Deshidratación
- E87.1 - Hiponatremia
- E87.0 - Hipernatremia
- E87.5 - Hiperpotasemia
- E87.6 - Hipopotasemia
- E87.2 - Acidosis
- E87.3 - Alcalosis

**Diabetes y Glucemia:**
- E10.9 - Diabetes mellitus tipo 1
- E11.9 - Diabetes mellitus tipo 2
- E16.2 - Hipoglucemia

**Tiroides:**
- E03.9 - Hipotiroidismo
- E05.9 - Tirotoxicosis

**Nutrición:**
- E55.9 - Deficiencia de vitamina D
- E66.9 - Obesidad
- E44.0 - Desnutrición moderada
- E44.1 - Desnutrición leve
- E46 - Desnutrición proteicocalórica

### 9. ❤️ ENFERMEDADES CARDIOVASCULARES (12 códigos)

- I51.9 - Enfermedad cardíaca
- I50.9 - Insuficiencia cardíaca
- I47.1 - Taquicardia supraventricular
- I47.2 - Taquicardia ventricular
- I49.9 - Arritmia cardíaca
- Q21.0 - Defecto del tabique ventricular
- Q21.1 - Defecto del tabique auricular
- Q25.0 - Conducto arterioso permeable
- I10 - Hipertensión esencial
- I95.9 - Hipotensión

### 10. 🫘 ENFERMEDADES RENALES (4 códigos)

- N17.9 - Insuficiencia renal aguda
- N18.9 - Enfermedad renal crónica
- N04.9 - Síndrome nefrótico
- N05.9 - Síndrome nefrítico

### 11. 🤕 TRAUMATISMOS Y ALERGIAS (6 códigos)

- S06.9 - Traumatismo intracraneal
- S06.0 - Conmoción cerebral
- T78.3 - Edema angioneurótico
- T78.4 - Alergia no especificada
- T78.2 - Shock anafiláctico
- T88.6 - Shock anafiláctico por medicamento

### 12. 🌡️ SÍNTOMAS Y SIGNOS (12 códigos)

- R50.9 - Fiebre
- R51 - Cefalea
- R10.4 - Dolor abdominal
- R11 - Náusea y vómito
- R19.7 - Diarrea
- R05 - Tos
- R06.0 - Disnea
- R06.2 - Sibilancias
- R06.8 - Otras anomalías respiratorias
- R21 - Erupción cutánea
- R55 - Síncope y colapso

### 13. 👶 CONDICIONES PERINATALES (8 códigos)

- P22.0 - Síndrome de dificultad respiratoria del RN
- P22.9 - Dificultad respiratoria del RN
- P59.9 - Ictericia neonatal
- P07.3 - Recién nacido pretérmino
- P07.0 - Peso extremadamente bajo al nacer
- P07.1 - Bajo peso al nacer
- P36.9 - Sepsis neonatal
- P38 - Onfalitis del recién nacido

### 14. 🧬 MALFORMACIONES CONGÉNITAS (8 códigos)

- Q90.9 - Síndrome de Down
- Q03.9 - Hidrocéfalo congénito
- Q05.9 - Espina bífida
- Q35.9 - Fisura del paladar
- Q36.9 - Labio leporino
- Q37.9 - Fisura del paladar con labio leporino
- Q53.9 - Testículo no descendido

### 15. 👂👁️ OTROS DIAGNÓSTICOS COMUNES (15 códigos)

**Odontológico:**
- K00.7 - Síndrome de la erupción dentaria

**Oftalmológico:**
- H10.9 - Conjuntivitis

**Otorrinolaringológico:**
- H66.9 - Otitis media
- H66.0 - Otitis media aguda supurativa
- H65.9 - Otitis media no supurativa
- J35.0 - Amigdalitis crónica
- J35.1 - Hipertrofia de las amígdalas
- J35.2 - Hipertrofia de las adenoides
- J35.3 - Hipertrofia amígdalas y adenoides

**Desarrollo:**
- R62.8 - Fallas del desarrollo
- R62.0 - Falta del desarrollo esperado

**Psiquiátrico:**
- F90.0 - TDAH
- F84.0 - Autismo infantil
- F80.9 - Trastorno del habla y lenguaje

## Total de Códigos Agregados

**Más de 200 códigos CIE-10** específicos para pediatría, organizados en 15 categorías principales.

## Cómo Aplicar la Migración

### Opción 1: Usando Supabase CLI (Recomendado)

```bash
# Navegar al directorio del proyecto
cd d:\Proyecto IA\pedi-flow-chile

# Aplicar la migración
supabase db push
```

### Opción 2: Desde Supabase Dashboard

1. Ir a https://supabase.com/dashboard
2. Seleccionar tu proyecto
3. Ir a "SQL Editor"
4. Copiar y pegar el contenido del archivo:
   `supabase/migrations/20250109_expand_cie10_pediatric.sql`
5. Click en "Run"

### Opción 3: Script SQL Directo

Si no tienes acceso a migraciones, puedes ejecutar el SQL directamente en cualquier cliente PostgreSQL conectado a tu base de datos Supabase.

## Verificación

Después de aplicar la migración, verifica que los códigos se agregaron correctamente:

```sql
-- Contar códigos por categoría
SELECT category, COUNT(*) as total
FROM cie10_codes
GROUP BY category
ORDER BY total DESC;

-- Buscar bronquiolitis
SELECT * FROM cie10_codes
WHERE description ILIKE '%bronquiolitis%';

-- Buscar encefalitis
SELECT * FROM cie10_codes
WHERE description ILIKE '%encefalitis%';

-- Buscar shock séptico
SELECT * FROM cie10_codes
WHERE description ILIKE '%shock%séptico%';

-- Buscar infección urinaria
SELECT * FROM cie10_codes
WHERE description ILIKE '%infección%urinaria%'
   OR description ILIKE '%pielonefritis%';
```

## Uso en la Aplicación

Una vez aplicada la migración, los médicos podrán:

1. **Buscar diagnósticos fácilmente:**
   ```
   Usuario escribe: "bronquiolitis"
   → Sistema muestra:
     J21.0 - Bronquiolitis aguda debida a VSR
     J21.8 - Bronquiolitis aguda debida a otros microorganismos
     J21.9 - Bronquiolitis aguda, no especificada
   ```

2. **Seleccionar múltiples diagnósticos:**
   ```
   Click en J21.0
   → Se agrega a "Diagnósticos Seleccionados"
   → Badge: "J21.0 - Bronquiolitis aguda debida a VSR"
   ```

3. **Buscar por categoría:**
   ```
   Usuario escribe: "respiratorio"
   → Sistema muestra todos los diagnósticos respiratorios
   ```

## Beneficios

### Para el Médico
- ✅ **Búsqueda rápida** de diagnósticos comunes
- ✅ **Códigos correctos** según CIE-10
- ✅ **Categorización clara** por especialidad
- ✅ **Autocompletado** inteligente
- ✅ **Menos errores** de codificación

### Para el Sistema
- ✅ **Estadísticas precisas** por diagnóstico
- ✅ **Reportes confiables** para auditorías
- ✅ **Integración** con sistemas de facturación
- ✅ **Búsqueda semántica** mejorada
- ✅ **Base de datos completa** para pediatría

### Para el Hospital
- ✅ **Codificación correcta** para reembolsos
- ✅ **Estadísticas epidemiológicas** precisas
- ✅ **Cumplimiento normativo** con CIE-10
- ✅ **Reportes de calidad** mejorados

## Diagnósticos Más Buscados en Pediatría

Según la práctica clínica, estos son los diagnósticos más comunes que ahora están disponibles:

### Top 20 Diagnósticos Pediátricos

1. ✅ J21.9 - Bronquiolitis aguda
2. ✅ A09 - Gastroenteritis infecciosa
3. ✅ J06.9 - Infección respiratoria alta
4. ✅ N39.0 - Infección de vías urinarias
5. ✅ J18.9 - Neumonía
6. ✅ J45.9 - Asma
7. ✅ R50.9 - Fiebre
8. ✅ H66.9 - Otitis media
9. ✅ J03.9 - Amigdalitis aguda
10. ✅ L20.9 - Dermatitis atópica
11. ✅ K59.0 - Constipación
12. ✅ R56.0 - Convulsiones febriles
13. ✅ D50.9 - Anemia ferropénica
14. ✅ E86.0 - Deshidratación
15. ✅ J05.0 - Crup (laringitis obstructiva)
16. ✅ K21.9 - Reflujo gastroesofágico
17. ✅ L22 - Dermatitis del pañal
18. ✅ B01.9 - Varicela
19. ✅ J00 - Resfriado común
20. ✅ P59.9 - Ictericia neonatal

## Mantenimiento Futuro

### Agregar Nuevos Códigos

Para agregar más códigos en el futuro, usar el mismo formato:

```sql
INSERT INTO cie10_codes (code, description, category) VALUES
('X00.0', 'Descripción del diagnóstico', 'Categoría')
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  category = EXCLUDED.category;
```

### Actualizar Códigos Existentes

```sql
UPDATE cie10_codes
SET description = 'Nueva descripción',
    category = 'Nueva categoría'
WHERE code = 'J21.0';
```

## Archivos Creados

- ✅ `supabase/migrations/20250109_expand_cie10_pediatric.sql` - Migración SQL
- ✅ `EXPANSION_CIE10_PEDIATRICO.md` - Esta documentación

## Resumen

**Se han agregado más de 200 códigos CIE-10 específicos para pediatría**, incluyendo:
- ✅ Bronquiolitis (J21.x)
- ✅ Encefalitis (G04.x, G05.x)
- ✅ Shock séptico (R57.2)
- ✅ Infección del tracto urinario (N39.0, N10, N30.x)
- ✅ Y muchos más diagnósticos pediátricos comunes

**El sistema ahora tiene una base de datos completa de diagnósticos CIE-10 para pediatría, facilitando la codificación correcta y búsqueda rápida de diagnósticos.**
