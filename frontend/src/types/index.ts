// Tipos compartidos en toda la app.

export type Verdict = 'verde' | 'amarillo' | 'rojo';

export interface Niche {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string; // nombre del icono de lucide
  cpm: [number, number]; // rango USD
  saturacion: 'baja' | 'media' | 'alta';
  potencial: 'bajo' | 'medio' | 'alto';
  cpmLatam?: boolean; // true si monetiza bien en LATAM
}

export interface VideoItem {
  videoId: string;
  title: string;
  channelId?: string;
  channelTitle?: string;
  publishedAt?: string;
  thumbnail?: string;
  views?: number;
  likes?: number;
  comments?: number;
  tags?: string[];
  duration?: string;
  // Calculados
  vph?: number; // vistas por hora
  isOutlier?: boolean;
}

export interface ChannelItem {
  channelId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  customUrl?: string;
  country?: string;
  publishedAt?: string;
  views?: number;
  subscribers?: number;
  videos?: number;
}

export interface InvestigationReport {
  nicho: string;
  fecha: string;
  resumen: string;
  veredicto: Verdict;
  explicacionVeredicto: string;
  topVideos: VideoItem[];
  outliers: VideoItem[];
  subNichos: string[];
  angulos: string[];
  competidores: { nombre: string; url?: string; porQue: string }[];
  metricas: {
    vistasPromedio: number;
    vphPromedio: number;
    frecuenciaPublicacion: string;
    duracionPromedio: string;
  };
}

export interface VideoIdea {
  id: string;
  titulo: string;
  hook: string;
  angulo: string;
  porQueViral: string;
  promesaValor?: string;
  estructuraSugerida?: string[];
  justificacionMetricas?: string;
  origen?: 'kb' | 'ai' | 'hibrida';
  fuentes?: string[];
  desgloseKB?: string;
  desgloseInvestigacion?: string;
}

export interface GeneratedAssets {
  tema: string;
  nicho: string;
  titulos: { texto: string; razon: string }[];
  guion: string;
  descripcionSEO: string;
  keywords: string[];
  timestamps: string[];
  promptThumbnail: string;
  thumbnails?: { concepto: string; textoMiniatura: string; prompt: string; ratio: '16:9' }[];
  storyboard?: {
    escena: number;
    inicioSeg: number;
    finSeg: number;
    vozEnOff: string;
    textoEnPantalla?: string;
    promptImagen: string;
    promptVideo: string;
    ratio: '9:16' | '16:9';
  }[];
  promptVideo: string;
  promptMusica: string;
  promptMusicaGemini: string;
  estrategiaPublicacion: {
    // Calendario y cadencia
    mejorDia: string;
    mejorHora: string;
    frecuencia: string;
    formato: string;
    razon: string;
    // Listo para copiar y pegar en el formulario de subida de YouTube
    tituloPublicacion: string;
    descripcionPublicacion: string;
    tags: string[];
    hashtags: string[];
    // Configuración del formulario de subida (YouTube Studio)
    categoria: string;
    audienciaInfantil: string;
    idioma: string;
    licencia: string;
    visibilidad: string;
    // Para maximizar alcance, retención y engagement temprano
    comentarioFijado: string;
    pantallaFinal: string;
    tarjetas: string;
    playlist: string;
    publicacionComunidad: string;
    // Guía específica para crear/optimizar el Short en YouTube
    shorts: {
      hashtags: string;
      musica: string;
      tips: string;
    };
    // Pasos en orden para subir y publicar correctamente
    checklistSubida: string[];
  };
  fuentesUtilizadas?: {
    kb: string[];
    investigacion: string[];
    explicacion: string;
  };
}

export type VideoFormato = 'short' | 'largo';

export interface VideoPlan {
  formato: VideoFormato;
  duracionSegundos: number;
  preset: 'short_rapido' | 'short_largo' | 'largo_custom';
}

export interface MonetizationReport {
  nicho: string;
  rpm: [number, number];
  cpm: [number, number];
  vias: { nombre: string; descripcion: string; potencial: 'bajo' | 'medio' | 'alto' }[];
  proyeccion: {
    vistasMes: number;
    ingresosAds: [number, number];
    ingresosAfiliados: [number, number];
    ingresosTotales: [number, number];
  };
  requisitos: { texto: string; cumplido: boolean }[];
}

export interface Project {
  id: string;
  nombre: string;
  nicho: string;
  nichoPersonalizado?: string;
  fechaCreacion: string;
  fechaModificacion: string;
  knowledgeBase?: KnowledgeDocMeta[];
  investigacion?: InvestigationReport;
  ideasGeneradas?: VideoIdea[];
  ideaElegida?: VideoIdea;
  videoPlan?: VideoPlan;
  assets?: GeneratedAssets;
  monetizacion?: MonetizationReport;
  planPublicacion?: { fecha: string; titulo: string; estado: 'idea' | 'guion' | 'grabado' | 'publicado' }[];
}

export interface KnowledgeDocMeta {
  id: string;
  name: string;
  mime: string;
  size: number;
  createdAt: string;
}

export interface AppSettings {
  youtubeKey: string;
  geminiKey: string;
  modeloGemini: 'gemini-2.5-flash' | 'gemini-2.5-flash-lite';
  claudeKey: string;
  modeloClaude: string;
  mistralKey: string;
  modeloMistral: string;
  proveedorIA: 'gemini' | 'claude' | 'mistral';
  onVisitou: boolean;
}

export interface PlanItem {
  id: string;
  titulo: string;
  fecha: string;
  hora?: string;
  estado: 'idea' | 'guion' | 'grabado' | 'publicado';
  nicho?: string;
}


