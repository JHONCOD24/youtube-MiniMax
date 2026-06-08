import { useMemo, useState } from 'react';
import { X, Zap, Timer, Film, ArrowRight } from 'lucide-react';
import type { VideoPlan, VideoFormato } from '../types';

function formatSeconds(total: number) {
  const s = Math.max(0, Math.round(total || 0));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return r ? `${m}m ${r}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm ? `${h}h ${mm}m` : `${h}h`;
}

function pill(label: string, value: string) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">{value}</span>
    </div>
  );
}

export function VideoDurationModal(props: {
  open: boolean;
  title: string;
  onClose: () => void;
  onConfirm: (plan: VideoPlan) => void;
}) {
  const { open, title, onClose, onConfirm } = props;
  const [preset, setPreset] = useState<VideoPlan['preset']>('short_rapido');
  const [longMinutes, setLongMinutes] = useState(12);

  const plan = useMemo<VideoPlan>(() => {
    if (preset === 'short_rapido') return { formato: 'short', duracionSegundos: 60, preset };
    if (preset === 'short_largo') return { formato: 'short', duracionSegundos: 90, preset };
    const mins = Math.min(60, Math.max(2, Number(longMinutes) || 12));
    return { formato: 'largo', duracionSegundos: mins * 60, preset };
  }, [preset, longMinutes]);

  const formatoLabel = (f: VideoFormato) => (f === 'short' ? 'Short' : 'Video largo');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
      <div className="w-full max-w-xl relative animate-slide-up">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-brand-500/25 via-transparent to-accent-500/25 blur-2xl" />
        <div className="card relative overflow-hidden p-6 rounded-3xl border border-slate-200/70 dark:border-slate-800/70">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold">
                <Timer className="w-4 h-4" />
                Duración del video
              </div>
              <h2 className="text-xl font-bold mt-3 truncate">{title}</h2>
              <p className="text-sm text-slate-500 mt-1">
                Define el formato y la duración. Los activos se generarán siguiendo este timing.
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Cerrar">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <button
              onClick={() => setPreset('short_rapido')}
              className={`p-4 rounded-2xl border text-left transition ${
                preset === 'short_rapido'
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold">Short rápido</span>
                <Zap className={`w-4 h-4 ${preset === 'short_rapido' ? 'text-brand-600 dark:text-brand-300' : 'text-slate-400'}`} />
              </div>
              <p className="text-xs text-slate-500 mt-1">Hook agresivo + ritmo alto.</p>
              <div className="mt-3">{pill('Objetivo', '60s')}</div>
            </button>

            <button
              onClick={() => setPreset('short_largo')}
              className={`p-4 rounded-2xl border text-left transition ${
                preset === 'short_largo'
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold">Short largo</span>
                <Timer className={`w-4 h-4 ${preset === 'short_largo' ? 'text-brand-600 dark:text-brand-300' : 'text-slate-400'}`} />
              </div>
              <p className="text-xs text-slate-500 mt-1">Más contexto sin perder velocidad.</p>
              <div className="mt-3">{pill('Objetivo', '90s')}</div>
            </button>

            <button
              onClick={() => setPreset('largo_custom')}
              className={`p-4 rounded-2xl border text-left transition ${
                preset === 'largo_custom'
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold">Video largo</span>
                <Film className={`w-4 h-4 ${preset === 'largo_custom' ? 'text-brand-600 dark:text-brand-300' : 'text-slate-400'}`} />
              </div>
              <p className="text-xs text-slate-500 mt-1">Guion con capítulos y retención.</p>
              <div className="mt-3">{pill('Rango', '2–60 min')}</div>
            </button>
          </div>

          {preset === 'largo_custom' && (
            <div className="mb-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
              <div className="flex items-center justify-between gap-4 mb-2">
                <p className="text-sm font-semibold">Duración objetivo</p>
                <span className="text-sm font-bold text-brand-700 dark:text-brand-300">{formatSeconds(plan.duracionSegundos)}</span>
              </div>
              <input
                type="range"
                min={2}
                max={60}
                value={longMinutes}
                onChange={(e) => setLongMinutes(Number(e.target.value))}
                className="w-full"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>2 min</span>
                <span>60 min</span>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
              <p className="text-xs text-slate-500 mb-1">Formato</p>
              <p className="font-bold">{formatoLabel(plan.formato)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
              <p className="text-xs text-slate-500 mb-1">Duración</p>
              <p className="font-bold">{formatSeconds(plan.duracionSegundos)}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-2">
            <button onClick={onClose} className="btn-secondary flex-1">Volver</button>
            <button onClick={() => onConfirm(plan)} className="btn-primary flex-1">
              Continuar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
