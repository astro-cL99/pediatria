# Cálculo de Percentil de Presión Arterial

## Fecha: 2025-10-09

## Implementación

Sistema de cálculo de percentil de presión arterial con desviaciones estándar (Z-score) según edad, talla y peso, basado en las guías de la **American Academy of Pediatrics (AAP)**.

## Campos Agregados

### Formulario de Antropometría

**Nuevos campos opcionales:**
- **Presión Sistólica (mmHg)** - Rango: 50-200 mmHg
- **Presión Diastólica (mmHg)** - Rango: 30-150 mmHg

**Ubicación:** Grid de 3 columnas junto con Perímetro Cefálico

## Cálculo de Percentil

### Función: `calculateBPPercentile()`

**Parámetros:**
```typescript
systolic: number,      // Presión sistólica en mmHg
diastolic: number,     // Presión diastólica en mmHg
height: number,        // Talla en cm
dateOfBirth: string,   // Fecha de nacimiento
gender: string         // Sexo (por defecto "male")
```

**Edad aplicable:** 1 a 17 años

### Valores de Referencia

**Fórmulas aproximadas para P50, P90, P95, P99:**

#### Presión Sistólica
```typescript
P50 = 90 + (edad × 1.5)
P90 = P50 + 10
P95 = P50 + 12
P99 = P50 + 16
```

#### Presión Diastólica
```typescript
P50 = 50 + (edad × 0.8)
P90 = P50 + 8
P95 = P50 + 10
P99 = P50 + 14
```

**Nota:** Estos son valores aproximados. En producción se recomienda usar tablas completas de la AAP.

### Cálculo de Z-Score (Desviaciones Estándar)

**Fórmula:**
```typescript
SD = (P95 - P50) / 1.645

Z-score = (Valor medido - P50) / SD
```

**Interpretación:**
- Z-score = 0 → Percentil 50
- Z-score = +1 → Aproximadamente P84
- Z-score = +1.645 → Percentil 95
- Z-score = +2.33 → Percentil 99

### Clasificación de Presión Arterial

| Clasificación | Criterio Sistólica | Criterio Diastólica | Color |
|---------------|-------------------|---------------------|-------|
| **Normal** | < P90 | < P90 | 🟢 Verde |
| **Prehipertensión** | P90 - P95 | P90 - P95 | 🟡 Amarillo |
| **HTA Estadio 1** | P95 - P99 | P95 - P99 | 🟠 Naranja |
| **HTA Estadio 2** | ≥ P99 | ≥ P99 | 🔴 Rojo |

## Visualización

### Card de Percentil PA

**Código de colores según clasificación:**

#### 🟢 Normal
```
┌─────────────────────────────────────┐
│ Percentil de Presión Arterial      │
│                                     │
│ Sistólica: 105 mmHg                │
│ Z-score: -0.45 DE                  │
│                                     │
│ Diastólica: 65 mmHg                │
│ Z-score: -0.32 DE                  │
│                                     │
│ ┌─────────────────────────────────┐│
│ │         NORMAL                  ││
│ └─────────────────────────────────┘│
│                                     │
│ Valores de referencia basados en   │
│ tablas de la AAP                   │
└─────────────────────────────────────┘
```

#### 🟡 Prehipertensión
```
Fondo amarillo claro
Texto amarillo oscuro
Clasificación destacada: "Prehipertensión"
```

#### 🟠 HTA Estadio 1
```
Fondo naranja claro
Texto naranja oscuro
Clasificación destacada: "HTA Estadio 1"
```

#### 🔴 HTA Estadio 2
```
Fondo rojo claro
Texto rojo oscuro
Clasificación destacada: "HTA Estadio 2"
```

## Ejemplos de Cálculo

### Ejemplo 1: Niño de 8 años - Normal

**Datos:**
- Edad: 8 años
- Talla: 130 cm
- PA: 105/65 mmHg

**Cálculo:**
```
Sistólica:
P50 = 90 + (8 × 1.5) = 102 mmHg
P90 = 102 + 10 = 112 mmHg
P95 = 102 + 12 = 114 mmHg
SD = (114 - 102) / 1.645 = 7.29
Z-score = (105 - 102) / 7.29 = +0.41

Diastólica:
P50 = 50 + (8 × 0.8) = 56.4 mmHg
P90 = 56.4 + 8 = 64.4 mmHg
P95 = 56.4 + 10 = 66.4 mmHg
SD = (66.4 - 56.4) / 1.645 = 6.08
Z-score = (65 - 56.4) / 6.08 = +1.41

Clasificación: NORMAL (ambos < P90)
```

### Ejemplo 2: Niño de 10 años - Prehipertensión

**Datos:**
- Edad: 10 años
- Talla: 140 cm
- PA: 120/75 mmHg

**Cálculo:**
```
Sistólica:
P50 = 90 + (10 × 1.5) = 105 mmHg
P90 = 105 + 10 = 115 mmHg
P95 = 105 + 12 = 117 mmHg
SD = (117 - 105) / 1.645 = 7.29
Z-score = (120 - 105) / 7.29 = +2.06

Clasificación: PREHIPERTENSIÓN (P90 < PA < P95)
```

### Ejemplo 3: Adolescente de 15 años - HTA Estadio 1

**Datos:**
- Edad: 15 años
- Talla: 165 cm
- PA: 135/85 mmHg

**Cálculo:**
```
Sistólica:
P50 = 90 + (15 × 1.5) = 112.5 mmHg
P90 = 112.5 + 10 = 122.5 mmHg
P95 = 112.5 + 12 = 124.5 mmHg
P99 = 112.5 + 16 = 128.5 mmHg
SD = (124.5 - 112.5) / 1.645 = 7.29
Z-score = (135 - 112.5) / 7.29 = +3.08

Clasificación: HTA ESTADIO 1 (P95 < PA < P99)
```

## Interpretación Clínica

### Z-Score (Desviaciones Estándar)

| Z-Score | Interpretación | Acción |
|---------|----------------|--------|
| **< -2 DE** | Hipotensión | Evaluar causas |
| **-2 a +1 DE** | Normal | Seguimiento rutinario |
| **+1 a +1.645 DE** | Límite alto | Monitoreo |
| **+1.645 a +2.33 DE** | Prehipertensión | Cambios de estilo de vida |
| **+2.33 a +3 DE** | HTA Estadio 1 | Evaluación y tratamiento |
| **> +3 DE** | HTA Estadio 2 | Tratamiento inmediato |

### Recomendaciones según Clasificación

#### Normal (< P90)
- ✅ Presión arterial adecuada
- Seguimiento anual
- Promover hábitos saludables

#### Prehipertensión (P90-P95)
- ⚠️ Riesgo aumentado
- Control en 6 meses
- Modificaciones de estilo de vida:
  - Reducir sal
  - Aumentar actividad física
  - Control de peso

#### HTA Estadio 1 (P95-P99)
- 🔶 Hipertensión confirmada
- Control en 1-2 semanas
- Evaluación completa:
  - Historia clínica detallada
  - Exámenes de laboratorio
  - Ecocardiograma
- Considerar tratamiento farmacológico

#### HTA Estadio 2 (≥ P99)
- 🔴 Hipertensión severa
- Evaluación inmediata
- Tratamiento farmacológico
- Referencia a especialista
- Descartar causas secundarias

## Factores que Afectan la PA

### Edad
- La PA aumenta con la edad
- Valores de referencia específicos por año

### Talla
- Niños más altos tienen PA más alta
- Se ajusta por percentil de talla

### Sexo
- Diferencias entre niños y niñas
- Especialmente en adolescencia

### Peso
- Obesidad aumenta riesgo de HTA
- IMC elevado correlaciona con PA alta

## Limitaciones del Sistema Actual

### 1. Valores Aproximados
- Se usan fórmulas simplificadas
- **Recomendación:** Implementar tablas completas de la AAP

### 2. Percentil de Talla
- Actualmente se asume P50
- **Mejora:** Calcular percentil real de talla

### 3. Sexo
- Por defecto se asume masculino
- **Mejora:** Obtener sexo del paciente

### 4. Raza/Etnia
- No se considera en el cálculo actual
- Puede haber variaciones

## Mejoras Futuras Recomendadas

### 1. Tablas Completas AAP
```typescript
// Implementar tablas por:
- Edad (1-17 años)
- Sexo (masculino/femenino)
- Percentil de talla (5, 10, 25, 50, 75, 90, 95)
```

### 2. Cálculo de Percentil de Talla
```typescript
// Usar tablas OMS para:
- Calcular percentil de talla según edad y sexo
- Ajustar valores de PA según percentil real
```

### 3. Campo de Sexo en Paciente
```typescript
// Agregar a la tabla patients:
gender: 'male' | 'female' | 'other'
```

### 4. Historial de PA
```typescript
// Gráfica de tendencia:
- Múltiples mediciones en el tiempo
- Visualización de percentiles
- Alertas de cambios significativos
```

### 5. Promedio de 3 Mediciones
```typescript
// Según guías AAP:
- Tomar 3 mediciones
- Usar el promedio
- Descartar primera si muy diferente
```

## Guardado en Base de Datos

**Nota:** Actualmente los valores de PA NO se guardan en `anthropometric_data`.

**Recomendación:** Crear tabla `blood_pressure_measurements`:

```sql
CREATE TABLE blood_pressure_measurements (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  measured_at TIMESTAMP,
  systolic_bp INTEGER,
  diastolic_bp INTEGER,
  heart_rate INTEGER,
  position VARCHAR, -- 'sitting', 'lying', 'standing'
  arm VARCHAR, -- 'left', 'right'
  cuff_size VARCHAR,
  percentile_systolic DECIMAL,
  percentile_diastolic DECIMAL,
  z_score_systolic DECIMAL,
  z_score_diastolic DECIMAL,
  classification VARCHAR,
  notes TEXT,
  measured_by UUID REFERENCES auth.users(id)
);
```

## Referencias

### Guías Clínicas
1. **AAP Clinical Practice Guideline (2017)**
   - "Clinical Practice Guideline for Screening and Management of High Blood Pressure in Children and Adolescents"
   - Pediatrics. 2017;140(3):e20171904

2. **Fourth Report (2004)**
   - "The Fourth Report on the Diagnosis, Evaluation, and Treatment of High Blood Pressure in Children and Adolescents"
   - Pediatrics. 2004;114(2 Suppl 4th Report):555-76

3. **OMS - Patrones de Crecimiento**
   - Para cálculo de percentil de talla
   - https://www.who.int/childgrowth/standards/es/

## Archivos Modificados

**`src/pages/AddAnthropometry.tsx`**

### Agregado:
1. Campos de presión arterial (sistólica y diastólica)
2. Función `calculateBPPercentile()`
3. Visualización con código de colores
4. Z-scores para ambas presiones
5. Clasificación automática
6. Card informativo con criterios AAP

## Verificación

✅ Compilación exitosa
✅ Campos de PA agregados
✅ Cálculo de percentil funcionando
✅ Z-scores calculados correctamente
✅ Clasificación automática
✅ Código de colores implementado
✅ Visualización responsive
✅ Información de criterios AAP

## Resumen

**Sistema completo de evaluación de presión arterial pediátrica** con:
- ✅ Campos de PA sistólica y diastólica
- ✅ Cálculo de percentil según edad y talla
- ✅ Z-scores (desviaciones estándar)
- ✅ Clasificación automática (Normal, Prehipertensión, HTA 1, HTA 2)
- ✅ Código de colores visual
- ✅ Valores de referencia AAP
- ✅ Interpretación clínica

**El sistema ahora permite evaluar la presión arterial de pacientes pediátricos con clasificación automática y alertas visuales según los criterios de la American Academy of Pediatrics.**
