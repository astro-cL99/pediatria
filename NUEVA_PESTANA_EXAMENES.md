# Nueva Pestaña: Exámenes de Laboratorio

## Fecha: 2025-10-09

## Implementación

### 1. Nuevo Componente: `LaboratoryExamsViewer`

**Ubicación:** `src/components/LaboratoryExamsViewer.tsx`

#### Características Principales

**Visualización Completa de Exámenes:**
- 📊 Tabla estructurada por secciones (Química, Hemograma, GSV, etc.)
- 📈 Valores con rangos de referencia
- ⚠️ Alertas críticas y valores anormales
- 🔍 Búsqueda en tiempo real
- 📅 Selector de documentos por fecha

**Código de Colores y Alertas:**
```
🔴 Crítico   → Fondo rojo, badge rojo, ícono de alerta
🟠 Anormal   → Fondo naranja, badge naranja, ícono de tendencia
🟢 Normal    → Badge verde, ícono de línea
```

**Estadísticas en Dashboard:**
- Total de documentos cargados
- Total de exámenes procesados
- Cantidad de valores críticos
- Cantidad de valores anormales

### 2. Estructura de Datos

#### Interface LabExam
```typescript
{
  name: string,              // Nombre del examen (ej: "CREATININA")
  value: string | number,    // Valor (ej: 0.38)
  unit?: string,             // Unidad (ej: "mg/dL")
  referenceRange?: string,   // Rango (ej: "VR: 0.26 - 0.77")
  isAbnormal?: boolean,      // Si está fuera del rango
  isCritical?: boolean       // Si es un valor crítico
}
```

#### Estructura en extracted_data
```json
{
  "date": "21/08/2025",
  "sections": {
    "QUIMICA": [
      {
        "name": "CREATININA",
        "value": 0.38,
        "unit": "mg/dL",
        "referenceRange": "VR: 0.26 - 0.77",
        "isAbnormal": false,
        "isCritical": false
      },
      {
        "name": "PROTEINA C REACTIVA",
        "value": 3.92,
        "unit": "mg/L",
        "referenceRange": "VR: Hasta 1.00",
        "isAbnormal": true,
        "isCritical": true
      }
    ],
    "HEMOGRAMA": [
      {
        "name": "RECUENTO DE LEUCOCITOS",
        "value": 7.4,
        "unit": "x10³/µL",
        "referenceRange": "VR: 5.50 - 15.50",
        "isAbnormal": false
      }
    ]
  }
}
```

### 3. Integración en PatientDetail

**Pestaña Agregada:**
```
Tabs: Evoluciones | Antropometría | Exámenes | Gráficas | Historial | Diagnósticos | Documentos
                                      ↑ NUEVA
```

**Ubicación:** Tab "Exámenes" en el detalle del paciente

**Acceso:**
1. Ir a "Pacientes"
2. Click en un paciente
3. Tab "Exámenes"

### 4. Funcionalidades

#### Dashboard de Estadísticas
```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Total Docs: 3   │ Total Exams: 45 │ Críticos: 2     │ Anormales: 5    │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

#### Selector de Documento
- Dropdown con todos los documentos de laboratorio
- Formato: "nombre_archivo.pdf - 21/08/2025"
- Selecciona el más reciente por defecto

#### Búsqueda de Exámenes
- Campo de búsqueda en tiempo real
- Filtra por nombre de examen
- Mantiene la estructura por secciones

#### Tabla de Resultados

**Columnas:**
1. **Ícono de Estado** - Visual rápido del resultado
2. **Examen** - Nombre del examen
3. **Valor** - Resultado con unidad (resaltado si anormal/crítico)
4. **Rango de Referencia** - Valores normales
5. **Estado** - Badge con clasificación

**Ejemplo de Fila Crítica:**
```
🔴 | PROTEINA C REACTIVA | 3.92 mg/L | VR: Hasta 1.00 | [CRÍTICO]
```

**Ejemplo de Fila Normal:**
```
➖ | CREATININA | 0.38 mg/dL | VR: 0.26 - 0.77 | [Normal]
```

### 5. Visualización por Secciones

Los exámenes se agrupan automáticamente por sección:

**Secciones Comunes:**
- QUÍMICA
- HEMOGRAMA
- GASES EN SANGRE VENOSA (GSV)
- ELECTROLITOS PLASMÁTICOS (ELP)
- PRUEBAS DE COAGULACIÓN
- OTROS EXÁMENES

Cada sección tiene:
- Título destacado con borde inferior
- Tabla con todos los exámenes de esa sección
- Filas con código de colores según estado

### 6. Estados Visuales

#### Estado de Carga
```
┌─────────────────────────────┐
│   📄 (animado)              │
│   Cargando exámenes...      │
└─────────────────────────────┘
```

#### Sin Exámenes
```
┌─────────────────────────────┐
│   📄                        │
│   No hay exámenes           │
│   de laboratorio            │
│                             │
│   Los exámenes cargados     │
│   en "Carga Documentos"     │
│   aparecerán aquí           │
└─────────────────────────────┘
```

#### Con Datos
```
┌─────────────────────────────────────────────────┐
│ [Estadísticas: 4 cards]                         │
├─────────────────────────────────────────────────┤
│ Selector: [20811911.pdf - 21/08/2025 ▼]       │
│ Búsqueda: [🔍 Buscar examen...]                │
│ Fecha: 📅 21/08/2025 URGENCIA PEDIATRICA       │
├─────────────────────────────────────────────────┤
│ QUÍMICA                                         │
│ ┌─────────────────────────────────────────────┐│
│ │ 🔴 | PROTEINA C REACTIVA | 3.92 | ... | 🔴 ││
│ │ ➖ | CREATININA | 0.38 | VR: 0.26-0.77 | 🟢││
│ │ ➖ | BUN | 10.0 | VR: 5.0-17.9 | 🟢        ││
│ └─────────────────────────────────────────────┘│
├─────────────────────────────────────────────────┤
│ HEMOGRAMA                                       │
│ ┌─────────────────────────────────────────────┐│
│ │ ➖ | LEUCOCITOS | 7.4 | VR: 5.5-15.5 | 🟢  ││
│ │ 🟠 | ERITROCITOS | 4.41 | VR: 3.7-5.7 | 🟠││
│ └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### 7. Flujo de Uso

#### Para el Médico

**Paso 1: Cargar Documento**
1. Ir a "Carga Documentos"
2. Subir PDF de laboratorio
3. Procesar con IA
4. Sistema clasifica como "laboratorio"
5. Extrae datos estructurados

**Paso 2: Ver Resultados**
1. Ir a "Pacientes"
2. Seleccionar paciente
3. Tab "Exámenes"
4. Ver todos los exámenes con alertas

**Paso 3: Revisar Alertas**
- Dashboard muestra cantidad de críticos
- Valores críticos resaltados en rojo
- Valores anormales en naranja
- Fácil identificación visual

### 8. Diferencia con "Nuevo Ingreso"

**En "Nuevo Ingreso" (campo de texto):**
```
Formato simple para registro rápido:
"07/10: Hb 11,1 Hcto 32% Leucocitos 16.700 Segmentados 68% 
PQT 353.000 // Albúmina 3,5 Crea 0,17 BUN 9,6 // 
GSV: pH 7,40 HCO3 26,5 pCO2 44,6 pO2 35,4"
```

**En "Exámenes" (visualización estructurada):**
```
Tabla completa con:
- Valores separados por examen
- Rangos de referencia
- Alertas automáticas
- Código de colores
- Búsqueda y filtros
```

### 9. Archivos Modificados/Creados

#### Creados
- ✅ `src/components/LaboratoryExamsViewer.tsx` - Componente completo

#### Modificados
- ✅ `src/pages/PatientDetail.tsx` - Agregada pestaña "Exámenes"

### 10. Integración con IA

**Procesamiento Automático:**
1. Usuario sube PDF de laboratorio
2. Edge Function `classify-and-extract` procesa el documento
3. IA extrae:
   - Fecha del examen
   - Secciones (Química, Hemograma, etc.)
   - Cada examen con su valor
   - Rangos de referencia
   - Detecta valores anormales/críticos
4. Guarda en `clinical_documents.extracted_data`
5. Componente lee y visualiza los datos

**Detección de Alertas:**
- La IA compara valores con rangos de referencia
- Marca `isAbnormal: true` si está fuera del rango
- Marca `isCritical: true` si es un valor peligroso
- El componente aplica colores y badges automáticamente

### 11. Ventajas

**Para el Médico:**
- ✅ Visualización clara y organizada
- ✅ Alertas críticas imposibles de ignorar
- ✅ Comparación rápida con valores de referencia
- ✅ Búsqueda de exámenes específicos
- ✅ Historial completo de laboratorios
- ✅ Sin necesidad de abrir PDFs

**Para el Sistema:**
- ✅ Datos estructurados y consultables
- ✅ Integración con IA
- ✅ Escalable a más tipos de exámenes
- ✅ Exportable a otros formatos

### 12. Próximas Mejoras Sugeridas

1. **Gráficas de Tendencia:**
   - Ver evolución de un examen en el tiempo
   - Comparar múltiples fechas
   - Detectar tendencias

2. **Exportación:**
   - PDF con resumen de exámenes
   - Excel con datos tabulados
   - Incluir gráficas

3. **Comparación:**
   - Comparar dos fechas lado a lado
   - Resaltar cambios significativos
   - Calcular deltas

4. **Notificaciones:**
   - Alertas automáticas por valores críticos
   - Email/SMS al médico tratante
   - Dashboard de alertas pendientes

## Verificación

✅ Compilación exitosa
✅ Pestaña "Exámenes" agregada
✅ Componente funcionando
✅ Integración con Supabase
✅ Código de colores implementado
✅ Alertas críticas destacadas
✅ Búsqueda operativa

## Resumen

**Nueva pestaña "Exámenes"** en el detalle del paciente que muestra:
- Todos los exámenes de laboratorio procesados
- Valores con rangos de referencia
- Alertas críticas en rojo
- Valores anormales en naranja
- Búsqueda y filtros
- Estadísticas rápidas

**Los documentos cargados en "Carga Documentos"** se procesan automáticamente con IA y aparecen estructurados en esta nueva pestaña.
