import { AlertCircle, Check, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';

export function AutoSaveInfo() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Mostrar la información solo la primera vez
    const hasSeenInfo = localStorage.getItem('ynl.hasSeenAutoSaveInfo');
    if (!hasSeenInfo) {
      setShow(true);
      localStorage.setItem('ynl.hasSeenAutoSaveInfo', 'true');
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="card max-w-md p-6 space-y-4 animate-fade-in">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Auto-guardado activado</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Tu trabajo se guarda automáticamente mientras trabajas.</p>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Cambios en tiempo real</p>
              <p className="text-xs text-slate-500">Cada cambio en tus activos, ideas o títulos se guarda automáticamente en tu navegador.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-brand-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Sincroniza cuando quieras</p>
              <p className="text-xs text-slate-500">Usa el botón "Sincronizar" en la sidebar para confirmar que todo está guardado en tu lista de proyectos.</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShow(false)}
          className="w-full btn-primary py-2"
        >
          ¡Entendido!
        </button>
      </div>
    </div>
  );
}
