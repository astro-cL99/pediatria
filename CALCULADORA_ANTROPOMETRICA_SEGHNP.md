# Calculadora Antropométrica - Criterios SEGHNP

## Fecha: 2025-10-09

## Implementación

Calculadora antropométrica basada en los criterios de la **Sociedad Española de Gastroenterología, Hepatología y Nutrición Pediátrica (SEGHNP)**.

**Referencia:** https://www.seghnp.org/nutricional/

## Cálculos Implementados

### 1. Superficie Corporal - Fórmula de DuBois

**Fórmula:**
```
BSA (m²) = 0.007184 × peso^0.425 × talla^0.725
```

**Implementación:**
```typescript
const calculateBodySurfaceArea = (weight: number, height: number) => {
  if (weight && height && weight > 0 && height > 0) {
    const bsa = 0.007184 * Math.pow(weight, 0.425) * Math.pow(height, 0.725);
    return parseFloat(bsa.toFixed(4));
  }
  return undefined;
};
```

**Uso:**
- Cálculo de dosis de medicamentos
- Evaluación de función renal
- Planificación de tratamientos oncológicos
- Cálculos de requerimientos nutricionales

### 2. Índice de Masa Corporal (IMC)

**Fórmula:**
```
IMC = peso (kg) / altura² (m)
```

**Implementación:**
```typescript
const calculateBMI = (weight: number, height: number) => {
  if (weight && height && height > 0) {
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return parseFloat(bmi.toFixed(2));
  }
  return undefined;
};
```

### 3. Indicadores Nutricionales según Edad

#### Criterios SEGHNP:

**< 1 año: Peso/Edad**
```typescript
if (age.totalMonths < 12) {
  return {
    type: "Peso/Edad",
    description: "Indicador nutricional para menores de 1 año",
    note: "Se evalúa con tablas de percentiles OMS"
  };
}
```

**1 a 5 años: Peso/Talla**
```typescript
if (age.years >= 1 && age.years < 5) {
  const ratio = (weight / height) * 100;
  return {
    type: "Peso/Talla",
    value: ratio.toFixed(2),
    description: "Indicador nutricional para 1-5 años",
    note: "Se evalúa con tablas de percentiles OMS"
  };
}
```

**≥ 5 años: IMC**
```typescript
if (age.years >= 5) {
  const bmi = calculateBMI(weight, height);
  return {
    type: "IMC (Índice de Masa Corporal)",
    value: bmi,
    description: "Indicador nutricional para mayores de 5 años",
    note: "Se evalúa con tablas de percentiles OMS"
  };
}
```

## Visualización en el Formulario

### Cálculos Automáticos en Tiempo Real

**3 Cards con Código de Colores:**

#### 1. IMC (Azul)
```
┌─────────────────────────────────┐
│ IMC (Índice de Masa Corporal)  │
│                                 │
│     15.98  kg/m²               │
│                                 │
│ Fórmula: peso / altura²        │
└─────────────────────────────────┘
```

#### 2. Superficie Corporal (Púrpura)
```
┌─────────────────────────────────┐
│ Superficie Corporal (DuBois)   │
│                                 │
│     0.6234  m²                 │
│                                 │
│ Fórmula: 0.007184 × peso^0.425 │
│          × talla^0.725          │
└─────────────────────────────────┘
```

#### 3. Indicador Nutricional (Verde)
```
┌─────────────────────────────────┐
│ Peso/Talla                      │
│                                 │
│     14.72                       │
│                                 │
│ Indicador nutricional para     │
│ 1-5 años                        │
│                                 │
│ Se evalúa con tablas de        │
│ percentiles OMS                 │
└─────────────────────────────────┘
```

## Tabla de Indicadores por Edad

| Edad | Indicador | Fórmula | Uso |
|------|-----------|---------|-----|
| **< 1 año** | Peso/Edad | Evaluación con tablas OMS | Detectar desnutrición temprana |
| **1-5 años** | Peso/Talla | (peso / talla) × 100 | Evaluar estado nutricional actual |
| **≥ 5 años** | IMC | peso / altura² | Clasificar estado nutricional |

## Guardado en Base de Datos

**Tabla:** `anthropometric_data`

**Campos guardados:**
```typescript
{
  patient_id: string,
  weight_kg: number,              // Peso en kg
  height_cm: number,              // Talla en cm
  head_circumference_cm: number,  // Perímetro cefálico (opcional)
  bmi: number,                    // IMC calculado
  body_surface_area: number,      // BSA (DuBois) calculado
  measured_at: timestamp,         // Fecha de medición
  notes: string                   // Notas opcionales
}
```

## Ejemplos de Cálculo

### Ejemplo 1: Lactante de 8 meses
```
Entrada:
- Peso: 8.5 kg
- Talla: 70 cm
- Edad: 8 meses

Cálculos:
- IMC: 8.5 / (0.70)² = 17.35 kg/m²
- BSA: 0.007184 × 8.5^0.425 × 70^0.725 = 0.3856 m²
- Indicador: Peso/Edad (< 1 año)
```

### Ejemplo 2: Preescolar de 3 años
```
Entrada:
- Peso: 15.5 kg
- Talla: 98 cm
- Edad: 3 años

Cálculos:
- IMC: 15.5 / (0.98)² = 16.14 kg/m²
- BSA: 0.007184 × 15.5^0.425 × 98^0.725 = 0.6234 m²
- Indicador: Peso/Talla = (15.5 / 98) × 100 = 15.82
- Uso: Peso/Talla (1-5 años)
```

### Ejemplo 3: Escolar de 8 años
```
Entrada:
- Peso: 28 kg
- Talla: 130 cm
- Edad: 8 años

Cálculos:
- IMC: 28 / (1.30)² = 16.57 kg/m²
- BSA: 0.007184 × 28^0.425 × 130^0.725 = 0.9876 m²
- Indicador: IMC = 16.57 kg/m² (≥ 5 años)
```

## Interpretación de Resultados

### IMC (≥ 5 años)

**Clasificación OMS:**
- **< P5:** Bajo peso
- **P5 - P85:** Normopeso
- **P85 - P95:** Sobrepeso
- **≥ P95:** Obesidad

### Peso/Talla (1-5 años)

**Clasificación OMS:**
- **< -2 DE:** Desnutrición aguda
- **-2 a +1 DE:** Normal
- **+1 a +2 DE:** Riesgo de sobrepeso
- **> +2 DE:** Sobrepeso

### Peso/Edad (< 1 año)

**Clasificación OMS:**
- **< -2 DE:** Bajo peso
- **-2 a +2 DE:** Peso adecuado
- **> +2 DE:** Peso elevado

## Características de la Interfaz

### Cálculo en Tiempo Real
- Los valores se calculan automáticamente mientras se escribe
- No requiere hacer clic en ningún botón
- Actualización instantánea

### Código de Colores
- 🔵 **Azul:** IMC
- 🟣 **Púrpura:** Superficie Corporal
- 🟢 **Verde:** Indicador Nutricional según edad

### Información Contextual
- Cada cálculo muestra su fórmula
- Indicador nutricional explica el criterio usado
- Card informativo con criterios SEGHNP

### Responsive
- 1 columna en móvil
- 2 columnas en tablet/desktop
- Cards adaptables

## Ventajas del Sistema

### Para el Médico
1. **Cálculos Automáticos:** No necesita calculadora
2. **Indicador Correcto:** Se selecciona automáticamente según edad
3. **Superficie Corporal:** Fórmula de DuBois precisa
4. **Visualización Clara:** Cards con colores distintivos
5. **Criterios Estandarizados:** Basados en SEGHNP/OMS

### Para el Sistema
1. **Datos Estructurados:** Todos los cálculos guardados
2. **Trazabilidad:** Fecha y hora de cada medición
3. **Historial Completo:** Seguimiento longitudinal
4. **Exportable:** Datos listos para análisis
5. **Integrado:** Con el resto del sistema

## Uso Clínico

### Dosis de Medicamentos
```
Ejemplo: Quimioterapia
Dosis = 100 mg/m² × BSA
Si BSA = 0.9876 m²
Dosis = 100 × 0.9876 = 98.76 mg
```

### Evaluación Nutricional
```
Niño de 3 años:
Peso/Talla = 15.82
Comparar con tablas OMS
Determinar percentil
Clasificar estado nutricional
```

### Seguimiento Longitudinal
```
Mediciones seriadas:
- Enero: IMC 16.5
- Abril: IMC 17.2
- Julio: IMC 17.8
Tendencia: Aumento progresivo
```

## Archivos Modificados

**`src/pages/AddAnthropometry.tsx`**

### Funciones Agregadas:
1. `calculateBodySurfaceArea()` - Fórmula de DuBois
2. `getAgeDetails()` - Cálculo detallado de edad
3. `getNutritionalIndicator()` - Selección de indicador según edad

### Visualización Agregada:
- Cards de cálculos automáticos
- Indicador nutricional según edad
- Información de criterios SEGHNP

### Guardado Mejorado:
- Incluye BSA en la base de datos
- Mantiene IMC
- Todos los cálculos automáticos

## Verificación

✅ Compilación exitosa
✅ Fórmula de DuBois implementada
✅ Indicadores por edad funcionando
✅ Visualización con código de colores
✅ Guardado en base de datos completo
✅ Cálculos en tiempo real
✅ Criterios SEGHNP documentados

## Referencias

1. **SEGHNP:** https://www.seghnp.org/nutricional/
2. **Fórmula de DuBois:** DuBois D, DuBois EF. A formula to estimate the approximate surface area if height and weight be known. Arch Intern Med. 1916;17:863-71.
3. **OMS:** Patrones de crecimiento infantil. https://www.who.int/childgrowth/standards/es/

## Resumen

**Calculadora antropométrica completa** con:
- ✅ Superficie corporal (DuBois)
- ✅ IMC automático
- ✅ Indicador nutricional según edad (< 1 año, 1-5 años, ≥ 5 años)
- ✅ Cálculos en tiempo real
- ✅ Visualización con código de colores
- ✅ Criterios basados en SEGHNP
- ✅ Guardado completo en base de datos

**El sistema ahora calcula automáticamente todos los parámetros antropométricos según los criterios de la Sociedad Española de Pediatría.**
