# Fórmula de Holliday-Segar - Hidratación Basal Pediátrica

## Fecha: 2025-10-09

## Implementación

Cálculo automático de requerimientos hídricos basales para pacientes pediátricos hospitalizados según la **Fórmula de Holliday-Segar**, estándar de oro en pediatría para hidratación de mantenimiento.

## Fórmula de Holliday-Segar

### Regla de los 100-50-20

| Peso del Paciente | Requerimiento Hídrico |
|-------------------|----------------------|
| **0 - 10 kg** | 100 ml/kg/día |
| **10 - 20 kg** | 1000 ml + 50 ml/kg por cada kg sobre 10 |
| **> 20 kg** | 1500 ml + 20 ml/kg por cada kg sobre 20 |

### Implementación en Código

```typescript
const calculateHollidaySegar = (weight: number) => {
  let totalMl = 0;
  
  // Primeros 10 kg: 100 ml/kg/día
  if (weight <= 10) {
    totalMl = weight * 100;
  } 
  // 10-20 kg: 1000 ml + 50 ml/kg por cada kg sobre 10
  else if (weight <= 20) {
    totalMl = 1000 + ((weight - 10) * 50);
  }
  // > 20 kg: 1500 ml + 20 ml/kg por cada kg sobre 20
  else {
    totalMl = 1500 + ((weight - 20) * 20);
  }
  
  return totalMl;
};
```

## Cálculos Adicionales

### 1. Mililitros por Hora
```
ml/hora = Volumen total diario / 24 horas
```

### 2. Gotas por Minuto (Macrogotero)
```
gotas/min = (ml/hora × 20 gotas/ml) / 60 minutos
```
**Nota:** 1 ml = 20 gotas en macrogotero estándar

### 3. Microgotas por Minuto (Microgotero)
```
microgotas/min = ml/hora
```
**Nota:** 1 ml = 60 microgotas, por lo que microgotas/min = ml/hora

## Ejemplos de Cálculo

### Ejemplo 1: Lactante de 5 kg

**Peso:** 5 kg

**Cálculo:**
```
5 kg × 100 ml/kg = 500 ml/día

ml/hora = 500 / 24 = 20.8 ml/hora
gotas/min = (20.8 × 20) / 60 = 7 gotas/min
microgotas/min = 20.8 ≈ 21 μgts/min
```

**Resultado:**
- 💧 **500 ml/día**
- ⏱️ 20.8 ml/hora
- 💉 7 gotas/min (macrogotero)
- 💉 21 μgts/min (microgotero)

### Ejemplo 2: Preescolar de 15 kg

**Peso:** 15 kg

**Cálculo:**
```
Primeros 10 kg: 10 × 100 = 1000 ml
Siguientes 5 kg: 5 × 50 = 250 ml
Total = 1000 + 250 = 1250 ml/día

ml/hora = 1250 / 24 = 52.1 ml/hora
gotas/min = (52.1 × 20) / 60 = 17 gotas/min
microgotas/min = 52.1 ≈ 52 μgts/min
```

**Resultado:**
- 💧 **1250 ml/día**
- ⏱️ 52.1 ml/hora
- 💉 17 gotas/min (macrogotero)
- 💉 52 μgts/min (microgotero)

### Ejemplo 3: Escolar de 30 kg

**Peso:** 30 kg

**Cálculo:**
```
Primeros 10 kg: 10 × 100 = 1000 ml
Siguientes 10 kg: 10 × 50 = 500 ml
Siguientes 10 kg: 10 × 20 = 200 ml
Total = 1000 + 500 + 200 = 1700 ml/día

ml/hora = 1700 / 24 = 70.8 ml/hora
gotas/min = (70.8 × 20) / 60 = 24 gotas/min
microgotas/min = 70.8 ≈ 71 μgts/min
```

**Resultado:**
- 💧 **1700 ml/día**
- ⏱️ 70.8 ml/hora
- 💉 24 gotas/min (macrogotero)
- 💉 71 μgts/min (microgotero)

## Visualización en la Aplicación

### Card de Hidratación Basal (Color Cyan)

```
┌─────────────────────────────────────────┐
│ Hidratación Basal (Holliday-Segar)     │
│                                         │
│         1250  ml/día                    │
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ 10 kg × 100 ml/kg = 1000 ml        ││
│ │ 5 kg × 50 ml/kg = 250 ml           ││
│ │ Total = 1250 ml/día                ││
│ └─────────────────────────────────────┘│
│                                         │
│ ┌────────┬────────┬────────┐          │
│ │ml/hora │gts/min │μgts/min│          │
│ │  52.1  │   17   │   52   │          │
│ └────────┴────────┴────────┘          │
│                                         │
│ Fórmula de Holliday-Segar para        │
│ hidratación basal                      │
└─────────────────────────────────────────┘
```

### Elementos Visuales

**1. Volumen Total Destacado:**
- Número grande en cyan
- Unidad "ml/día" visible

**2. Cálculo Detallado:**
- Fondo cyan claro
- Desglose paso a paso
- Fácil de verificar

**3. Velocidades de Infusión:**
- 3 cards pequeños
- ml/hora, gotas/min, microgotas/min
- Listos para usar en órdenes médicas

## Uso Clínico

### Indicaciones

**Hidratación de Mantenimiento para:**
- ✅ Pacientes hospitalizados en ayuno
- ✅ NPO (nada por vía oral)
- ✅ Cirugías programadas
- ✅ Enfermedades que impiden ingesta oral
- ✅ Hidratación basal en UCI

### Consideraciones Importantes

#### ⚠️ Ajustes Necesarios

**Aumentar volumen en:**
- Fiebre (12% por cada °C > 37.5°C)
- Taquipnea
- Pérdidas aumentadas (diarrea, vómitos)
- Ambiente caluroso
- Sudoración excesiva

**Disminuir volumen en:**
- Insuficiencia cardíaca
- Insuficiencia renal
- SIADH (síndrome de secreción inapropiada de ADH)
- Edema cerebral
- Hipertensión endocraneana

#### 🚫 Contraindicaciones Relativas

- Shock hipovolémico (requiere reanimación, no mantenimiento)
- Deshidratación severa (requiere rehidratación rápida)
- Sobrecarga de volumen
- Oliguria/anuria sin causa clara

### Tipo de Solución

**Soluciones Recomendadas:**

#### Para Mantenimiento Estándar:
- **Solución Salina 0.45% + Dextrosa 5%**
- **Solución Salina 0.9% + Dextrosa 5%** (más usado actualmente)

#### Electrolitos:
- **Sodio:** 2-4 mEq/kg/día
- **Potasio:** 2-3 mEq/kg/día (si función renal normal)
- **Cloro:** Según solución base

**Ejemplo de Orden:**
```
Paciente: 15 kg
Holliday-Segar: 1250 ml/día

Orden:
- Solución Salina 0.9% + Dextrosa 5%
- Agregar KCl 20 mEq/L
- Pasar a 52 ml/hora
- O 17 gotas/min (macrogotero)
- O 52 microgotas/min (microgotero)
```

## Monitoreo

### Parámetros a Vigilar

**Clínicos:**
- ✅ Estado de hidratación (mucosas, turgencia)
- ✅ Diuresis (1-2 ml/kg/hora)
- ✅ Signos vitales
- ✅ Peso diario
- ✅ Balance hídrico

**Laboratorio:**
- ✅ Electrolitos séricos (Na, K, Cl)
- ✅ Función renal (BUN, creatinina)
- ✅ Glicemia
- ✅ Osmolaridad

### Ajustes según Monitoreo

| Hallazgo | Acción |
|----------|--------|
| **Hiponatremia** | Reducir volumen o aumentar concentración de Na |
| **Hipernatremia** | Aumentar volumen o reducir concentración de Na |
| **Oliguria** | Evaluar causa, considerar bolo |
| **Poliuria** | Evaluar causa, ajustar volumen |
| **Edema** | Reducir volumen |
| **Deshidratación** | Aumentar volumen |

## Limitaciones de la Fórmula

### 1. No Considera Pérdidas Adicionales
- Fiebre
- Taquipnea
- Diarrea
- Vómitos
- Drenajes

### 2. No Aplica en Situaciones Especiales
- Neonatos prematuros
- Insuficiencia renal
- Insuficiencia cardíaca
- Enfermedades metabólicas

### 3. Es Solo un Punto de Partida
- Requiere ajuste individualizado
- Monitoreo continuo necesario
- No reemplaza el juicio clínico

## Tabla de Referencia Rápida

| Peso (kg) | ml/día | ml/hora | gotas/min | μgts/min |
|-----------|--------|---------|-----------|----------|
| **5** | 500 | 21 | 7 | 21 |
| **10** | 1000 | 42 | 14 | 42 |
| **15** | 1250 | 52 | 17 | 52 |
| **20** | 1500 | 63 | 21 | 63 |
| **25** | 1600 | 67 | 22 | 67 |
| **30** | 1700 | 71 | 24 | 71 |
| **35** | 1800 | 75 | 25 | 75 |
| **40** | 1900 | 79 | 26 | 79 |
| **50** | 2100 | 88 | 29 | 88 |

## Ventajas del Sistema Implementado

### Para el Médico
1. ✅ **Cálculo Instantáneo:** Solo ingresa el peso
2. ✅ **Desglose Detallado:** Ve cómo se calcula paso a paso
3. ✅ **Múltiples Velocidades:** ml/hora, gotas/min, microgotas/min
4. ✅ **Listo para Ordenar:** Valores directamente usables
5. ✅ **Sin Errores de Cálculo:** Automatizado y preciso

### Para Enfermería
1. ✅ **Velocidades Claras:** Gotas y microgotas calculadas
2. ✅ **Fácil Verificación:** Cálculo mostrado paso a paso
3. ✅ **Estandarización:** Todos usan la misma fórmula

## Referencias

### Literatura Médica
1. **Holliday MA, Segar WE (1957)**
   - "The maintenance need for water in parenteral fluid therapy"
   - Pediatrics. 1957;19(5):823-832
   - **Artículo original** que estableció la fórmula

2. **American Academy of Pediatrics (2018)**
   - "Clinical Practice Guideline: Maintenance Intravenous Fluids in Children"
   - Pediatrics. 2018;142(6):e20183083

3. **WHO (2005)**
   - "Pocket book of hospital care for children"
   - Guidelines for IV fluid therapy

### Guías Clínicas
- **NICE Guidelines:** Intravenous fluid therapy in children
- **APLS:** Advanced Pediatric Life Support
- **PALS:** Pediatric Advanced Life Support

## Archivos Modificados

**`src/pages/AddAnthropometry.tsx`**

### Función Agregada:
```typescript
calculateHollidaySegar(weight: number)
```

### Retorna:
```typescript
{
  totalMlPerDay: number,
  mlPerHour: number,
  dropsPerMinute: number,
  microdropsPerMinute: number,
  calculation: string[],
  note: string
}
```

### Visualización:
- Card cyan con desglose completo
- 3 velocidades de infusión
- Cálculo paso a paso visible

## Verificación

✅ Compilación exitosa
✅ Fórmula de Holliday-Segar implementada
✅ Cálculo automático funcionando
✅ Desglose paso a paso visible
✅ Velocidades de infusión calculadas
✅ Visualización con código de colores
✅ Documentación completa

## Resumen

**Sistema completo de cálculo de hidratación basal pediátrica** con:
- ✅ Fórmula de Holliday-Segar (100-50-20)
- ✅ Volumen total diario (ml/día)
- ✅ Velocidad de infusión (ml/hora)
- ✅ Gotas por minuto (macrogotero)
- ✅ Microgotas por minuto (microgotero)
- ✅ Desglose detallado del cálculo
- ✅ Visualización clara y profesional

**El sistema ahora calcula automáticamente los requerimientos hídricos basales según la fórmula de Holliday-Segar, proporcionando todas las velocidades de infusión necesarias para las órdenes médicas.**
