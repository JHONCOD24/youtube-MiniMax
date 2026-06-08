// Calendario / planificador de contenido.
import { useState } from 'react';
import { useApp } from '../store/useApp';
import { CalendarDays, Plus, Trash2, GripVertical } from 'lucide-react';
import { formatDate } from '../utils/format';
import { KEYS, load, save } from '../services/storage';

type PlanItem = { id: string; fecha: string; titulo: string; estado: 'idea' | 'guion' | 'grabado' | 'publicado'; nicho?: string };

const KEY = 'ynl.calendario';

export function CalendarioPage() {
  const { proyecto } = useApp();
  const [items, setItems] = useState<PlanItem[]>(load(KEY, []));
  const [nuevo, setNuevo] = useState({ fecha: new Date().toISOString().slice(0, 10), titulo: '', estado: 'idea' as PlanItem['estado'] });
  const [drag, setDrag] = useState<string | null>(null);

  const guardar = (lista: PlanItem[]) => { setItems(lista); save(KEY, lista); };

  const agregar = () => {
    if (!nuevo.titulo.trim()) return;
    guardar([...items, { id: Math.random().toString(36).slice(2), ...nuevo, nicho: proyecto.nicho || undefined }]);
    setNuevo({ ...nuevo, titulo: '' });
  };

  const eliminar = (id: string) => guardar(items.filter((i) => i.id !== id));
  const cambiarEstado = (id: string, estado: PlanItem['estado']) =>
    guardar(items.map((i) => i.id === id ? { ...i, estado } : i));

  const onDragStart = (id: string) => setDrag(id);
  const onDrop = (targetId: string) => {
    if (!drag || drag === targetId) return;
    const arr = [...items];
    const from = arr.findIndex((i) => i.id === drag);
    const to = arr.findIndex((i) => i.id === targetId);
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    guardar(arr);
    setDrag(null);
  };

  const grupos: Record<PlanItem['estado'], PlanItem[]> = { idea: [], guion: [], grabado: [], publicado: [] };
  for (const i of items) grupos[i.estado].push(i);
  for (const k of Object.keys(grupos) as PlanItem['estado'][]) {
    grupos[k].sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Calendario de contenido</h1>
        <p className="text-slate-600 dark:text-slate-300">Arrastra ideas entre columnas según avance tu producción.</p>
      </header>

      <div className="card p-4">
        <h3 className="font-bold mb-2">Nueva entrada</h3>
        <div className="grid sm:grid-cols-12 gap-2">
          <input type="date" value={nuevo.fecha} onChange={(e) => setNuevo({ ...nuevo, fecha: e.target.value })} className="input sm:col-span-3" />
          <input value={nuevo.titulo} onChange={(e) => setNuevo({ ...nuevo, titulo: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && agregar()} placeholder="Título del video…" className="input sm:col-span-7" />
          <button onClick={agregar} className="btn-primary sm:col-span-2"><Plus className="w-4 h-4" /> Agregar</button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {(['idea', 'guion', 'grabado', 'publicado'] as const).map((estado) => (
          <div key={estado}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => drag && cambiarEstado(drag, estado)}
            className="card p-3 min-h-[300px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold capitalize text-sm">{estado}</h3>
              <span className="chip">{grupos[estado].length}</span>
            </div>
            <ul className="space-y-2">
              {grupos[estado].map((it) => (
                <li key={it.id}
                  draggable
                  onDragStart={() => onDragStart(it.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.stopPropagation(); onDrop(it.id); }}
                  className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing">
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{it.titulo}</p>
                      <p className="text-xs text-slate-500">{formatDate(it.fecha)} {it.nicho && `· ${it.nicho}`}</p>
                    </div>
                    <button onClick={() => eliminar(it.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </li>
              ))}
            </ul>
            {grupos[estado].length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">Arrastra aquí</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
