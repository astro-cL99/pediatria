# Cambio: Fecha de Egreso Automática

## Fecha: 2025-10-09

## Cambio Realizado

El campo **"Fecha Egreso"** en el formulario de Nueva Epicrisis ahora **siempre se establece automáticamente con la fecha y hora actual**.

## Archivo Modificado

**`src/pages/NewEpicrisis.tsx`**

## Cambios Específicos

### 1. Valor por Defecto al Cargar el Formulario

```typescript
// ANTES
const { register, handleSubmit, setValue, watch } = useForm<EpicrisisFormData>();

// AHORA
const { register, handleSubmit, setValue, watch } = useForm<EpicrisisFormData>({
  defaultValues: {
    discharge_date: new Date().toISOString().slice(0, 16), // Fecha actual en formato datetime-local
  }
});
```

### 2. Al Seleccionar un Ingreso

```typescript
// ANTES
setValue("discharge_date", admission.discharge_date || new Date().toISOString());

// AHORA
// Siempre usar la fecha actual para fecha de egreso
setValue("discharge_date", new Date().toISOString().slice(0, 16));
```

### 3. Cálculo de Edad al Egreso

```typescript
// ANTES
const dischargeDate = new Date(admission.discharge_date || new Date());

// AHORA
const dischargeDate = new Date(); // Siempre usar fecha actual
```

## Comportamiento

1. **Al abrir el formulario**: El campo "Fecha Egreso" se llena automáticamente con la fecha y hora actual
2. **Al seleccionar un ingreso**: El campo "Fecha Egreso" se actualiza con la fecha y hora actual (no usa la fecha almacenada en la base de datos)
3. **El usuario puede modificar**: El campo sigue siendo editable si se necesita ajustar la fecha/hora

## Formato

El formato usado es `datetime-local` de HTML5, que muestra:
- Fecha: DD-MM-AAAA
- Hora: HH:MM

Ejemplo: `09-10-2025 19:08`

## Verificación

✅ Compilación exitosa
✅ Sin errores de TypeScript
✅ Campo se auto-completa con fecha actual
✅ Campo permanece editable

## Uso

1. Ve a **Nueva Epicrisis** en el menú
2. Selecciona un ingreso hospitalario
3. El campo **"Fecha Egreso"** ya estará lleno con la fecha y hora actual
4. Puedes modificarlo si es necesario antes de generar la epicrisis
