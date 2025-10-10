# 🚀 Guía Simple: Configurar Supabase en 7 Pasos

## ⚠️ Situación Actual

El proyecto `fmooavbdxqprpxcxyzrd` no existe en tu cuenta. Necesitas crear uno nuevo.

## 📋 Pasos Simples

### Paso 1️⃣: Crear Proyecto

1. Ir a: **https://supabase.com/dashboard**
2. Click en **"New Project"** (botón verde)
3. Llenar:
   - **Name:** `pedi-flow-chile`
   - **Database Password:** Crear contraseña (¡GUARDARLA!)
   - **Region:** South America (São Paulo)
4. Click en **"Create new project"**
5. ⏳ Esperar 2-3 minutos

### Paso 2️⃣: Copiar Credenciales

Una vez creado:
1. Ir a **Settings → API** (menú lateral)
2. Copiar estos 2 valores:

```
Project URL: https://xxxxxxxxxx.supabase.co
anon public: eyJhbGci...
```

### Paso 3️⃣: Actualizar .env

Abrir el archivo `.env` en la raíz del proyecto y cambiar:

```env
VITE_SUPABASE_PROJECT_ID="xxxxxxxxxx"
VITE_SUPABASE_URL="https://xxxxxxxxxx.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGci..."
```

**Reemplazar `xxxxxxxxxx` con tus valores reales**

### Paso 4️⃣: Actualizar config.toml

Abrir `supabase/config.toml` y cambiar la primera línea:

```toml
project_id = "xxxxxxxxxx"
```

### Paso 5️⃣: Ejecutar SQL

1. En Supabase Dashboard, ir a **SQL Editor**
2. Click en **"New query"**
3. Abrir el archivo: `SETUP_COMPLETO_NUEVO_PROYECTO.sql`
4. Copiar TODO
5. Pegar en SQL Editor
6. Click en **"Run"** ▶️
7. ⏳ Esperar 10-20 segundos

**Verificar:**
```
✅ Tablas creadas: 7
✅ Políticas RLS: 28+
✅ Códigos CIE-10: 60+
✅ Bucket Storage: Creado ✅
```

### Paso 6️⃣: Crear Usuario

1. En Supabase Dashboard, ir a **Authentication → Users**
2. Click en **"Add user"**
3. Ingresar:
   - **Email:** tu-email@ejemplo.com
   - **Password:** tu-contraseña-segura
4. Click en **"Create user"**

### Paso 7️⃣: Reiniciar App

En la terminal:
```bash
# Detener con Ctrl+C si está corriendo
npm run dev
```

Luego abrir: **http://localhost:8080**

## ✅ Verificación Final

- [ ] Proyecto creado en Supabase
- [ ] Credenciales copiadas
- [ ] Archivo .env actualizado
- [ ] Archivo config.toml actualizado
- [ ] SQL ejecutado sin errores
- [ ] Usuario creado
- [ ] App reiniciada
- [ ] Puedo hacer login

## 🎯 Resultado Esperado

Después de estos pasos:
- ✅ Aplicación funciona
- ✅ Puedes hacer login
- ✅ Puedes crear pacientes
- ✅ Puedes subir exámenes
- ✅ Sin errores de RLS

## 🆘 Problemas Comunes

### "Cannot connect to Supabase"
**Solución:** Verificar que copiaste bien las credenciales en .env

### "Table does not exist"
**Solución:** Ejecutar el SQL completo en SQL Editor

### "Authentication failed"
**Solución:** Crear un usuario en Authentication → Users

### "Row level security policy"
**Solución:** El SQL ya incluye las políticas RLS correctas

## 📞 Necesitas Ayuda?

Si algo no funciona:
1. Indicar en qué paso te quedaste
2. Compartir el error que ves (screenshot)
3. Verificar que completaste TODOS los pasos

## 🎉 ¡Listo!

Una vez completados los 7 pasos, tu aplicación estará funcionando correctamente con Supabase.
