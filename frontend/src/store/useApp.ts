// Store global mínimo con Zustand.
// Maneja: proyecto activo, settings, paso del pipeline.
import { create } from 'zustand';
import type { Project, AppSettings, VideoIdea, GeneratedAssets, MonetizationReport, InvestigationReport, KnowledgeDocMeta, VideoPlan } from '../types';
import { KEYS, load, save } from '../services/storage';
import { calcularPaso, resolverGuardadoProyecto } from '../utils/projectHelpers';
import { kbCloneProject, kbPurgeProject } from '../services/kbClient';

interface State {
  proyecto: Project;
  settings: AppSettings;
  pasoActual: number;
  backendKeys: { youtube: boolean; gemini: boolean; claude: boolean; mistral: boolean };
  syncingActivos: boolean;
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
  guardarProyecto: () => void;
  updateSettings: (s: Partial<AppSettings>) => void;
  toggleTema: () => void;
  temaOscuro: boolean;
}

function uid() { return Math.random().toString(36).slice(2, 10); }

const defaultProyecto: Project = {
  id: uid(),
  nombre: 'Nuevo proyecto',
  nicho: '',
  fechaCreacion: new Date().toISOString(),
  fechaModificacion: new Date().toISOString(),
  knowledgeBase: [],
  videoPlan: { formato: 'short', duracionSegundos: 60, preset: 'short_rapido' },
};

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

const initialProyecto = load<Project>(KEYS.proyectoActivo, defaultProyecto);
const initialSettings = load<AppSettings>(KEYS.settings, defaultSettings);

const store = create<State>((set, get) => ({
  proyecto: initialProyecto,
  settings: initialSettings,
  pasoActual: calcularPaso(initialProyecto),
  temaOscuro: localStorage.getItem(KEYS.theme) === 'dark',
  proyectos: [],
  backendKeys: { youtube: false, gemini: false, claude: false, mistral: false },
  syncingActivos: false,

  setBackendKeys: (keys) => set({ backendKeys: keys }),
  setSyncingActivos: (v) => set({ syncingActivos: v }),

  setNicho: (nicho, personalizado) => {
    const updated = { ...get().proyecto, nicho, nichoPersonalizado: personalizado, fechaModificacion: new Date().toISOString() };
    set({ proyecto: updated, pasoActual: 1 });
  },
  addKnowledgeDocs: (docs) => {
    const base = get().proyecto.knowledgeBase || [];
    const merged = [...base];
    for (const d of docs) {
      if (!merged.some((x) => x.id === d.id)) merged.push(d);
    }
    const updated = { ...get().proyecto, knowledgeBase: merged, fechaModificacion: new Date().toISOString() };
    set({ proyecto: updated });
  },
  removeKnowledgeDoc: (id) => {
    const base = get().proyecto.knowledgeBase || [];
    const updated = { ...get().proyecto, knowledgeBase: base.filter((d) => d.id !== id), fechaModificacion: new Date().toISOString() };
    set({ proyecto: updated });
  },
  setInvestigacion: (data) => {
    const updated = { ...get().proyecto, investigacion: data, fechaModificacion: new Date().toISOString() };
    set({ proyecto: updated, pasoActual: 2 });
  },
  setIdeasGeneradas: (ideas) => {
    const updated = { ...get().proyecto, ideasGeneradas: ideas, fechaModificacion: new Date().toISOString() };
    set({ proyecto: updated });
  },
  setIdea: (idea) => {
    const updated = { ...get().proyecto, ideaElegida: idea, fechaModificacion: new Date().toISOString() };
    set({ proyecto: updated, pasoActual: 3 });
  },
  setVideoPlan: (plan) => {
    const updated = { ...get().proyecto, videoPlan: plan, fechaModificacion: new Date().toISOString() };
    set({ proyecto: updated });
  },
  setAssets: (assets) => {
    const updated = { ...get().proyecto, assets, fechaModificacion: new Date().toISOString() };
    set({ proyecto: updated, pasoActual: 4 });
  },
  updateGuion: (guion) => {
    const { proyecto, proyectos } = get();
    if (!proyecto.assets) return;
    const assets = { ...proyecto.assets, guion };
    const updated = { ...proyecto, assets, fechaModificacion: new Date().toISOString() };
    const idx = proyectos.findIndex((p) => p.id === updated.id);
    const nuevos = idx >= 0
      ? [...proyectos.slice(0, idx), updated, ...proyectos.slice(idx + 1)]
      : proyectos;
    save(KEYS.proyectos, nuevos);
    set({ proyecto: updated, proyectos: nuevos });
  },
  setMonetizacion: (m) => {
    const updated = { ...get().proyecto, monetizacion: m, fechaModificacion: new Date().toISOString() };
    set({ proyecto: updated, pasoActual: 5 });
  },
  setPaso: (n) => set({ pasoActual: n }),

  nuevoProyecto: (nombre) => {
    const p: Project = {
      ...defaultProyecto,
      id: uid(),
      nombre: nombre || `Proyecto ${new Date().toLocaleDateString('es-ES')}`,
    };
    set({ proyecto: p, pasoActual: 0 });
    persistProyectoActivo(p);
    get().cargarProyectos();
  },

  cargarProyecto: (id) => {
    const p = get().proyectos.find((x) => x.id === id);
    if (!p) return;
    set({ proyecto: p, pasoActual: calcularPaso(p) });
    persistProyectoActivo(p);
  },

  importarProyecto: (p) => {
    const pNew: Project = { ...p, id: uid(), fechaModificacion: new Date().toISOString() };
    const lista = [...get().proyectos, pNew];
    save(KEYS.proyectos, lista);
    set({ proyectos: lista, proyecto: pNew, pasoActual: calcularPaso(pNew) });
    persistProyectoActivo(pNew);
  },

  eliminarProyecto: (id) => {
    const restantes = get().proyectos.filter((p) => p.id !== id);
    save(KEYS.proyectos, restantes);
    kbPurgeProject(id).catch((e) => console.warn('No se pudo limpiar la KB del proyecto', e));
    if (get().proyecto.id === id) {
      get().nuevoProyecto();
    } else {
      set({ proyectos: restantes });
    }
  },

  duplicarProyecto: (id) => {
    const original = get().proyectos.find((p) => p.id === id);
    if (!original) return;
    const copiaId = uid();
    const copia: Project = {
      ...original,
      id: copiaId,
      nombre: `${original.nombre} (copia)`,
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString(),
    };
    const lista = [...get().proyectos, copia];
    save(KEYS.proyectos, lista);
    set({ proyectos: lista });

    kbCloneProject(id, copiaId)
      .then((metas) => {
        if (!metas.length) return;
        set({
          proyectos: get().proyectos.map((p) =>
            p.id === copiaId ? { ...p, knowledgeBase: metas } : p,
          ),
        });
        if (get().proyecto.id === copiaId) {
          set({ proyecto: { ...get().proyecto, knowledgeBase: metas } });
        }
      })
      .catch((e) => console.warn('No se pudo copiar la KB del proyecto', e));
  },

  cargarProyectos: () => {
    set({ proyectos: load<Project[]>(KEYS.proyectos, []) });
  },

  guardarProyecto: () => {
    const { proyecto, proyectos } = get();
    const ahora = new Date().toISOString();
    const { actualizado, nuevos } = resolverGuardadoProyecto(proyecto, proyectos, ahora, uid);
    persistProyectoActivo(actualizado);
    save(KEYS.proyectos, nuevos);
    set({ proyecto: actualizado, proyectos: nuevos });
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

// Auto-guardado con debounce: un solo punto de persistencia para el proyecto activo.
const AUTO_SAVE_MS = 400;
let pendingProyecto: Project | null = null;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let lastSavedJson = JSON.stringify(store.getState().proyecto);

function persistProyectoActivo(proyecto: Project) {
  pendingProyecto = null;
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = undefined;
  }
  save(KEYS.proyectoActivo, proyecto);
  lastSavedJson = JSON.stringify(proyecto);
}

function flushProyectoActivo() {
  if (!pendingProyecto) return;
  const json = JSON.stringify(pendingProyecto);
  if (json === lastSavedJson) {
    pendingProyecto = null;
    return;
  }
  persistProyectoActivo(pendingProyecto);
  pendingProyecto = null;
}

store.subscribe((state) => {
  const json = JSON.stringify(state.proyecto);
  if (json === lastSavedJson) return;
  pendingProyecto = state.proyecto;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = undefined;
    flushProyectoActivo();
  }, AUTO_SAVE_MS);
});

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => flushProyectoActivo());
}

export const useApp = store;