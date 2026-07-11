// Layout principal: sidebar en escritorio, menú hamburguesa en móvil.
import { ReactNode, useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Compass, Search, Lightbulb, Wand2, DollarSign, Download, FolderOpen,
  GitCompare, MessageSquareQuote, CalendarDays, Settings, Menu, X, Youtube, Sun, Moon,
  Check, Loader2, AlertCircle,
} from 'lucide-react';
import { useApp } from '../store/useApp';
import { PipelineProgress } from './PipelineProgress';
import { ProjectStatusBar } from './ProjectStatusBar';
import { QuotaIndicator } from './QuotaIndicator';

const NAV = [
  { to: '/', label: 'Inicio', icon: Compass, group: 'Pipeline' },
  { to: '/nicho', label: '1. Nicho', icon: Compass, group: 'Pipeline' },
  { to: '/investigacion', label: '2. Investigación', icon: Search, group: 'Pipeline' },
  { to: '/ideas', label: '3. Ideas', icon: Lightbulb, group: 'Pipeline' },
  { to: '/assets', label: '4. Activos', icon: Wand2, group: 'Pipeline' },
  { to: '/monetizacion', label: '5. Monetización', icon: DollarSign, group: 'Pipeline' },
  { to: '/exportar', label: '6. Exportar', icon: Download, group: 'Pipeline' },
  { to: '/proyectos', label: 'Proyectos', icon: FolderOpen, group: 'Herramientas' },
  { to: '/comparador', label: 'Comparador', icon: GitCompare, group: 'Herramientas' },
  { to: '/hooks', label: 'Banco de hooks', icon: MessageSquareQuote, group: 'Herramientas' },
  { to: '/calendario', label: 'Calendario', icon: CalendarDays, group: 'Herramientas' },
  { to: '/settings', label: 'Ajustes', icon: Settings, group: 'Sistema' },
];

function ProviderToggle() {
  const proveedorIA = useApp((s) => s.settings.proveedorIA);
  const updateSettings = useApp((s) => s.updateSettings);
  return (
    <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs">
      <div className="flex items-center justify-between text-slate-400">
        <span>IA activa</span>
      </div>
      <div className="grid grid-cols-3 gap-1 w-full mt-0.5">
        <button
          onClick={() => updateSettings({ proveedorIA: 'gemini' })}
          title="Google Gemini"
          aria-pressed={proveedorIA === 'gemini'}
          className={`px-2 py-1.5 rounded text-center font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-500 ${proveedorIA === 'gemini' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'}`}
        >
          Gemini
        </button>
        <button
          onClick={() => updateSettings({ proveedorIA: 'claude' })}
          title="Anthropic Claude"
          aria-pressed={proveedorIA === 'claude'}
          className={`px-2 py-1.5 rounded text-center font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-orange-600 ${proveedorIA === 'claude' ? 'bg-orange-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'}`}
        >
          Claude
        </button>
        <button
          onClick={() => updateSettings({ proveedorIA: 'mistral' })}
          title="Mistral AI"
          aria-pressed={proveedorIA === 'mistral'}
          className={`px-2 py-1.5 rounded text-center font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-purple-600 ${proveedorIA === 'mistral' ? 'bg-purple-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'}`}
        >
          Mistral
        </button>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggleTema = useApp((s) => s.toggleTema);
  const temaOscuro = useApp((s) => s.temaOscuro);
  const saveStatus = useApp((s) => s.saveStatus);
  const location = useLocation();

  // Cierra el menú móvil al navegar
  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Top bar móvil */}
      <header className="md:hidden sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center flex-shrink-0">
            <Youtube className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white truncate">Mini MX YouTube</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full ${
              saveStatus === 'error'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                : saveStatus === 'saving'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                  : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
            }`}
            title="Estado del guardado automático"
          >
            {saveStatus === 'saving' && <Loader2 className="w-3 h-3 animate-spin" />}
            {saveStatus === 'error' && <AlertCircle className="w-3 h-3" />}
            {(saveStatus === 'saved' || saveStatus === 'idle') && <Check className="w-3 h-3" />}
            {saveStatus === 'saving' ? 'Guardando' : saveStatus === 'error' ? 'Error' : 'Guardado'}
          </span>
          <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Abrir menú">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:w-64 lg:w-72 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-md">
              <Youtube className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-white">Mini MX YouTube</h1>
              <p className="text-xs text-slate-500">Estudio de nichos virales</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          {Object.entries(groupBy(NAV, 'group')).map(([group, items]) => (
            <div key={group} className="mb-4">
              <p className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">{group}</p>
              {items.map((it) => (
                <NavLink key={it.to} to={it.to} end
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                      isActive
                        ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`
                  }>
                  <it.icon className="w-4 h-4" />
                  {it.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <ProjectStatusBar />
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <ProviderToggle />
          <QuotaIndicator />
          <button onClick={toggleTema} className="w-full btn-ghost justify-start">
            {temaOscuro ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {temaOscuro ? 'Modo claro' : 'Modo oscuro'}
          </button>
        </div>
      </aside>

      {/* Drawer móvil */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-900 shadow-xl flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <span className="font-bold">Menú</span>
              <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3">
              {Object.entries(groupBy(NAV, 'group')).map(([group, items]) => (
                <div key={group} className="mb-4">
                  <p className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase">{group}</p>
                  {items.map((it) => (
                    <NavLink key={it.to} to={it.to} end
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                          isActive
                            ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-semibold'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`
                      }>
                      <it.icon className="w-4 h-4" />
                      {it.label}
                    </NavLink>
                  ))}
                </div>
              ))}
            </nav>
            <ProjectStatusBar />
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <ProviderToggle />
              <QuotaIndicator />
              <button onClick={toggleTema} className="w-full btn-ghost justify-start">
                {temaOscuro ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {temaOscuro ? 'Modo claro' : 'Modo oscuro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenido */}
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <PipelineProgress />
        <div className="flex-1 px-4 py-5 md:px-8 md:py-8 max-w-5xl w-full mx-auto animate-fade-in">{children}</div>
      </main>
    </div>
  );
}

function groupBy<T extends { group: string }>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(item[key]);
    (acc[k] = acc[k] || []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}
