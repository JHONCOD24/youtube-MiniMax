// Paso 2: Investigación de mercado del nicho.
import { useState } from 'react';
import { useApp } from '../store/useApp';
import { useProveedorIA } from '../hooks/useProveedorIA';
import { investigarNicho } from '../services/youtubeClient';
import { CheckCircle2, AlertTriangle, XCircle, Loader2, TrendingUp, Eye, Flame, BarChart3, Sparkles, Bot, ExternalLink, Trash2, Plus, Wand2 } from 'lucide-react';
import { formatNumber, formatDate } from '../utils/format';
import type { InvestigationReport, Verdict, VideoItem } from '../types';
import { api } from '../services/api';
import { kbBuildContext } from '../services/kbClient';

export function InvestigacionPage() {
  const { proyecto, setInvestigacion, updateSettings } = useApp();
  const { youtubeDisponible, geminiOk, claudeOk, mistralOk, proveedor, investigacionDisponible } = useProveedorIA();
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState('');

  const ejecutar = async () => {
    if (!proyecto.nicho) {
      setError('Primero elige un nicho en el paso anterior.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const kb = await kbBuildContext(proyecto.id);
      const data = await investigarNicho({
        nicho: proyecto.nicho,
        geminiDisponible: investigacionDisponible,
        onProgress: setProgressMsg,
        knowledgeBase: kb.context,
      });
      setInvestigacion(data);
    } catch (e: any) {
      setError(e?.message || 'Error al investigar. Revisa las keys y la conexión.');
    } finally {
      setLoading(false);
      setProgressMsg('');
    }
  };

  const inv = proyecto.investigacion;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Paso 2 · Investigación</h1>
          <p className="text-slate-600 dark:text-slate-300">
            {proyecto.nicho ? <>Nicho: <b>{proyecto.nicho}</b></> : 'Elige un nicho primero.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="card px-3 py-2 flex items-center gap-1.5 text-sm">
            <span className="text-slate-400 text-xs mr-1 shrink-0">Analizar con</span>
            <button
              onClick={() => updateSettings({ proveedorIA: 'gemini' })}
              title={geminiOk ? 'Gemini disponible' : 'Sin key de Gemini'}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${proveedor === 'gemini' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              <Sparkles className="w-3 h-3" />
              Gemini
              {geminiOk && <span className={`w-1.5 h-1.5 rounded-full ml-0.5 ${proveedor === 'gemini' ? 'bg-green-300' : 'bg-green-400'}`} />}
            </button>
            <button
              onClick={() => updateSettings({ proveedorIA: 'claude' })}
              title={claudeOk ? 'Claude disponible' : 'Sin key de Claude'}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${proveedor === 'claude' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              <Bot className="w-3 h-3" />
              Claude
              {claudeOk && <span className={`w-1.5 h-1.5 rounded-full ml-0.5 ${proveedor === 'claude' ? 'bg-green-300' : 'bg-green-400'}`} />}
            </button>
            <button
              onClick={() => updateSettings({ proveedorIA: 'mistral' })}
              title={mistralOk ? 'Mistral disponible' : 'Sin key de Mistral'}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${proveedor === 'mistral' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              <Bot className="w-3 h-3" />
              Mistral
              {mistralOk && <span className={`w-1.5 h-1.5 rounded-full ml-0.5 ${proveedor === 'mistral' ? 'bg-green-300' : 'bg-green-400'}`} />}
            </button>
          </div>
          <button onClick={ejecutar} disabled={loading || !proyecto.nicho} className="btn-primary">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Investigando…</> : <><TrendingUp className="w-4 h-4" /> {inv ? 'Re-investigar' : 'Investigar nicho'}</>}
          </button>
        </div>
      </header>

      {!youtubeDisponible && (
        <div className="card p-4 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ <b>YouTube no está conectado.</b> Estás viendo datos de ejemplo. Configura tu key en Ajustes para datos reales.
          </p>
        </div>
      )}

      {loading && (
        <div className="card p-6 text-center">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-2" />
          <p className="text-slate-600 dark:text-slate-300">{progressMsg || 'Procesando…'}</p>
        </div>
      )}

      {error && (
        <div className="card p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 text-sm">
          {error}
        </div>
      )}

      {inv && !loading && <InvestigationView data={inv} />}
    </div>
  );
}

function youtubeUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

function parseYouTubeId(input: string): string | null {
  const raw = (input || '').trim();
  if (!raw) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
  try {
    const url = new URL(raw);
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (url.hostname.includes('youtube.com')) {
      const v = url.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const parts = url.pathname.split('/').filter(Boolean);
      const shortsIdx = parts.indexOf('shorts');
      if (shortsIdx >= 0 && parts[shortsIdx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[shortsIdx + 1])) return parts[shortsIdx + 1];
      const embedIdx = parts.indexOf('embed');
      if (embedIdx >= 0 && parts[embedIdx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[embedIdx + 1])) return parts[embedIdx + 1];
    }
    return null;
  } catch {
    return null;
  }
}

function calcVPH(views: number, publishedAt?: string): number {
  if (!publishedAt) return 0;
  const hours = Math.max(1, (Date.now() - new Date(publishedAt).getTime()) / 36e5);
  return Math.round(views / hours);
}

function recomputeMetrics(videos: VideoItem[], prev: InvestigationReport['metricas']): InvestigationReport['metricas'] {
  const vistasPromedio = videos.length
    ? Math.round(videos.reduce((s, v) => s + (v.views || 0), 0) / videos.length)
    : 0;
  const vphPromedio = videos.length
    ? Math.round(videos.reduce((s, v) => s + (v.vph || 0), 0) / videos.length)
    : 0;
  return { ...prev, vistasPromedio, vphPromedio };
}

function VerdictBadge({ v, text }: { v: Verdict; text: string }) {
  const map = {
    verde: { c: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-500', I: CheckCircle2, l: 'Oportunidad VERDE' },
    amarillo: { c: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-500', I: AlertTriangle, l: 'Oportunidad AMARILLA' },
    rojo: { c: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-500', I: XCircle, l: 'Oportunidad ROJA' },
  } as const;
  const it = map[v];
  const I = it.I;
  return (
    <div className={`card p-4 border-l-4 ${it.c}`}>
      <div className="flex items-center gap-2 font-bold mb-1"><I className="w-5 h-5" /> {it.l}</div>
      <p className="text-sm">{text}</p>
    </div>
  );
}

function InvestigationView({ data }: { data: InvestigationReport }) {
  const { setInvestigacion } = useApp();
  const { youtubeDisponible } = useProveedorIA();
  const [tab, setTab] = useState<'virales' | 'alcance'>('virales');
  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const videosSorted = [...data.topVideos].sort((a, b) => (b.views || 0) - (a.views || 0));
  const outlierIds = new Set((data.outliers || []).map((v) => v.videoId));
  const virales = [...videosSorted]
    .map((v) => ({ ...v, isOutlier: Boolean(v.isOutlier) || outlierIds.has(v.videoId) }))
    .sort((a, b) => (b.vph || 0) - (a.vph || 0));
  const viralesTop = (() => {
    const picked: VideoItem[] = [];
    const seen = new Set<string>();
    for (const v of virales) {
      if (picked.length >= 12) break;
      if ((v.isOutlier || (v.vph || 0) >= (data.metricas.vphPromedio || 0) * 2) && !seen.has(v.videoId)) {
        seen.add(v.videoId);
        picked.push(v);
      }
    }
    if (picked.length < 8) {
      for (const v of virales) {
        if (picked.length >= 8) break;
        if (!seen.has(v.videoId)) {
          seen.add(v.videoId);
          picked.push(v);
        }
      }
    }
    return picked;
  })();
  const alcance = videosSorted.filter((v) => !viralesTop.some((x) => x.videoId === v.videoId));

  const persist = (next: InvestigationReport) => {
    setInvestigacion(next);
  };

  const eliminar = (videoId: string) => {
    const topVideos = data.topVideos.filter((v) => v.videoId !== videoId);
    const outliers = (data.outliers || []).filter((v) => v.videoId !== videoId);
    persist({
      ...data,
      topVideos,
      outliers,
      metricas: recomputeMetrics(topVideos, data.metricas),
    });
  };

  const agregar = async () => {
    const videoId = parseYouTubeId(url);
    if (!videoId) {
      setAddError('Pega un enlace válido de YouTube o un ID de 11 caracteres.');
      return;
    }
    if (!youtubeDisponible) {
      setAddError('Conecta YouTube en Ajustes para poder cargar videos por enlace.');
      return;
    }
    if (data.topVideos.some((v) => v.videoId === videoId)) {
      setAddError('Ese video ya está en el listado.');
      return;
    }

    setAddError('');
    setAdding(true);
    try {
      const res = await api.youtubeVideos([videoId]);
      const v = (res.items || [])[0] as VideoItem | undefined;
      if (!v?.videoId) {
        setAddError('No pude cargar ese video. Revisa el enlace.');
        return;
      }
      const vph = calcVPH(v.views || 0, v.publishedAt);
      let isOutlier = false;
      if (v.channelId) {
        const ch = await api.youtubeChannels([v.channelId]);
        const c = (ch.items || [])[0];
        const promedio = c?.videos ? Math.round((c.views || 0) / c.videos) : 0;
        isOutlier = promedio > 0 && (v.views || 0) > promedio * 3;
      }
      const enriched: VideoItem = { ...v, vph, isOutlier };
      const topVideos = [...data.topVideos, enriched].sort((a, b) => (b.views || 0) - (a.views || 0));
      const outliers = topVideos.filter((x) => x.isOutlier);
      persist({
        ...data,
        topVideos,
        outliers,
        metricas: recomputeMetrics(topVideos, data.metricas),
      });
      setUrl('');
    } catch (e: any) {
      setAddError(e?.message || 'No se pudo agregar el video.');
    } finally {
      setAdding(false);
    }
  };

  const renderVideo = (v: VideoItem) => (
    <div key={v.videoId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition">
      <a href={youtubeUrl(v.videoId)} target="_blank" rel="noreferrer" className="shrink-0">
        {v.thumbnail && <img src={v.thumbnail} className="w-24 h-14 object-cover rounded" alt="" />}
      </a>
      <div className="flex-1 min-w-0">
        <a href={youtubeUrl(v.videoId)} target="_blank" rel="noreferrer" className="font-medium text-sm truncate hover:underline flex items-center gap-2">
          <span className="truncate">{v.title}</span>
          <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-400" />
        </a>
        <p className="text-xs text-slate-500">{v.channelTitle} · {formatDate(v.publishedAt)}</p>
      </div>
      <div className="text-right text-xs shrink-0">
        <p className="font-bold">{formatNumber(v.views || 0)} vistas</p>
        <p className="text-slate-500">VPH {formatNumber(v.vph || 0)}</p>
      </div>
      {v.isOutlier && <span className="chip bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">🔥 Outlier</span>}
      <button onClick={() => eliminar(v.videoId)} className="btn-ghost p-2" title="Eliminar de la lista">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-6 animate-slide-up">
      <VerdictBadge v={data.veredicto} text={data.explicacionVeredicto} />

      <div className="card p-5">
        <h3 className="font-bold mb-2">Resumen</h3>
        <p className="text-slate-600 dark:text-slate-300">{data.resumen}</p>
      </div>

      {/* Métricas */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Vistas promedio" value={formatNumber(data.metricas.vistasPromedio)} icon={Eye} />
        <MetricCard label="VPH promedio" value={formatNumber(data.metricas.vphPromedio)} icon={Flame} />
        <MetricCard label="Frecuencia" value={data.metricas.frecuenciaPublicacion} icon={BarChart3} />
        <MetricCard label="Duración prom." value={data.metricas.duracionPromedio} icon={TrendingUp} />
      </div>

      <div className="card p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="font-bold">Videos del nicho</h3>
            <p className="text-sm text-slate-500">Curación: elimina los que no sirven y agrega por enlace.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="relative">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Pega un enlace de YouTube o ID…"
                className="input w-full sm:w-[360px] pr-10"
                disabled={adding}
              />
              <Wand2 className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
            <button onClick={agregar} disabled={adding} className="btn-secondary">
              {adding ? <><Loader2 className="w-4 h-4 animate-spin" /> Agregando…</> : <><Plus className="w-4 h-4" /> Agregar</>}
            </button>
          </div>
        </div>

        {addError && <div className="mt-3 text-sm text-red-600 dark:text-red-300">{addError}</div>}

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => setTab('virales')}
            className={tab === 'virales' ? 'btn-primary' : 'btn-secondary'}
          >
            <Flame className="w-4 h-4" /> Virales
          </button>
          <button
            onClick={() => setTab('alcance')}
            className={tab === 'alcance' ? 'btn-primary' : 'btn-secondary'}
          >
            <BarChart3 className="w-4 h-4" /> Alcance / Monetización
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {tab === 'virales' ? viralesTop.map(renderVideo) : alcance.slice(0, 20).map(renderVideo)}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-bold mb-3">Sub-nichos poco explotados</h3>
          <ul className="space-y-1.5 text-sm">
            {data.subNichos.map((s, i) => <li key={i} className="flex items-start gap-2"><span className="text-brand-500">▸</span>{s}</li>)}
          </ul>
        </div>
        <div className="card p-5">
          <h3 className="font-bold mb-3">Ángulos para atacar</h3>
          <ul className="space-y-1.5 text-sm">
            {data.angulos.map((s, i) => <li key={i} className="flex items-start gap-2"><span className="text-accent-500">▸</span>{s}</li>)}
          </ul>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-bold mb-3">Competidores referentes</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {data.competidores.map((c, i) => (
            <div key={i} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <p className="font-semibold">{c.nombre}</p>
              <p className="text-sm text-slate-500">{c.porQue}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: I }: { label: string; value: string; icon: any }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-slate-500">{label}</p>
        <I className="w-4 h-4 text-slate-400" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
