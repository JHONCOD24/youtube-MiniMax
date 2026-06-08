// Modal de onboarding (primera visita).
import { useState } from 'react';
import { useApp } from '../store/useApp';
import { X, Sparkles, Wand2, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function OnboardingModal() {
  const settings = useApp((s) => s.settings);
  const updateSettings = useApp((s) => s.updateSettings);
  const navigate = useNavigate();
  const [open, setOpen] = useState(!settings.onVisitou);

  if (!open) return null;
  const cerrar = () => {
    updateSettings({ onVisitou: true });
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
      <div className="card max-w-lg w-full p-6 relative animate-slide-up">
        <button onClick={cerrar} className="absolute top-3 right-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">¡Bienvenido a Mini MX YouTube!</h2>
            <p className="text-sm text-slate-500">Tu estudio todo-en-uno de nichos virales.</p>
          </div>
        </div>
        <ol className="space-y-3 mb-6">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
            <div><b>Elige un nicho</b> y la app lo investiga con datos reales de YouTube.</div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
            <div><b>Genera ideas, guion, títulos, descripciones y prompts</b> para tu próximo video.</div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
            <div><b>Exporta todo</b> en .md, .txt o .json y empieza a producir.</div>
          </li>
        </ol>
        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={() => { cerrar(); navigate('/settings'); }} className="btn-secondary flex-1">
            Configurar API keys
          </button>
          <button onClick={cerrar} className="btn-primary flex-1">
            <Wand2 className="w-4 h-4" /> Empezar (modo demo)
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-4 text-center">
          💡 Puedes usar la app en <b>modo demo</b> sin keys. Para datos reales, configura YouTube + Gemini en Ajustes.
        </p>
      </div>
    </div>
  );
}
