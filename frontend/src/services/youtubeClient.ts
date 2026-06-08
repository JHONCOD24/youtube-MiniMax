// Cliente de investigación de nichos en YouTube + análisis con Gemini.
// Cuando no hay keys, devuelve los datos de demo automáticamente.
import { api, ApiError } from './api';
import type { InvestigationReport, VideoItem, ChannelItem, Niche } from '../types';
import { DEMO_INVESTIGACION } from '../data/demo';
import { useApp } from '../store/useApp';

interface InvestigationOptions {
  nicho: string;
  geminiDisponible: boolean;
  onProgress?: (msg: string) => void;
  knowledgeBase?: string;
}

function parseDuration(iso: string): number {
  // PT1H2M3S -> segundos
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || '');
  if (!m) return 0;
  return (Number(m[1] || 0) * 3600) + (Number(m[2] || 0) * 60) + Number(m[3] || 0);
}

function calcVPH(views: number, publishedAt: string): number {
  if (!publishedAt) return 0;
  const hours = Math.max(1, (Date.now() - new Date(publishedAt).getTime()) / 36e5);
  return Math.round(views / hours);
}

export async function investigarNicho(opts: InvestigationOptions): Promise<InvestigationReport> {
  const { nicho, geminiDisponible, onProgress, knowledgeBase } = opts;
  if (!geminiDisponible) {
    // Modo demo
    onProgress?.('Cargando datos de ejemplo (modo demo)…');
    await new Promise((r) => setTimeout(r, 400));
    return { ...DEMO_INVESTIGACION, nicho };
  }

  onProgress?.(`Buscando videos sobre "${nicho}" en YouTube…`);
  const search = await api.youtubeSearch(nicho, 15);
  const videoIds = search.items.map((v: any) => v.videoId).filter(Boolean);

  onProgress?.(`Obteniendo estadísticas de ${videoIds.length} videos…`);
  const stats = videoIds.length ? await api.youtubeVideos(videoIds) : { items: [] };
  const channelIds = [...new Set(stats.items.map((v: any) => v.channelId).filter(Boolean))];

  onProgress?.(`Obteniendo info de ${channelIds.length} canales…`);
  const channels: { items: ChannelItem[] } = channelIds.length
    ? await api.youtubeChannels(channelIds as string[])
    : { items: [] };

  // Enriquece videos con datos
  const videos: VideoItem[] = stats.items.map((v: any) => ({
    ...v,
    vph: calcVPH(v.views || 0, v.publishedAt),
  }));

  // Detección de outliers: vistas >> promedio del canal
  const promedioPorCanal: Record<string, number> = {};
  for (const c of channels.items) {
    promedioPorCanal[c.channelId] = c.videos ? Math.round((c.views || 0) / c.videos) : 0;
  }
  for (const v of videos) {
    const promedio = promedioPorCanal[v.channelId || ''] || 0;
    v.isOutlier = promedio > 0 && (v.views || 0) > promedio * 3;
  }
  const outliers = videos.filter((v) => v.isOutlier);

  // Métricas agregadas
  const vistasPromedio = videos.length
    ? Math.round(videos.reduce((s, v) => s + (v.views || 0), 0) / videos.length)
    : 0;
  const vphPromedio = videos.length
    ? Math.round(videos.reduce((s, v) => s + (v.vph || 0), 0) / videos.length)
    : 0;
  const duracionPromedio = videos.length
    ? `${Math.round(videos.reduce((s, v) => s + parseDuration(v.duration || ''), 0) / videos.length / 60)} min`
    : '—';

  const settings = useApp.getState().settings;
  const provider = settings.proveedorIA;
  const system = 'Eres un estratega de YouTube, claro y directo. Responde solo con JSON válido.';
  const hint = '{resumen,veredicto,explicacionVeredicto,subNichos,angulos,competidores,frecuenciaPublicacion}';
  const providerName = provider === 'claude' ? 'Claude' : provider === 'mistral' ? 'Mistral' : 'Gemini';

  onProgress?.(`Pidiendo análisis a ${providerName}…`);
  const analysisPrompt = `Eres un analista experto en marketing de YouTube. A partir de estos datos del nicho "${nicho}", devuelve un JSON con esta forma:

{
  "resumen": "1 párrafo de 3-4 frases resumiendo el estado del nicho",
  "veredicto": "verde" | "amarillo" | "rojo",
  "explicacionVeredicto": "2-3 frases explicando por qué",
  "subNichos": ["3-5 subnichos específicos poco explotados"],
  "angulos": ["3-4 ángulos/encuadres que podrían funcionar"],
  "competidores": [{"nombre": "x", "porQue": "qué hacen bien"}],
  "frecuenciaPublicacion": "1-2 videos/semana (estimada)"
}

Datos:
Top videos (título / vistas / canal / fecha / VPH):
${videos.slice(0, 12).map((v) => `- "${v.title}" | ${v.views} vistas | ${v.channelTitle} | ${v.publishedAt?.slice(0, 10)} | VPH ${v.vph}`).join('\n')}

Outliers (videos que explotaron):
${outliers.slice(0, 5).map((v) => `- "${v.title}" | ${v.views} vistas | VPH ${v.vph}`).join('\n')}

Canales top:
${channels.items.slice(0, 5).map((c) => `- ${c.title}: ${c.subscribers} subs, ${c.videos} videos`).join('\n')}

Metricas globales: ${videos.length} videos analizados, promedio ${vistasPromedio} vistas, VPH promedio ${vphPromedio}.`;

  const kbBlock = knowledgeBase ? `\n\nBase de conocimiento del usuario (úsala para afinar sub-nichos, ángulos, promesa de valor y terminología):\n${knowledgeBase}\n` : '';

  let analysis;
  if (provider === 'claude') {
    analysis = await api.claudeJSON(analysisPrompt + kbBlock, system, hint, settings.modeloClaude);
  } else if (provider === 'mistral') {
    analysis = await api.mistralJSON(analysisPrompt + kbBlock, system, hint, settings.modeloMistral);
  } else {
    analysis = await api.geminiJSON(analysisPrompt + kbBlock, system, hint, settings.modeloGemini);
  }

  return {
    nicho,
    fecha: new Date().toISOString(),
    resumen: analysis.resumen || '',
    veredicto: ['verde', 'amarillo', 'rojo'].includes(analysis.veredicto) ? analysis.veredicto : 'amarillo',
    explicacionVeredicto: analysis.explicacionVeredicto || '',
    topVideos: videos.sort((a, b) => (b.views || 0) - (a.views || 0)),
    outliers,
    subNichos: analysis.subNichos || [],
    angulos: analysis.angulos || [],
    competidores: analysis.competidores || [],
    metricas: {
      vistasPromedio,
      vphPromedio,
      frecuenciaPublicacion: analysis.frecuenciaPublicacion || '—',
      duracionPromedio,
    },
  };
}
