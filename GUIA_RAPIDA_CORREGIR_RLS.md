# 🚨 GUÍA RÁPIDA: Corregir Error de RLS

## Error Actual
```
new row violates row-level security policy for table "clinical_documents"
```

## 🎯 Solución en 3 Pasos

### Paso 1: Ir a Supabase Dashboard

1. Abrir navegador
2. Ir a: https://supabase.com/dashboard
3. Seleccionar tu proyecto
4. En el menú lateral, click en **"SQL Editor"**

### Paso 2: Ejecutar el Script SQL

1. En SQL Editor, click en **"New query"**
2. Abrir el archivo: `EJECUTAR_EN_SUPABASE.sql`
3. **Copiar TODO el contenido** del archivo
4. **Pegar** en el editor SQL de Supabase
5. Click en **"Run"** (botón verde en la esquina inferior derecha)

### Paso 3: Verificar que Funcionó

Deberías ver al final de la ejecución:

```
✅ Políticas RLS en clinical_documents: 4
✅ Políticas Storage en medical-documents: 4
✅ Bucket medical-documents existe: true
```

## 🧪 Probar en la Aplicación

1. Ir a: http://localhost:8080/patient/3aecaf13-8442-447f-a4d2-33b2859f5b32
2. Click en tab **"Exámenes"**
3. Arrastrar un PDF de laboratorio
4. Debería subir **SIN ERRORES** ✅

## 🔧 Si el Error Persiste

### Opción A: Deshabilitar RLS Temporalmente

Ejecutar en SQL Editor:

```sql
ALTER TABLE clinical_documents DISABLE ROW LEVEL SECURITY;
```

⚠️ **ADVERTENCIA:** Esto deshabilita la seguridad. Solo para testing.

### Opción B: Verificar Usuario Autenticado

Abrir consola del navegador (F12) y ejecutar:

```javascript
const { data: { user } } = await supabase.auth.getUser();
console.log('Usuario:', user);
```

Si `user` es `null`, el problema es de autenticación, no de RLS.

### Opción C: Verificar Políticas

Ejecutar en SQL Editor:

```sql
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'clinical_documents';
```

Deberías ver 4 políticas (SELECT, INSERT, UPDATE, DELETE).

## 📋 Checklist de Verificación

- [ ] Script SQL ejecutado sin errores
- [ ] 4 políticas creadas en `clinical_documents`
- [ ] 4 políticas creadas en `storage.objects`
- [ ] Bucket `medical-documents` existe
- [ ] Usuario está autenticado (no null)
- [ ] Aplicación recargada (Ctrl+F5)
- [ ] Probado subir un PDF

## 🆘 Troubleshooting

### Error: "relation storage.buckets does not exist"

El proyecto no tiene Storage habilitado. Ejecutar solo la parte de `clinical_documents`:

```sql
-- Solo ejecutar desde línea 1 hasta línea 60 del script
-- (Omitir la parte de Storage)
```

### Error: "permission denied for table pg_policies"

Tu usuario no tiene permisos de admin. Contactar al administrador del proyecto.

### Error: "auth.uid() does not exist"

Ejecutar:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## 📞 Contacto

Si ninguna solución funciona:
1. Tomar screenshot del error completo
2. Tomar screenshot de las políticas (`SELECT * FROM pg_policies WHERE tablename = 'clinical_documents'`)
3. Compartir ambos screenshots

## ✅ Resultado Esperado

Después de aplicar el script:

```
✅ RLS habilitado
✅ 4 políticas activas
✅ Usuarios autenticados pueden:
   - Ver documentos
   - Subir documentos
   - Actualizar documentos
   - Eliminar documentos
✅ Storage configurado
✅ Aplicación funcional
```

## 🎉 Éxito

Si puedes subir un PDF sin errores, **¡el problema está resuelto!** 🎊
