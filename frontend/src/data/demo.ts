// Datos de ejemplo para "modo demo" (cuando no hay keys configuradas).
// Sirve para que el usuario vea el flujo completo antes de conectar nada.
import type { InvestigationReport, VideoIdea, GeneratedAssets, MonetizationReport, VideoItem } from '../types';

export const DEMO_INVESTIGACION: InvestigationReport = {
  nicho: 'Curiosidades y Datos',
  fecha: new Date().toISOString(),
  resumen: 'Nicho faceless con demanda constante. Buena oportunidad para canales nuevos si se elige un ángulo específico.',
  veredicto: 'verde',
  explicacionVeredicto: 'Hay volumen alto de búsquedas, baja exigencia de aparecer en cámara, y múltiples ángulos poco explotados (datos económicos, récords curiosos, geografía sorprendente).',
  topVideos: [
    {
      videoId: 'demo1', title: '10 datos sobre el océano que parecen inventados',
      channelTitle: 'CuriosaMente', publishedAt: '2024-08-12', views: 4_200_000,
      thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      isOutlier: true, vph: 4850,
    },
    {
      videoId: 'demo2', title: 'Por qué los aviones no sobrevuelan el Tíbet',
      channelTitle: 'QuantumFracture', publishedAt: '2024-09-03', views: 2_800_000,
      thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      isOutlier: true, vph: 3200,
    },
    {
      videoId: 'demo3', title: 'El país que eliminó el dinero en efectivo',
      channelTitle: 'VisualEconomik', publishedAt: '2024-07-21', views: 1_650_000,
      thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      isOutlier: false, vph: 1850,
    },
  ] as VideoItem[],
  outliers: [
    { videoId: 'demo1', title: '10 datos sobre el océano que parecen inventados', channelTitle: 'CuriosaMente', views: 4_200_000, vph: 4850, isOutlier: true } as VideoItem,
    { videoId: 'demo2', title: 'Por qué los aviones no sobrevuelan el Tíbet', channelTitle: 'QuantumFracture', views: 2_800_000, vph: 3200, isOutlier: true } as VideoItem,
  ],
  subNichos: ['Datos económicos de países', 'Récords Guinness explicados', 'Geografía sorprendente', 'Historia de objetos cotidianos'],
  angulos: ['"Lo que tu profesor no te contó"', '"Cosas que solo pasan en {PAÍS}"', '"El lado oscuro de {OBJETO}"'],
  competidores: [
    { nombre: 'CuriosaMente', porQue: 'Excelente guion y ritmo. Pueden diferenciarse con datos más frescos.' },
    { nombre: 'QuantumFracture', porQue: 'Producción impecable pero ya muy visto. Nichos adyacentes abiertos.' },
    { nombre: 'VisualEconomik', porQue: 'Fuerte en datos económicos, débil en storytelling emocional.' },
  ],
  metricas: { vistasPromedio: 2_800_000, vphPromedio: 3300, frecuenciaPublicacion: '1-2 videos/semana', duracionPromedio: '10-14 min' },
};

export const DEMO_IDEAS: VideoIdea[] = [
  { id: 'i1', titulo: '7 cosas que no pueden existir según la física (pero existen)', hook: 'La #4 me dejó despierto 3 días…', angulo: 'Mezcla de física y datos contraintuitivos', porQueViral: 'Formato lista + hook de curiosidad + temática que invita a comentar' },
  { id: 'i2', titulo: 'El país donde todos los presos vuelven a la cárcel (a propósito)', hook: 'En este país la cárcel es más cómoda que tu casa…', angulo: 'Dato sorprendente + storytelling', porQueViral: 'Rompe esquema, alto potencial de share' },
  { id: 'i3', titulo: 'Por qué tu café sabe distinto en cada país (no es el grano)', hook: 'Lo que pasa con tu café antes de llegar a tu taza es ilegal en algunos países.', angulo: 'Cotidiano + dato oculto', porQueViral: 'Tema masivo + revelación' },
];

export const DEMO_ASSETS: GeneratedAssets = {
  tema: '7 cosas que no pueden existir según la física',
  nicho: 'Curiosidades y Datos',
  titulos: [
    { texto: '7 cosas que NO deberían existir (pero existen) 🤯', razon: 'Lista + negación + emoji = alto CTR' },
    { texto: 'La física dice que esto es imposible…', razon: 'Hook directo + conflicto' },
    { texto: 'Lo que vas a ver en el punto #4 cambió cómo veo el mundo', razon: 'Anticipación + transformación personal' },
    { texto: 'Imposible hasta que lo ves: 7 maravillas contraintuitivas', razon: 'Corto, rítmico, fácil de leer' },
    { texto: 'Tu profesor de física se equivocó con estos 7 casos', razon: 'Provocación + autoridad' },
  ],
  guion: `HOOK (0-5s):
"La #4 de esta lista va contra todo lo que te enseñaron en el colegio… y es real."

INTRO (5-30s):
"Hoy te traigo 7 cosas que la física dice que no deberían existir, pero aquí estamos.
Si te gusta este tipo de contenido, suscríbete que cada semana subo videos así."

PUNTO 1 (30s-1:30):
"...Primer dato: ..."

PUNTO 4 (4:00-5:30) — El más viral:
"Este es el que me dejó pensando 3 días. Resulta que..."

CTA FINAL (al final):
"Si quieres la parte 2, déjame en comentarios 'QUIERO PARTE 2'.
Suscríbete y nos vemos el próximo video."`,
  descripcionSEO: `En este video te muestro 7 cosas que no deberían existir según la física, pero existen. Datos sorprendentes, ejemplos visuales y explicación sencilla.

📌 Índice:
0:00 Hook
0:30 Intro
1:00 Punto 1 - ...
4:00 Punto 4 - El más loco
7:00 Cierre y CTA

🔔 Suscríbete y activa la campana.
💬 ¿Cuál te sorprendió más? Déjalo en comentarios.

#curiosidades #datos #física`,
  keywords: ['cosas que no deberían existir', 'datos curiosos', 'física divertida', 'paradojas', 'curiosidades del mundo', 'datos sorprendentes'],
  timestamps: ['0:00 Hook', '0:30 Introducción', '1:00 Dato #1', '2:00 Dato #2', '3:00 Dato #3', '4:00 Dato #4 (el más loco)', '5:30 Dato #5', '6:30 Dato #6', '7:00 Dato #7', '8:00 Cierre'],
  promptThumbnail: `Hyper-realistic photograph of a floating impossible object defying gravity, glowing golden light, dramatic dark background, ultra high contrast, vivid colors, cinematic composition, 4K --ar 16:9 --v 6`,
  thumbnails: [
    {
      concepto: 'Objeto imposible flotando',
      textoMiniatura: 'IMP0SIBLE',
      prompt: `Hyper-realistic photograph of an impossible object floating and defying gravity, glowing golden rim light, dark cinematic background, ultra high contrast, sharp focus, dramatic composition, 4K --ar 16:9`,
      ratio: '16:9',
    },
    {
      concepto: 'Profesor sorprendido',
      textoMiniatura: '¿CÓMO?',
      prompt: `Cinematic portrait of a shocked physics teacher holding a chalkboard with impossible equations, intense expression, dramatic lighting, shallow depth of field, high contrast, clean background, 4K --ar 16:9`,
      ratio: '16:9',
    },
    {
      concepto: 'Lista de 7 con iconos',
      textoMiniatura: '7 COSAS',
      prompt: `High-impact YouTube thumbnail design, bold large number 7, floating icons of science phenomena, vibrant colors, crisp typography area, clean composition, studio lighting, ultra sharp, 4K --ar 16:9`,
      ratio: '16:9',
    },
  ],
  storyboard: [
    { escena: 1, inicioSeg: 0, finSeg: 7, vozEnOff: 'La #4 de esta lista te va a romper la cabeza… y es real.', textoEnPantalla: 'ES REAL', promptImagen: 'Close-up of an impossible floating object, dramatic rim light, dark background, ultra sharp, cinematic, 4K --ar 9:16', promptVideo: 'Cinematic vertical shot: slow push-in on an impossible floating object, subtle particles, volumetric light, photorealistic, 3 seconds, 4K --ar 9:16', ratio: '9:16' as const },
    { escena: 2, inicioSeg: 7, finSeg: 15, vozEnOff: 'Empezamos con algo que la física dice que no debería existir.', textoEnPantalla: 'NO DEBERÍA EXISTIR', promptImagen: 'A physics chalkboard with impossible equations, moody lighting, shallow depth of field, photorealistic, 4K --ar 9:16', promptVideo: 'Vertical shot: quick pan across a chalkboard full of impossible equations, cinematic lighting, 3 seconds, 4K --ar 9:16', ratio: '9:16' as const },
    { escena: 3, inicioSeg: 15, finSeg: 25, vozEnOff: 'Dato #1: cuando ves esto, tu cerebro completa lo que falta.', textoEnPantalla: 'DATO #1', promptImagen: 'Optical illusion style scene in a clean studio, high contrast, photorealistic, 4K --ar 9:16', promptVideo: 'Vertical shot: subtle zoom into an optical illusion object, high contrast lighting, 3 seconds, 4K --ar 9:16', ratio: '9:16' as const },
    { escena: 4, inicioSeg: 25, finSeg: 35, vozEnOff: 'Dato #2: hay fenómenos que se sienten como magia, pero son pura ciencia.', textoEnPantalla: 'PURA CIENCIA', promptImagen: 'Macro shot of a magnet and iron filings forming patterns, dramatic lighting, photorealistic, 4K --ar 9:16', promptVideo: 'Vertical macro shot: iron filings move into patterns around a magnet, cinematic, 3 seconds, 4K --ar 9:16', ratio: '9:16' as const },
    { escena: 5, inicioSeg: 35, finSeg: 48, vozEnOff: 'Dato #3: lo más viral siempre es lo contraintuitivo.', textoEnPantalla: 'CONTRAINTUITIVO', promptImagen: 'Surreal yet photoreal scene of a ball floating above a hand, dramatic light, 4K --ar 9:16', promptVideo: 'Vertical shot: slow motion ball floating above a hand, subtle camera shake, 3 seconds, 4K --ar 9:16', ratio: '9:16' as const },
    { escena: 6, inicioSeg: 48, finSeg: 60, vozEnOff: 'Y ahora sí… la #4. Si esto no te sorprende, no sé qué lo hará.', textoEnPantalla: '#4', promptImagen: 'Impossible object glowing, intense cinematic lighting, dust particles, photorealistic, 4K --ar 9:16', promptVideo: 'Vertical shot: dramatic reveal of a glowing impossible object, quick push-in, particles, 3 seconds, 4K --ar 9:16', ratio: '9:16' as const },
  ],
  promptVideo: `Cinematic slow dolly-in shot on a glowing impossible object floating in dark space. Camera slowly rotates around it. Soft volumetric light, particle dust, slight camera shake for realism. 8 seconds, 4K, photorealistic.`,
  promptMusica: `Ambient cinematic background music, mysterious and curious mood, deep sub-bass, ethereal synth pads, soft piano notes, 80 BPM, instrumental, 2:30 duration, no vocals`,
  promptMusicaGemini: `Lo-fi ambient mysterious track, deep bass, ethereal synths, soft piano, 80 BPM, instrumental, cinematic mood, 2 minutes`,
  estrategiaPublicacion: {
    mejorDia: 'Sábado',
    mejorHora: '11:00 AM (hora local del público objetivo)',
    frecuencia: '2 videos por semana',
    formato: 'Video largo (8-12 min) + 1 Short derivado',
    razon: 'El nicho de curiosidades tiene su pico de consumo en fin de semana, cuando la gente busca entretenimiento "ligero pero interesante".',
    tituloPublicacion: '4 Fenómenos Científicos que Parecen Magia (el #3 te va a sorprender)',
    descripcionPublicacion: `¿Sabías que tu cerebro completa imágenes que no existen? En este video te muestro 4 fenómenos científicos tan extraños que parecen trucos de magia — pero tienen una explicación real.

Si te gustan las curiosidades, la ciencia y los datos que te dejan pensando, este canal es para ti. Suscríbete y activa la campana para no perderte el próximo video 🔔

⏱️ Capítulos en la descripción
💬 Cuéntame en los comentarios cuál fenómeno te sorprendió más

#Curiosidades #Ciencia #DatosCuriosos`,
    tags: ['curiosidades', 'datos curiosos', 'ciencia para todos', 'fenómenos científicos', 'cosas que no sabías', 'ciencia curiosa', 'experimentos mentales', 'ilusiones ópticas', 'datos increíbles', 'sabías que', 'mente humana', 'ciencia explicada'],
    hashtags: ['Curiosidades', 'Ciencia', 'DatosCuriosos'],
    categoria: 'Educación (también funciona bien en Entretenimiento si buscas más alcance casual)',
    audienciaInfantil: 'No, "no está hecho para niños" — el tono y referencias son para audiencia general/adulta, y declarar "para niños" desactiva comentarios y limita el algoritmo.',
    idioma: 'Español (España/Latinoamérica neutro — coincide con el público objetivo del nicho)',
    licencia: 'Licencia estándar de YouTube (protege tu contenido; usa Creative Commons solo si buscas que reutilicen tus clips)',
    visibilidad: 'Programado: publícalo el sábado a las 11:00 AM hora local de tu audiencia, no apenas termines de subirlo — el algoritmo premia la consistencia de horario.',
    comentarioFijado: '¿Cuál de estos 4 fenómenos te dejó con la boca abierta? 👇 Te leo en los comentarios y respondo a los mejores.',
    pantallaFinal: 'En los últimos 15-20s, usa la pantalla final para promocionar el video más reciente del mismo nicho + el botón de suscripción — así conviertes la curiosidad que generaste en una próxima visita.',
    tarjetas: 'Coloca 1-2 tarjetas en los minutos donde mencionas un dato relacionado con otro video tuyo (p. ej. al hablar del "Dato #2"), enlazando a ese video para aumentar el tiempo total de visualización del canal.',
    playlist: '"Curiosidades que parecen magia" — agrupa aquí todos los videos de este formato; las playlists hacen que YouTube encadene tus propios videos automáticamente y suben el watch time.',
    publicacionComunidad: '🧠 Nuevo video el sábado: 4 fenómenos científicos que parecen magia (literal, el #3 me dejó loco). ¿Cuál creen que es más raro: ilusiones ópticas, magnetismo, levitación o el #4 sorpresa? Voten 👇',
    shorts: {
      hashtags: '#Shorts #Curiosidades #DatosCuriosos',
      musica: 'Usa una pista de la biblioteca de Shorts marcada como "en tendencia" con ritmo ascendente — ayuda a que el Short entre al feed de descubrimiento.',
      tips: 'Engancha en el primer 1.5s con la afirmación más impactante (sin intro ni logo), deja un micro "loop" entre el último y el primer frame para que se repita sin corte, y añade texto en pantalla sincronizado con la voz para verlo sin sonido.',
    },
    checklistSubida: [
      'Abre YouTube Studio → "Crear" → "Subir video" y selecciona el archivo final exportado.',
      'Pega el título y la descripción listos para copiar de esta sección (revisa que el gancho quede en las primeras 2 líneas visibles).',
      'Sube la miniatura elegida en el paso "Thumbnail" — verifica que se vea nítida también en tamaño móvil.',
      'En "Elementos": agrega los timestamps al inicio de la descripción, coloca las tarjetas y la pantalla final según lo indicado arriba.',
      'En "Audiencia": marca "No, no está hecho para niños" y selecciona el idioma correcto.',
      'En "Más opciones": pega las etiquetas (tags), elige la categoría sugerida y la licencia recomendada.',
      'Programa la publicación para el día y hora óptimos indicados arriba (no publiques de inmediato).',
      'En cuanto se publique, fija el comentario sugerido y publica el anuncio en la pestaña Comunidad.',
      'Agrega el video a la playlist sugerida y revisa el CTR/retención a las 24-48h para ajustar la próxima miniatura/título.',
    ],
  },
};

export const DEMO_MONETIZACION: MonetizationReport = {
  nicho: 'Curiosidades y Datos',
  rpm: [1.5, 5],
  cpm: [3, 10],
  vias: [
    { nombre: 'AdSense', descripcion: 'Ingresos por mil vistas. Volumen alto + nicho evergreen.', potencial: 'medio' },
    { nombre: 'Marketing de afiliados (cursos, libros)', descripcion: 'Promoción de productos de educación / herramientas.', potencial: 'medio' },
    { nombre: 'Productos digitales', descripcion: 'Plantillas, ebooks, packs de ideas. Margen alto.', potencial: 'alto' },
    { nombre: 'Patrocinios', descripcion: 'Marcas de apps de productividad, libros, herramientas IA.', potencial: 'medio' },
    { nombre: 'Membresía / Super Thanks', descripcion: 'Audiencia fiel dispuesta a apoyar.', potencial: 'bajo' },
  ],
  proyeccion: {
    vistasMes: 300_000,
    ingresosAds: [450, 1500],
    ingresosAfiliados: [200, 1200],
    ingresosTotales: [650, 2700],
  },
  requisitos: [
    { texto: '1.000 suscriptores', cumplido: false },
    { texto: '4.000 horas de reproducción (últimos 12 meses)', cumplido: false },
    { texto: 'Cuenta en regla (sin strikes)', cumplido: true },
    { texto: 'Verificación de identidad', cumplido: true },
  ],
};
