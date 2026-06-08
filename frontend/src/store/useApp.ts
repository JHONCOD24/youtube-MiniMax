// Store global mínimo con Zustand.
// Maneja: proyecto activo, settings, paso del pipeline.
import { create } from 'zustand';
import type { Project, AppSettings, VideoIdea, GeneratedAssets, MonetizationReport, InvestigationReport, KnowledgeDocMeta, VideoPlan } from '../types';
import { KEYS, load, save } from '../services/storage';

interface State {
  proyecto: Project;
  settings: AppSettings;
  pasoActual: number;
  backendKeys: { youtube: boolean; gemini: boolean; claude: boolean; mistral: boolean };
  syncingActivos: boolean;
  // acciones
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
  guardar: () => void;
  guardarComoNuevo: (nombre: string) => void;
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
  pasoActual: 0,
  temaOscuro: localStorage.getItem(KEYS.theme) === 'dark',
  proyectos: [],
  backendKeys: { youtube: false, gemini: false, claude: false, mistral: false },
  syncingActivos: false,

  setBackendKeys: (keys) => set({ backendKeys: keys }),
  setSyncingActivos: (v) => set({ syncingActivos: v }),

  setNicho: (nicho, personalizado) => {
    const updated = { ...get().proyecto, nicho, nichoPersonalizado: personalizado, fechaModificacion: new Date().toISOString() };
    set({ proyecto: updated, pasoActual: 1 });
    save(KEYS.proyectoActivo, updated);
  },
  addKnowledgeDocs: (docs) => {
    const base = get().proyecto.knowledgeBase || [];
    const merged = [...base];
    for (const d of docs) {
      if (!merged.some((x) => x.id === d.id)) merged.push(d);
    }
    const updated = { ...get().proyecto, knowledgeBase: merged, fechaModificacion: new Date().toISOString() };
    set({ proyecto: updated });
    save(KEYS.proyectoActivo, updated);
  },
  removeKnowledgeDoc: (id) => {
    const base = get().proyecto.knowledgeBase || [];
    const updated = { ...get().proyecto, knowledgeBase: base.filter((d) => d.id !== id), fechaModificacion: new Date().toISOString() };
    set({ proyecto: updated });
    save(KEYS.proyectoActivo, updated);
  },
  setInvestigacion: (data) => {
    const updated = { ...get().proyecto, investigacion: data, fechaModificacion: new Date().toISOString() };
    set({ proyecto: updated, pasoActual: 2 });
    save(KEYS.proyectoActivo, updated);
  },
  setIdeasGeneradas: (ideas) => {
    const updated = { ...get().proyecto, ideasGeneradas: ideas, fechaModificacion: new Date().toISOString() };
    set({ proyecto: updated });
    save(KEYS.proyectoActivo, updated);
  },
  setIdea: (idea) => {
    const updated = { ...get().proyecto, ideaElegida: idea, fechaModificacion: new Date().toISOString() };
    set({ proyecto: updated, pasoActual: 3 });
    save(KEYS.proyectoActivo, updated);
  },
  setVideoPlan: (plan) => {
    const updated = { ...get().proyecto, videoPlan: plan, fechaModificacion: new Date().toISOString() };
    set({ proyecto: updated });
    save(KEYS.proyectoActivo, updated);
  },
  setAssets: (assets) => {
    const updated = { ...get().proyecto, assets, fechaModificacion: new Date().toISOString() };
    set({ proyecto: updated, pasoActual: 4 });
    save(KEYS.proyectoActivo, updated);
  },
  updateGuion: (guion) => {
    const { proyecto, proyectos } = get();
    if (!proyecto.assets) return;
    const assets = { ...proyecto.assets, guion };
    const updated = { ...proyecto, assets, fechaModificacion: new Date().toISOString() };
    // Sincroniza tanto el proyecto activo como la lista de proyectos
    const idx = proyectos.findIndex((p) => p.id === updated.id);
    const nuevos = idx >= 0
      ? [...proyectos.slice(0, idx), updated, ...proyectos.slice(idx + 1)]
      : proyectos;
    save(KEYS.proyectoActivo, updated);
    save(KEYS.proyectos, nuevos);
    set({ proyecto: updated, proyectos: nuevos });
  },
  setMonetizacion: (m) => {
    const updated = { ...get().proyecto, monetizacion: m, fechaModificacion: new Date().toISOString() };
    set({ proyecto: updated, pasoActual: 5 });
    save(KEYS.proyectoActivo, updated);
  },
  setPaso: (n) => set({ pasoActual: n }),

  nuevoProyecto: (nombre) => {
    const p: Project = {
      ...defaultProyecto,
      id: uid(),
      nombre: nombre || `Proyecto ${new Date().toLocaleDateString('es-ES')}`,
    };
    set({ proyecto: p, pasoActual: 0 });
    save(KEYS.proyectoActivo, p);
    get().cargarProyectos();
  },

  cargarProyecto: (id) => {
    const p = get().proyectos.find((x) => x.id === id);
    if (!p) return;
    // Restaura al paso donde quedó
    let paso = 0;
    if (p.investigacion) paso = 2;
    if (p.ideaElegida) paso = 3;
    if (p.assets) paso = 4;
    if (p.monetizacion) paso = 5;
    set({ proyecto: p, pasoActual: paso });
    save(KEYS.proyectoActivo, p);
  },

  importarProyecto: (p) => {
    // Garantiza ID nuevo para no colisionar con proyectos existentes
    const pNew: Project = { ...p, id: uid(), fechaModificacion: new Date().toISOString() };
    const lista = [...get().proyectos, pNew];
    save(KEYS.proyectos, lista);
    set({ proyectos: lista });
    // Lo carga como activo y restaura al paso más avanzado que tenga
    let paso = 0;
    if (pNew.investigacion) paso = 2;
    if (pNew.ideaElegida) paso = 3;
    if (pNew.assets) paso = 4;
    if (pNew.monetizacion) paso = 5;
    set({ proyecto: pNew, pasoActual: paso });
    save(KEYS.proyectoActivo, pNew);
  },

  eliminarProyecto: (id) => {
    const restantes = get().proyectos.filter((p) => p.id !== id);
    save(KEYS.proyectos, restantes);
    if (get().proyecto.id === id) {
      get().nuevoProyecto();
    } else {
      set({ proyectos: restantes });
    }
  },

  duplicarProyecto: (id) => {
    const original = get().proyectos.find((p) => p.id === id);
    if (!original) return;
    const copia: Project = { ...original, id: uid(), nombre: `${original.nombre} (copia)`, fechaCreacion: new Date().toISOString(), fechaModificacion: new Date().toISOString() };
    const lista = [...get().proyectos, copia];
    save(KEYS.proyectos, lista);
    set({ proyectos: lista });
  },

  cargarProyectos: () => {
    set({ proyectos: load<Project[]>(KEYS.proyectos, []) });
  },

  guardar: () => {
    const { proyecto, proyectos } = get();
    save(KEYS.proyectoActivo, proyecto);
    const idx = proyectos.findIndex((p) => p.id === proyecto.id);
    const nuevos = idx >= 0 ? [...proyectos.slice(0, idx), proyecto, ...proyectos.slice(idx + 1)] : [...proyectos, proyecto];
    save(KEYS.proyectos, nuevos);
    set({ proyectos: nuevos });
  },

  guardarComoNuevo: (nombre) => {
    const { proyecto, proyectos } = get();
    // Crea una copia completamente nueva con ID propio — no sobreescribe ningún proyecto existente.
    const copia: Project = {
      ...proyecto,
      id: uid(),
      nombre: nombre.trim() || proyecto.nombre,
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString(),
    };
    const nuevos = [...proyectos, copia];
    save(KEYS.proyectos, nuevos);
    set({ proyectos: nuevos });
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

// Suscribirse a cambios del proyecto para auto-guardar automáticamente
let lastProject = store.getState().proyecto;
store.subscribe((state) => {
  if (JSON.stringify(lastProject) !== JSON.stringify(state.proyecto)) {
    save(KEYS.proyectoActivo, state.proyecto);
    lastProject = state.proyecto;
  }
});

export const useApp = store;
