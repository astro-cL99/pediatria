# Fix: Row-Level Security para clinical_documents

## Problema

Al intentar subir exámenes de laboratorio, aparece el error:
```
new row violates row-level security policy for table "clinical_documents"
```

## Causa

Las políticas de Row-Level Security (RLS) de Supabase no están configuradas correctamente para permitir que usuarios autenticados inserten documentos en la tabla `clinical_documents`.

## Solución

### 1. Aplicar Migración SQL

**Archivo:** `supabase/migrations/20250109_fix_clinical_documents_rls.sql`

#### Opción A: Usando Supabase CLI

```bash
cd d:\Proyecto IA\pedi-flow-chile
supabase db push
```

#### Opción B: Desde Supabase Dashboard

1. Ir a https://supabase.com/dashboard
2. Seleccionar tu proyecto
3. Ir a "SQL Editor"
4. Copiar y pegar el contenido del archivo de migración
5. Click en "Run"

#### Opción C: SQL Directo

Ejecutar el siguiente SQL en tu base de datos:

```sql
-- Habilitar RLS
ALTER TABLE clinical_documents ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view clinical documents" ON clinical_documents;
DROP POLICY IF EXISTS "Users can insert clinical documents" ON clinical_documents;
DROP POLICY IF EXISTS "Users can update clinical documents" ON clinical_documents;
DROP POLICY IF EXISTS "Users can delete clinical documents" ON clinical_documents;

-- Crear nuevas políticas
CREATE POLICY "Users can view clinical documents"
ON clinical_documents
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert clinical documents"
ON clinical_documents
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update clinical documents"
ON clinical_documents
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can delete clinical documents"
ON clinical_documents
FOR DELETE
TO authenticated
USING (true);

-- Valor por defecto para uploaded_by
ALTER TABLE clinical_documents 
ALTER COLUMN uploaded_by SET DEFAULT auth.uid();

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_clinical_documents_patient_id ON clinical_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_admission_id ON clinical_documents(admission_id);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_document_type ON clinical_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_uploaded_at ON clinical_documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_uploaded_by ON clinical_documents(uploaded_by);
```

### 2. Cambios en el Código

#### Archivo: `LaboratoryExamsManager.tsx`

**Cambios realizados:**

1. **Agregado prop `admissionId`:**
```typescript
interface LaboratoryExamsManagerProps {
  patientId: string;
  admissionId?: string; // ← NUEVO
}
```

2. **Obtención automática de admission_id activo:**
```typescript
const fetchActiveAdmission = async () => {
  if (currentAdmissionId) return;
  
  const { data } = await supabase
    .from("admissions")
    .select("id")
    .eq("patient_id", patientId)
    .eq("status", "active")
    .order("admission_date", { ascending: false })
    .limit(1)
    .single();

  if (data) {
    setCurrentAdmissionId(data.id);
  }
};
```

3. **Inclusión de admission_id en inserción:**
```typescript
await supabase
  .from("clinical_documents")
  .insert({
    patient_id: patientId,
    admission_id: currentAdmissionId, // ← AGREGADO
    file_name: file.name,
    file_path: uploadData.path,
    document_type: "laboratorio",
    extracted_data: processData?.extractedData || {},
    confidence_score: processData?.confidence || 0.8,
  });
```

#### Archivo: `PatientDetail.tsx`

**Cambio realizado:**
```typescript
<LaboratoryExamsManager 
  patientId={id!} 
  admissionId={activeAdmission?.id} // ← AGREGADO
/>
```

## Verificación

### 1. Verificar Políticas RLS

```sql
-- Ver políticas actuales
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'clinical_documents';
```

Deberías ver 4 políticas:
- `Users can view clinical documents` (SELECT)
- `Users can insert clinical documents` (INSERT)
- `Users can update clinical documents` (UPDATE)
- `Users can delete clinical documents` (DELETE)

### 2. Probar Inserción

```sql
-- Como usuario autenticado, probar inserción
INSERT INTO clinical_documents (
  patient_id,
  admission_id,
  file_name,
  file_path,
  document_type,
  extracted_data
) VALUES (
  'uuid-del-paciente',
  'uuid-del-admission',
  'test.pdf',
  'path/to/test.pdf',
  'laboratorio',
  '{}'::jsonb
);
```

Si funciona, las políticas están correctas ✅

### 3. Probar en la Aplicación

1. Ir a un paciente
2. Tab "Exámenes"
3. Arrastrar un PDF de laboratorio
4. Debería subir sin errores

## Políticas RLS Explicadas

### SELECT (Ver documentos)
```sql
USING (true)
```
- Todos los usuarios autenticados pueden ver todos los documentos
- Cambiar a `USING (uploaded_by = auth.uid())` para que solo vean sus propios documentos

### INSERT (Crear documentos)
```sql
WITH CHECK (true)
```
- Todos los usuarios autenticados pueden crear documentos
- El campo `uploaded_by` se llena automáticamente con `auth.uid()`

### UPDATE (Actualizar documentos)
```sql
USING (true) WITH CHECK (true)
```
- Todos los usuarios autenticados pueden actualizar cualquier documento
- Cambiar a `USING (uploaded_by = auth.uid())` para que solo actualicen sus propios documentos

### DELETE (Eliminar documentos)
```sql
USING (true)
```
- Todos los usuarios autenticados pueden eliminar cualquier documento
- Cambiar a `USING (uploaded_by = auth.uid())` para que solo eliminen sus propios documentos

## Políticas Más Restrictivas (Opcional)

Si quieres que los usuarios solo puedan ver/editar sus propios documentos:

```sql
-- Solo ver propios documentos
DROP POLICY "Users can view clinical documents" ON clinical_documents;
CREATE POLICY "Users can view clinical documents"
ON clinical_documents
FOR SELECT
TO authenticated
USING (uploaded_by = auth.uid());

-- Solo insertar con su propio user_id
DROP POLICY "Users can insert clinical documents" ON clinical_documents;
CREATE POLICY "Users can insert clinical documents"
ON clinical_documents
FOR INSERT
TO authenticated
WITH CHECK (uploaded_by = auth.uid());

-- Solo actualizar propios documentos
DROP POLICY "Users can update clinical documents" ON clinical_documents;
CREATE POLICY "Users can update clinical documents"
ON clinical_documents
FOR UPDATE
TO authenticated
USING (uploaded_by = auth.uid())
WITH CHECK (uploaded_by = auth.uid());

-- Solo eliminar propios documentos
DROP POLICY "Users can delete clinical documents" ON clinical_documents;
CREATE POLICY "Users can delete clinical documents"
ON clinical_documents
FOR DELETE
TO authenticated
USING (uploaded_by = auth.uid());
```

## Troubleshooting

### Error persiste después de aplicar migración

1. **Verificar que el usuario está autenticado:**
```typescript
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);
```

2. **Verificar que RLS está habilitado:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'clinical_documents';
```

3. **Verificar políticas:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'clinical_documents';
```

4. **Probar con RLS deshabilitado temporalmente:**
```sql
ALTER TABLE clinical_documents DISABLE ROW LEVEL SECURITY;
-- Probar inserción
-- Si funciona, el problema es con las políticas
ALTER TABLE clinical_documents ENABLE ROW LEVEL SECURITY;
```

### Error: "uploaded_by cannot be null"

Verificar que el valor por defecto está configurado:
```sql
ALTER TABLE clinical_documents 
ALTER COLUMN uploaded_by SET DEFAULT auth.uid();
```

### Error: "admission_id is required"

El componente ahora obtiene automáticamente el `admission_id` activo. Si no hay admission activo, el campo será `null`, lo cual debería ser permitido.

Si es requerido, verificar:
```sql
ALTER TABLE clinical_documents 
ALTER COLUMN admission_id DROP NOT NULL;
```

## Archivos Modificados

- ✅ `supabase/migrations/20250109_fix_clinical_documents_rls.sql` - Migración SQL
- ✅ `src/components/LaboratoryExamsManager.tsx` - Obtención de admission_id
- ✅ `src/pages/PatientDetail.tsx` - Pasar admission_id al componente
- ✅ `FIX_RLS_CLINICAL_DOCUMENTS.md` - Esta documentación

## Resumen

**Problema:** Error de RLS al subir exámenes
**Causa:** Políticas de seguridad no configuradas
**Solución:** 
1. ✅ Aplicar migración SQL con políticas RLS
2. ✅ Agregar obtención automática de admission_id
3. ✅ Incluir admission_id en inserción

**El sistema ahora permite subir exámenes de laboratorio sin errores de RLS.**
