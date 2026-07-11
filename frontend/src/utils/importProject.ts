// Importa proyectos desde archivos .json o .md exportados por la app o escritos a mano.
// Devuelve un Project listo para cargarse en el store, o lanza un error legible.
import type { Project, InvestigationReport, VideoIdea, GeneratedAssets, MonetizationReport, Verdict } from '../types';

function uid() { return Math.random().toString(36).slice(2, 10); }

function emptyAssets(): GeneratedAssets {
  return {
    tema: '',
    nicho: '',
    titulos: [],
    guion: '',
    descripcionSEO: '',
    keywords: [],
    timestamps: [],
    promptThumbnail: '',
    promptVideo: '',
    promptMusica: '',
    promptMusicaGemini: '',
    estrategiaPublicacion: {
      mejorDia: '', mejorHora: '', frecuencia: '', formato: '', razon: '',
      tituloPublicacion: '', descripcionPublicacion: '', tags: [], hashtags: [],
      categoria: '', audienciaInfantil: '', idioma: '', licencia: '', visibilidad: '',
      comentarioFijado: '', pantallaFinal: '', tarjetas: '', playlist: '', publicacionComunidad: '',
      shorts: { hashtags: '', musica: '', tips: '' },
      checklistSubida: [],
    },
  };
}

function emptyMonetizacion(): MonetizationReport {
  return {
    nicho: '',
    rpm: [0, 0],
    cpm: [0, 0],
    vias: [],
    proyeccion: { vistasMes: 0, ingresosAds: [0, 0], ingresosAfiliados: [0, 0], ingresosTotales: [0, 0] },
    requisitos: [],
  };
}

function asVerdict(v: any): Verdict {
  const s = String(v || '').toLowerCase();
  return s === 'verde' || s === 'amarillo' || s === 'rojo' ? s : 'amarillo';
}

// Quita negritas/cursivas de Markdown residuales (`**texto**`, `*texto*`, `_texto_`).
// El export de la app escribe campos como `**Nicho:** valor`; el parser no debe
// dejar basura de formato en el dato final.
function stripMarkdownInline(s: string): string {
  return String(s || '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/^\*+\s*|\s*\*+$/g, '')
    .trim();
}

// Extrae el valor de una línea tipo `**Etiqueta:** valor` o `Etiqueta: valor`.
// El export escribe la etiqueta en negrita con el `:` dentro: `**Título:** texto`.
function fieldValue(body: string, label: RegExp): string {
  const re = new RegExp(
    String.raw`(?:\*\*|__)?${label.source}(?:\*\*|__)?\s*:\s*(?:\*\*|__)?\s*(.+)`,
    'i',
  );
  const m = body.match(re);
  return m ? stripMarkdownInline(m[1]) : '';
}

// ----------------- JSON -----------------
// Acepta: el Project completo, o un envoltorio { proyecto: ... } o { project: ... }
export function parseJsonProject(text: string): Project {
  let data: any;
  try {
    data = JSON.parse(text);
  } catch (e: any) {
    throw new Error('JSON inválido: ' + e.message);
  }
  if (!data || typeof data !== 'object') throw new Error('JSON vacío o no es un objeto.');

  // Detectar envoltorio
  if (data.proyecto && typeof data.proyecto === 'object') data = data.proyecto;
  else if (data.project && typeof data.project === 'object') data = data.project;

  if (!data.nicho && !data.nombre) {
    throw new Error('El JSON no parece un proyecto válido (falta "nombre" y "nicho").');
  }

  const now = new Date().toISOString();
  const p: Project = {
    id: data.id || uid(),
    nombre: data.nombre || 'Proyecto importado',
    nicho: data.nicho || '',
    nichoPersonalizado: data.nichoPersonalizado,
    fechaCreacion: data.fechaCreacion || now,
    fechaModificacion: now,
    knowledgeBase: Array.isArray(data.knowledgeBase) ? data.knowledgeBase : [],
    investigacion: data.investigacion || undefined,
    ideaElegida: data.ideaElegida || undefined,
    videoPlan: data.videoPlan || { formato: 'short', duracionSegundos: 60, preset: 'short_rapido' },
    assets: data.assets || undefined,
    monetizacion: data.monetizacion || undefined,
    planPublicacion: Array.isArray(data.planPublicacion) ? data.planPublicacion : [],
  };
  return p;
}

// ----------------- Markdown -----------------
// Reconstruye un Project a partir del .md que genera ExportarPage.
// Es "best-effort": si una sección no existe, ese campo queda undefined.
export function parseMarkdownProject(text: string, fallbackName?: string): Project {
  const now = new Date().toISOString();
  const lines = text.split(/\r?\n/);

  // Título (# Nombre) y metadatos
  const h1Match = lines.find((l) => /^#\s+/.test(l));
  const nombre = h1Match ? h1Match.replace(/^#\s+/, '').trim() : (fallbackName || 'Proyecto importado');

  // Quitar acentos para matching tolerante (así "Música" = "musica")
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Busca la línea de nicho aunque venga envuelta en markdown (`**Nicho:** …`)
  const nichoLine = lines.find((l) => /nicho\s*:/i.test(stripMarkdownInline(l)) || /\*?nicho\*?\s*:/i.test(l));
  const nicho = nichoLine
    ? stripMarkdownInline(
        nichoLine
          .replace(/^[\s*_]*nicho[\s*_]*:\s*/i, '')
          .replace(/\(.*?\)\s*$/, ''),
      )
    : '';

  // Dividir por secciones ## ...
  type Block = { title: string; body: string };
  const blocks: Block[] = [];
  let current: Block | null = null;
  for (const l of lines) {
    const m = l.match(/^##\s+(.+?)\s*$/);
    if (m) {
      if (current) blocks.push(current);
      current = { title: m[1], body: '' };
    } else if (current) {
      current.body += l + '\n';
    }
  }
  if (current) blocks.push(current);

  // Claves en texto plano (NO regex): se comparan normalizadas sin acentos.
  const findBlock = (key: string) =>
    blocks.find((b) => norm(b.title).includes(norm(key)));

  // --- Investigación ---
  let investigacion: InvestigationReport | undefined;
  const inv = findBlock('Investigacion');
  if (inv) {
    const veredicto = asVerdict((inv.body.match(/Veredicto:\s*(\w+)/i) || [])[1]);
    const resumen = (inv.body.match(/Veredicto:.*\n([\s\S]*?)(?=\n\*\*|$)/) || [])[1]?.trim() || '';
    const subNichos = ((inv.body.match(/Sub-nichos:\s*([^\n]+)/i) || [])[1] || '')
      .split(',').map((s) => s.trim()).filter(Boolean);
    const angulos = ((inv.body.match(/[ÁA]ngulos:\s*([^\n]+)/i) || [])[1] || '')
      .split(',').map((s) => s.trim()).filter(Boolean);
    const topVideosRaw = inv.body.split(/Top videos:?\s*/i)[1] || '';
    const topVideos = topVideosRaw
      .split('\n')
      .map((l) => l.replace(/^[-*]\s*/, '').trim())
      .filter((l) => l && !l.startsWith('##'))
      .slice(0, 5)
      .map((l, i) => {
        const m = l.match(/^(.*?)\s+[—-]\s+(.*)$/);
        return {
          videoId: `imported-${i}`,
          title: m ? m[1].trim() : l,
          channelTitle: m ? m[2].trim() : undefined,
        };
      });

    investigacion = {
      nicho: nicho,
      fecha: now,
      resumen,
      veredicto,
      explicacionVeredicto: '',
      topVideos: topVideos as any,
      outliers: [],
      subNichos,
      angulos,
      competidores: [],
      metricas: { vistasPromedio: 0, vphPromedio: 0, frecuenciaPublicacion: '', duracionPromedio: '' },
    };
  }

  // --- Idea ---
  let ideaElegida: VideoIdea | undefined;
  const idea = findBlock('Idea');
  if (idea) {
    const titulo = fieldValue(idea.body, /T[íi]tulo/i) || nombre;
    const hook = fieldValue(idea.body, /Hook/i);
    const angulo = fieldValue(idea.body, /[ÁA]ngulo/i);
    ideaElegida = {
      id: uid(),
      titulo,
      hook,
      angulo,
      porQueViral: '',
      origen: 'ai',
    };
  }

  // --- Activos (Títulos, Guion, Descripción, Timestamps, Prompts) ---
  // findBlock usa includes con texto normalizado (sin acentos), no regex.
  let assets: GeneratedAssets | undefined;
  const titBlock = findBlock('Titulos');
  const guionBlock = findBlock('Guion');
  const descBlock = findBlock('Descripcion SEO') || findBlock('Descripcion');
  const tsBlock = findBlock('Timestamps');
  const pthBlock = findBlock('Prompt Thumbnail');
  const pvidBlock = findBlock('Prompt Video');
  // El export usa secciones separadas: "Prompt Música (Suno)" y "Prompt Música (Gemini)"
  const pmusSuno = blocks.find((b) => {
    const t = norm(b.title);
    return t.includes('prompt musica') && t.includes('suno');
  }) || findBlock('Prompt Musica');
  const pmusGemini = blocks.find((b) => {
    const t = norm(b.title);
    return t.includes('prompt musica') && t.includes('gemini');
  });

  if (titBlock || guionBlock || descBlock || tsBlock || pthBlock || pvidBlock || pmusSuno || pmusGemini) {
    assets = emptyAssets();
    assets.nicho = nicho;
    assets.tema = nombre;

    if (titBlock) {
      assets.titulos = titBlock.body
        .split('\n')
        .map((l) => l.replace(/^[-*]\s*/, '').trim())
        .filter((l) => l && !l.startsWith('##'))
        .map((l) => {
          const m = l.match(/^(.+?)\s+_\(\s*(.+?)\s*\)_\s*$/);
          return m ? { texto: m[1].trim(), razon: m[2].trim() } : { texto: l, razon: '' };
        });
    }
    if (guionBlock) {
      assets.guion = guionBlock.body
        .replace(/^##\s+.+\n/, '')
        .replace(/```[\s\S]*?```/g, '')
        .trim();
    }
    if (descBlock) {
      assets.descripcionSEO = descBlock.body
        .replace(/^##\s+.+\n/, '')
        .replace(/\*\*Keywords:\*\*.*$/i, '')
        .trim();
      const kw = (descBlock.body.match(/Keywords:\s*([^\n]+)/i) || [])[1];
      if (kw) assets.keywords = kw.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (tsBlock) {
      assets.timestamps = tsBlock.body
        .split('\n')
        .map((l) => l.replace(/^[-*]\s*/, '').trim())
        .filter(Boolean);
    }
    if (pthBlock) {
      const m = pthBlock.body.match(/```([\s\S]*?)```/);
      assets.promptThumbnail = (m ? m[1] : pthBlock.body).trim();
    }
    if (pvidBlock) {
      const m = pvidBlock.body.match(/```([\s\S]*?)```/);
      assets.promptVideo = (m ? m[1] : pvidBlock.body).trim();
    }
    const extractCode = (block?: { body: string } | null) => {
      if (!block) return '';
      const m = block.body.match(/```([\s\S]*?)```/);
      return (m ? m[1] : block.body).trim();
    };
    const suno = extractCode(pmusSuno);
    const geminiMus = extractCode(pmusGemini);
    if (suno) assets.promptMusica = suno;
    if (geminiMus) assets.promptMusicaGemini = geminiMus;
    // Si solo hay uno, reutilízalo en ambos campos para no dejar vacío el otro
    if (suno && !geminiMus) assets.promptMusicaGemini = suno;
    if (geminiMus && !suno) assets.promptMusica = geminiMus;
  }

  // --- Monetización ---
  let monetizacion: MonetizationReport | undefined;
  const mon = findBlock('Monetizacion') || findBlock('Monetización');
  if (mon) {
    const cpmMatch = mon.body.match(/CPM:\s*\$?(\d+)\s*-\s*\$?(\d+)/i);
    const rpmMatch = mon.body.match(/RPM:\s*\$?(\d+)\s*-\s*\$?(\d+)/i);
    monetizacion = emptyMonetizacion();
    monetizacion.nicho = nicho;
    if (cpmMatch) monetizacion.cpm = [Number(cpmMatch[1]), Number(cpmMatch[2])];
    if (rpmMatch) monetizacion.rpm = [Number(rpmMatch[1]), Number(rpmMatch[2])];
    monetizacion.vias = mon.body
      .split('\n')
      .map((l) => l.replace(/^[-*]\s*/, '').trim())
      .filter((l) => l.startsWith('**'))
      .map((l) => {
        const m = l.match(/^\*\*(.+?)\*\*\s*\(([^)]+)\):\s*(.+)$/);
        if (m) return { nombre: m[1], potencial: m[2] as any, descripcion: m[3] };
        return { nombre: l.replace(/\*\*/g, ''), potencial: 'medio' as const, descripcion: '' };
      });
  }

  return {
    id: uid(),
    nombre,
    nicho,
    nichoPersonalizado: undefined,
    fechaCreacion: now,
    fechaModificacion: now,
    knowledgeBase: [],
    investigacion,
    ideaElegida,
    videoPlan: { formato: 'short', duracionSegundos: 60, preset: 'short_rapido' },
    assets,
    monetizacion,
    planPublicacion: [],
  };
}

// Detecta el tipo y parsea
export function parseProjectFile(filename: string, text: string): Project {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.json')) return parseJsonProject(text);
  if (lower.endsWith('.md') || lower.endsWith('.markdown') || lower.endsWith('.txt')) {
    // Si por accidente el .txt trae JSON, intentar JSON primero
    const trimmed = text.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try { return parseJsonProject(trimmed); } catch { /* fallback md */ }
    }
    return parseMarkdownProject(text, filename.replace(/\.(md|markdown|txt)$/i, ''));
  }
  throw new Error('Formato no soportado. Usa .json o .md');
}
