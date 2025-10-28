import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, imageBase64List, fileName } = await req.json();
    console.log('Clasificando y extrayendo datos de:', fileName);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no configurado');
    }

    // Paso 1: Clasificar tipo de documento
    const classificationPrompt = `Analiza este documento médico pediátrico y clasifica en UNA de estas categorías:

CATEGORÍAS:
- ingreso: Ficha de ingreso hospitalario, anamnesis inicial
- evolucion: Evolución diaria, nota de progreso
- epicrisis: Resumen de alta, resumen de egreso
- interconsulta: Solicitud o respuesta de interconsulta
- laboratorio: Resultados de exámenes de laboratorio
- imagenologia: Informes de radiología, ecografía, TAC, resonancia
- dau: Documento de Atención de Urgencia (DAU)
- receta: Receta médica, prescripción
- otro: Cualquier otro documento médico

INSTRUCCIONES:
1. Lee el documento completo
2. Identifica el tipo basándote en la estructura y contenido
3. Responde SOLO con UNA palabra: la categoría exacta (ej: "laboratorio")
4. Si no estás seguro, usa "otro"

Responde SOLO con la categoría, sin explicaciones.`;

    // Construir contenido para clasificación
    const classificationContent: any[] = [{ type: 'text', text: classificationPrompt }];
    if (Array.isArray(imageBase64List) && imageBase64List.length > 0) {
      classificationContent.push({
        type: 'image_url',
        image_url: { url: `data:image/png;base64,${imageBase64List[0]}` }
      });
    } else if (imageBase64) {
      classificationContent.push({
        type: 'image_url',
        image_url: { url: `data:image/png;base64,${imageBase64}` }
      });
    }

    const classificationResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: classificationContent }],
      }),
    });

    if (!classificationResponse.ok) {
      const errorText = await classificationResponse.text();
      console.error('Error en clasificación:', classificationResponse.status, errorText);
      throw new Error(`Error en clasificación: ${classificationResponse.status}`);
    }

    const classificationData = await classificationResponse.json();
    const documentType = classificationData.choices[0].message.content.trim().toLowerCase();
    console.log('Tipo detectado:', documentType);

    // Paso 2: Extraer datos según el tipo
    const extractionPrompts: Record<string, string> = {
      ingreso: `Extrae información de este documento de INGRESO HOSPITALARIO pediátrico:

{
  "paciente": {
    "nombre": "nombre completo del paciente",
    "edad": "edad del paciente",
    "sexo": "M/F"
  },
  "fechaIngreso": "fecha de ingreso en formato DD/MM/YYYY",
  "motivoConsulta": "motivo de consulta o queja principal",
  "anamnesis": "historia de enfermedad actual",
  "antecedentes": {
    "personales": "antecedentes personales relevantes",
    "familiares": "antecedentes familiares",
    "alergias": "alergias conocidas"
  },
  "examenFisico": "resumen del examen físico",
  "diagnosticos": ["array de diagnósticos de ingreso"],
  "planTratamiento": "plan inicial de tratamiento"
}`,

      evolucion: `Extrae información de esta EVOLUCIÓN DIARIA pediátrica:

{
  "fecha": "fecha de la evolución en formato DD/MM/YYYY",
  "hora": "hora de la evolución",
  "subjetivo": "información subjetiva (síntomas referidos, quejas)",
  "objetivo": "datos objetivos (signos vitales, examen físico)",
  "signosVitales": {
    "temperatura": "temperatura en °C",
    "fc": "frecuencia cardíaca",
    "fr": "frecuencia respiratoria",
    "sat": "saturación de oxígeno"
  },
  "analisis": "evaluación clínica",
  "plan": "plan de manejo actualizado",
  "medicamentos": ["medicamentos indicados o ajustados"]
}`,

      laboratorio: `Extrae TODOS los resultados de este examen de LABORATORIO:

{
  "fechaToma": "fecha de toma de muestra en formato DD/MM/YYYY",
  "procedencia": "procedencia del examen",
  "categorias": [
    {
      "nombre": "nombre del sistema (ej: Hemograma, Química, Coagulación)",
      "examenes": [
        {
          "nombre": "nombre del examen",
          "valor": "valor numérico sin unidades",
          "unidad": "unidad de medida",
          "referencia": "rango de referencia",
          "alterado": true/false
        }
      ]
    }
  ]
}

IMPORTANTE: Extrae TODOS los exámenes de TODAS las páginas.`,

      imagenologia: `Extrae información de este informe de IMAGENOLOGÍA pediátrico:

{
  "fecha": "fecha del estudio en formato DD/MM/YYYY",
  "tecnica": "técnica utilizada (ej: Radiografía, Ecografía, TAC)",
  "region": "región anatómica estudiada",
  "indicacion": "indicación del estudio",
  "hallazgos": "descripción de los hallazgos",
  "conclusion": "conclusión o impresión diagnóstica",
  "recomendaciones": "recomendaciones del radiólogo si las hay"
}`,

      epicrisis: `Extrae información de esta EPICRISIS o resumen de alta:

{
  "fechaIngreso": "fecha de ingreso en formato DD/MM/YYYY",
  "fechaEgreso": "fecha de egreso en formato DD/MM/YYYY",
  "diasHospitalizacion": "número de días",
  "diagnosticoIngreso": "diagnóstico de ingreso",
  "diagnosticosEgreso": ["diagnósticos finales de egreso"],
  "resumenEvolucion": "resumen de la evolución hospitalaria",
  "tratamientoRecibido": "tratamiento recibido durante hospitalización",
  "condicionEgreso": "condición al alta",
  "indicacionesAlta": "indicaciones al alta",
  "medicamentosAlta": ["medicamentos al alta"],
  "controlAmbulatorio": "controles ambulatorios indicados"
}`,

      interconsulta: `Extrae información de esta INTERCONSULTA:

{
  "fecha": "fecha de la interconsulta en formato DD/MM/YYYY",
  "especialidad": "especialidad consultada",
  "tipo": "solicitud/respuesta",
  "motivo": "motivo de la interconsulta",
  "antecedentes": "antecedentes relevantes",
  "respuesta": "respuesta del especialista (si aplica)",
  "recomendaciones": "recomendaciones o sugerencias"
}`,

      dau: `Extrae información de este DAU (Documento de Atención de Urgencia):

{
  "fecha": "fecha de atención en formato DD/MM/YYYY",
  "hora": "hora de atención",
  "paciente": {
    "nombre": "nombre del paciente",
    "edad": "edad",
    "sexo": "M/F"
  },
  "motivoConsulta": "motivo de consulta",
  "anamnesis": "anamnesis de urgencia",
  "examenFisico": "examen físico",
  "diagnostico": "diagnóstico de urgencia",
  "tratamiento": "tratamiento administrado",
  "destino": "destino del paciente (alta, hospitalización, etc)"
}`,

      receta: `Extrae información de esta RECETA MÉDICA:

{
  "fecha": "fecha de la receta en formato DD/MM/YYYY",
  "paciente": "nombre del paciente",
  "medicamentos": [
    {
      "nombre": "nombre del medicamento",
      "dosis": "dosis prescrita",
      "frecuencia": "frecuencia de administración",
      "via": "vía de administración",
      "duracion": "duración del tratamiento"
    }
  ],
  "indicaciones": "indicaciones adicionales"
}`,

      otro: `Extrae la información principal de este documento médico:

{
  "tipo": "tipo de documento identificado",
  "fecha": "fecha del documento en formato DD/MM/YYYY",
  "contenidoPrincipal": "resumen del contenido principal",
  "datosRelevantes": ["datos clínicamente relevantes encontrados"]
}`
    };

    const extractionPrompt = extractionPrompts[documentType] || extractionPrompts.otro;

    // Construir contenido para extracción (todas las páginas)
    const extractionContent: any[] = [{ type: 'text', text: extractionPrompt }];
    if (Array.isArray(imageBase64List) && imageBase64List.length > 0) {
      for (const img of imageBase64List) {
        extractionContent.push({
          type: 'image_url',
          image_url: { url: `data:image/png;base64,${img}` }
        });
      }
      console.log('Procesando', imageBase64List.length, 'páginas');
    } else if (imageBase64) {
      extractionContent.push({
        type: 'image_url',
        image_url: { url: `data:image/png;base64,${imageBase64}` }
      });
      console.log('Procesando 1 página');
    }

    const extractionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: extractionContent }],
        response_format: { type: 'json_object' }
      }),
    });

    if (!extractionResponse.ok) {
      const errorText = await extractionResponse.text();
      console.error('Error en extracción:', extractionResponse.status, errorText);
      throw new Error(`Error en extracción: ${extractionResponse.status}`);
    }

    const extractionData = await extractionResponse.json();
    let extractedText = extractionData.choices[0].message.content;

    // Manejar bloques markdown JSON
    if (extractedText.includes('```json')) {
      extractedText = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      console.log('JSON extraído de bloque markdown');
    }

    const extractedDataParsed = JSON.parse(extractedText);

    console.log('Datos extraídos exitosamente');
    console.log('Tipo:', documentType);

    // Calcular score de confianza simple (puede mejorarse)
    let confidenceScore = 0.9; // Base
    if (documentType === 'otro') confidenceScore = 0.6;
    if (!extractedDataParsed || Object.keys(extractedDataParsed).length < 3) {
      confidenceScore -= 0.2;
    }

    return new Response(
      JSON.stringify({
        success: true,
        documentType,
        extractedData: extractedDataParsed,
        confidenceScore
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
