import { generateAIContent } from '../../../lib/aiService';
import type { OficioData } from './types';

const getStoredApiKey = (): string => {
  let apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  if (!apiKey) {
    apiKey = localStorage.getItem('cfe_gemini_api_key') || '';
  }
  if (!apiKey) {
    apiKey = localStorage.getItem('gemini_api_key') || '';
  }
  return apiKey;
};

export type AIOperationMode = 
  | 'formalizar_completo'
  | 'blindaje_legal'
  | 'normativa_tecnica'
  | 'sintetizar_ejecutivo'
  | 'generar_acuerdos'
  | 'personalizado';

export async function processOficioWithAI(
  currentOficio: OficioData,
  mode: AIOperationMode,
  customInstructions?: string,
  userNotes?: string
): Promise<{
  asunto?: string;
  vocativo?: string;
  antecedentes?: string;
  cuerpo: string;
  fundamentacion?: string;
  peticion?: string;
  despedida?: string;
  sugerencias?: string;
}> {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    throw new Error('No se encontró una clave de API de Gemini configurada. Por favor configúrala en Ajustes o variables de entorno.');
  }

  const systemPrompt = `Eres un Ingeniero y Coordinador de Proyectos de la empresa "ESOL ENERGIAS" con sede en Tepic, Nayarit, representada por Manuel de Jesus Fregoso Samaniega.
Tu objetivo es redactar oficios y comunicados dirigidos a clientes, constructoras, directores de obra, dependencias (CFE, Municipio) o subcontratistas.

ESTILO Y TONO REQUERIDO:
1. SEMI-FORMAL Y EN PRIMERA PERSONA: Redacta siempre en primera persona del singular ("me dirijo a usted", "hago de su conocimiento", "solicito a usted", "quedo a sus órdenes").
2. Profesional, claro, respetuoso, directo, constructivo y natural.
3. Evita fórmulas rebuscadas, lenguaje arcaico, excesivamente legal o solemne (evita frases como "en el tenor de las siguientes", "a quien en lo sucesivo", o párrafos interminables).
4. Escribe de manera fluida y directa, como un profesional de la ingeniería que se comunica con claridad y firmeza para coordinar trabajos, reportar avances o solicitar permisos.
5. Mantén la seriedad técnica dejando constancia clara de fechas, compromisos y responsabilidades.
6. Responde SIEMPRE en formato JSON válido.`;

  let prompt = `DATOS DEL OFICIO ACTUAL:
- Folio: ${currentOficio.folio || 'OF-ESOL-2026-001'}
- Fecha: ${currentOficio.fecha || new Date().toISOString().split('T')[0]}
- Lugar: ${currentOficio.lugar || 'Tepic, Nayarit'}
- Obra/Proyecto: ${currentOficio.nombreObra || 'Proyecto Fotovoltaico'}
- Ubicación Obra: ${currentOficio.ubicacionObra || 'N/D'}
- Cliente: ${currentOficio.clienteFinal || 'Cliente General'}
- Destinatario: ${currentOficio.destinatarioTitulo} ${currentOficio.destinatarioNombre} (${currentOficio.destinatarioCargo} - ${currentOficio.destinatarioEmpresa})
- Asunto Actual: ${currentOficio.asunto || ''}
- Antecedentes Actuales: ${currentOficio.antecedentes || ''}
- Cuerpo Actual: ${currentOficio.cuerpo || ''}
- Fundamentación Actual: ${currentOficio.fundamentacion || ''}
- Petición / Acuerdos Actuales: ${currentOficio.peticion || ''}
- Despedida Actual: ${currentOficio.despedida || ''}
`;

  if (userNotes) {
    prompt += `\nNOTAS O IDEAS DEL USUARIO (BORRADOR RÁPIDO):\n"""\n${userNotes}\n"""\n`;
  }

  if (mode === 'formalizar_completo') {
    prompt += `
TAREA: Estructura el oficio en tono semi-formal y en primera persona (profesional, claro y directo) tomando en cuenta las notas y los datos de la obra.
Entrega un JSON con los siguientes campos:
{
  "asunto": "ASUNTO en mayúsculas, claro y sintético",
  "vocativo": "Vocativo protocolario en primera persona (ej. 'Por medio de la presente me dirijo a usted de la manera más atenta para:')",
  "antecedentes": "Contexto breve y claro del proyecto o visita en 1 o 2 oraciones",
  "cuerpo": "Explicación clara, directa y respetuosa en primera persona de la situación o motivo del oficio",
  "fundamentacion": "Norma o criterio técnico aplicable explicado de forma sencilla (o déjalo breve si no es necesario)",
  "peticion": "Puntos concretos enumerados (1., 2.) de lo que se solicita o acuerda",
  "despedida": "Cierre amable y profesional en primera persona (ej. 'Quedo a sus respetables órdenes para cualquier duda o aclaración.')",
  "sugerencias": "Breve recomendación práctica para el seguimiento"
}`;
  } else if (mode === 'blindaje_legal') {
    prompt += `
TAREA: Redacta con claridad y firmeza para dejar constancia de fechas, suspensión, atrasos o vicios ajenos, cuidando la responsabilidad de ESOL ENERGIAS pero con tono respetuoso y semi-formal sin caer en pleitos legales.
Entrega un JSON con:
{
  "asunto": "Asunto claro y específico",
  "antecedentes": "Contexto de fechas y acuerdos previos",
  "cuerpo": "Exposición de hechos concretos que motivan el aviso",
  "fundamentacion": "Referencia a términos convenidos o condiciones del sitio",
  "peticion": "Puntos de acuerdo o reprogramación solicitados",
  "despedida": "Cierre cordial",
  "sugerencias": "Nota sobre seguimiento"
}`;
  } else if (mode === 'normativa_tecnica') {
    prompt += `
TAREA: Incorpora mención a las normas técnicas oficiales mexicanas (NOM-001-SEDE-2012, STPS, CFE) de manera clara y comprensible.
Entrega un JSON con:
{
  "cuerpo": "Cuerpo con respaldo técnico claro",
  "fundamentacion": "Citas breves de normas aplicables (NOM-001-SEDE-2012, NOM-009-STPS)",
  "peticion": "Petición técnica directa",
  "sugerencias": "Anexos recomendados"
}`;
  } else if (mode === 'sintetizar_ejecutivo') {
    prompt += `
TAREA: Haz el oficio muy conciso, directo y al grano, ideal para lectura rápida en obra.
Entrega un JSON con:
{
  "asunto": "Asunto breve",
  "antecedentes": "1 línea de contexto",
  "cuerpo": "1 o 2 párrafos cortos y directos",
  "peticion": "Puntos rápidos y claros",
  "despedida": "Cierre breve"
}`;
  } else if (mode === 'generar_acuerdos') {
    prompt += `
TAREA: Convierte los puntos clave en compromisos claros con fechas o plazos comprensibles.
Entrega un JSON con:
{
  "cuerpo": "Cuerpo ajustado",
  "peticion": "Puntos de acuerdo y compromisos numerados (1., 2.) con fechas o plazos",
  "despedida": "Cierre formal y constructivo"
}`;
  } else {
    prompt += `
INSTRUCCIÓN PERSONALIZADA DEL USUARIO:
${customInstructions || 'Mejora la redacción manteniendo un tono semi-formal, claro y profesional.'}

Entrega tu respuesta en formato JSON con los campos a actualizar (asunto, vocativo, antecedentes, cuerpo, fundamentacion, peticion, despedida, sugerencias).`;
  }

  try {
    const rawResponse = await generateAIContent(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      apiKey,
      '',
      'gemini-2.5-flash',
      0.3
    );

    let cleanJson = rawResponse.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const firstBrace = cleanJson.indexOf('{');
    const lastBrace = cleanJson.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(cleanJson);
    return {
      asunto: parsed.asunto || currentOficio.asunto,
      vocativo: parsed.vocativo || currentOficio.vocativo,
      antecedentes: parsed.antecedentes !== undefined ? parsed.antecedentes : currentOficio.antecedentes,
      cuerpo: parsed.cuerpo || currentOficio.cuerpo,
      fundamentacion: parsed.fundamentacion !== undefined ? parsed.fundamentacion : currentOficio.fundamentacion,
      peticion: parsed.peticion !== undefined ? parsed.peticion : currentOficio.peticion,
      despedida: parsed.despedida || currentOficio.despedida,
      sugerencias: parsed.sugerencias || ''
    };
  } catch (error: any) {
    console.error('Error procesando con IA:', error);
    throw new Error('Error al procesar con IA: ' + (error.message || 'Error desconocido'));
  }
}
