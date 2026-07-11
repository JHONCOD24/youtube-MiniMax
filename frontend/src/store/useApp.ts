// Store global mínimo con Zustand.
// Persistencia: TODO cambio del proyecto se guarda solo en el navegador
// (localStorage): tanto el activo como la lista de Proyectos.
import { create } from 'zustand';
import type { Project, AppSettings, VideoIdea, GeneratedAssets, MonetizationReport, InvestigationReport, KnowledgeDocMeta, VideoPlan } from '../types';
import { KEYS, load, save, type StorageResult } from '../services/storage';
import { calcularPaso, proyectoTieneContenido, resolverGuardadoProyecto, upsertProyectoEnLista } from '../utils/projectHelpers';
import { kbCloneProject, kbPurgeProject } from '../services/kbClient';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface State {
  proyecto: Project;
  settings: AppSettings;
  pasoActual: number;
  backendKeys: { youtube: boolean; gemini: boolean; claude: boolean; mistral: boolean };
  syncingActivos: boolean;
  /** Estado visible del auto-guardado */
  saveStatus: SaveStatus;
  lastSaveError: string;
  lastSavedAt: number | null;
  setBackendKeys: (keys: { youtube: boolean; gemini: boolean; claude: boolean; mistral: boolean }) => void;
  setSyncingActivos: (v: boolean) => void;
  setNicho: (nicho: string, personalizado?: string) => void;
  addKnowledgeDocs: (docs: KnowledgeDocMeta[]) => void;
  removeKnowledgeDoc: (id: string) => void;
  setInvestigacion: (data: InvestigationReport) => void;
  setIdeasGeneradas: (ideas: VideoIdea[]) => void;
  setIdea: (idea: VideoIdea) => void;
  setVideoPlan: (plan: VideoPlan) => void;
  setAssets: (assets: GeneratedAssets) => void;
  updateGuion: (guion: string) => void;
  setMonetizacion: (m: MonetizationReport) => void;
  setPaso: (n: number) => void;
  nuevoProyecto: (nombre?: string) => void;
  cargarProyecto: (id: string) => void;
  importarProyecto: (p: Project) => void;
  eliminarProyecto: (id: string) => void;
  duplicarProyecto: (id: string) => void;
  proyectos: Project[];
  cargarProyectos: () => void;
  /** Guardado explícito (mismo efecto que auto-guardado + renombra con la idea). */
  guardarProyecto: () => void;
  updateSettings: (s: Partial<AppSettings>) => void;
  toggleTema: () => void;
  temaOscuro: boolean;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function crearProyectoVacio(nombre?: string): Project {
  const ahora = new Date().toISOString();
  return {
    id: uid(),
    nombre: nombre || `Proyecto ${new Date().toLocaleDateString('es-ES')}`,
    nicho: '',
    fechaCreacion: ahora,
    fechaModificacion: ahora,
    knowledgeBase: [],
    videoPlan: { formato: 'short', duracionSegundos: 60, preset: 'short_rapido' },
  };
}

const defaultSettings: AppSettings = {
  youtubeKey: '',
  geminiKey: '',
  modeloGemini: 'gemini-2.5-flash',
  claudeKey: '',
  modeloClaude: 'claude-sonnet-4-6',
  mistralKey: '',
  modeloMistral: 'mistral-large-latest',
  proveedorIA: 'gemini',
  onVisitou: false,
};

/** Arranque: recupera activo + lista y los alinea (evita “se borró al recargar”). */
function bootstrap(): { proyecto: Project; proyectos: Project[] } {
  let proyectos = load<Project[]>(KEYS.proyectos, []);
  if (!Array.isArray(proyectos)) proyectos = [];

  let activo = load<Project | null>(KEYS.proyectoActivo, null);

  // Si no hay activo, o está corrupto, usa el más reciente de la lista o crea uno.
  if (!activo || typeof activo !== 'object' || !activo.id) {
    if (proyectos.length > 0) {
      const ordenados = [...proyectos].sort((a, b) =>
        String(b.fechaModificacion || '').localeCompare(String(a.fechaModificacion || '')),
      );
      activo = ordenados[0];
    } else {
      activo = crearProyectoVacio();
    }
  }

  // El activo con contenido siempre debe estar en la lista de Proyectos.
  if (proyectoTieneContenido(activo) || proyectos.some((p) => p.id === activo!.id)) {
    const idx = proyectos.findIndex((p) => p.id === activo!.id);
    if (idx >= 0) {
      // Preferimos la versión MÁS reciente entre lista y activo
      const deLista = proyectos[idx];
      const tActivo = Date.parse(activo.fechaModificacion || '') || 0;
      const tLista = Date.parse(deLista.fechaModificacion || '') || 0;
      if (tActivo >= tLista) {
        proyectos = upsertProyectoEnLista(activo, proyectos);
      } else {
        activo = deLista;
      }
    } else if (proyectoTieneContenido(activo)) {
      proyectos = [...proyectos, activo];
    }
  }

  // Persistimos alineación (por si el activo no estaba en la lista).
  save(KEYS.proyectoActivo, activo);
  save(KEYS.proyectos, proyectos);

  return { proyecto: activo, proyectos };
}

const boot = bootstrap();
const initialSettings = load<AppSettings>(KEYS.settings, defaultSettings);

// --- Persistencia ---
const AUTO_SAVE_MS = 300;
let pendingProyecto: Project | null = null;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let lastSavedJson = JSON.stringify(boot.proyecto);
let savedIdleTimer: ReturnType<typeof setTimeout> | undefined;

function setSaveUi(status: SaveStatus, error = '') {
  store.setState({
    saveStatus: status,
    lastSaveError: error,
    lastSavedAt: status === 'saved' ? Date.now() : store.getState().lastSavedAt,
  });
  if (status === 'saved') {
    if (savedIdleTimer) clearTimeout(savedIdleTimer);
    savedIdleTimer = setTimeout(() => {
      if (store.getState().saveStatus === 'saved') {
        store.setState({ saveStatus: 'idle' });
      }
    }, 2500);
  }
}

/**
 * Escribe proyecto activo + lista de proyectos.
 * Es la única vía de persistencia: auto y botón "Guardar" pasan por aquí.
 */
function persistEverything(proyecto: Project, proyectosLista?: Project[], opts?: { renameWithIdea?: boolean }) {
  const listaBase = proyectosLista ?? store.getState().proyectos;
  const ahora = new Date().toISOString();

  let actualizado: Project;
  let nuevos: Project[];

  if (opts?.renameWithIdea) {
    ({ actualizado, nuevos } = resolverGuardadoProyecto(proyecto, listaBase, ahora));
  } else {
    actualizado = { ...proyecto, fechaModificacion: proyecto.fechaModificacion || ahora };
    // Solo mete a la lista si hay contenido o ya existía
    if (proyectoTieneContenido(actualizado) || listaBase.some((p) => p.id === actualizado.id)) {
      nuevos = upsertProyectoEnLista(actualizado, listaBase);
    } else {
      nuevos = listaBase;
    }
  }

  setSaveUi('saving');
  const r1 = save(KEYS.proyectoActivo, actualizado);
  const r2 = save(KEYS.proyectos, nuevos);

  if (!r1.ok || !r2.ok) {
    const err = (!r1.ok ? (r1 as Extract<StorageResult, { ok: false }>).error : null)
      || (!r2.ok ? (r2 as Extract<StorageResult, { ok: false }>).error : null)
      || 'No se pudo guardar';
    setSaveUi('error', err);
    return { actualizado, nuevos, ok: false as const };
  }

  lastSavedJson = JSON.stringify(actualizado);
  pendingProyecto = null;
  setSaveUi('saved');
  return { actualizado, nuevos, ok: true as const };
}

function flushPendiente(opts?: { renameWithIdea?: boolean }) {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = undefined;
  }
  const proyecto = pendingProyecto || store.getState().proyecto;
  const json = JSON.stringify(proyecto);
  if (json === lastSavedJson && !opts?.renameWithIdea) {
    pendingProyecto = null;
    return;
  }
  const { actualizado, nuevos } = persistEverything(proyecto, store.getState().proyectos, opts);
  // Mantener estado en memoria alineado con lo guardado
  store.setState({ proyecto: actualizado, proyectos: nuevos });
}

/** Guarda YA (sin esperar el debounce). Usar tras investigación, ideas, etc. */
function persistNow(proyecto: Project) {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = undefined;
  }
  pendingProyecto = null;
  const { actualizado, nuevos } = persistEverything(proyecto, store.getState().proyectos);
  store.setState({
    proyecto: actualizado,
    proyectos: nuevos,
    pasoActual: calcularPaso(actualizado),
  });
}

function schedulePersist(proyecto: Project) {
  pendingProyecto = proyecto;
  if (saveTimer) clearTimeout(saveTimer);
  setSaveUi('saving');
  saveTimer = setTimeout(() => {
    saveTimer = undefined;
    flushPendiente();
  }, AUTO_SAVE_MS);
}

const store = create<State>((set, get) => ({
  proyecto: boot.proyecto,
  settings: initialSettings,
  pasoActual: calcularPaso(boot.proyecto),
  temaOscuro: localStorage.getItem(KEYS.theme) === 'dark',
  proyectos: boot.proyectos,
  backendKeys: { youtube: false, gemini: false, claude: false, mistral: false },
  syncingActivos: false,
  saveStatus: 'idle',
  lastSaveError: '',
  lastSavedAt: null,

  setBackendKeys: (keys) => set({ backendKeys: keys }),
  setSyncingActivos: (v) => set({ syncingActivos: v }),

  setNicho: (nicho, personalizado) => {
    const updated = {
      ...get().proyecto,
      nicho,
      nichoPersonalizado: personalizado,
      fechaModificacion: new Date().toISOString(),
    };
    set({ proyecto: updated, pasoActual: 1 });
    persistNow(updated);
  },
  addKnowledgeDocs: (docs) => {
    const base = get().proyecto.knowledgeBase || [];
    const merged = [...base];
    for (const d of docs) {
      if (!merged.some((x) => x.id === d.id)) merged.push(d);
    }
    const updated = { ...get().proyecto, knowledgeBase: merged, fechaModificacion: new Date().toISOString() };
    set({ proyecto: updated });
    persistNow(updated);
  },
  removeKnowledgeDoc: (id) => {
    const base = get().proyecto.knowledgeBase || [];
    const updated = {
      ...get().proyecto,
      knowledgeBase: base.filter((d) => d.id !== id),
      fechaModificacion: new Date().toISOString(),
    };
    set({ proyecto: updated });
    persistNow(updated);
  },
  setInvestigacion: (data) => {
    const updated = {
      ...get().proyecto,
      investigacion: data,
      fechaModificacion: new Date().toISOString(),
    };
    set({ proyecto: updated, pasoActual: 2 });
    persistNow(updated);
  },
  setIdeasGeneradas: (ideas) => {
    const updated = {
      ...get().proyecto,
      ideasGeneradas: ideas,
      fechaModificacion: new Date().toISOString(),
    };
    set({ proyecto: updated });
    persistNow(updated);
  },
  setIdea: (idea) => {
    const updated = {
      ...get().proyecto,
      ideaElegida: idea,
      fechaModificacion: new Date().toISOString(),
    };
    set({ proyecto: updated, pasoActual: 3 });
    persistNow(updated);
  },
  setVideoPlan: (plan) => {
    const updated = {
      ...get().proyecto,
      videoPlan: plan,
      fechaModificacion: new Date().toISOString(),
    };
    set({ proyecto: updated });
    persistNow(updated);
  },
  setAssets: (assets) => {
    const updated = {
      ...get().proyecto,
      assets,
      fechaModificacion: new Date().toISOString(),
    };
    set({ proyecto: updated, pasoActual: 4 });
    persistNow(updated);
  },
  updateGuion: (guion) => {
    const { proyecto } = get();
    if (!proyecto.assets) return;
    const assets = { ...proyecto.assets, guion };
    const updated = { ...proyecto, assets, fechaModificacion: new Date().toISOString() };
    set({ proyecto: updated });
    persistNow(updated);
  },
  setMonetizacion: (m) => {
    const updated = {
      ...get().proyecto,
      monetizacion: m,
      fechaModificacion: new Date().toISOString(),
    };
    set({ proyecto: updated, pasoActual: 5 });
    persistNow(updated);
  },
  setPaso: (n) => set({ pasoActual: n }),

  nuevoProyecto: (nombre) => {
    // Guarda el actual antes de salir (si tiene contenido)
    flushPendiente();
    let lista = get().proyectos;
    const actual = get().proyecto;
    if (proyectoTieneContenido(actual)) {
      const r = persistEverything(actual, lista);
      lista = r.nuevos;
    }
    const p = crearProyectoVacio(nombre);
    save(KEYS.proyectoActivo, p);
    lastSavedJson = JSON.stringify(p);
    set({ proyecto: p, pasoActual: 0, proyectos: lista, saveStatus: 'saved', lastSaveError: '' });
  },

  cargarProyecto: (id) => {
    flushPendiente();
    // Guarda el actual en la lista antes de cambiar
    const actual = get().proyecto;
    if (proyectoTieneContenido(actual)) {
      persistEverything(actual, get().proyectos);
    }
    const lista = load<Project[]>(KEYS.proyectos, get().proyectos);
    const p = lista.find((x) => x.id === id);
    if (!p) return;
    save(KEYS.proyectoActivo, p);
    lastSavedJson = JSON.stringify(p);
    set({ proyecto: p, proyectos: lista, pasoActual: calcularPaso(p), saveStatus: 'saved' });
  },

  importarProyecto: (p) => {
    flushPendiente();
    const pNew: Project = {
      ...p,
      id: uid(),
      fechaModificacion: new Date().toISOString(),
      fechaCreacion: p.fechaCreacion || new Date().toISOString(),
    };
    const lista = upsertProyectoEnLista(pNew, get().proyectos);
    save(KEYS.proyectos, lista);
    save(KEYS.proyectoActivo, pNew);
    lastSavedJson = JSON.stringify(pNew);
    set({ proyectos: lista, proyecto: pNew, pasoActual: calcularPaso(pNew), saveStatus: 'saved' });
  },

  eliminarProyecto: (id) => {
    const restantes = get().proyectos.filter((p) => p.id !== id);
    save(KEYS.proyectos, restantes);
    kbPurgeProject(id).catch((e) => console.warn('No se pudo limpiar la KB del proyecto', e));
    if (get().proyecto.id === id) {
      const p = restantes[0] || crearProyectoVacio();
      save(KEYS.proyectoActivo, p);
      lastSavedJson = JSON.stringify(p);
      set({ proyectos: restantes, proyecto: p, pasoActual: calcularPaso(p) });
    } else {
      set({ proyectos: restantes });
    }
  },

  duplicarProyecto: (id) => {
    const original = get().proyectos.find((p) => p.id === id) || (get().proyecto.id === id ? get().proyecto : null);
    if (!original) return;
    const copiaId = uid();
    const copia: Project = {
      ...original,
      id: copiaId,
      nombre: `${original.nombre} (copia)`,
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString(),
    };
    const lista = upsertProyectoEnLista(copia, get().proyectos);
    save(KEYS.proyectos, lista);
    set({ proyectos: lista });

    kbCloneProject(id, copiaId)
      .then((metas) => {
        if (!metas.length) return;
        const conKb = { ...copia, knowledgeBase: metas };
        const lista2 = upsertProyectoEnLista(conKb, get().proyectos);
        save(KEYS.proyectos, lista2);
        set({ proyectos: lista2 });
      })
      .catch((e) => console.warn('No se pudo copiar la KB del proyecto', e));
  },

  cargarProyectos: () => {
    set({ proyectos: load<Project[]>(KEYS.proyectos, []) });
  },

  guardarProyecto: () => {
    // Guardado manual: fuerza flush + renombra con la idea elegida
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = undefined;
    }
    pendingProyecto = get().proyecto;
    flushPendiente({ renameWithIdea: true });
  },

  updateSettings: (s) => {
    const merged = { ...get().settings, ...s };
    save(KEYS.settings, merged);
    set({ settings: merged });
  },

  toggleTema: () => {
    const next = !get().temaOscuro;
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem(KEYS.theme, next ? 'dark' : 'light');
    set({ temaOscuro: next });
  },
}));

// Auto-guardado: cualquier cambio de proyecto → lista + activo (con debounce suave).
// Los hitos grandes (investigación, ideas…) ya llaman persistNow de inmediato.
store.subscribe((state, prev) => {
  if (state.proyecto === prev.proyecto) return;
  const json = JSON.stringify(state.proyecto);
  if (json === lastSavedJson) return;
  schedulePersist(state.proyecto);
});

if (typeof window !== 'undefined') {
  const flush = () => flushPendiente();
  window.addEventListener('beforeunload', flush);
  // pagehide es más fiable en móviles (Safari) que beforeunload
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}

export const useApp = store;
