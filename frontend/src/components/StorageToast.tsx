import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { onStorageError } from '../services/storage';
import { useApp } from '../store/useApp';

export function StorageToast() {
  const [mensaje, setMensaje] = useState('');
  const avisoUsuario = useApp((s) => s.avisoUsuario);
  const limpiarAviso = useApp((s) => s.limpiarAviso);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsub = onStorageError((msg) => {
      setMensaje(msg);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setMensaje(''), 8000);
    });
    return () => {
      unsub();
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (avisoUsuario) {
    return (
      <div
        role="status"
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 flex items-start gap-3 p-4 rounded-xl border border-brand-300 dark:border-brand-700 bg-white dark:bg-slate-900 shadow-lg text-slate-800 dark:text-slate-100 text-sm"
      >
        <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-brand-600" />
        <p className="flex-1">{avisoUsuario}</p>
        <button
          onClick={limpiarAviso}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Cerrar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (!mensaje) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 flex items-start gap-3 p-4 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/90 shadow-lg text-amber-900 dark:text-amber-100 text-sm"
    >
      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <p className="flex-1">{mensaje}</p>
      <button
        onClick={() => setMensaje('')}
        className="p-1 rounded hover:bg-amber-200/50 dark:hover:bg-amber-800/50"
        aria-label="Cerrar aviso"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}