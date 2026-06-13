// Generadores de contenido con Gemini/Claude. Devuelven null y cae a demo si no hay key.
import { api } from './api';
import type { VideoIdea, GeneratedAssets, MonetizationReport, Niche } from '../types';
import { DEMO_IDEAS, DEMO_ASSETS, DEMO_MONETIZACION } from '../data/demo';
import { useApp } from '../store/useApp';

const JSON_HINT_IDEAS = `{ideas: [{titulo, hook, angulo, porQueViral, promesaValor, estructuraSugerida, justificacionMetricas, origen, fuentes, desgloseKB, desgloseInvestigacion}]}`;
const JSON_HINT_ASSETS = `{titulos,guion,descripcionSEO,keywords,timestamps,thumbnails,storyboard,promptVideo,promptMusica,promptMusicaGemini,estrategiaPublicacion,fuentesUtilizadas}`;

function withRatio(prompt: string, ratio: '9:16' | '16:9') {
  if (!prompt) return prompt;
  const cleaned = prompt.replace(/\s--ar\s+\S+/g, '').trim();
  return `${cleaned} --ar ${ratio}`.trim();
}

function buildStoryboardDemo(
  base: NonNullable<GeneratedAssets['storyboard']> | undefined,
  scenes: number,
  dur: number,
  ratio: '9:16' | '16:9',
) {
  const templates = (base && base.length ? base : [{
    escena: 1,
    inicioSeg: 0,
    finSeg: 1,
    vozEnOff: 'Arrancamos con el hook: esto parece imposible… pero es real.',
    textoEnPantalla: 'ES REAL',
    promptImagen: 'Cinematic close-up of an impossible object floating, dramatic rim light, dark background, ultra sharp, photorealistic, 4K',
    promptVideo: 'Cinematic vertical shot: slow push-in on an impossible floating object, subtle particles, volumetric light, photorealistic, 3 seconds, 4K',
    ratio,
  }]);

  const items = Array.from({ length: scenes }).map((_, i) => {
    const tpl = templates[i % templates.length];
    const inicio = Math.round((i * dur) / scenes);
    const fin = i === scenes - 1 ? dur : Math.max(inicio + 1, Math.round(((i + 1) * dur) / scenes));
    return {
      escena: i + 1,
      inicioSeg: inicio,
      finSeg: fin,
      vozEnOff: tpl.vozEnOff || '',
      textoEnPantalla: tpl.textoEnPantalla || '',
      promptImagen: withRatio(tpl.promptImagen || '', ratio),
      promptVideo: withRatio(tpl.promptVideo || '', ratio),
      ratio,
    };
  });

  return items;
}

export async function generarIdeas(opts: {
  nicho: string;
  investigacion: { resumen: string; outliers: { title: string; views: number }[]; subNichos: string[]; angulos: string[] };
  geminiDisponible: boolean;
  knowledgeBase?: string;
}): Promise<VideoIdea[]> {
  if (!opts.geminiDisponible) return DEMO_IDEAS;

  const prompt = `A partir del análisis del nicho "${opts.nicho}", genera 10 ideas de video con alto potencial viral.

Requisitos por idea:
- título (claro y clicable)
- hook de 3 segundos (1 frase corta)
- promesa de valor (qué gana el espectador en 1 frase)
- ángulo diferenciador (por qué esta versión es distinta)
- por qué podría viralizar (mecanismo: curiosidad, controversia, transformación, lista, etc.)
- estructura sugerida (5-8 bullets con tiempos aproximados)
- justificación de métricas (por qué debería subir CTR/retención/VPH)
- origen: "kb" (si proviene principalmente de tu Base de Conocimiento), "ai" (si es una idea general del nicho surgida de la investigación de YouTube), "hibrida" (si cruza/condensa información de tu KB con la investigación de YouTube).
- fuentes: array de referencias específicas. Si usas información de tu Base de Conocimiento, DEBES incluir el ID exacto del documento formateado como "[KB:<id>]" (ej. "[KB:doc-id]"). Si usas datos de los videos analizados, outliers o canales de la investigación, incluye el título o canal formateado como "[Investigación: <título o canal>]" (ej. "[Investigación: Outlier - 5 Hábitos]").
- desgloseKB: explicación breve (1-2 frases) de qué se tomó como importante de la Base de Conocimiento (documentación cargada por el usuario) para construir esta idea y cómo se incorporó (dejar vacío si el origen es "ai" o no se usó ningún documento).
- desgloseInvestigacion: explicación breve (1-2 frases) de qué se tomó de la investigación de YouTube (outliers, canales analizados, subnichos) para armar y sustentar esta idea.

Contexto del análisis:
- Resumen: ${opts.investigacion.resumen}
- Outliers: ${opts.investigacion.outliers.slice(0, 5).map((o) => `"${o.title}" (${o.views} vistas)`).join('; ')}
- Subnichos: ${opts.investigacion.subNichos.join(', ')}
- Ángulos: ${opts.investigacion.angulos.join(', ')}

${opts.knowledgeBase ? `\nBase de conocimiento del usuario (DEBES utilizarla activamente para cruzar datos y enriquecer las ideas híbridas):\n${opts.knowledgeBase}\n` : ''}

Devuelve un JSON con esta forma: ${JSON_HINT_IDEAS}`;
  const settings = useApp.getState().settings;
  const provider = settings.proveedorIA;
  const system = 'Eres un estratega creativo de YouTube en español de Latinoamérica.';
  let data;
  if (provider === 'claude') {
    data = await api.claudeJSON(prompt, system, JSON_HINT_IDEAS, settings.modeloClaude);
  } else if (provider === 'mistral') {
    data = await api.mistralJSON(prompt, system, JSON_HINT_IDEAS, settings.modeloMistral);
  } else {
    data = await api.geminiJSON(prompt, system, JSON_HINT_IDEAS, settings.modeloGemini);
  }
  return (data.ideas || []).slice(0, 10).map((it: any, i: number) => normalizeIdea(it, i));
}

export async function generarAssets(opts: {
  nicho: string;
  idea: VideoIdea;
  geminiDisponible: boolean;
  knowledgeBase?: string;
  videoPlan?: { formato: 'short' | 'largo'; duracionSegundos: number };
}): Promise<GeneratedAssets> {
  const dur = opts.videoPlan?.duracionSegundos || 60;
  const formato = opts.videoPlan?.formato || 'short';
  const durLabel = formato === 'short' ? `${Math.min(90, Math.max(15, dur))} segundos` : `${Math.min(60, Math.max(2, Math.round(dur / 60)))} minutos`;
  const ratioStoryboard = formato === 'short' ? '9:16' : '16:9';
  const scenes = formato === 'short'
    ? (dur <= 60 ? 8 : 10)
    : Math.min(36, Math.max(12, Math.round((dur / 60) * 1.5)));

  if (!opts.geminiDisponible) {
    const tema = opts.idea.titulo;
    const base = { ...DEMO_ASSETS, tema, nicho: opts.nicho };
    const thumbnails = (base.thumbnails || []).slice(0, 3);
    const storyboard = buildStoryboardDemo(base.storyboard, scenes, dur, ratioStoryboard);
    return {
      ...base,
      promptThumbnail: thumbnails[0]?.prompt || base.promptThumbnail,
      thumbnails,
      storyboard,
    };
  }

  const prompt = `Genera un paquete completo de contenido para YouTube a partir de esta idea:

Nicho: ${opts.nicho}
Idea: ${opts.idea.titulo}
Hook: ${opts.idea.hook}
Ángulo: ${opts.idea.angulo}
Duración objetivo: ${durLabel} (${formato === 'short' ? 'formato vertical, ritmo alto' : 'video largo con capítulos y retención'})

Devuelve un JSON con:
{
  "titulos": [{"texto": "...", "razon": "por qué funcionaría"}],
  "guion": "guion estructurado por secciones. CADA sección DEBE seguir este formato exacto:\n\nNOMBRE SECCIÓN (tiempo):\n[VISUAL: descripción breve de cámara, escena o transición]\nVOZ EN OFF: texto exacto que se narra\n\nIncluye hook, desarrollo con técnicas de retención (open loops, cambios de ritmo, pattern interrupt) y CTA final. Los tiempos deben ajustarse a la duración objetivo.",
  "descripcionSEO": "descripción optimizada con hashtags y enlaces",
  "keywords": ["array", "de", "keywords"],
  "timestamps": ["0:00 Hook", "... (capítulos coherentes con la duración objetivo)"],
  "thumbnails": [
    {"concepto": "concepto visual distinto", "textoMiniatura": "3 palabras máximo", "prompt": "prompt EN INGLÉS 16:9", "ratio": "16:9"},
    {"concepto": "...", "textoMiniatura": "...", "prompt": "prompt EN INGLÉS 16:9", "ratio": "16:9"},
    {"concepto": "...", "textoMiniatura": "...", "prompt": "prompt EN INGLÉS 16:9", "ratio": "16:9"}
  ],
  "storyboard": [
    {"escena": 1, "inicioSeg": 0, "finSeg": 7, "vozEnOff": "texto exacto para narración", "textoEnPantalla": "opcional", "promptImagen": "prompt EN INGLÉS", "promptVideo": "prompt EN INGLÉS derivado de la imagen", "ratio": "${ratioStoryboard}"},
    "... ${scenes} escenas totales"
  ],
  "promptVideo": "prompt en INGLÉS para Veo/Kling con movimiento de cámara, escena, duración",
  "promptMusica": "prompt en INGLÉS para Suno con género, mood, BPM, instrumentos, estructura",
  "promptMusicaGemini": "variante del prompt de música para Gemini",
  "estrategiaPublicacion": {
    "mejorDia": "día de la semana óptimo para publicar según hábitos de consumo de este nicho",
    "mejorHora": "franja horaria óptima, indicando que es hora local del público objetivo",
    "frecuencia": "cadencia de publicación recomendada para crecer en este nicho sin quemar al equipo",
    "formato": "mezcla de formatos recomendada (shorts vs. largos) para este nicho",
    "razon": "por qué esta combinación de día/hora/frecuencia/formato funciona para este nicho específico (hábitos reales de la audiencia)",
    "tituloPublicacion": "título FINAL listo para copiar y pegar en el campo de título de YouTube (≤100 caracteres, palabra clave principal cerca del inicio, gancho emocional/curiosidad, sin clickbait vacío)",
    "descripcionPublicacion": "descripción COMPLETA lista para copiar y pegar: 2-3 líneas de gancho que repiten la promesa del título (lo único visible antes de 'mostrar más'), desarrollo natural con keywords, CTA de suscripción, mención de que los timestamps están abajo, y 3 hashtags al final",
    "tags": ["10 a 15 tags para el campo 'Etiquetas' de YouTube Studio, ordenados de más a menos específico, en minúsculas"],
    "hashtags": ["3 a 5 hashtags sin el símbolo #, listos para insertar en título/descripción"],
    "categoria": "categoría de YouTube recomendada para maximizar la sugerencia algorítmica en este nicho, con una breve razón entre paréntesis",
    "audienciaInfantil": "recomendación para la pregunta '¿Es contenido hecho para niños?' (sí/no) y por qué — incluye la consecuencia de marcarlo mal (desactiva comentarios/personalización)",
    "idioma": "idioma y variante regional principal del video, alineado con el público objetivo del nicho",
    "licencia": "licencia recomendada (Licencia estándar de YouTube vs. Creative Commons - Atribución) y en qué caso usar cada una",
    "visibilidad": "recomendación concreta de visibilidad al publicar (Público inmediato / Programado para [día] a las [hora] / Oculto para promoción cruzada antes del lanzamiento) y por qué conviene para este video",
    "comentarioFijado": "comentario fijado LISTO para copiar y pegar apenas se publique, que invite a responder algo concreto del video para disparar el engagement temprano",
    "pantallaFinal": "qué elementos colocar en la pantalla final (últimos 15-20s): qué video/playlist promocionar, suscripción, y por qué esa combinación retiene mejor a esta audiencia",
    "tarjetas": "en qué momentos del video colocar tarjetas (cards) y hacia qué contenido del canal deben enlazar para subir el watch time",
    "playlist": "nombre de playlist sugerida para agrupar este video con futuros similares y por qué eso ayuda al algoritmo (autoplay encadenado)",
    "publicacionComunidad": "texto LISTO para copiar y pegar como publicación en la pestaña Comunidad anunciando el video ANTES o el día de su estreno, con una pregunta o encuesta que genere expectativa",
    "shorts": {
      "hashtags": "string con los hashtags exactos a usar en el Short (incluye #Shorts + 2-3 específicos del nicho), listo para copiar",
      "musica": "qué tipo de audio/música usar para favorecer el descubrimiento en el feed de Shorts (sonidos en tendencia, ritmo, biblioteca de YouTube)",
      "tips": "1-2 técnicas concretas para que ESTE Short funcione mejor (gancho en el primer 1-2s, loop perfecto entre el último y primer frame, texto en pantalla legible sin sonido, etc.)"
    },
    "checklistSubida": ["6 a 9 pasos NUMERADOS en el orden exacto a seguir en YouTube Studio para subir, configurar y publicar este video correctamente, desde 'Subir video' hasta la promoción post-publicación"]
  },
  "fuentesUtilizadas": {
    "kb": ["array con los IDs exactos (ej. \\\"doc-id-1\\\") de los documentos de tu base de conocimientos que se usaron en este guion/paquete"],
    "investigacion": ["array con referencias de la investigación de YouTube (outliers, subnichos, ángulos, competidores) que inspiraron este guion/paquete"],
    "explicacion": "explicación en un párrafo corto sobre cómo se unificó e integró la información del usuario con los datos de investigación de YouTube"
  }
}

Reglas:
- "thumbnails" debe traer 3 opciones distintas, todas en 16:9.
- "storyboard" debe traer exactamente ${scenes} escenas, cubriendo toda la duración (inicioSeg/finSeg consistentes).
- En shorts, "storyboard.ratio" debe ser 9:16 (vertical); en largos 16:9.
- Los prompts de imagen/video deben ser EN INGLÉS y consistentes en estilo/personajes/locación entre escenas.
- En "guion", CADA sección debe incluir obligatoriamente la línea [VISUAL: ...] con la indicación de cámara/escena, seguida de la línea VOZ EN OFF: con el texto narrado. Sin excepciones.
- TODO el contenido de "estrategiaPublicacion" debe estar listo para copiar y pegar directamente en YouTube Studio (sin placeholders genéricos tipo "[tu canal]"; usa información real de la idea y el nicho) y basarse en buenas prácticas reales de viralidad para el nicho indicado.
- En "fuentesUtilizadas", relaciona de forma honesta qué elementos de la base de conocimientos y qué videos de la investigación influyeron.

Responde en español salvo los prompts (que van en inglés para mejor calidad).`;

  const kbBlock = opts.knowledgeBase ? `\n\nBase de conocimiento del usuario (úsala para ejemplos, terminología y datos relevantes; evita inventar cuando la KB ya lo define):\n${opts.knowledgeBase}\n` : '';

  const settings = useApp.getState().settings;
  const provider = settings.proveedorIA;
  const system = 'Eres un experto en producción de contenido viral de YouTube en español.';
  let data;
  if (provider === 'claude') {
    data = await api.claudeJSON(prompt + kbBlock, system, JSON_HINT_ASSETS, settings.modeloClaude);
  } else if (provider === 'mistral') {
    data = await api.mistralJSON(prompt + kbBlock, system, JSON_HINT_ASSETS, settings.modeloMistral);
  } else {
    data = await api.geminiJSON(prompt + kbBlock, system, JSON_HINT_ASSETS, settings.modeloGemini);
  }

  const thumbnails = Array.isArray(data.thumbnails) ? data.thumbnails.slice(0, 3).map((t: any) => ({
    concepto: t.concepto || '',
    textoMiniatura: t.textoMiniatura || '',
    prompt: t.prompt || '',
    ratio: '16:9' as const,
  })) : [];

  const storyboard = Array.isArray(data.storyboard) ? data.storyboard.map((s: any, i: number) => ({
    escena: Number(s.escena || i + 1),
    inicioSeg: Number(s.inicioSeg || 0),
    finSeg: Number(s.finSeg || 0),
    vozEnOff: s.vozEnOff || '',
    textoEnPantalla: s.textoEnPantalla || '',
    promptImagen: s.promptImagen || '',
    promptVideo: s.promptVideo || '',
    ratio: (formato === 'short' ? '9:16' : '16:9') as ('9:16' | '16:9'),
  })) : [];

  return {
    tema: opts.idea.titulo,
    nicho: opts.nicho,
    titulos: data.titulos || [],
    guion: data.guion || '',
    descripcionSEO: data.descripcionSEO || '',
    keywords: data.keywords || [],
    timestamps: data.timestamps || [],
    promptThumbnail: (thumbnails[0]?.prompt || data.promptThumbnail || ''),
    thumbnails,
    storyboard,
    promptVideo: data.promptVideo || '',
    promptMusica: data.promptMusica || '',
    promptMusicaGemini: data.promptMusicaGemini || '',
    estrategiaPublicacion: normalizeEstrategia(data.estrategiaPublicacion),
    fuentesUtilizadas: normalizeFuentes(data.fuentesUtilizadas),
  };
}

// Convierte cualquier valor devuelto por la IA (string, número, objeto, array...)
// en un texto plano seguro para renderizar. React lanza "Objects are not valid as
// a React child" si un campo llega como objeto/array en vez de string — esto evita
// que un JSON con forma inesperada rompa la pestaña de Publicación.
function toText(v: any, fallback = '—'): string {
  if (v == null) return fallback;
  if (typeof v === 'string') return v.trim() || fallback;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) {
    const parts = v.map((x) => toText(x, '')).filter(Boolean);
    return parts.length ? parts.join(', ') : fallback;
  }
  if (typeof v === 'object') {
    const cand = v.texto ?? v.valor ?? v.nombre ?? v.titulo ?? v.descripcion ?? v.razon ?? v.tag ?? v.hashtag ?? v.paso ?? v.contenido ?? v.mensaje;
    if (typeof cand === 'string' && cand.trim()) return cand.trim();
    try { return JSON.stringify(v); } catch { return fallback; }
  }
  return String(v);
}

// Igual que toText pero sin valor de relleno — para campos "listos para copiar"
// donde preferimos string vacío a un guion largo.
function toCopyText(v: any): string {
  const t = toText(v, '');
  return t === '—' ? '' : t;
}

function toStringArray(v: any): string[] {
  if (Array.isArray(v)) return v.map((x) => toText(x, '')).filter(Boolean);
  if (typeof v === 'string') return v.split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean);
  return [];
}

// Normaliza una idea de video (recién generada por la IA o leída de un proyecto
// guardado con una versión anterior), garantizando que cada campo tenga el tipo
// que espera la UI para que la pestaña de Ideas nunca falle con
// "Objects are not valid as a React child".
export function normalizeIdea(it: any, i = 0): VideoIdea {
  const src = it || {};
  const origenTexto = toText(src.origen, '');
  return {
    id: src.id || `idea-${i}`,
    titulo: toText(src.titulo, `Idea ${i + 1}`),
    hook: toText(src.hook, ''),
    angulo: toText(src.angulo, ''),
    porQueViral: toText(src.porQueViral, ''),
    promesaValor: toCopyText(src.promesaValor),
    estructuraSugerida: toStringArray(src.estructuraSugerida),
    justificacionMetricas: toCopyText(src.justificacionMetricas),
    origen: (['kb', 'ai', 'hibrida'] as const).includes(origenTexto as any) ? (origenTexto as 'kb' | 'ai' | 'hibrida') : undefined,
    fuentes: toStringArray(src.fuentes),
    desgloseKB: toCopyText(src.desgloseKB),
    desgloseInvestigacion: toCopyText(src.desgloseInvestigacion),
  };
}

export function normalizeFuentes(f: any): GeneratedAssets['fuentesUtilizadas'] {
  const src = f || {};
  return {
    kb: Array.isArray(src.kb) ? src.kb.map(String).filter(Boolean) : [],
    investigacion: Array.isArray(src.investigacion) ? src.investigacion.map(String).filter(Boolean) : [],
    explicacion: typeof src.explicacion === 'string' ? src.explicacion.trim() : '',
  };
}

// Normaliza la estrategia de publicación devuelta por la IA, rellenando con
// valores por defecto cualquier campo faltante y garantizando que cada campo
// tenga el tipo (string / string[] / objeto) que la UI espera, sin importar
// la forma exacta del JSON que haya devuelto el modelo.
export function normalizeEstrategia(e: any): GeneratedAssets['estrategiaPublicacion'] {
  const src = e || {};
  const shorts = (src.shorts && typeof src.shorts === 'object' && !Array.isArray(src.shorts)) ? src.shorts : {};
  return {
    mejorDia: toText(src.mejorDia),
    mejorHora: toText(src.mejorHora),
    frecuencia: toText(src.frecuencia),
    formato: toText(src.formato),
    razon: toText(src.razon),
    tituloPublicacion: toCopyText(src.tituloPublicacion),
    descripcionPublicacion: toCopyText(src.descripcionPublicacion),
    tags: toStringArray(src.tags),
    hashtags: toStringArray(src.hashtags).map((h) => h.replace(/^#+/, '')),
    categoria: toText(src.categoria),
    audienciaInfantil: toText(src.audienciaInfantil),
    idioma: toText(src.idioma),
    licencia: toText(src.licencia),
    visibilidad: toText(src.visibilidad),
    comentarioFijado: toCopyText(src.comentarioFijado),
    pantallaFinal: toText(src.pantallaFinal, ''),
    tarjetas: toText(src.tarjetas, ''),
    playlist: toText(src.playlist, ''),
    publicacionComunidad: toCopyText(src.publicacionComunidad),
    shorts: {
      hashtags: toCopyText(shorts.hashtags),
      musica: toText(shorts.musica, ''),
      tips: toText(shorts.tips, ''),
    },
    checklistSubida: toStringArray(src.checklistSubida),
  };
}

// Regenera TODOS los activos dependientes a partir de un guion editado por el usuario.
// El guion editado se preserva tal cual; el resto (títulos, SEO, keywords, timestamps,
// thumbnails, storyboard, prompts de video/música, estrategia de publicación) se
// recalcula para mantener coherencia integral con el nuevo guion.
export async function regenerarActivosDesdeGuion(opts: {
  nicho: string;
  idea: VideoIdea;
  guion: string;
  prevAssets: GeneratedAssets;
  geminiDisponible: boolean;
  knowledgeBase?: string;
  videoPlan?: { formato: 'short' | 'largo'; duracionSegundos: number };
}): Promise<GeneratedAssets> {
  const dur = opts.videoPlan?.duracionSegundos || 60;
  const formato = opts.videoPlan?.formato || 'short';
  const durLabel = formato === 'short'
    ? `${Math.min(90, Math.max(15, dur))} segundos`
    : `${Math.min(60, Math.max(2, Math.round(dur / 60)))} minutos`;
  const ratioStoryboard = formato === 'short' ? '9:16' : '16:9';
  const scenes = formato === 'short'
    ? (dur <= 60 ? 8 : 10)
    : Math.min(36, Math.max(12, Math.round((dur / 60) * 1.5)));

  // Sin IA disponible: solo actualizamos el guion. No podemos sintetizar el resto
  // sin un modelo, así que el resto del paquete se preserva intacto.
  if (!opts.geminiDisponible) {
    return {
      ...opts.prevAssets,
      guion: opts.guion,
      tema: opts.prevAssets.tema || opts.idea.titulo,
      nicho: opts.prevAssets.nicho || opts.nicho,
    };
  }

  const prompt = `Has recibido un GUION EDITADO POR EL USUARIO. Tu tarea es regenerar TODOS los activos del paquete de YouTube para que sean integralmente coherentes con este guion editado. El guion es la fuente de verdad: títulos, SEO, keywords, timestamps, thumbnails, storyboard, prompts de video/música y estrategia de publicación deben derivar de él.

Nicho: ${opts.nicho}
Idea base original: ${opts.idea.titulo}
Hook original: ${opts.idea.hook}
Ángulo original: ${opts.idea.angulo}
Formato: ${formato === 'short' ? 'Short vertical 9:16' : 'Video largo 16:9'}
Duración objetivo: ${durLabel}

GUION EDITADO (FUENTE DE VERDAD — NO LO MODIFIQUES):
"""
${opts.guion}
"""

Devuelve un JSON con esta forma exacta (sin el campo "guion", que ya está fijado):
{
  "titulos": [{"texto": "...", "razon": "por qué este título refleja mejor el guion editado"}],  // 5 títulos NUEVOS basados en el guion editado
  "descripcionSEO": "descripción optimizada con hashtags y enlaces, coherente con el guion editado",
  "keywords": ["array", "de", "keywords", "derivadas", "del", "guion"],
  "timestamps": ["0:00 Hook", "..."],   // capítulos derivados de la estructura real del nuevo guion
  "thumbnails": [
    {"concepto": "concepto visual coherente con el guion", "textoMiniatura": "3 palabras máximo", "prompt": "prompt EN INGLÉS 16:9", "ratio": "16:9"},
    {"concepto": "...", "textoMiniatura": "...", "prompt": "prompt EN INGLÉS 16:9", "ratio": "16:9"},
    {"concepto": "...", "textoMiniatura": "...", "prompt": "prompt EN INGLÉS 16:9", "ratio": "16:9"}
  ],
  "storyboard": [
    {"escena": 1, "inicioSeg": 0, "finSeg": 7, "vozEnOff": "texto extraído/reformulado del guion editado para esta escena", "textoEnPantalla": "opcional", "promptImagen": "prompt EN INGLÉS", "promptVideo": "prompt EN INGLÉS derivado de la imagen", "ratio": "${ratioStoryboard}"},
    "... ${scenes} escenas totales"
  ],
  "promptVideo": "prompt en INGLÉS para Veo/Kling coherente con tono y escenas del guion editado",
  "promptMusica": "prompt en INGLÉS para Suno con género/mood/BPM que acompañe el ritmo del guion editado",
  "promptMusicaGemini": "variante del prompt de música para Gemini",
  "estrategiaPublicacion": {
    "mejorDia": "...", "mejorHora": "...", "frecuencia": "...", "formato": "...", "razon": "...",
    "tituloPublicacion": "título FINAL listo para copiar y pegar, coherente con el guion editado (≤100 caracteres)",
    "descripcionPublicacion": "descripción COMPLETA lista para copiar y pegar, coherente con el guion editado, con gancho + CTA + hashtags",
    "tags": ["10 a 15 tags derivados del guion editado, en minúsculas"],
    "hashtags": ["3 a 5 hashtags sin #"],
    "categoria": "categoría de YouTube recomendada + razón breve",
    "audienciaInfantil": "recomendación sí/no + por qué",
    "idioma": "idioma y variante regional principal",
    "licencia": "licencia recomendada + por qué",
    "visibilidad": "recomendación de visibilidad al publicar + por qué",
    "comentarioFijado": "comentario fijado listo para copiar y pegar, referido a algo concreto del guion editado",
    "pantallaFinal": "qué colocar en la pantalla final y por qué",
    "tarjetas": "en qué momentos colocar tarjetas y hacia qué deben enlazar",
    "playlist": "nombre de playlist sugerida y por qué agrupa bien este video",
    "publicacionComunidad": "texto listo para copiar y pegar en la pestaña Comunidad anunciando este video",
    "shorts": {"hashtags": "string con hashtags exactos incluyendo #Shorts", "musica": "guía de audio/música para el feed de Shorts", "tips": "1-2 técnicas concretas para este Short"},
    "checklistSubida": ["6 a 9 pasos numerados para subir y publicar este video en YouTube Studio"]
  },
  "fuentesUtilizadas": {
    "kb": ["array con los IDs exactos (ej. \\\"doc-id-1\\\") de los documentos de tu base de conocimientos que se usaron en este guion/paquete"],
    "investigacion": ["array con referencias de la investigación de YouTube (outliers, subnichos, ángulos, competidores) que inspiraron este guion/paquete"],
    "explicacion": "explicación en un párrafo corto sobre cómo se unificó e integró la información del usuario con los datos de investigación de YouTube"
  }
}

Reglas estrictas:
- NO incluyas el campo "guion" en la respuesta: el usuario lo edita por separado.
- Las "vozEnOff" del storyboard deben ser frases TEXTUALES del guion editado o reformulaciones mínimas para sincronizarse con la escena. No inventes contenido que no esté en el guion.
- "storyboard" debe traer exactamente ${scenes} escenas cubriendo toda la duración (inicioSeg/finSeg consistentes con ${dur}s).
- "thumbnails" debe traer 3 opciones distintas en 16:9.
- "timestamps" debe coincidir con la estructura real del guion editado (no dejes los del guion anterior).
- Prompts de imagen/video EN INGLÉS y consistentes en estilo/personajes/locación entre escenas.
- En "fuentesUtilizadas", relaciona de forma honesta qué elementos de la base de conocimientos y qué videos de la investigación influyeron.

Responde en español salvo los prompts (que van en inglés para mejor calidad).`;

  const kbBlock = opts.knowledgeBase
    ? `\n\nBase de conocimiento del usuario (úsala para terminología y datos relevantes; evita inventar cuando la KB ya lo define):\n${opts.knowledgeBase}\n`
    : '';

  const settings = useApp.getState().settings;
  const provider = settings.proveedorIA;
  const system = 'Eres un experto en producción de contenido viral de YouTube en español. Resincronizas todos los activos al guion editado por el usuario sin alterar el guion.';
  const hint = '{titulos,descripcionSEO,keywords,timestamps,thumbnails,storyboard,promptVideo,promptMusica,promptMusicaGemini,estrategiaPublicacion,fuentesUtilizadas}';
  let data;
  if (provider === 'claude') {
    data = await api.claudeJSON(prompt + kbBlock, system, hint, settings.modeloClaude);
  } else if (provider === 'mistral') {
    data = await api.mistralJSON(prompt + kbBlock, system, hint, settings.modeloMistral);
  } else {
    data = await api.geminiJSON(prompt + kbBlock, system, hint, settings.modeloGemini);
  }

  const thumbnails = Array.isArray(data.thumbnails) && data.thumbnails.length
    ? data.thumbnails.slice(0, 3).map((t: any) => ({
        concepto: t.concepto || '',
        textoMiniatura: t.textoMiniatura || '',
        prompt: t.prompt || '',
        ratio: '16:9' as const,
      }))
    : (opts.prevAssets.thumbnails || []);

  const storyboard = Array.isArray(data.storyboard) && data.storyboard.length
    ? data.storyboard.map((s: any, i: number) => ({
        escena: Number(s.escena || i + 1),
        inicioSeg: Number(s.inicioSeg || 0),
        finSeg: Number(s.finSeg || 0),
        vozEnOff: s.vozEnOff || '',
        textoEnPantalla: s.textoEnPantalla || '',
        promptImagen: s.promptImagen || '',
        promptVideo: s.promptVideo || '',
        ratio: (formato === 'short' ? '9:16' : '16:9') as ('9:16' | '16:9'),
      }))
    : (opts.prevAssets.storyboard || []);

  return {
    tema: opts.prevAssets.tema || opts.idea.titulo,
    nicho: opts.prevAssets.nicho || opts.nicho,
    titulos: Array.isArray(data.titulos) && data.titulos.length ? data.titulos : opts.prevAssets.titulos || [],
    guion: opts.guion, // SIEMPRE el guion editado, nunca lo que devuelva el modelo
    descripcionSEO: data.descripcionSEO || opts.prevAssets.descripcionSEO || '',
    keywords: Array.isArray(data.keywords) && data.keywords.length ? data.keywords : opts.prevAssets.keywords || [],
    timestamps: Array.isArray(data.timestamps) && data.timestamps.length ? data.timestamps : opts.prevAssets.timestamps || [],
    promptThumbnail: (thumbnails[0]?.prompt || data.promptThumbnail || opts.prevAssets.promptThumbnail || ''),
    thumbnails,
    storyboard,
    promptVideo: data.promptVideo || opts.prevAssets.promptVideo || '',
    promptMusica: data.promptMusica || opts.prevAssets.promptMusica || '',
    promptMusicaGemini: data.promptMusicaGemini || opts.prevAssets.promptMusicaGemini || '',
    estrategiaPublicacion: data.estrategiaPublicacion
      ? normalizeEstrategia(data.estrategiaPublicacion)
      : opts.prevAssets.estrategiaPublicacion || normalizeEstrategia(null),
    fuentesUtilizadas: data.fuentesUtilizadas
      ? normalizeFuentes(data.fuentesUtilizadas)
      : opts.prevAssets.fuentesUtilizadas || normalizeFuentes(null),
  };
}

export async function generarMonetizacion(opts: {
  nicho: Niche | null;
  nichoNombre: string;
  idea?: VideoIdea | null;
  geminiDisponible: boolean;
}): Promise<MonetizationReport> {
  if (!opts.geminiDisponible) {
    return { ...DEMO_MONETIZACION, nicho: opts.nichoNombre, ideaId: opts.idea?.id };
  }

  const cpmSugerido = opts.nicho?.cpm || [2, 10];
  const contextoIdea = opts.idea
    ? `\nEl video específico a monetizar es: "${opts.idea.titulo}". Hook: "${opts.idea.hook}". Ángulo: "${opts.idea.angulo}". Ajusta las vías de monetización, la proyección de ingresos y sus descripciones a este video concreto, no solo al nicho en general.\n`
    : '';
  const prompt = `Genera un plan de monetización para un canal de YouTube del nicho "${opts.nichoNombre}".
${contextoIdea}

Devuelve un JSON con:
{
  "cpm": [minimo, maximo],   // USD
  "rpm": [minimo, maximo],   // USD (aprox 50% del CPM)
  "vias": [
    {"nombre": "AdSense", "descripcion": "...", "potencial": "bajo|medio|alto"},
    {"nombre": "Afiliados", "descripcion": "...", "potencial": "bajo|medio|alto"},
    {"nombre": "Productos digitales", "descripcion": "...", "potencial": "bajo|medio|alto"},
    {"nombre": "Patrocinios", "descripcion": "...", "potencial": "bajo|medio|alto"},
    {"nombre": "Membresía", "descripcion": "...", "potencial": "bajo|medio|alto"}
  ],
  "proyeccion": {
    "vistasMes": numero_realista_para_canal_nuevo_3_a_6_meses,
    "ingresosAds": [min, max],
    "ingresosAfiliados": [min, max],
    "ingresosTotales": [min, max]
  },
  "requisitos": [
    {"texto": "1.000 suscriptores", "cumplido": false},
    {"texto": "4.000 horas de reproducción en últimos 12 meses", "cumplido": false},
    {"texto": "Cuenta sin strikes", "cumplido": true},
    {"texto": "Verificación de identidad", "cumplido": true}
  ]
}

Sugerencia base: CPM referencial del nicho es [${cpmSugerido[0]}, ${cpmSugerido[1]}] USD.`;

  const settings = useApp.getState().settings;
  const provider = settings.proveedorIA;
  const system = 'Eres un estratega de monetización para creadores de YouTube.';
  const hint = '{cpm,rpm,vias,proyeccion,requisitos}';
  let data;
  if (provider === 'claude') {
    data = await api.claudeJSON(prompt, system, hint, settings.modeloClaude);
  } else if (provider === 'mistral') {
    data = await api.mistralJSON(prompt, system, hint, settings.modeloMistral);
  } else {
    data = await api.geminiJSON(prompt, system, hint, settings.modeloGemini);
  }

  return {
    nicho: opts.nichoNombre,
    ideaId: opts.idea?.id,
    rpm: data.rpm || [1, 3],
    cpm: data.cpm || cpmSugerido,
    vias: data.vias || [],
    proyeccion: data.proyeccion || { vistasMes: 0, ingresosAds: [0, 0], ingresosAfiliados: [0, 0], ingresosTotales: [0, 0] },
    requisitos: data.requisitos || [],
  };
}
