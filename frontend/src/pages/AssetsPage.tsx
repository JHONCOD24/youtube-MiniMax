// Paso 4: Generación de activos (títulos, guion, descripciones, prompts).
// Diseñado con tipografía amplia, espaciado generoso y jerarquía visual clara.
import { useState } from 'react';
import { useApp } from '../store/useApp';
import { useProveedorIA } from '../hooks/useProveedorIA';
import { generarAssets, regenerarActivosDesdeGuion, normalizeEstrategia } from '../services/geminiClient';
import { CopyButton } from '../components/CopyButton';
import { GuionViewer } from '../components/GuionViewer';
import { GuionEditorModal } from '../components/GuionEditorModal';
import { Wand2, Loader2, Image as ImageIcon, Video, Music, FileText, Hash, Clock, Sparkles, Layers, ChevronDown, Edit3, RefreshCw, AlertCircle, CheckCircle2, Settings2, TrendingUp, Megaphone, Smartphone, ListOrdered, Copy as CopyIcon } from 'lucide-react';
import { copyToClipboard } from '../utils/format';
import { kbBuildContext } from '../services/kbClient';

type Tab = 'titulos' | 'guion' | 'seo' | 'thumb' | 'imagenes' | 'video' | 'musica' | 'estrategia';

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'titulos', label: 'Títulos', icon: Sparkles },
  { id: 'guion', label: 'Guion', icon: FileText },
  { id: 'seo', label: 'SEO', icon: Hash },
  { id: 'thumb', label: 'Thumbnail', icon: ImageIcon },
  { id: 'imagenes', label: 'Imágenes', icon: Layers },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'musica', label: 'Música', icon: Music },
  { id: 'estrategia', label: 'Publicación', icon: Clock },
];

export function AssetsPage() {
  const { proyecto, setAssets, syncingActivos } = useApp();
  const { iaDisponible: geminiDisponible } = useProveedorIA();
  const [tab, setTab] = useState<Tab>('titulos');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [guionEditorOpen, setGuionEditorOpen] = useState(false);
  const [resyncLoading, setResyncLoading] = useState(false);
  const [resyncMsg, setResyncMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [showFuentes, setShowFuentes] = useState(false);


  const a = proyecto.assets;
  const plan = proyecto.videoPlan;
  const activeTab = TABS.find((t) => t.id === tab) || TABS[0];
  const ActiveTabIcon = activeTab.icon;

  const sinIdea = !proyecto.ideaElegida;

  const duracionLabel = (() => {
    if (!plan) return null;
    if (plan.formato === 'short') return `Short · ${plan.duracionSegundos}s`;
    const mins = Math.round(plan.duracionSegundos / 60);
    return `Video largo · ${mins} min`;
  })();

  const generar = async () => {
    if (!proyecto.ideaElegida) {
      setError('Elige una idea primero.');
      return;
    }
    setError(''); setLoading(true);
    try {
      const kb = await kbBuildContext(proyecto.id);
      const data = await generarAssets({
        nicho: proyecto.nicho,
        idea: proyecto.ideaElegida,
        geminiDisponible,
        knowledgeBase: kb.context,
        videoPlan: plan ? { formato: plan.formato, duracionSegundos: plan.duracionSegundos } : undefined,
      });
      setAssets(data);
    } catch (e: any) {
      setError(e?.message || 'Error generando activos.');
    } finally { setLoading(false); }
  };

  const handleResync = async () => {
    if (!a || !proyecto.ideaElegida) return;
    setResyncLoading(true);
    setResyncMsg(null);
    try {
      const kb = await kbBuildContext(proyecto.id);
      const nuevos = await regenerarActivosDesdeGuion({
        nicho: proyecto.nicho,
        idea: proyecto.ideaElegida,
        guion: a.guion,
        prevAssets: a,
        geminiDisponible,
        knowledgeBase: kb.context,
        videoPlan: proyecto.videoPlan
          ? { formato: proyecto.videoPlan.formato, duracionSegundos: proyecto.videoPlan.duracionSegundos }
          : undefined,
      });
      setAssets(nuevos);
      setResyncMsg({ type: 'ok', text: 'Todos los activos están ahora sincronizados con el guion.' });
      setTimeout(() => setResyncMsg(null), 4000);
    } catch (e: any) {
      setResyncMsg({ type: 'err', text: e?.message || 'No se pudo regenerar. Revisa tu clave de IA.' });
    } finally {
      setResyncLoading(false);
    }
  };

  if (sinIdea && !a) {
    return (
      <div className="card p-10 text-center max-w-lg mx-auto mt-12">
        <p className="text-slate-500 text-base leading-relaxed">Elige una idea en el paso 3 para generar los activos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="relative overflow-hidden rounded-[1.25rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-brand-600 to-accent-500" />
        <div className="p-5 md:p-7">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="chip bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border-brand-100 dark:border-brand-800">
                  Paso 4
                </span>
                {duracionLabel && (
                  <span className="chip bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200">{duracionLabel}</span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Activos del video</h1>
              <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed max-w-3xl">
                Convierte la idea en piezas listas para producir: titulos, guion, SEO, prompts y plan de publicacion.
              </p>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
                <span className="font-semibold text-slate-800 dark:text-slate-100">Idea:</span>{' '}
                {proyecto.ideaElegida?.titulo || a?.tema || '(sin idea)'}
              </p>
            </div>
            <button onClick={generar} disabled={loading || sinIdea} className="btn-primary w-full sm:w-auto lg:shrink-0" title={sinIdea ? 'Elige una idea en el paso 3 primero' : ''}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</> : <><Wand2 className="w-4 h-4" /> {a ? 'Regenerar activos' : 'Generar activos'}</>}
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="card p-5 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-200 leading-relaxed">{error}</p>
        </div>
      )}

      {/* Banner de sincronización en segundo plano (disparada desde el editor de guion) */}
      {syncingActivos && (
        <div className="card p-4 border-l-4 border-brand-500 bg-brand-50 dark:bg-brand-900/10 flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-brand-600 dark:text-brand-400 animate-spin flex-shrink-0" />
          <p className="text-sm text-brand-700 dark:text-brand-300">
            Regenerando títulos, SEO, keywords, timestamps, thumbnails, storyboard y prompts a partir del guion editado…
          </p>
        </div>
      )}

      {/* Feedback de resync manual */}
      {resyncMsg && (
        <div className={`card p-4 border-l-4 flex items-center gap-3 ${resyncMsg.type === 'ok' ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-red-500 bg-red-50 dark:bg-red-900/10'}`}>
          {resyncMsg.type === 'ok'
            ? <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />}
          <p className={`text-sm ${resyncMsg.type === 'ok' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>{resyncMsg.text}</p>
        </div>
      )}

      {loading && (
        <div className="card p-12 text-center">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-600 text-base">Generando titulos, guion, descripcion y prompts...</p>
        </div>
      )}

      {a && !loading && (
        <div className="space-y-6 animate-slide-up">
          {/* Tabs */}
          <div className="card p-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2">
              {TABS.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`min-h-[4.25rem] px-3 py-3 rounded-xl text-sm font-semibold flex flex-col items-start justify-between gap-2 transition-all text-left ${
                    tab === t.id
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100'
                  }`}>
                  <t.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="leading-tight">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {a.fuentesUtilizadas && (a.fuentesUtilizadas.kb?.length > 0 || a.fuentesUtilizadas.investigacion?.length > 0) && (
            <div className="rounded-2xl border border-emerald-500/20 dark:border-emerald-500/35 overflow-hidden bg-gradient-to-br from-emerald-50/30 via-teal-50/10 to-emerald-50/20 dark:from-emerald-950/10 dark:via-teal-950/5 dark:to-emerald-950/10 shadow-sm transition-all duration-300">
              <button 
                onClick={() => setShowFuentes(!showFuentes)}
                className="w-full text-left cursor-pointer select-none flex items-center justify-between p-4 hover:bg-emerald-100/10 dark:hover:bg-emerald-950/20 transition-colors"
              >
                <div className="flex items-center gap-2.5 text-sm font-bold text-emerald-800 dark:text-emerald-300">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5">
                    <span>Síntesis de fuentes condensadas</span>
                    <span className="chip bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[10px] py-0.5 px-2.5 rounded-full font-semibold border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
                      {((a.fuentesUtilizadas.kb?.length || 0) + (a.fuentesUtilizadas.investigacion?.length || 0))} fuentes
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">
                    {showFuentes ? 'Ocultar' : 'Ver detalle'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 transition-transform duration-300 ${showFuentes ? 'rotate-180' : ''}`} />
                </div>
              </button>
              
              <div 
                className={`transition-all duration-300 ease-in-out ${
                  showFuentes ? 'max-h-[1000px] opacity-100 border-t border-emerald-500/10 dark:border-emerald-500/20' : 'max-h-0 opacity-0 overflow-hidden'
                }`}
              >
                <div className="p-4 md:p-5 bg-white dark:bg-slate-900 space-y-4">
                  {a.fuentesUtilizadas.explicacion && (
                    <div className="flex gap-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/60 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800/40">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300 text-xs shrink-0 mt-0.5">
                        💡
                      </div>
                      <p>{a.fuentesUtilizadas.explicacion}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                    {a.fuentesUtilizadas.kb.length > 0 && (
                      <div className="space-y-2.5">
                        <span className="font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block text-[10px]">De tu Base de Conocimiento</span>
                        <div className="flex flex-wrap gap-1.5">
                          {a.fuentesUtilizadas.kb.map((f, idx) => {
                            const doc = proyecto.knowledgeBase?.find(d => d.id === f);
                            const label = doc ? doc.name : `Doc: ${f}`;
                            return (
                              <span 
                                key={idx} 
                                onClick={() => copyToClipboard(label)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100/60 dark:border-blue-900/40 max-w-full truncate hover:bg-blue-100/40 dark:hover:bg-blue-900/30 cursor-pointer select-none transition-colors" 
                                title="Click para copiar el nombre"
                              >
                                <FileText className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{label}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {a.fuentesUtilizadas.investigacion.length > 0 && (
                      <div className="space-y-2.5">
                        <span className="font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block text-[10px]">De la Investigación del Nicho</span>
                        <div className="flex flex-wrap gap-1.5">
                          {a.fuentesUtilizadas.investigacion.map((f, idx) => (
                            <span 
                              key={idx} 
                              onClick={() => copyToClipboard(f)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50/80 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border border-purple-100/60 dark:border-purple-900/40 max-w-full truncate hover:bg-purple-100/40 dark:hover:bg-purple-900/30 cursor-pointer select-none transition-colors" 
                              title="Click para copiar la búsqueda"
                            >
                              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{f}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}


          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 px-1">
            <ActiveTabIcon className="w-4 h-4 text-brand-500" />
            <span>Estas viendo: <span className="font-semibold text-slate-800 dark:text-slate-100">{activeTab.label}</span></span>
          </div>

          {/* Títulos */}
          {tab === 'titulos' && (
            <div className="card p-6 md:p-7 space-y-4">
              <h3 className="text-lg font-bold tracking-tight">5 títulos de alto CTR</h3>
              <div className="space-y-3">
                {(a.titulos || []).map((t, i) => (
                  <div key={i} className="p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex items-start gap-4">
                    <span className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center text-sm font-bold flex-shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold leading-relaxed text-slate-800 dark:text-slate-100">{t.texto}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{t.razon}</p>
                    </div>
                    <CopyButton text={t.texto} />
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">Tip: prueba 2-3 en un A/B test usando variación de miniatura.</p>
            </div>
          )}

          {/* Guion */}
          {tab === 'guion' && (
            <div className="space-y-4">
              <div className="card overflow-hidden">
                <div className="grid lg:grid-cols-[minmax(0,1fr)_260px]">
                  <div className="p-5 md:p-7">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-300 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </span>
                        <div>
                          <h3 className="text-xl font-bold tracking-tight">Guion persuasivo</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Lectura por escenas para grabar, editar y copiar sin friccion.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {geminiDisponible && (
                          <button
                            onClick={handleResync}
                            disabled={resyncLoading || syncingActivos}
                            title="Regenera títulos, SEO, keywords, timestamps, thumbnails, storyboard y prompts a partir del guion actual"
                            className="btn-secondary shrink-0 gap-2 text-sm"
                          >
                            {resyncLoading
                              ? <><Loader2 className="w-4 h-4 animate-spin" />Regenerando…</>
                              : <><RefreshCw className="w-4 h-4" />Regenerar desde guion</>}
                          </button>
                        )}
                        <button
                          onClick={() => setGuionEditorOpen(true)}
                          className="btn-primary shrink-0 gap-2"
                        >
                          <Edit3 className="w-4 h-4" />
                          Editar guion
                        </button>
                      </div>
                    </div>
                    <p className="text-sm md:text-base leading-7 text-slate-600 dark:text-slate-300 max-w-2xl">
                      Cada bloque separa tiempo, indicacion visual/audio y narracion. Asi puedes validar ritmo, detectar partes flojas y llevar el texto directo a produccion.
                    </p>
                  </div>
                  <div className="border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/30 p-5 md:p-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">Checklist de lectura</p>
                    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      <li className="flex items-start gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />Hook claro en los primeros segundos.</li>
                      <li className="flex items-start gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />Un cambio visual por idea fuerte.</li>
                      <li className="flex items-start gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />CTA natural, sin cortar el ritmo.</li>
                    </ul>
                  </div>
                </div>
              </div>
              <GuionViewer key={proyecto.fechaModificacion} guion={a.guion} />
            </div>
          )}


          {/* SEO */}
          {tab === 'seo' && (
            <div className="space-y-4">
              <div className="card p-6 md:p-7">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold tracking-tight">Descripción SEO</h3>
                  <CopyButton text={a.descripcionSEO} />
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 md:p-6 rounded-xl">
                  <pre className="whitespace-pre-wrap text-base leading-7 font-sans text-slate-700 dark:text-slate-200">{a.descripcionSEO}</pre>
                </div>
              </div>
              <div className="card p-6 md:p-7">
                <h3 className="text-lg font-bold tracking-tight mb-4">Keywords / tags</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(a.keywords || []).map((k, i) => (
                    <span key={i} className="chip text-sm px-3 py-1 cursor-pointer hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors" onClick={() => copyToClipboard(k)}>
                      #{k}
                    </span>
                  ))}
                </div>
                <CopyButton text={(a.keywords || []).join(', ')} label="Copiar todas" />
              </div>
              <div className="card p-6 md:p-7">
                <h3 className="text-lg font-bold tracking-tight mb-4">Timestamps / capítulos</h3>
                <ul className="space-y-1.5">
                  {(a.timestamps || []).map((t, i) => <li key={i} className="font-mono text-sm leading-6 text-slate-700 dark:text-slate-300">{t}</li>)}
                </ul>
                <div className="mt-4"><CopyButton text={(a.timestamps || []).join('\n')} label="Copiar timestamps" /></div>
              </div>
            </div>
          )}

          {/* Thumbnail */}
          {tab === 'thumb' && (
            <div className="card p-6 md:p-7 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">3 opciones de thumbnail</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Elige una y úsala como referencia visual para el resto del reel.</p>
                </div>
                <CopyButton
                  text={(a.thumbnails?.length ? a.thumbnails : [{ prompt: a.promptThumbnail }]).map((t: any, i: number) => `OPCIÓN ${i + 1}\n${t.prompt || ''}\n`).join('\n')}
                  label="Copiar 3 prompts"
                />
              </div>
              <div className="grid lg:grid-cols-3 gap-4">
                {(a.thumbnails?.length ? a.thumbnails : [{ concepto: '—', textoMiniatura: '—', prompt: a.promptThumbnail, ratio: '16:9' }]).slice(0, 3).map((t, i) => (
                  <div key={i} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-medium">Opción {i + 1}</p>
                        <p className="text-base font-semibold mt-0.5 truncate text-slate-800 dark:text-slate-100">{t.concepto || 'Concepto'}</p>
                        <p className="text-sm text-slate-500 truncate mt-0.5">{t.textoMiniatura ? `Texto: ${t.textoMiniatura}` : 'Texto: —'}</p>
                      </div>
                      <CopyButton text={t.prompt || ''} className="shrink-0" />
                    </div>
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono bg-white dark:bg-slate-900/60 p-4 rounded-xl text-slate-700 dark:text-slate-300">{t.prompt || ''}</pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Storyboard */}
          {tab === 'imagenes' && (
            <div className="card p-6 md:p-7">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">Storyboard</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Cada escena incluye voz en off, prompt de imagen y prompt de video.
                  </p>
                </div>
                <CopyButton
                  label="Copiar storyboard"
                  text={(a.storyboard || []).map((s) =>
                    `ESCENA ${s.escena} (${s.inicioSeg}s–${s.finSeg}s)\nVOZ EN OFF: ${s.vozEnOff}\nTEXTO: ${s.textoEnPantalla || ''}\nPROMPT IMAGEN (${s.ratio}): ${s.promptImagen}\nPROMPT VIDEO (${s.ratio}): ${s.promptVideo}\n`
                  ).join('\n')}
                />
              </div>

              {(a.storyboard || []).length === 0 ? (
                <div className="text-sm text-slate-500 leading-relaxed">Genera activos para ver el storyboard.</div>
              ) : (
                <div className="space-y-3">
                  {(a.storyboard || []).map((s) => (
                    <details key={s.escena} className="group rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-shadow hover:shadow-sm">
                      <summary className="cursor-pointer select-none flex items-center justify-between gap-3 p-4 md:p-5 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wide">
                            Escena {s.escena} · {s.inicioSeg}s – {s.finSeg}s · {s.ratio}
                          </p>
                          <p className="text-sm font-semibold mt-1 truncate text-slate-700 dark:text-slate-200">{s.textoEnPantalla || s.vozEnOff}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <CopyButton label="Voz" text={s.vozEnOff} className="hidden sm:flex" />
                          <CopyButton label="Imagen" text={s.promptImagen} className="hidden sm:flex" />
                          <CopyButton label="Video" text={s.promptVideo} className="hidden sm:flex" />
                          <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                        </div>
                      </summary>
                      <div className="p-4 md:p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-4">
                        <Section label="Voz en off" text={s.vozEnOff} />
                        {s.textoEnPantalla && <Section label="Texto en pantalla" text={s.textoEnPantalla} />}
                        <div className="grid md:grid-cols-2 gap-4">
                          <PromptBlock label="Prompt imagen" text={s.promptImagen} />
                          <PromptBlock label="Prompt video" text={s.promptVideo} />
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Video */}
          {tab === 'video' && (
            <div className="card p-6 md:p-7">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold tracking-tight">Prompt de Video</h3>
                <CopyButton text={a.promptVideo} />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 md:p-6 rounded-xl mb-4">
                <pre className="whitespace-pre-wrap text-sm leading-7 font-mono text-slate-700 dark:text-slate-200">{a.promptVideo}</pre>
              </div>
              <p className="text-sm text-slate-400 dark:text-slate-500 leading-relaxed">Encadena este video al thumbnail/imagen inicial para mantener coherencia visual. Compatible con Veo, Kling, Runway.</p>
            </div>
          )}

          {/* Música */}
          {tab === 'musica' && (
            <div className="space-y-4">
              <div className="card p-6 md:p-7">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold tracking-tight">Prompt para Suno</h3>
                  <CopyButton text={a.promptMusica} />
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 md:p-6 rounded-xl">
                  <pre className="whitespace-pre-wrap text-sm leading-7 font-mono text-slate-700 dark:text-slate-200">{a.promptMusica}</pre>
                </div>
              </div>
              <div className="card p-6 md:p-7">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold tracking-tight">Variante para Gemini</h3>
                  <CopyButton text={a.promptMusicaGemini} />
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 md:p-6 rounded-xl">
                  <pre className="whitespace-pre-wrap text-sm leading-7 font-mono text-slate-700 dark:text-slate-200">{a.promptMusicaGemini}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Estrategia / Publicación */}
          {tab === 'estrategia' && (() => {
            // Los proyectos guardados pueden traer datos de versiones anteriores
            // (campos faltantes o con forma distinta a la esperada). Se normaliza
            // siempre antes de renderizar para que esta pestaña nunca falle.
            const est = normalizeEstrategia(a.estrategiaPublicacion);
            const tieneShorts = !!(est?.shorts?.hashtags || est?.shorts?.musica || est?.shorts?.tips);
            const checklist = est?.checklistSubida || [];
            return (
              <div className="space-y-5">
                {/* Calendario y cadencia */}
                <div className="card p-6 md:p-7">
                  <h3 className="text-lg font-bold tracking-tight mb-5 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-brand-500" />
                    Calendario de publicación
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Item label="Mejor día" value={est?.mejorDia || '—'} />
                    <Item label="Mejor hora" value={est?.mejorHora || '—'} />
                    <Item label="Frecuencia" value={est?.frecuencia || '—'} />
                    <Item label="Formato" value={est?.formato || '—'} />
                  </div>
                  {est?.razon && (
                    <div className="mt-4 p-4 md:p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{est.razon}</p>
                    </div>
                  )}
                </div>

                {/* Listo para copiar y pegar */}
                <div className="card p-6 md:p-7 space-y-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <CopyIcon className="w-5 h-5 text-brand-500" />
                      <h3 className="text-lg font-bold tracking-tight">Listo para copiar y pegar en YouTube</h3>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Pega esto directo en el formulario de subida — ya está optimizado para esta idea y este nicho.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-medium">Título para publicar</p>
                      <CopyButton text={est?.tituloPublicacion || ''} />
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                      <p className="text-base font-semibold leading-relaxed text-slate-800 dark:text-slate-100">{est?.tituloPublicacion || '—'}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-medium">Descripción para publicar</p>
                      <CopyButton text={est?.descripcionPublicacion || ''} />
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 md:p-5 rounded-xl">
                      <pre className="whitespace-pre-wrap text-sm leading-7 font-sans text-slate-700 dark:text-slate-200">{est?.descripcionPublicacion || '—'}</pre>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-medium">Etiquetas (tags) para YouTube Studio</p>
                      <CopyButton text={(est?.tags || []).join(', ')} label="Copiar todas" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(est?.tags || []).length === 0 && <span className="text-sm text-slate-400">—</span>}
                      {(est?.tags || []).map((t, i) => (
                        <span key={i} className="chip text-sm px-3 py-1 cursor-pointer hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors" onClick={() => copyToClipboard(t)} title="Click para copiar">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-medium">Hashtags</p>
                      <CopyButton text={(est?.hashtags || []).map((h) => `#${h}`).join(' ')} label="Copiar todos" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(est?.hashtags || []).length === 0 && <span className="text-sm text-slate-400">—</span>}
                      {(est?.hashtags || []).map((h, i) => (
                        <span key={i} className="chip text-sm px-3 py-1 cursor-pointer hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors" onClick={() => copyToClipboard(`#${h}`)} title="Click para copiar">
                          #{h}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Configuración del formulario de subida */}
                <div className="card p-6 md:p-7">
                  <h3 className="text-lg font-bold tracking-tight mb-5 flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-brand-500" />
                    Configuración al subir el video (YouTube Studio)
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Item label="Categoría" value={est?.categoria || '—'} />
                    <Item label="¿Hecho para niños?" value={est?.audienciaInfantil || '—'} />
                    <Item label="Idioma" value={est?.idioma || '—'} />
                    <Item label="Licencia" value={est?.licencia || '—'} />
                  </div>
                  <div className="mt-4">
                    <Section label="Visibilidad recomendada al publicar" text={est?.visibilidad || '—'} />
                  </div>
                </div>

                {/* Para maximizar alcance y retención */}
                <div className="card p-6 md:p-7 space-y-4">
                  <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-brand-500" />
                    Para maximizar alcance y retención
                  </h3>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-medium">Comentario fijado (pégalo apenas publiques)</p>
                      <CopyButton text={est?.comentarioFijado || ''} />
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{est?.comentarioFijado || '—'}</p>
                    </div>
                  </div>
                  <Section label="Pantalla final (últimos 15-20s)" text={est?.pantallaFinal || '—'} />
                  <Section label="Tarjetas (cards)" text={est?.tarjetas || '—'} />
                  <Section label="Playlist sugerida" text={est?.playlist || '—'} />
                </div>

                {/* Anuncio en Comunidad */}
                <div className="card p-6 md:p-7">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
                      <Megaphone className="w-5 h-5 text-brand-500" />
                      Anuncio en la pestaña Comunidad
                    </h3>
                    <CopyButton text={est?.publicacionComunidad || ''} />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                    Publícalo antes o el mismo día del estreno para generar expectativa y avisar a tus suscriptores.
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 md:p-5 rounded-xl">
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{est?.publicacionComunidad || '—'}</p>
                  </div>
                </div>

                {/* Configuración específica para Shorts */}
                {tieneShorts && (
                  <div className="card p-6 md:p-7 space-y-4">
                    <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-brand-500" />
                      Configuración específica para crear el Short
                    </h3>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-medium">Hashtags del Short</p>
                        <CopyButton text={est?.shorts?.hashtags || ''} />
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                        <p className="text-sm font-mono text-slate-700 dark:text-slate-200">{est?.shorts?.hashtags || '—'}</p>
                      </div>
                    </div>
                    <Section label="Música / audio recomendado" text={est?.shorts?.musica || '—'} />
                    <Section label="Trucos para que ESTE Short funcione" text={est?.shorts?.tips || '—'} />
                  </div>
                )}

                {/* Checklist paso a paso */}
                <div className="card p-6 md:p-7">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
                      <ListOrdered className="w-5 h-5 text-brand-500" />
                      Checklist paso a paso para publicar
                    </h3>
                    {checklist.length > 0 && (
                      <CopyButton text={checklist.map((s, i) => `${i + 1}. ${s}`).join('\n')} label="Copiar checklist" />
                    )}
                  </div>
                  {checklist.length === 0 && <p className="text-sm text-slate-400">—</p>}
                  <ol className="space-y-2.5">
                    {checklist.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Modal editor de guion — fuera del árbol de tabs */}
      <GuionEditorModal open={guionEditorOpen} onClose={() => setGuionEditorOpen(false)} />
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
      <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className="text-base font-semibold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}

function Section({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-medium mb-2">{label}</p>
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{text}</p>
      </div>
    </div>
  );
}

function PromptBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-medium mb-2">{label}</p>
      <pre className="whitespace-pre-wrap text-sm leading-6 font-mono bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-slate-700 dark:text-slate-300">{text}</pre>
    </div>
  );
}
