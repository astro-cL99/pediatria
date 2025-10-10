# 🆕 Crear Nuevo Proyecto de Supabase

## Situación Actual

El proyecto `fmooavbdxqprpxcxyzrd` no existe en tu cuenta de Supabase. Esto puede ocurrir porque:
- El proyecto fue creado con otra cuenta
- El proyecto fue eliminado
- Necesitas crear uno nuevo

## 🎯 Solución: Crear Nuevo Proyecto

### Paso 1: Crear Proyecto en Supabase

1. Ir a: https://supabase.com/dashboard
2. Click en **"New Project"**
3. Llenar los datos:
   - **Name:** `pedi-flow-chile` (o el nombre que prefieras)
   - **Database Password:** Crear una contraseña segura (¡GUARDARLA!)
   - **Region:** Elegir la más cercana (ej: South America - São Paulo)
   - **Pricing Plan:** Free (para empezar)
4. Click en **"Create new project"**
5. Esperar 2-3 minutos mientras se crea

### Paso 2: Obtener Credenciales

Una vez creado el proyecto:

1. Ir a **Settings → API** (en el menú lateral)
2. Copiar estos valores:

```
Project URL: https://[tu-project-id].supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Paso 3: Actualizar Archivo .env

Abrir el archivo `.env` en la raíz del proyecto y actualizar:

```env
VITE_SUPABASE_PROJECT_ID="[tu-nuevo-project-id]"
VITE_SUPABASE_URL="https://[tu-nuevo-project-id].supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="[tu-nuevo-anon-key]"
```

**Ejemplo:**
```env
VITE_SUPABASE_PROJECT_ID="abcdefghijklmnopqrst"
VITE_SUPABASE_URL="https://abcdefghijklmnopqrst.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3BxcnN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAxNTU4NjAwMH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### Paso 4: Actualizar config.toml

Abrir `supabase/config.toml` y actualizar la primera línea:

```toml
project_id = "[tu-nuevo-project-id]"
```

### Paso 5: Ejecutar Setup Completo

Ahora necesitas crear las tablas en tu nuevo proyecto.

1. Ir a tu proyecto en Supabase Dashboard
2. Click en **SQL Editor** (menú lateral izquierdo)
3. Click en **"New query"**
4. Abrir el archivo: **`SETUP_COMPLETO_NUEVO_PROYECTO.sql`**
5. Copiar **TODO** el contenido del archivo
6. Pegar en SQL Editor
7. Click en **"Run"** (botón verde abajo a la derecha)
8. Esperar a que termine (puede tomar 10-20 segundos)

**Verificar que funcionó:**

Al final deberías ver:
```
✅ Tablas creadas: 7
✅ Políticas RLS: 28+
✅ Códigos CIE-10: 60+
✅ Bucket Storage: Creado ✅
```

Si ves errores, tomar screenshot y pedir ayuda.

### Paso 6: Reiniciar la Aplicación

```bash
# Detener el servidor si está corriendo (Ctrl+C)
# Luego reiniciar:
npm run dev
```

### Paso 7: Crear Usuario de Prueba

1. Ir a **Authentication → Users** en Supabase Dashboard
2. Click en **"Add user"**
3. Ingresar email y contraseña
4. Click en **"Create user"**

### Paso 8: Probar la Aplicación

1. Abrir: http://localhost:8080
2. Iniciar sesión con el usuario creado
3. Probar funcionalidades

## 🔄 Alternativa: Usar Supabase Local

Si prefieres trabajar localmente sin crear un proyecto en la nube:

### Instalar Supabase CLI

```powershell
# Usando npm
npm install -g supabase

# O usando Scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Iniciar Supabase Local

```bash
cd "d:\Proyecto IA\pedi-flow-chile"
supabase start
```

Esto iniciará Supabase localmente y te dará las credenciales.

### Actualizar .env para Local

```env
VITE_SUPABASE_URL="http://localhost:54321"
VITE_SUPABASE_PUBLISHABLE_KEY="[key que te dio supabase start]"
```

## 📋 Checklist

### Para Proyecto en la Nube
- [ ] Crear proyecto en Supabase Dashboard
- [ ] Copiar Project URL y anon key
- [ ] Actualizar archivo .env
- [ ] Actualizar supabase/config.toml
- [ ] Ejecutar migraciones en SQL Editor
- [ ] Crear usuario de prueba
- [ ] Reiniciar aplicación
- [ ] Probar login

### Para Proyecto Local
- [ ] Instalar Supabase CLI
- [ ] Ejecutar `supabase start`
- [ ] Actualizar .env con credenciales locales
- [ ] Reiniciar aplicación
- [ ] Probar login

## 🆘 Problemas Comunes

### "Cannot connect to Supabase"

**Causa:** Credenciales incorrectas en .env
**Solución:** Verificar que copiaste correctamente URL y anon key

### "Table does not exist"

**Causa:** No ejecutaste las migraciones
**Solución:** Ir a SQL Editor y ejecutar los archivos de migración

### "Authentication error"

**Causa:** No creaste un usuario
**Solución:** Ir a Authentication → Users y crear un usuario

## 📞 Necesitas Ayuda?

Si tienes problemas:
1. Indicar qué opción elegiste (nube o local)
2. Compartir el error que ves
3. Verificar que el archivo .env tiene las credenciales correctas

## ✅ Resultado Esperado

Después de completar estos pasos:
- ✅ Proyecto de Supabase funcionando
- ✅ Base de datos con todas las tablas
- ✅ Usuario creado para login
- ✅ Aplicación conectada correctamente
- ✅ Sin errores de RLS
