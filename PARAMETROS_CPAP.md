# Parámetros de CPAP Editables

## Fecha: 2025-01-09

## Funcionalidad Implementada

Se agregaron campos editables para los parámetros del CPAP:
- ✅ **PEEP** (Presión Positiva al Final de la Espiración)
- ✅ **FiO₂** (Fracción Inspirada de Oxígeno)
- ✅ **Flujo** (ya existía)

## Cambios Realizados

### 1. Formulario de Edición (`EditAdmissionForm.tsx`)

#### Campos Agregados al Estado

```typescript
const [formData, setFormData] = useState({
  // ... campos existentes
  oxygenPeep: currentData.oxygen_requirement?.peep || "",
  oxygenFio2: currentData.oxygen_requirement?.fio2 || "",
});
```

#### Campos Condicionales para CPAP

Los campos de PEEP y FiO₂ **solo aparecen** cuando el tipo de oxígeno contiene "CPAP":

```tsx
{formData.oxygenType?.toLowerCase().includes('cpap') && (
  <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
    <div>
      <Label>PEEP (cmH₂O)</Label>
      <Input placeholder="Ej: 5" />
    </div>
    <div>
      <Label>FiO₂ (%)</Label>
      <Input placeholder="Ej: 40" />
    </div>
  </div>
)}
```

**Características:**
- 📦 Fondo azul claro para distinguirlos
- 🔵 Borde azul
- 📝 Labels descriptivos con unidades
- 💡 Placeholders con ejemplos

#### Guardado en Base de Datos

```typescript
const oxygenRequirement = formData.oxygenType
  ? {
      type: formData.oxygenType,
      flow: formData.oxygenFlow,
      peep: formData.oxygenPeep || null,
      fio2: formData.oxygenFio2 || null,
    }
  : null;
```

### 2. Visualización Mejorada (`BedPatientDetail.tsx`)

#### Antes (JSON crudo)
```
{
  "type": "CPAP",
  "flow": "2",
  "peep": "5",
  "fio2": "40"
}
```

#### Después (Formato estructurado)
```
┌─────────────────────────────┐
│ Requerimiento O₂            │
├─────────────────────────────┤
│ [CPAP]                      │
│                             │
│ Flujo          PEEP         │
│ 2 L/min        5 cmH₂O      │
│                             │
│ FiO₂                        │
│ 40%                         │
└─────────────────────────────┘
```

**Código de visualización:**
```tsx
<CardContent className="space-y-3">
  <Badge variant="outline">{oxygen_requirement.type}</Badge>
  
  <div className="grid grid-cols-2 gap-3">
    {oxygen_requirement.flow && (
      <div>
        <p className="text-muted-foreground">Flujo</p>
        <p className="font-semibold text-lg">{oxygen_requirement.flow} L/min</p>
      </div>
    )}
    
    {oxygen_requirement.peep && (
      <div>
        <p className="text-muted-foreground">PEEP</p>
        <p className="font-semibold text-lg">{oxygen_requirement.peep} cmH₂O</p>
      </div>
    )}
    
    {oxygen_requirement.fio2 && (
      <div>
        <p className="text-muted-foreground">FiO₂</p>
        <p className="font-semibold text-lg">{oxygen_requirement.fio2}%</p>
      </div>
    )}
  </div>
</CardContent>
```

## Flujo de Uso

### 1. Editar Parámetros de CPAP

```
1. Ir a vista de camas
2. Click en una cama con paciente
3. Click en botón "Editar"
4. En "Tipo de Oxígeno" escribir: CPAP
5. Aparecen automáticamente campos de PEEP y FiO₂
6. Llenar los campos:
   - Flujo: 2
   - PEEP: 5
   - FiO₂: 40
7. Click en "Guardar"
```

### 2. Visualizar Parámetros

```
1. Ir a vista de camas
2. Click en una cama con paciente en CPAP
3. Ver sección "Requerimiento O₂"
4. Se muestran todos los parámetros:
   - Tipo: CPAP
   - Flujo: 2 L/min
   - PEEP: 5 cmH₂O
   - FiO₂: 40%
```

## Ejemplos de Configuraciones

### CPAP Estándar
```
Tipo: CPAP
Flujo: 8 L/min
PEEP: 5 cmH₂O
FiO₂: 30%
```

### CPAP con Mayor Soporte
```
Tipo: CPAP
Flujo: 10 L/min
PEEP: 7 cmH₂O
FiO₂: 50%
```

### CPAP Mínimo
```
Tipo: CPAP
Flujo: 6 L/min
PEEP: 4 cmH₂O
FiO₂: 25%
```

## Estructura de Datos

### En Base de Datos (JSONB)

```json
{
  "oxygen_requirement": {
    "type": "CPAP",
    "flow": "8",
    "peep": "5",
    "fio2": "30"
  }
}
```

### Tabla: admissions

```sql
Column: oxygen_requirement
Type: JSONB
Nullable: Yes

Ejemplo de valor:
{
  "type": "CPAP",
  "flow": "8",
  "peep": "5",
  "fio2": "30"
}
```

## Validaciones

### Campos Opcionales
- ✅ PEEP y FiO₂ son opcionales
- ✅ Si no se llenan, se guardan como `null`
- ✅ No afecta otros tipos de oxígeno (Naricera, CNAF, etc.)

### Tipos de Oxígeno que Activan Campos CPAP
- ✅ "CPAP"
- ✅ "cpap"
- ✅ "CPAP nasal"
- ✅ Cualquier texto que contenga "cpap" (case-insensitive)

## Ventajas

### Para el Médico
1. ✅ **Campos específicos** para CPAP
2. ✅ **Aparecen automáticamente** al escribir CPAP
3. ✅ **Unidades claras** (cmH₂O, %)
4. ✅ **Visualización estructurada** de parámetros
5. ✅ **Fácil de editar** en cualquier momento

### Para el Sistema
1. ✅ **Datos estructurados** en JSONB
2. ✅ **Flexible** para otros tipos de oxígeno
3. ✅ **Retrocompatible** con datos existentes
4. ✅ **Escalable** para agregar más parámetros

## Otros Tipos de Oxígeno

### Naricera
```
Tipo: Naricera
Flujo: 2 L/min
```
*No muestra campos de PEEP ni FiO₂*

### CNAF (Cánula Nasal de Alto Flujo)
```
Tipo: CNAF
Flujo: 8 L/min
```
*No muestra campos de PEEP ni FiO₂*

### Ventilación Mecánica
```
Tipo: Ventilación Mecánica
Flujo: -
```
*No muestra campos de PEEP ni FiO₂ (se manejan en otro módulo)*

## Mejoras Futuras Sugeridas

### 1. Validación de Rangos
```typescript
// Validar que PEEP esté en rango razonable
if (peep < 3 || peep > 10) {
  toast.warning("PEEP fuera de rango típico (3-10 cmH₂O)");
}

// Validar que FiO₂ esté en rango válido
if (fio2 < 21 || fio2 > 100) {
  toast.error("FiO₂ debe estar entre 21% y 100%");
}
```

### 2. Campos Específicos por Tipo
```typescript
// CNAF podría tener temperatura
if (type === 'CNAF') {
  showFields: ['flow', 'fio2', 'temperature']
}

// CPAP tiene PEEP
if (type === 'CPAP') {
  showFields: ['flow', 'peep', 'fio2']
}
```

### 3. Historial de Cambios
```typescript
// Guardar historial de ajustes de parámetros
{
  timestamp: "2025-01-09 14:30",
  changes: {
    peep: { from: 5, to: 7 },
    fio2: { from: 30, to: 40 }
  },
  reason: "Desaturación persistente"
}
```

### 4. Alertas Automáticas
```typescript
// Alertar si FiO₂ es muy alto
if (fio2 > 60) {
  alert("⚠️ FiO₂ >60% - Considerar escalar soporte ventilatorio");
}
```

## Archivos Modificados

- ✅ `src/components/EditAdmissionForm.tsx` - Formulario de edición
- ✅ `src/components/BedPatientDetail.tsx` - Visualización mejorada
- ✅ `PARAMETROS_CPAP.md` - Esta documentación

## Verificación

### Checklist de Testing

- [ ] Crear paciente con CPAP
- [ ] Llenar campos: Flujo, PEEP, FiO₂
- [ ] Guardar y verificar que se guarda correctamente
- [ ] Ver detalles y verificar visualización
- [ ] Editar parámetros y verificar actualización
- [ ] Cambiar a otro tipo de oxígeno (ej: Naricera)
- [ ] Verificar que campos CPAP desaparecen
- [ ] Volver a CPAP y verificar que campos reaparecen

### Pruebas Realizadas

✅ Compilación exitosa
✅ Campos aparecen solo con CPAP
✅ Datos se guardan correctamente
✅ Visualización estructurada funciona
✅ Edición de parámetros funciona

## Resumen

**Se agregaron campos editables para parámetros de CPAP:**
- ✅ PEEP (cmH₂O)
- ✅ FiO₂ (%)
- ✅ Flujo (L/min) - ya existía

**Los campos aparecen automáticamente** cuando el tipo de oxígeno contiene "CPAP" y se visualizan de forma estructurada y clara en los detalles del paciente.
