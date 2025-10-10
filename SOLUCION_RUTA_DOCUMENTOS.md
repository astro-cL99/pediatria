# Solución: Ruta de Documentos y Documentos Procesados

## Fecha: 2025-10-09

## Problema
La ruta `/documents` devolvía un error 404 (Not Found).

## Causa
La ruta correcta era `/documents/upload`, no `/documents`.

## Solución Implementada

### Redirección Agregada
```typescript
<Route path="/documents" element={<Navigate to="/documents/upload" replace />} />
```

Ahora `/documents` redirige automáticamente a `/documents/upload`.

## ¿Qué Pasa con los Documentos Procesados?

### Ubicación
Los documentos procesados se muestran en la **misma página** de "Carga Documentos" (`/documents/upload`), en la parte inferior.

### Componente: ProcessedDocumentsTable

**Ubicación:** `src/components/ProcessedDocumentsTable.tsx`

#### Características Principales

**1. Tabla Completa de Documentos**
- 📄 Nombre del archivo
- 🏷️ Tipo de documento (laboratorio, imagenología, epicrisis, evolución, anamnesis, otro)
- 📊 Nivel de confianza (porcentaje)
- 📅 Fecha y hora de carga
- 👤 Indicador si está asignado a un paciente

**2. Filtros y Búsqueda**
```
🔍 Búsqueda por nombre de archivo
📋 Filtro por tipo de documento
```

**3. Acciones Disponibles**
- 👁️ **Ver Detalles** - Abre un diálogo con información completa
- 💾 **Descargar** - Descarga el archivo original

**4. Código de Colores por Tipo**
```
🔵 Laboratorio    - Azul
🟣 Imagenología   - Púrpura
🟢 Epicrisis      - Verde
🟠 Evolución      - Naranja
🩷 Anamnesis      - Rosa
⚪ Otro           - Gris
```

### Flujo de Procesamiento

#### 1. Carga de Documentos
```
Usuario sube archivo(s)
    ↓
Archivos en cola (estado: pendiente)
    ↓
Click en "Procesar Todos"
    ↓
Procesamiento con IA (estado: procesando)
    ↓
Clasificación automática
    ↓
Extracción de información
    ↓
Guardado en base de datos (estado: éxito)
    ↓
Aparece en tabla de "Documentos Procesados"
```

#### 2. Información Extraída por la IA

**Clasificación:**
- Tipo de documento
- Nivel de confianza

**Datos Extraídos (según tipo):**
- **Laboratorio:** Exámenes, resultados, valores
- **Imagenología:** Tipo de estudio, hallazgos
- **Epicrisis:** Diagnósticos, tratamientos
- **Evolución:** Fecha, observaciones
- **Anamnesis:** Historia clínica

### Estructura de la Página `/documents/upload`

```
┌─────────────────────────────────────────┐
│  Estadísticas (4 cards)                 │
│  - Pendientes                           │
│  - Procesando                           │
│  - Exitosos                             │
│  - Errores                              │
├─────────────────────────────────────────┤
│  Zona de Carga (Drag & Drop)           │
│  - Arrastra archivos aquí              │
│  - O haz clic para seleccionar         │
├─────────────────────────────────────────┤
│  Archivos en Cola                       │
│  - Lista de archivos pendientes         │
│  - Estado de cada archivo               │
│  - Botón "Procesar Todos"              │
├─────────────────────────────────────────┤
│  📋 DOCUMENTOS PROCESADOS               │
│  ┌───────────────────────────────────┐ │
│  │ Búsqueda y Filtros                │ │
│  ├───────────────────────────────────┤ │
│  │ Tabla con todos los documentos    │ │
│  │ - Nombre                          │ │
│  │ - Tipo (con color)                │ │
│  │ - Confianza (%)                   │ │
│  │ - Fecha                           │ │
│  │ - Acciones (Ver/Descargar)        │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Base de Datos

**Tabla:** `clinical_documents`

**Campos principales:**
```typescript
{
  id: string,
  file_name: string,
  file_path: string,
  document_type: string,        // laboratorio, imagenología, etc.
  confidence_score: number,     // 0.0 - 1.0
  extracted_data: json,         // Datos extraídos por IA
  patient_id: string | null,    // Si está asignado a un paciente
  uploaded_at: timestamp,
  uploaded_by: string
}
```

### Diálogo de Detalles

Al hacer clic en "Ver Detalles" (👁️), se abre un diálogo con:

**Información General:**
- Nombre del archivo
- Tipo de documento
- Nivel de confianza
- Fecha de carga
- Usuario que lo cargó

**Datos Extraídos:**
- JSON formateado con toda la información extraída por la IA
- Estructura depende del tipo de documento

**Acciones:**
- Descargar archivo
- Asignar a paciente (si no está asignado)
- Cerrar diálogo

### Almacenamiento de Archivos

**Bucket de Supabase:** `medical-documents`

**Estructura:**
```
medical-documents/
  ├── {uuid}-{filename}.pdf
  ├── {uuid}-{filename}.docx
  └── {uuid}-{filename}.xlsx
```

### Procesamiento con IA

**Edge Function:** `classify-and-extract`

**Proceso:**
1. Recibe el archivo
2. Extrae texto (OCR si es necesario)
3. Clasifica el tipo de documento
4. Extrae información relevante
5. Calcula nivel de confianza
6. Retorna datos estructurados

## Rutas Disponibles

### Antes ❌
```
/documents          → 404 Not Found
/documents/upload   → ✅ Página de carga
```

### Ahora ✅
```
/documents          → Redirige a /documents/upload
/documents/upload   → ✅ Página de carga + documentos procesados
```

## Cómo Ver los Documentos Procesados

### Opción 1: Desde el Menú
1. Click en "Carga Documentos" en el sidebar
2. Scroll hacia abajo
3. Verás la tabla "Documentos Procesados"

### Opción 2: URL Directa
```
http://localhost:8080/documents
http://localhost:8080/documents/upload
```
Ambas rutas llevan al mismo lugar.

## Funcionalidades Disponibles

### En la Tabla de Documentos

**Búsqueda:**
- Escribe en el campo de búsqueda
- Filtra por nombre de archivo en tiempo real

**Filtro por Tipo:**
- Dropdown con todos los tipos disponibles
- "Todos los tipos" para ver todo

**Ver Detalles:**
- Click en el ícono de ojo (👁️)
- Abre diálogo con información completa
- Muestra datos extraídos por la IA

**Descargar:**
- Click en el ícono de descarga (💾)
- Descarga el archivo original
- Mantiene el nombre original

### Indicadores Visuales

**Badges de Tipo:**
- Colores diferentes según tipo de documento
- Fácil identificación visual

**Barra de Confianza:**
- Progress bar visual
- Porcentaje numérico
- Indica qué tan segura está la IA de la clasificación

**Asignación a Paciente:**
- Ícono de usuario si está asignado
- Texto "Asignado a paciente"

## Estadísticas en Tiempo Real

En la parte superior de la página:

**4 Cards con Contadores:**
1. **Pendientes** - Archivos esperando procesamiento
2. **Procesando** - Archivos siendo procesados ahora
3. **Exitosos** - Archivos procesados correctamente
4. **Errores** - Archivos con errores de procesamiento

## Tipos de Documentos Soportados

**Formatos:**
- ✅ PDF (.pdf)
- ✅ Word (.docx)
- ✅ Excel (.xls, .xlsx)

**Tipos Clasificados:**
- 🔬 Laboratorio
- 🏥 Imagenología
- 📋 Epicrisis
- 📝 Evolución
- 🩺 Anamnesis
- 📄 Otro

## Verificación

✅ Ruta `/documents` redirige correctamente
✅ Tabla de documentos procesados visible
✅ Búsqueda y filtros funcionando
✅ Acciones de ver y descargar operativas
✅ Código de colores implementado
✅ Estadísticas en tiempo real

## Resumen

**Los documentos procesados están en la misma página de "Carga Documentos"**, en la parte inferior. La tabla muestra:
- Todos los documentos cargados históricamente
- Tipo y confianza de clasificación
- Opciones para ver detalles y descargar
- Búsqueda y filtros para encontrar documentos específicos

**Ahora la ruta `/documents` funciona** y redirige automáticamente a `/documents/upload` donde puedes ver tanto la zona de carga como todos los documentos procesados.
