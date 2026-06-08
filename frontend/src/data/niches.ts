// Lista curada de nichos virales + rentable para 2025-2026.
// Los rangos de CPM son referenciales (USD) y muy variables por país.
// Marca cpmLatam=true si el nicho monetiza razonablemente en LATAM.
import type { Niche } from '../types';

export const NICHOS: Niche[] = [
  {
    id: 'finanzas',
    nombre: 'Finanzas e Inversión',
    descripcion: 'Ahorro, presupuesto, crypto, inversión para principiantes.',
    icono: 'TrendingUp',
    cpm: [8, 28],
    saturacion: 'alta',
    potencial: 'alto',
    cpmLatam: false,
  },
  {
    id: 'salud-bienestar',
    nombre: 'Salud y Bienestar',
    descripcion: 'Hábitos, rutinas, longevidad, salud mental, biohacking.',
    icono: 'HeartPulse',
    cpm: [4, 16],
    saturacion: 'media',
    potencial: 'alto',
    cpmLatam: true,
  },
  {
    id: 'tecnologia-ia',
    nombre: 'Tecnología e IA',
    descripcion: 'Tutoriales, herramientas IA, gadgets, programación, apps.',
    icono: 'Cpu',
    cpm: [6, 22],
    saturacion: 'media',
    potencial: 'alto',
    cpmLatam: false,
  },
  {
    id: 'gaming',
    nombre: 'Gaming',
    descripcion: 'Gameplays, análisis, noticias, rankings, retos.',
    icono: 'Gamepad2',
    cpm: [2, 8],
    saturacion: 'alta',
    potencial: 'medio',
    cpmLatam: true,
  },
  {
    id: 'curiosidades-datos',
    nombre: 'Curiosidades y Datos',
    descripcion: 'Videos "faceless" de datos sorprendentes, ranking, top.',
    icono: 'Sparkles',
    cpm: [3, 10],
    saturacion: 'media',
    potencial: 'alto',
    cpmLatam: true,
  },
  {
    id: 'true-crime',
    nombre: 'True Crime',
    descripcion: 'Casos resueltos y sin resolver, análisis forense.',
    icono: 'Search',
    cpm: [3, 12],
    saturacion: 'media',
    potencial: 'alto',
    cpmLatam: true,
  },
  {
    id: 'motivacion',
    nombre: 'Motivación y Desarrollo Personal',
    descripcion: 'Disciplina, mindset, productividad, libros, hábitos.',
    icono: 'Flame',
    cpm: [3, 11],
    saturacion: 'alta',
    potencial: 'medio',
    cpmLatam: true,
  },
  {
    id: 'cocina-recetas',
    nombre: 'Cocina y Recetas',
    descripcion: 'Recetas rápidas, fáciles, meal prep, repostería.',
    icono: 'ChefHat',
    cpm: [3, 14],
    saturacion: 'alta',
    potencial: 'medio',
    cpmLatam: true,
  },
  {
    id: 'mascotas',
    nombre: 'Mascotas',
    descripcion: 'Cuidado, entrenamiento, videos tiernos, rescate.',
    icono: 'PawPrint',
    cpm: [2, 9],
    saturacion: 'media',
    potencial: 'alto',
    cpmLatam: true,
  },
  {
    id: 'viajes',
    nombre: 'Viajes',
    descripcion: 'Destinos, itinerarios, low cost, mochileros,美食.',
    icono: 'Plane',
    cpm: [4, 18],
    saturacion: 'media',
    potencial: 'alto',
    cpmLatam: true,
  },
  {
    id: 'reseñas',
    nombre: 'Reseñas de Productos',
    descripcion: 'Unboxings, comparativas, top X, afiliados Amazon.',
    icono: 'Star',
    cpm: [5, 20],
    saturacion: 'alta',
    potencial: 'alto',
    cpmLatam: true,
  },
  {
    id: 'historia',
    nombre: 'Historia',
    descripcion: 'Civilizaciones, eventos, biografías, "qué pasaría si".',
    icono: 'BookOpen',
    cpm: [3, 11],
    saturacion: 'media',
    potencial: 'alto',
    cpmLatam: true,
  },
  {
    id: 'terror-misterio',
    nombre: 'Terror y Misterio',
    descripcion: 'Historias de terror, creepypasta, casos inexplicables.',
    icono: 'Ghost',
    cpm: [3, 10],
    saturacion: 'media',
    potencial: 'alto',
    cpmLatam: true,
  },
  {
    id: 'asmr-relajacion',
    nombre: 'ASMR y Relajación',
    descripcion: 'Sonidos, masajes, meditaciones, videos relajantes.',
    icono: 'Waves',
    cpm: [1, 5],
    saturacion: 'baja',
    potencial: 'medio',
    cpmLatam: false,
  },
  {
    id: 'educacion-infantil',
    nombre: 'Educación Infantil',
    descripcion: 'Canciones, cuentos, ABCs, STEM para niños.',
    icono: 'Baby',
    cpm: [2, 9],
    saturacion: 'media',
    potencial: 'alto',
    cpmLatam: true,
  },
];

// Banco de hooks reutilizables por nicho (puedes ampliarlo).
export const HOOKS_POR_NICHO: Record<string, string[]> = {
  finanzas: [
    'El 90% de la gente no sabe esto sobre su dinero…',
    'Si ganas menos de esto, estás perdiendo dinero cada mes.',
    'Hace 2 años invertí $100. Hoy te muestro cuánto tengo.',
  ],
  tecnologia: [
    'Esta herramienta de IA reemplazará a tu asistente…',
    'Apple no quiere que veas este truco en tu iPhone.',
    'En 60 segundos te enseño algo que aprendí en 6 meses.',
  ],
  curiosidades: [
    'El dato #3 me dejó sin palabras.',
    'Nadie te cuenta esto en la escuela…',
    'Este país hace algo que parece ilegal, pero no lo es.',
  ],
};

// Plantillas de descripción editables.
export const PLANTILLAS_DESCRIPCION = [
  {
    id: 'clasica',
    nombre: 'Clásica con CTA',
    texto: `🔥 En este video te explico {TEMA}.

📌 Temas del video:
{TIMESTAMPS}

🔔 Suscríbete y activa la campana para no perderte el próximo video.

💬 Déjame en los comentarios qué opinas.

📱 Sígueme en:
- Instagram: {IG}
- TikTok: {TIKTOK}

🔗 Enlaces útiles:
{ENLACES_AFILIADOS}

#shorts #{NICHO}`,
  },
  {
    id: 'afiliados',
    nombre: 'Orientada a afiliados',
    texto: `En este video te muestro {TEMA} y por qué creo que vale la pena.

🛒 Productos mencionados (enlaces de afiliado):
{ENLACES_AFILIADOS}

⚠️ Como afiliado, gano una pequeña comisión sin costo extra para ti.

📌 Índice:
{TIMESTAMPS}

🔔 Suscríbete para más recomendaciones honestas.

#{NICHO} #recomendaciones`,
  },
];
