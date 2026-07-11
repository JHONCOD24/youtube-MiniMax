// Paso 3: Ideas de video.
import { useState } from 'react';
import { useApp } from '../store/useApp';
import { useProveedorIA } from '../hooks/useProveedorIA';
import { generarIdeas, normalizeIdea } from '../services/geminiClient';
import { Lightbulb, Loader2, Check, ArrowRight, BookOpen, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { kbBuildContext } from '../services/kbClient';
import { VideoDurationModal } from '../components/VideoDurationModal';
import type { VideoIdea, VideoPlan } from '../types';

export function IdeasPage() {
  const { proyecto, setIdea, setVideoPlan, setIdeasGeneradas } = useApp();
  const { iaDisponible: geminiDisponible } = useProveedorIA();

  // Inicializa con la lista completa guardada; si no hay, y hay una elegida, la incluye como semilla.
  // Se normaliza cada idea (puede venir de un proyecto guardado con una versión
  // anterior y traer campos con forma inesperada) para que esta pestaña nunca falle.
  const listaInicial: VideoIdea[] = (proyecto.ideasGeneradas?.length
    ? proyecto.ideasGeneradas
    : proyecto.ideaElegida
      ? [proyecto.ideaElegida]
      : []).map((idea, i) => ({
        ...normalizeIdea(idea, i),
        id: idea.id || `idea-${i}-${Math.random().toString(36).slice(2, 6)}`
      }));

  const [ideas, setIdeas] = useState<VideoIdea[]>(listaInicial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [ideaPendiente, setIdeaPendiente] = useState<VideoIdea | null>(null);
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const toggleExpand = (id: string) =>
    setExpandidas((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const generar = async () => {
    if (!proyecto.investigacion) {
      setError('Primero investiga tu nicho en el paso anterior.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const kb = await kbBuildContext(proyecto.id);
      const data = await generarIdeas({
        nicho: proyecto.nicho,
        investigacion: {
          resumen: proyecto.investigacion.resumen,
          outliers: proyecto.investigacion.outliers.map((o) => ({ title: o.title, views: o.views || 0 })),
          subNichos: proyecto.investigacion.subNichos,
          angulos: proyecto.investigacion.angulos,
        },
        geminiDisponible,
        knowledgeBase: kb.context,
      });
      setIdeas(data);
      setIdeasGeneradas(data);
    } catch (e: any) {
      setError(e?.message || 'Error al generar ideas.');
    } finally {
      setLoading(false);
    }
  };

  const elegir = (idea: VideoIdea) => {
    setIdeaPendiente(idea);
    setModalOpen(true);
  };

  const confirmarDuracion = (plan: VideoPlan) => {
    if (!ideaPendiente) return;
    setIdea(ideaPendiente);
    setVideoPlan(plan);
    setModalOpen(false);
    setIdeaPendiente(null);
    // Navega a activos, pero la lista completa queda guardada para volver.
    navigate('/assets');
  };

  const ideaActivaId = proyecto.ideaElegida?.id;

  return (
    <div className="space-y-6">
      <VideoDurationModal
        open={modalOpen}
        title={ideaPendiente?.titulo || 'Selecciona duración'}
        onClose={() => { setModalOpen(false); setIdeaPendiente(null); }}
        onConfirm={confirmarDuracion}
      />

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Paso 3 · Ideas de video</h1>
          <p className="text-slate-600 dark:text-slate-300">
            {ideas.length > 0
              ? `${ideas.length} ideas disponibles${ideaActivaId ? ' · 1 idea activa' : ''}.`
              : proyecto.investigacion
                ? 'Genera ideas para este nicho.'
                : 'Necesitas haber investigado el nicho.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {ideaActivaId && (
            <button onClick={() => navigate('/assets')} className="btn-secondary flex items-center gap-2">
              Ir a Activos <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button onClick={generar} disabled={loading || !proyecto.investigacion} className="btn-primary">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando…</>
              : <><Lightbulb className="w-4 h-4" /> {ideas.length ? 'Regenerar ideas' : 'Generar ideas'}</>}
          </button>
        </div>
      </header>

      {/* Banner idea activa */}
      {ideaActivaId && proyecto.ideaElegida && (
        <div className="card p-4 border-l-4 border-brand-500 bg-brand-50 dark:bg-brand-900/20 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Check className="w-5 h-5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400 mb-0.5">Idea activa</p>
              <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{proyecto.ideaElegida.titulo}</p>
            </div>
          </div>
          <button onClick={() => navigate('/assets')} className="btn-primary shrink-0 text-sm gap-2">
            Continuar a Activos <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="card p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-200">{error}</div>
      )}

      {loading && (
        <div className="card p-8 text-center">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-2" />
          <p className="text-slate-600">Generando ideas virales para "{proyecto.nicho}"…</p>
        </div>
      )}

      {!loading && ideas.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {ideas.map((idea) => {
            const elegido = ideaActivaId === idea.id;
            const expandida = expandidas.has(idea.id);
            return (
              <div
                key={idea.id}
                className={`card p-5 flex flex-col transition-shadow ${
                  elegido
                    ? 'ring-2 ring-brand-500 shadow-md'
                    : 'hover:shadow-sm'
                }`}
              >
                {/* Cabecera de la card */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-base leading-snug flex-1">{idea.titulo}</h3>
                  <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                    {idea.origen === 'kb' && (
                      <span className="chip bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                        <BookOpen className="w-3 h-3" /> KB
                      </span>
                    )}
                    {idea.origen === 'ai' && (
                      <span className="chip bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                        <Sparkles className="w-3 h-3" /> IA
                      </span>
                    )}
                    {idea.origen === 'hibrida' && (
                      <span className="chip bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                        <Sparkles className="w-3 h-3" /> Híbrida
                      </span>
                    )}
                    {elegido && (
                      <span className="chip bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-700">
                        <Check className="w-3 h-3" /> Activa
                      </span>
                    )}
                  </div>
                </div>

                {/* Datos básicos siempre visibles */}
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Hook:</span> {idea.hook}
                </p>
                {idea.promesaValor && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-1.5">
                    <span className="font-semibold">Promesa:</span> {idea.promesaValor}
                  </p>
                )}
                <p className="text-sm mb-1.5">
                  <span className="font-semibold">Ángulo:</span> {idea.angulo}
                </p>
                <p className="text-xs text-slate-500 mb-3">
                  <span className="font-semibold">¿Por qué viral?</span> {idea.porQueViral}
                </p>

                {/* Detalles expandibles */}
                {(idea.estructuraSugerida?.length || idea.justificacionMetricas || idea.fuentes?.length) && (
                  <button
                    onClick={() => toggleExpand(idea.id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 mb-3 self-start"
                  >
                    {expandida ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {expandida ? 'Ver menos' : 'Ver estructura y métricas'}
                  </button>
                )}

                {expandida && (
                  <div className="mb-4 space-y-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3.5">
                    {!(idea.estructuraSugerida?.length || idea.justificacionMetricas || idea.desgloseKB || idea.desgloseInvestigacion || idea.fuentes?.length) && (
                      <p className="text-xs text-slate-500 italic text-center py-1">
                        Esta idea fue generada con una versión anterior. Haz clic en "Regenerar ideas" arriba para ver el nuevo desglose de tu documentación y la investigación de YouTube.
                      </p>
                    )}
                    {Array.isArray(idea.estructuraSugerida) && idea.estructuraSugerida.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 font-semibold mb-1.5">Estructura sugerida</p>
                        <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                          {idea.estructuraSugerida.slice(0, 8).map((s, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-slate-400 flex-shrink-0">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {idea.justificacionMetricas && (
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        <span className="text-slate-500 font-semibold">Métricas:</span> {idea.justificacionMetricas}
                      </p>
                    )}
                    {idea.desgloseKB && (
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        <span className="text-slate-500 font-semibold">De tu documentación (KB):</span> {idea.desgloseKB}
                      </p>
                    )}
                    {idea.desgloseInvestigacion && (
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        <span className="text-slate-500 font-semibold">De la investigación (YouTube):</span> {idea.desgloseInvestigacion}
                      </p>
                    )}
                    {Array.isArray(idea.fuentes) && idea.fuentes.length > 0 && (
                      <div className="text-xs text-slate-500 flex flex-wrap gap-1 items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="font-semibold text-slate-500">Fuentes:</span>
                        {idea.fuentes.map((fuenteItem, idx) => {
                          const f = String(fuenteItem || '').trim();
                          if (!f) return null;
                          let label = f;
                          let isKb = false;
                          if (f.startsWith('[KB:')) {
                            isKb = true;
                            const id = f.replace('[KB:', '').replace(']', '').trim();
                            const doc = proyecto.knowledgeBase?.find((d) => d.id === id);
                            label = doc ? `Doc: ${doc.name}` : `Documento KB`;
                          } else if (f.startsWith('[Investigación:')) {
                            label = f.replace('[Investigación:', '').replace(']', '').trim();
                          }
                          return (
                            <span key={idx} className={`chip text-[10px] px-1.5 py-0.5 max-w-[180px] truncate ${isKb ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`} title={label}>
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* CTA */}
                <div className="mt-auto pt-1">
                  {elegido ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => elegir(idea)}
                        className="btn-secondary flex-1 text-sm"
                      >
                        Cambiar duración
                      </button>
                      <button
                        onClick={() => navigate('/assets')}
                        className="btn-primary flex-1 text-sm gap-1.5"
                      >
                        Ir a Activos <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => elegir(idea)} className="btn-primary w-full text-sm gap-1.5">
                      Elegir esta idea <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
