import { AlertCircle, Check, FolderOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useApp } from '../store/useApp';

export function AutoSaveInfo() {
  const onVisitou = useApp((s) => s.settings.onVisitou);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!onVisitou) return;
    const hasSeenInfo = localStorage.getItem('ynl.hasSeenAutoSaveInfo.v2');
    if (!hasSeenInfo) {
      setShow(true);
      localStorage.setItem('ynl.hasSeenAutoSaveInfo.v2', 'true');
    }
  }, [onVisitou]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="card max-w-md p-6 space-y-4 animate-fade-in">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Tu trabajo se guarda solo</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Investigación, ideas y activos se guardan automáticamente en <b>este navegador</b>.
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Sin botón obligatorio</p>
              <p className="text-xs text-slate-500">
                Al elegir nicho, investigar o generar ideas, ya queda guardado. Puedes recargar la página y seguir.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FolderOpen className="w-5 h-5 text-brand-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Menú Proyectos</p>
              <p className="text-xs text-slate-500">
                Ahí ves todos tus trabajos. El botón <b>Guardar proyecto</b> en la barra lateral renombra con la idea elegida y confirma.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShow(false)}
          className="w-full btn-primary py-2"
        >
          ¡Entendido!
        </button>
      </div>
    </div>
  );
}
