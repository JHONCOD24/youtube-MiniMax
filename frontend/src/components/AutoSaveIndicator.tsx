import { Check, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '../store/useApp';

/** Indicador compacto reutilizable del auto-guardado real del store. */
export function AutoSaveIndicator() {
  const saveStatus = useApp((s) => s.saveStatus);
  const lastSaveError = useApp((s) => s.lastSaveError);

  if (saveStatus === 'saving') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
        <Clock className="w-3.5 h-3.5 animate-spin" />
        <span>Guardando…</span>
      </div>
    );
  }

  if (saveStatus === 'error') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300" title={lastSaveError}>
        <AlertCircle className="w-3.5 h-3.5" />
        <span>No se pudo guardar</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
      <Check className="w-3.5 h-3.5 text-green-500" />
      <span>{saveStatus === 'saved' ? 'Guardado' : 'Auto-guardado'}</span>
    </div>
  );
}
