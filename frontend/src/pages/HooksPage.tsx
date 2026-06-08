// Banco de hooks reutilizables.
import { useState } from 'react';
import { HOOKS_POR_NICHO } from '../data/niches';
import { NICHOS } from '../data/niches';
import { CopyButton } from '../components/CopyButton';
import { MessageSquareQuote, Plus, Trash2 } from 'lucide-react';
import { KEYS, load, save } from '../services/storage';

interface HookItem { id: string; nicho: string; texto: string; }

export function HooksPage() {
  const [nicho, setNicho] = useState(NICHOS[0].nombre);
  const [hooks, setHooks] = useState<HookItem[]>(load(KEYS.hooksBanco, []));
  const [nuevo, setNuevo] = useState('');

  const sugerencias = HOOKS_POR_NICHO[
    Object.keys(HOOKS_POR_NICHO).find((k) => NICHOS.find((n) => n.id === k)?.nombre === nicho) || ''
  ] || [];

  const guardar = (lista: HookItem[]) => {
    setHooks(lista);
    save(KEYS.hooksBanco, lista);
  };

  const agregar = () => {
    const t = nuevo.trim();
    if (!t) return;
    guardar([{ id: Math.random().toString(36).slice(2), nicho, texto: t }, ...hooks]);
    setNuevo('');
  };

  const eliminar = (id: string) => guardar(hooks.filter((h) => h.id !== id));

  const delNicho = hooks.filter((h) => h.nicho === nicho);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Banco de hooks</h1>
        <p className="text-slate-600 dark:text-slate-300">Guarda y reutiliza ganchos de los primeros 3 segundos.</p>
      </header>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium">Nicho:</label>
        <select value={nicho} onChange={(e) => setNicho(e.target.value)} className="input flex-1 min-w-[180px]">
          {NICHOS.map((n) => <option key={n.id} value={n.nombre}>{n.nombre}</option>)}
        </select>
        <span className="chip">{delNicho.length} hooks guardados</span>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-2">
        <input value={nuevo} onChange={(e) => setNuevo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && agregar()}
          placeholder="Escribe un nuevo hook para este nicho…" className="input flex-1" />
        <button onClick={agregar} className="btn-primary"><Plus className="w-4 h-4" /> Agregar</button>
      </div>

      {sugerencias.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold mb-2 flex items-center gap-2"><MessageSquareQuote className="w-4 h-4" /> Sugerencias para este nicho</h3>
          <ul className="space-y-2">
            {sugerencias.map((s, i) => (
              <li key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                <span className="flex-1 text-sm">{s}</span>
                <CopyButton text={s} label="Copiar" />
                <button onClick={() => guardar([{ id: Math.random().toString(36).slice(2), nicho, texto: s }, ...hooks])} className="btn-ghost text-xs">Guardar</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {delNicho.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold mb-2">Tu banco ({nicho})</h3>
          <ul className="space-y-2">
            {delNicho.map((h) => (
              <li key={h.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                <span className="flex-1 text-sm">{h.texto}</span>
                <CopyButton text={h.texto} label="Copiar" />
                <button onClick={() => eliminar(h.id)} className="btn-ghost p-1.5 text-red-500"><Trash2 className="w-4 h-4" /></button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
