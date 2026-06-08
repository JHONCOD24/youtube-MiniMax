// Calendario / planificador de contenido.
import { useState, useEffect } from 'react';
import { useApp } from '../store/useApp';
import { CalendarDays, Plus, Trash2, GripVertical, Calendar, Sparkles } from 'lucide-react';
import { formatDate } from '../utils/format';
import { KEYS, load, save } from '../services/storage';
import type { PlanItem } from '../types';

const KEY = 'ynl.calendario';

export function CalendarioPage() {
  const { proyecto, proyectos, cargarProyectos } = useApp();
  const [items, setItems] = useState<PlanItem[]>(load(KEY, []));
  const [nuevo, setNuevo] = useState({ fecha: new Date().toISOString().slice(0, 10), titulo: '', estado: 'idea' as PlanItem['estado'] });
  const [drag, setDrag] = useState<string | null>(null);
  const [draggedProject, setDraggedProject] = useState<string | null>(null);

  useEffect(() => {
    cargarProyectos();
  }, [cargarProyectos]);

  const guardar = (lista: PlanItem[]) => { setItems(lista); save(KEY, lista); };

  const agregar = () => {
    if (!nuevo.titulo.trim()) return;
    guardar([...items, { id: Math.random().toString(36).slice(2), ...nuevo, nicho: proyecto.nicho || undefined }]);
    setNuevo({ ...nuevo, titulo: '' });
  };

  const eliminar = (id: string) => guardar(items.filter((i) => i.id !== id));
  
  const cambiarEstado = (id: string, estado: PlanItem['estado']) =>
    guardar(items.map((i) => i.id === id ? { ...i, estado } : i));

  const cambiarFecha = (id: string, fecha: string) =>
    guardar(items.map((i) => i.id === id ? { ...i, fecha } : i));

  const onDragStart = (id: string) => setDrag(id);
  
  const onDrop = (targetId: string) => {
    if (!drag || drag === targetId) return;
    const arr = [...items];
    const from = arr.findIndex((i) => i.id === drag);
    const to = arr.findIndex((i) => i.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    guardar(arr);
    setDrag(null);
  };

  // Cuando se suelta sobre una columna
  const onDropOnColumn = (estado: PlanItem['estado']) => {
    if (draggedProject) {
      const p = proyectos.find((x) => x.id === draggedProject);
      if (p) {
        const titulo = p.ideaElegida?.titulo || p.nombre;
        const nuevoItem: PlanItem = {
          id: Math.random().toString(36).slice(2),
          titulo,
          fecha: new Date().toISOString().slice(0, 10),
          estado,
          nicho: p.nicho || undefined,
        };
        guardar([...items, nuevoItem]);
      }
      setDraggedProject(null);
    } else if (drag) {
      cambiarEstado(drag, estado);
    }
  };

  const grupos: Record<PlanItem['estado'], PlanItem[]> = { idea: [], guion: [], grabado: [], publicado: [] };
  for (const i of items) {
    if (grupos[i.estado]) grupos[i.estado].push(i);
  }
  for (const k of Object.keys(grupos) as PlanItem['estado'][]) {
    grupos[k].sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Calendario de contenido</h1>
        <p className="text-slate-600 dark:text-slate-300">Organiza tu flujo de publicación. Arrastra ideas entre columnas o agenda tus proyectos guardados.</p>
      </header>

      {/* Agregar manual */}
      <div className="card p-4">
        <h3 className="font-bold mb-2 text-sm">Añadir video manualmente</h3>
        <div className="grid sm:grid-cols-12 gap-2">
          <input type="date" value={nuevo.fecha} onChange={(e) => setNuevo({ ...nuevo, fecha: e.target.value })} className="input sm:col-span-3 text-sm" />
          <input value={nuevo.titulo} onChange={(e) => setNuevo({ ...nuevo, titulo: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && agregar()} placeholder="Título del video…" className="input sm:col-span-7 text-sm" />
          <button onClick={agregar} className="btn-primary sm:col-span-2"><Plus className="w-4 h-4" /> Agregar</button>
        </div>
      </div>

      {/* Tablero Kanban */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(['idea', 'guion', 'grabado', 'publicado'] as const).map((estado) => (
          <div key={estado}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDropOnColumn(estado)}
            className="card p-4 min-h-[350px] border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800/80 pb-2">
              <h3 className="font-bold capitalize text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  estado === 'idea' ? 'bg-blue-400' :
                  estado === 'guion' ? 'bg-orange-400' :
                  estado === 'grabado' ? 'bg-purple-400' :
                  'bg-green-400'
                }`} />
                {estado}
              </h3>
              <span className="chip text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">{grupos[estado].length}</span>
            </div>
            <ul className="space-y-2.5 flex-1">
              {grupos[estado].map((it) => (
                <li key={it.id}
                  draggable
                  onDragStart={() => onDragStart(it.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.stopPropagation(); onDrop(it.id); }}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow">
                  <div className="flex items-start gap-2.5">
                    <GripVertical className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate" title={it.titulo}>{it.titulo}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <input
                          type="date"
                          value={it.fecha}
                          onChange={(e) => cambiarFecha(it.id, e.target.value)}
                          className="bg-transparent border-0 text-xs text-slate-500 hover:underline cursor-pointer outline-none w-[95px] dark:text-slate-400 p-0"
                        />
                        {it.nicho && <span className="text-[10px] chip bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 truncate max-w-[80px]" title={it.nicho}>{it.nicho}</span>}
                      </div>
                    </div>
                    <button onClick={() => eliminar(it.id)} className="text-slate-400 hover:text-red-500 transition-colors shrink-0" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </li>
              ))}
            </ul>
            {grupos[estado].length === 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl my-auto bg-white/40 dark:bg-slate-900/5">Arrastra aquí</p>
            )}
          </div>
        ))}
      </div>

      {/* Shelf inferior: Proyectos guardados */}
      <div className="card p-5 border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/10 space-y-4">
        <div className="flex items-start gap-2.5">
          <Calendar className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">Proyectos guardados para calendarizar</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Arrastra tus proyectos a cualquier columna del calendario para programar su publicación. Usará la idea activa del proyecto.
            </p>
          </div>
        </div>

        {proyectos.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 italic text-center py-8">
            No tienes proyectos guardados todavía. Ve al Paso 1 para crear uno y generar su guion.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {proyectos.map((p) => {
              const tieneIdea = !!p.ideaElegida;
              return (
                <div
                  key={p.id}
                  draggable
                  onDragStart={() => setDraggedProject(p.id)}
                  onDragEnd={() => setDraggedProject(null)}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-0.5 transition"
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className="text-[10px] chip bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 font-bold uppercase tracking-wider">{p.nicho || 'Sin nicho'}</span>
                    <Sparkles className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{p.nombre}</p>
                  {tieneIdea ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 border-t border-slate-100 dark:border-slate-800 pt-2 truncate" title={p.ideaElegida?.titulo}>
                      💡 {p.ideaElegida?.titulo}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-2 border-t border-slate-100 dark:border-slate-800 pt-2">
                      Sin idea elegida todavía
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

