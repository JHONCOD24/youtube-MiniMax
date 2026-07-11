// Barra de estado del proyecto actual en la sidebar.
import { useApp } from '../store/useApp';
import { Check, Save, FolderOpen, Loader2, AlertCircle, Cloud } from 'lucide-react';
import type { Project } from '../types';

const STEP_NAMES = ['Nicho', 'Investigación', 'Ideas', 'Activos', 'Monetización'];

function pasosCompletados(p: Project): number {
  if (p.monetizacion) return 5;
  if (p.assets) return 4;
  if (p.ideaElegida) return 3;
  if (p.investigacion) return 2;
  if (p.nicho) return 1;
  return 0;
}

export function ProjectStatusBar() {
  const proyecto = useApp((s) => s.proyecto);
  const guardarProyecto = useApp((s) => s.guardarProyecto);
  const saveStatus = useApp((s) => s.saveStatus);
  const lastSaveError = useApp((s) => s.lastSaveError);
  const completados = pasosCompletados(proyecto);

  const nombreDestino = proyecto.ideaElegida?.titulo?.trim() || proyecto.nombre;
  const renombrará = Boolean(proyecto.ideaElegida?.titulo?.trim()) && nombreDestino !== proyecto.nombre;

  const handleSave = () => {
    guardarProyecto();
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-800">
      <div className="p-3 space-y-2.5">

        {/* Nombre del proyecto activo */}
        <div className="flex items-center gap-1.5 min-w-0">
          <FolderOpen className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
          <span
            className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate"
            title={proyecto.nombre}
          >
            {proyecto.nombre}
          </span>
        </div>

        {/* Indicador de auto-guardado (honesto) */}
        <div
          className={`flex items-center gap-1.5 text-[11px] px-2 py-1.5 rounded-md border ${
            saveStatus === 'error'
              ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
              : saveStatus === 'saving'
                ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200'
                : saveStatus === 'saved'
                  ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900 text-green-700 dark:text-green-300'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500'
          }`}
          role="status"
          aria-live="polite"
        >
          {saveStatus === 'saving' && <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />}
          {saveStatus === 'saved' && <Check className="w-3 h-3 flex-shrink-0" />}
          {saveStatus === 'error' && <AlertCircle className="w-3 h-3 flex-shrink-0" />}
          {saveStatus === 'idle' && <Cloud className="w-3 h-3 flex-shrink-0" />}
          <span className="leading-snug">
            {saveStatus === 'saving' && 'Guardando en este navegador…'}
            {saveStatus === 'saved' && 'Guardado automático OK'}
            {saveStatus === 'error' && (lastSaveError || 'Error al guardar')}
            {saveStatus === 'idle' && 'Auto-guardado activo'}
          </span>
        </div>

        {/* Pasos completados */}
        <div className="flex flex-wrap gap-1">
          {STEP_NAMES.map((name, i) => {
            const done = i < completados;
            return (
              <span
                key={name}
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  done
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                }`}
              >
                {done && <Check className="w-2.5 h-2.5" />}
                {name}
              </span>
            );
          })}
        </div>

        {renombrará && (
          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug">
            Al guardar se renombrará:{' '}
            <span className="font-semibold text-brand-600 dark:text-brand-400 break-words">
              {nombreDestino}
            </span>
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all active:scale-[0.97] ${
            saveStatus === 'saved'
              ? 'bg-green-500 text-white'
              : 'bg-brand-600 hover:bg-brand-700 text-white'
          }`}
          title="Guarda el proyecto en la lista de Proyectos (también se guarda solo al trabajar)"
        >
          {saveStatus === 'saving' ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando…</>
          ) : saveStatus === 'saved' ? (
            <><Check className="w-3.5 h-3.5" /> Guardado</>
          ) : (
            <><Save className="w-3.5 h-3.5" /> Guardar proyecto</>
          )}
        </button>

        <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 leading-snug">
          Se guarda solo en <b>este navegador</b>. En Proyectos verás todos tus trabajos.
        </p>
      </div>
    </div>
  );
}
