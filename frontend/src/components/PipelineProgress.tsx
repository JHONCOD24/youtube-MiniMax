// Barra de progreso del pipeline — responsive y compacta en móvil.
import { useApp } from '../store/useApp';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

const STEPS = [
  { num: 0, label: 'Nicho',        short: 'Nicho',  to: '/nicho' },
  { num: 1, label: 'Investigación',short: 'Invest.',to: '/investigacion' },
  { num: 2, label: 'Ideas',        short: 'Ideas',  to: '/ideas' },
  { num: 3, label: 'Activos',      short: 'Activos',to: '/assets' },
  { num: 4, label: 'Monetización', short: 'Monet.', to: '/monetizacion' },
  { num: 5, label: 'Exportar',     short: 'Export.',to: '/exportar' },
];

export function PipelineProgress() {
  const pasoActual = useApp((s) => s.pasoActual);
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
      <div className="flex items-center gap-0.5 px-3 md:px-6 py-2.5 min-w-max">
        {STEPS.map((s, i) => {
          const activo    = s.num === pasoActual;
          const completado = s.num < pasoActual;

          return (
            <div key={s.num} className="flex items-center">
              <button
                onClick={() => navigate(s.to)}
                title={s.label}
                className={`flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3.5 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                  activo
                    ? 'bg-brand-600 text-white shadow-sm'
                    : completado
                    ? 'text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20'
                    : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {/* Indicador de número/check */}
                <span className={`w-5 h-5 md:w-5 md:h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                  activo
                    ? 'bg-white/25 text-white'
                    : completado
                    ? 'bg-brand-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}>
                  {completado ? <Check className="w-3 h-3" /> : s.num + 1}
                </span>

                {/* Label: corto en móvil, completo en desktop */}
                <span className="md:hidden">{s.short}</span>
                <span className="hidden md:inline">{s.label}</span>
              </button>

              {/* Separador */}
              {i < STEPS.length - 1 && (
                <span className={`w-4 md:w-6 h-px mx-1 flex-shrink-0 ${
                  s.num < pasoActual ? 'bg-brand-400' : 'bg-slate-200 dark:bg-slate-700'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
