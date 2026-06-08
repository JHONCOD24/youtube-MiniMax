// Calendario / planificador de contenido.
import { useState, useEffect } from 'react';
import { useApp } from '../store/useApp';
import { 
  CalendarDays, Plus, Trash2, GripVertical, Calendar, Sparkles, 
  ChevronLeft, ChevronRight, LayoutGrid, Kanban, Clock, X, Info
} from 'lucide-react';
import { formatDate } from '../utils/format';
import { load, save } from '../services/storage';
import type { PlanItem } from '../types';

const KEY = 'ynl.calendario';

export function CalendarioPage() {
  const { proyecto, proyectos, cargarProyectos } = useApp();
  const [items, setItems] = useState<PlanItem[]>(load(KEY, []));
  const [viewMode, setViewMode] = useState<'calendar' | 'kanban'>('calendar');
  
  // Navegación de fecha del calendario mensual
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Drag and drop states
  const [drag, setDrag] = useState<string | null>(null); // Kanban item drag
  const [draggedProject, setDraggedProject] = useState<string | null>(null); // Project shelf drag
  const [draggedPlanItemId, setDraggedPlanItemId] = useState<string | null>(null); // Calendar item reschedule drag
  const [dragOverDate, setDragOverDate] = useState<string | null>(null); // Hover feedback on calendar grid cells

  // Modal para agregar / editar
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingItem, setEditingItem] = useState<PlanItem | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDate, setModalDate] = useState('');
  const [modalTime, setModalTime] = useState('');
  const [modalStatus, setModalStatus] = useState<PlanItem['estado']>('idea');
  const [modalNicho, setModalNicho] = useState('');

  useEffect(() => {
    cargarProyectos();
  }, [cargarProyectos]);

  const guardar = (lista: PlanItem[]) => {
    setItems(lista);
    save(KEY, lista);
  };

  const eliminar = (id: string) => guardar(items.filter((i) => i.id !== id));
  
  const cambiarEstado = (id: string, estado: PlanItem['estado']) =>
    guardar(items.map((i) => i.id === id ? { ...i, estado } : i));

  const cambiarFecha = (id: string, fecha: string) =>
    guardar(items.map((i) => i.id === id ? { ...i, fecha } : i));

  // --- LÓGICA DE DRAG & DROP EN CALENDARIO GRIDS ---
  const handleDropOnDay = (dateStr: string) => {
    if (draggedProject) {
      // Arrastrar un proyecto guardado para agendarlo
      const p = proyectos.find((x) => x.id === draggedProject);
      if (p) {
        const titulo = p.ideaElegida?.titulo || p.nombre;
        const newItem: PlanItem = {
          id: Math.random().toString(36).slice(2),
          titulo,
          fecha: dateStr,
          hora: '12:00', // hora por defecto
          estado: 'idea',
          nicho: p.nicho || undefined,
        };
        guardar([...items, newItem]);
      }
      setDraggedProject(null);
    } else if (draggedPlanItemId) {
      // Arrastrar un item ya calendarizado para cambiar su fecha
      const updated = items.map((it) => 
        it.id === draggedPlanItemId ? { ...it, fecha: dateStr } : it
      );
      guardar(updated);
      setDraggedPlanItemId(null);
    }
    setDragOverDate(null);
  };

  // --- MODAL ACCIONES ---
  const openAddModal = (dateStr: string) => {
    setModalMode('add');
    setEditingItem(null);
    setModalTitle('');
    setModalDate(dateStr);
    setModalTime('12:00');
    setModalStatus('idea');
    setModalNicho(proyecto.nicho || '');
    setModalOpen(true);
  };

  const openEditModal = (item: PlanItem) => {
    setModalMode('edit');
    setEditingItem(item);
    setModalTitle(item.titulo);
    setModalDate(item.fecha);
    setModalTime(item.hora || '12:00');
    setModalStatus(item.estado);
    setModalNicho(item.nicho || '');
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!modalTitle.trim()) return;
    
    if (modalMode === 'add') {
      const newItem: PlanItem = {
        id: Math.random().toString(36).slice(2),
        titulo: modalTitle.trim(),
        fecha: modalDate,
        hora: modalTime || undefined,
        estado: modalStatus,
        nicho: modalNicho || undefined
      };
      guardar([...items, newItem]);
    } else if (modalMode === 'edit' && editingItem) {
      const updated = items.map(it => 
        it.id === editingItem.id 
          ? { 
              ...it, 
              titulo: modalTitle.trim(), 
              fecha: modalDate, 
              hora: modalTime || undefined, 
              estado: modalStatus, 
              nicho: modalNicho || undefined 
            }
          : it
      );
      guardar(updated);
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (editingItem) {
      eliminar(editingItem.id);
      setModalOpen(false);
    }
  };

  // --- NAVEGACIÓN MES ---
  const changeMonth = (offset: number) => {
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(next);
  };

  const goToday = () => {
    setCurrentDate(new Date());
  };

  const formatMonthYear = (date: Date) => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${meses[date.getMonth()]} ${date.getFullYear()}`;
  };

  // --- GENERAR CELDAS DEL CALENDARIO ---
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const firstDayIndex = (firstDay.getDay() + 6) % 7; // Lunes es 0, Domingo es 6
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const cells: { date: string; dayNum: number; isCurrent: boolean; key: string }[] = [];
    
    // Relleno de días del mes anterior
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDay = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, prevDay);
      // Ajuste de offset de fecha local
      const offset = prevDate.getTimezoneOffset();
      const localDate = new Date(prevDate.getTime() - (offset * 60 * 1000));
      const dateStr = localDate.toISOString().slice(0, 10);
      cells.push({
        date: dateStr,
        dayNum: prevDay,
        isCurrent: false,
        key: `prev-${prevDay}`
      });
    }
    
    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      const currDate = new Date(year, month, i);
      const offset = currDate.getTimezoneOffset();
      const localDate = new Date(currDate.getTime() - (offset * 60 * 1000));
      const dateStr = localDate.toISOString().slice(0, 10);
      cells.push({
        date: dateStr,
        dayNum: i,
        isCurrent: true,
        key: `curr-${i}`
      });
    }
    
    // Relleno de días del mes siguiente (para completar la cuadrícula de 42 celdas)
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const offset = nextDate.getTimezoneOffset();
      const localDate = new Date(nextDate.getTime() - (offset * 60 * 1000));
      const dateStr = localDate.toISOString().slice(0, 10);
      cells.push({
        date: dateStr,
        dayNum: i,
        isCurrent: false,
        key: `next-${i}`
      });
    }
    
    return cells;
  };

  const cells = getDaysInMonth(currentDate);

  // --- MANEJO KANBAN (CÓDIGO ORIGINAL CONSERVADO) ---
  const onDragStartKanban = (id: string) => setDrag(id);
  
  const onDropKanban = (targetId: string) => {
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
      {/* Encabezado */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Calendario de Contenido</h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm">
            Organiza tu flujo de publicación de forma mensual o en columnas Kanban. Programa fechas y horas exactas.
          </p>
        </div>
        
        {/* Toggle de vistas */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 self-start md:self-auto border border-slate-200 dark:border-slate-700">
          <button 
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'calendar' 
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Mes
          </button>
          <button 
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'kanban' 
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            Tablero
          </button>
        </div>
      </header>

      {/* VISTA CALENDARIO MENSUAL */}
      {viewMode === 'calendar' && (
        <div className="space-y-4 animate-slide-up">
          {/* Navegador del Calendario */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {formatMonthYear(currentDate)}
            </h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => changeMonth(-1)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={goToday}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                Hoy
              </button>
              <button 
                onClick={() => changeMonth(1)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
            <Info className="w-3.5 h-3.5 text-brand-500 shrink-0" />
            <span>Haz clic en cualquier celda para añadir una tarea, o arrastra un proyecto para programarlo.</span>
          </div>

          {/* Cuadrícula de Calendario */}
          <div className="overflow-x-auto">
            <div className="min-w-[760px] space-y-1 bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              {/* Días de la semana */}
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 py-2">
                <div>Lun</div>
                <div>Mar</div>
                <div>Mié</div>
                <div>Jue</div>
                <div>Vie</div>
                <div>Sáb</div>
                <div>Dom</div>
              </div>

              {/* Días del mes */}
              <div className="grid grid-cols-7 gap-1.5 bg-slate-50/50 dark:bg-slate-950/20 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                {cells.map((cell) => {
                  const dayItems = items.filter((it) => it.fecha === cell.date);
                  dayItems.sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
                  const isToday = cell.date === new Date().toISOString().slice(0, 10);
                  const isHovered = dragOverDate === cell.date;
                  
                  return (
                    <div
                      key={cell.key}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnter={() => setDragOverDate(cell.date)}
                      onDragLeave={() => setDragOverDate(null)}
                      onDrop={() => handleDropOnDay(cell.date)}
                      onClick={() => openAddModal(cell.date)}
                      className={`min-h-[110px] p-2 rounded-xl flex flex-col justify-between transition-all border cursor-pointer ${
                        cell.isCurrent 
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100' 
                          : 'bg-slate-50/40 dark:bg-slate-900/10 border-slate-100/50 dark:border-slate-800/30 text-slate-400 dark:text-slate-600'
                      } ${
                        isToday ? 'ring-2 ring-brand-500 bg-brand-50/20 dark:bg-brand-900/10 border-transparent' : ''
                      } ${
                        isHovered ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500 shadow-sm scale-[0.99]' : ''
                      } hover:shadow-sm`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold w-5.5 h-5.5 rounded-full flex items-center justify-center ${
                          isToday ? 'bg-brand-500 text-white' : ''
                        }`}>
                          {cell.dayNum}
                        </span>
                        {dayItems.length > 0 && (
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                            {dayItems.length} {dayItems.length === 1 ? 'Video' : 'Videos'}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1 mt-1.5 space-y-1 overflow-y-auto max-h-[72px] pr-0.5 scrollbar-thin">
                        {dayItems.map((it) => (
                          <div
                            key={it.id}
                            draggable
                            onDragStart={(e) => {
                              e.stopPropagation();
                              setDraggedPlanItemId(it.id);
                            }}
                            onDragEnd={() => setDraggedPlanItemId(null)}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(it);
                            }}
                            className={`group w-full text-left px-2 py-0.5 rounded text-[10px] truncate flex items-center justify-between transition cursor-grab active:cursor-grabbing border ${
                              it.estado === 'idea' ? 'bg-blue-50/60 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/40 hover:bg-blue-100/40' :
                              it.estado === 'guion' ? 'bg-orange-50/60 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border-orange-100 dark:border-orange-900/40 hover:bg-orange-100/40' :
                              it.estado === 'grabado' ? 'bg-purple-50/60 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-900/40 hover:bg-purple-100/40' :
                              'bg-green-50/60 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/40 hover:bg-green-100/40'
                            }`}
                            title={`${it.hora ? `${it.hora} - ` : ''}${it.titulo}`}
                          >
                            <span className="truncate flex-1 font-semibold">{it.titulo}</span>
                            {it.hora ? (
                              <span className="text-[8px] opacity-75 font-bold font-mono ml-1.5 bg-white/60 dark:bg-slate-800 px-0.5 rounded shrink-0">
                                {it.hora}
                              </span>
                            ) : (
                              <Clock className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA TABLERO KANBAN (ORIGINAL POLISH) */}
      {viewMode === 'kanban' && (
        <div className="space-y-4 animate-slide-up">
          {/* Agregar manual */}
          <div className="card p-4">
            <h3 className="font-bold mb-2 text-sm">Añadir video manualmente</h3>
            <div className="grid sm:grid-cols-12 gap-2">
              <input 
                type="date" 
                value={modalDate} 
                onChange={(e) => setModalDate(e.target.value)} 
                className="input sm:col-span-3 text-sm" 
              />
              <input 
                value={modalTitle} 
                onChange={(e) => setModalTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && modalTitle.trim()) {
                    const newItem: PlanItem = {
                      id: Math.random().toString(36).slice(2),
                      titulo: modalTitle.trim(),
                      fecha: modalDate || new Date().toISOString().slice(0, 10),
                      estado: 'idea',
                      nicho: proyecto.nicho || undefined
                    };
                    guardar([...items, newItem]);
                    setModalTitle('');
                  }
                }} 
                placeholder="Título del video…" 
                className="input sm:col-span-7 text-sm" 
              />
              <button 
                onClick={() => {
                  if (modalTitle.trim()) {
                    const newItem: PlanItem = {
                      id: Math.random().toString(36).slice(2),
                      titulo: modalTitle.trim(),
                      fecha: modalDate || new Date().toISOString().slice(0, 10),
                      estado: 'idea',
                      nicho: proyecto.nicho || undefined
                    };
                    guardar([...items, newItem]);
                    setModalTitle('');
                  }
                }} 
                className="btn-primary sm:col-span-2"
              >
                <Plus className="w-4 h-4" /> Agregar
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['idea', 'guion', 'grabado', 'publicado'] as const).map((estado) => (
              <div 
                key={estado}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDropOnColumn(estado)}
                className="card p-4 min-h-[350px] border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 flex flex-col"
              >
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
                  <span className="chip text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                    {grupos[estado].length}
                  </span>
                </div>
                <ul className="space-y-2.5 flex-1">
                  {grupos[estado].map((it) => (
                    <li 
                      key={it.id}
                      draggable
                      onDragStart={() => onDragStartKanban(it.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.stopPropagation(); onDropKanban(it.id); }}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start gap-2.5">
                        <GripVertical className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0" onClick={() => openEditModal(it)}>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate cursor-pointer hover:text-brand-500" title={it.titulo}>
                            {it.titulo}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-1 rounded flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              {it.fecha}
                            </span>
                            {it.hora && (
                              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-1 rounded flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {it.hora}
                              </span>
                            )}
                            {it.nicho && (
                              <span className="text-[10px] chip bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 truncate max-w-[80px]" title={it.nicho}>
                                {it.nicho}
                              </span>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => eliminar(it.id)} 
                          className="text-slate-400 hover:text-red-500 transition-colors shrink-0" 
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                {grupos[estado].length === 0 && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl my-auto bg-white/40 dark:bg-slate-900/5">
                    Arrastra aquí
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shelf inferior: Proyectos guardados */}
      <div className="card p-5 border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/10 space-y-4">
        <div className="flex items-start gap-2.5">
          <Calendar className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
              Proyectos guardados para calendarizar
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Arrastra tus proyectos a cualquier día en el calendario o columna en el tablero para programar su publicación. Usará la idea activa del proyecto.
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
                    <span className="text-[10px] chip bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 font-bold uppercase tracking-wider">
                      {p.nicho || 'Sin nicho'}
                    </span>
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

      {/* MODAL AGREGAR / EDITAR */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md p-6 space-y-4 animate-slide-up relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button 
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-500" />
              {modalMode === 'add' ? 'Programar Video' : 'Editar Programación'}
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Título del Video
                </label>
                <input 
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="Ej: 5 Trucos secretos de productividad..."
                  className="input w-full"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Fecha
                  </label>
                  <input 
                    type="date"
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Hora de Publicación
                  </label>
                  <input 
                    type="time"
                    value={modalTime}
                    onChange={(e) => setModalTime(e.target.value)}
                    className="input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Estado de Producción
                </label>
                <select 
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value as PlanItem['estado'])}
                  className="input w-full capitalize bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="idea">💡 Idea</option>
                  <option value="guion">📝 Guion</option>
                  <option value="grabado">🎙️ Grabado</option>
                  <option value="publicado">✅ Publicado</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Nicho / Categoría
                </label>
                <input 
                  value={modalNicho}
                  onChange={(e) => setModalNicho(e.target.value)}
                  placeholder="Ej: Finanzas, Tecnología..."
                  className="input w-full"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              {modalMode === 'edit' ? (
                <button 
                  onClick={handleDelete}
                  className="btn bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold px-4"
                  title="Eliminar programación"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : <div />}
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary text-sm"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  disabled={!modalTitle.trim()}
                  className="btn-primary text-sm"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
