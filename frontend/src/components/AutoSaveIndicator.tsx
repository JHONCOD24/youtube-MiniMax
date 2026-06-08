import { useEffect, useState } from 'react';
import { Check, Clock } from 'lucide-react';
import { useApp } from '../store/useApp';

export function AutoSaveIndicator() {
  const proyecto = useApp((s) => s.proyecto);
  const [lastSave, setLastSave] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsSaving(true);
    setLastSave(new Date());
    const timer = setTimeout(() => setIsSaving(false), 800);
    return () => clearTimeout(timer);
  }, [proyecto.fechaModificacion]);

  if (!lastSave) return null;

  const timeAgo = Math.floor((new Date().getTime() - lastSave.getTime()) / 1000);
  let timeLabel = '';
  if (timeAgo < 5) timeLabel = 'Ahora';
  else if (timeAgo < 60) timeLabel = 'Hace poco';
  else timeLabel = 'Sincronizado';

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
      {isSaving ? (
        <>
          <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" />
          <span className="text-slate-600 dark:text-slate-300">Guardando...</span>
        </>
      ) : (
        <>
          <Check className="w-3.5 h-3.5 text-green-500" />
          <span className="text-slate-500 dark:text-slate-400">{timeLabel}</span>
        </>
      )}
    </div>
  );
}
