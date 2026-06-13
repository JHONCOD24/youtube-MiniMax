// Barra de estado del proyecto actual en la sidebar.
import { useState } from 'react';
import { useApp } from '../store/useApp';
import { Check, Save, FolderOpen } from 'lucide-react';
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
  const proyectos = useApp((s) => s.proyectos);
  const guardarProyecto = useApp((s) => s.guardarProyecto);
  const [saved, setSaved] = useState(false);
  const completados = pasosCompletados(proyecto);

  // El nombre que se usará al guardar: la idea elegida tiene prioridad
  const nombreDestino = proyecto.ideaElegida?.titulo?.trim() || proyecto.nombre;
  const existente = proyectos.find((p) => p.id === proyecto.id);
  // Solo se creará un proyecto nuevo si ya existía uno guardado con otra idea/nombre.
  const creará = Boolean(existente) && nombreDestino !== existente!.nombre;
  const renombrará = nombreDestino !== proyecto.nombre;

  const handleSave = () => {
    guardarProyecto();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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

        {/* Vista previa del nombre destino cuando es diferente */}
        {renombrará && !saved && (
          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug">
            Se guardará como:{' '}
            <span className="font-semibold text-brand-600 dark:text-brand-400 break-words">
              {nombreDestino}
            </span>
          </p>
        )}

        {/* Botón Guardar */}
        <button
          onClick={handleSave}
          className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all active:scale-[0.97] ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-brand-600 hover:bg-brand-700 text-white'
          }`}
          title={creará
            ? `Crea un proyecto nuevo en Proyectos con el nombre: "${nombreDestino}"`
            : `Actualiza el proyecto guardado: "${nombreDestino}"`}
        >
          {saved ? (
            <><Check className="w-3.5 h-3.5" /> Guardado</>
          ) : (
            <><Save className="w-3.5 h-3.5" /> Guardar proyecto</>
          )}
        </button>

        {/* Confirmación después de guardar */}
        {saved && (
          <p className="text-[10px] text-center text-green-600 dark:text-green-400 font-medium">
            "{nombreDestino}"
          </p>
        )}
      </div>
    </div>
  );
}
