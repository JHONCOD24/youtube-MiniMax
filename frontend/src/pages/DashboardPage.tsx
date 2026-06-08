// Página de inicio / dashboard.
import { useApp } from '../store/useApp';
import { OnboardingModal } from '../components/OnboardingModal';
import { useNavigate } from 'react-router-dom';
import {
  Compass, Search, Lightbulb, Wand2, DollarSign, Download, Sparkles, ArrowRight, FolderOpen, Check,
} from 'lucide-react';

const PASOS = [
  { num: 0, label: 'Nicho', desc: 'Elige o define tu nicho.', icon: Compass, to: '/nicho' },
  { num: 1, label: 'Investigación', desc: 'Top videos, outliers, competencia.', icon: Search, to: '/investigacion' },
  { num: 2, label: 'Ideas', desc: '10 ideas con potencial viral.', icon: Lightbulb, to: '/ideas' },
  { num: 3, label: 'Activos', desc: 'Títulos, guion, prompts.', icon: Wand2, to: '/assets' },
  { num: 4, label: 'Monetización', desc: 'Estrategia de ingresos.', icon: DollarSign, to: '/monetizacion' },
  { num: 5, label: 'Exportar', desc: '.md, .txt, .json, historial.', icon: Download, to: '/exportar' },
];

export function DashboardPage() {
  const { proyecto, pasoActual } = useApp();
  const navigate = useNavigate();

  return (
    <>
      <OnboardingModal />
      <div className="space-y-8">
        {/* Hero */}
        <div className="card p-6 md:p-8 bg-gradient-to-br from-brand-500/10 via-accent-500/10 to-transparent">
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 text-sm font-semibold mb-2">
            <Sparkles className="w-4 h-4" /> Tu estudio de nichos virales
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-2">
            De idea suelta a video listo para publicar.
          </h1>
          <p className="text-slate-600 dark:text-slate-300 max-w-2xl">
            Investiga nichos con datos reales de YouTube, genera ideas, guiones, títulos,
            descripciones SEO y prompts para tus herramientas de creación. Todo en español, paso a paso.
          </p>
          {proyecto.nicho && (
            <div className="mt-4 inline-flex items-center gap-2 chip bg-white/50 dark:bg-slate-800/50">
              <span className="font-semibold">Proyecto activo:</span> {proyecto.nombre} · {proyecto.nicho}
            </div>
          )}
        </div>

        {/* Pipeline resumen */}
        <div>
          <h2 className="text-lg font-bold mb-3">Tu pipeline</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PASOS.map((p) => {
              const activo = p.num === pasoActual;
              const completado = p.num < pasoActual;
              return (
                <button key={p.num} onClick={() => navigate(p.to)}
                  className={`card p-4 text-left transition hover:shadow-md hover:-translate-y-0.5 ${
                    activo ? 'ring-2 ring-brand-500' : ''
                  }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      activo ? 'bg-brand-600 text-white' :
                      completado ? 'bg-green-100 dark:bg-green-900/40 text-green-600' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {completado ? <Check className="w-5 h-5" /> : <p.icon className="w-5 h-5" />}
                    </div>
                    {activo && <span className="chip bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300">Actual</span>}
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{p.label}</h3>
                  <p className="text-sm text-slate-500 mb-3">{p.desc}</p>
                  <div className="flex items-center text-sm text-brand-600 dark:text-brand-400 font-medium">
                    Ir <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Atajos */}
        <div className="grid sm:grid-cols-2 gap-3">
          <button onClick={() => navigate('/proyectos')} className="card p-5 text-left hover:shadow-md transition flex items-center gap-3">
            <FolderOpen className="w-6 h-6 text-accent-500" />
            <div>
              <h3 className="font-semibold">Mis proyectos</h3>
              <p className="text-sm text-slate-500">Abre, duplica o elimina proyectos guardados.</p>
            </div>
          </button>
          <button onClick={() => navigate('/settings')} className="card p-5 text-left hover:shadow-md transition flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-brand-500" />
            <div>
              <h3 className="font-semibold">Conectar APIs</h3>
              <p className="text-sm text-slate-500">Configura tus keys de YouTube y Gemini.</p>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
