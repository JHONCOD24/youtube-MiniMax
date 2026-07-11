import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  X, Save, RotateCcw, Copy, Check, Eye, Edit3,
  FileText, Mic2, Clock, Layers, ChevronLeft, ChevronRight,
  AlertCircle, Sparkles, Loader2, RefreshCw,
} from 'lucide-react';
import { useApp } from '../store/useApp';
import { useProveedorIA } from '../hooks/useProveedorIA';
import { copyToClipboard } from '../utils/format';
import { regenerarActivosDesdeGuion } from '../services/geminiClient';
import { kbBuildContext } from '../services/kbClient';

// ─── Parser de escenas ────────────────────────────────────────────────────────
interface SceneRow { label: string; time: string; visual: string; narration: string; }

function toSec(s: string): number {
  const t = s.trim().replace(/\s/g, '');
  if (t.includes(':')) { const [m, sec] = t.split(':').map(Number); return (m || 0) * 60 + (sec || 0); }
  const n = parseInt(t.replace(/[^0-9]/g, ''), 10);
  return Number.isNaN(n) ? 0 : n;
}
function fmt(sec: number): string { return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; }
function extractTime(h: string): string {
  const p = h.match(/\(([^)]+)\)/);
  if (!p) return '';
  const inner = p[1].trim();
  if (/^al\s+final/i.test(inner)) return 'Final';
  const range = inner.match(/^([\d:]+\s*s?)\s*[-–—]\s*([\d:]+\s*s?)$/);
  if (range) return `${fmt(toSec(range[1]))}-${fmt(toSec(range[2]))}`;
  const single = inner.match(/^([\d:]+)\s*s?$/);
  if (single) return fmt(toSec(single[1]));
  return inner;
}
function extractLabel(h: string): string {
  return h.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^#+\s*/, '').replace(/\([^)]*\)/g, '').replace(/[:\-–—]+$/, '').trim();
}
function esHeader(line: string): boolean {
  const clean = line.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^#+\s*/, '').trim();
  if (!clean || clean.length > 80) return false;
  if (/\(\s*[\d:]/.test(clean) || /\(\s*al\s+final/i.test(clean)) return true;
  const letters = clean.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '');
  if (letters.length >= 3 && letters === letters.toUpperCase()) return true;
  return clean.endsWith(':') && clean.length <= 40;
}
function extractVisual(body: string): { visual: string; narration: string } {
  const vl: string[] = [], nl: string[] = [];
  for (const line of body.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    const pv = t.match(/^\(([^)]+)\)\s*$/), bv = t.match(/^\[([^\]]+)\]\s*$/);
    if (pv || bv) vl.push(pv?.[1] || bv?.[1] || '');
    else if (/^(ESCENA|VISUAL|AUDIO|MÚSICA|MUSICA|EFECTO|NOTA|CÁMARA|CAMARA|PLANO)/i.test(t)) vl.push(t.replace(/^[:\s]+/, ''));
    else nl.push(t);
  }
  return { visual: vl.join(' ') || '', narration: nl.join(' ').trim() || body.trim() };
}
function parseGuion(texto: string): SceneRow[] {
  if (!texto?.trim()) return [];
  let txt = texto.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
    .replace(/^```[\s\S]*?\n/, '').replace(/\n```$/, '');
  const bloques = txt.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const rows: SceneRow[] = [];
  if (bloques.length >= 2) {
    for (const bloque of bloques) {
      const lineas = bloque.split('\n');
      const header = lineas[0].trim();
      if (esHeader(header)) {
        const body = lineas.slice(1).join('\n').trim();
        const { visual, narration } = extractVisual(body || bloque);
        rows.push({ label: extractLabel(header) || `Escena ${rows.length + 1}`, time: extractTime(header), visual, narration });
      } else {
        const { visual, narration } = extractVisual(bloque);
        rows.push({ label: `Bloque ${rows.length + 1}`, time: '', visual, narration });
      }
    }
  } else {
    const lines = txt.split('\n');
    let cur: { header: string; bodyLines: string[] } | null = null;
    for (const raw of lines) {
      const t = raw.trim();
      if (!t) continue;
      if (esHeader(t)) {
        if (cur) {
          const body = cur.bodyLines.join('\n').trim();
          const { visual, narration } = extractVisual(body);
          rows.push({ label: extractLabel(cur.header) || `Escena ${rows.length + 1}`, time: extractTime(cur.header), visual, narration });
        }
        cur = { header: t, bodyLines: [] };
      } else if (cur) { cur.bodyLines.push(raw); }
      else { cur = { header: '', bodyLines: [raw] }; }
    }
    if (cur) {
      const body = cur.bodyLines.join('\n').trim();
      const { visual, narration } = extractVisual(body);
      rows.push({ label: extractLabel(cur.header) || `Escena ${rows.length + 1}`, time: extractTime(cur.header), visual, narration: narration || body });
    }
  }
  return rows.filter((r) => r.narration.trim() || r.visual.trim());
}

function calcStats(text: string) {
  const scenes = parseGuion(text);
  const words = text.split(/\s+/).filter(Boolean).length;
  const readSec = Math.round(words / 2.5);
  return { scenes: scenes.length, words, chars: text.length, readSec };
}
function fmtTime(sec: number) {
  return sec < 60 ? `~${sec}s` : `~${Math.floor(sec / 60)}m ${sec % 60}s`;
}

// ─── Tarjeta compacta de escena ───────────────────────────────────────────────
function SceneCard({ row, index, active, onClick }: { row: SceneRow; index: number; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full text-left rounded-xl border transition-all mb-2 overflow-hidden ${active ? 'border-brand-400 dark:border-brand-500 ring-2 ring-brand-200 dark:ring-brand-900/50' : 'border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700'}`}>
      <div className={`flex items-center gap-2 px-3 py-2 border-b ${active ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${active ? 'bg-brand-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>{index + 1}</span>
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate flex-1">{row.label}</span>
        {row.time && <span className="text-xs font-mono text-slate-400 dark:text-slate-500 flex-shrink-0">{row.time}</span>}
      </div>
      <div className="p-3 bg-white dark:bg-slate-900 space-y-1">
        {row.visual && <p className="text-xs text-slate-400 dark:text-slate-500 italic truncate"><span className="font-semibold not-italic text-brand-500">Visual:</span> {row.visual}</p>}
        <p className="text-xs text-slate-700 dark:text-slate-200 line-clamp-2 leading-relaxed">{row.narration}</p>
      </div>
    </button>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface Props { open: boolean; onClose: () => void; }

export function GuionEditorModal({ open, onClose }: Props) {
  // Selectores granulares — cada componente solo re-renderiza cuando su dato cambia
  const guionEnStore = useApp((s) => s.proyecto.assets?.guion ?? '');
  const nombreProyecto = useApp((s) => s.proyecto.nombre);
  const updateGuion = useApp((s) => s.updateGuion);
  const setAssets = useApp((s) => s.setAssets);
  const setSyncingActivos = useApp((s) => s.setSyncingActivos);
  const { iaDisponible } = useProveedorIA();

  // guionBase: el guion que existía cuando el modal se abrió (o cuando se guardó por última vez)
  // Usamos ref para no generar re-renders innecesarios y evitar closures stale
  const guionBaseRef = useRef('');

  const [draft, setDraft] = useState('');
  const [activeScene, setActiveScene] = useState(0);
  const [panelView, setPanelView] = useState<'split' | 'editor' | 'preview'>('split');
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  // Estado de la resincronización integral (títulos, SEO, thumbnails, storyboard, prompts, estrategia)
  type SyncState = 'idle' | 'syncing' | 'success' | 'error';
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncError, setSyncError] = useState('');

  // Al abrir el modal: captura la base y reset
  useEffect(() => {
    if (!open) return;
    guionBaseRef.current = guionEnStore;
    setDraft(guionEnStore);
    setHasChanges(false);
    setSaved(false);
    setActiveScene(0);
  }, [open]); // Intencionalmente NO incluye guionEnStore para no resetear mientras el usuario escribe

  const scenes = useMemo(() => parseGuion(draft), [draft]);
  const stats = useMemo(() => calcStats(draft), [draft]);

  // Clamp activeScene cuando bajan las escenas
  useEffect(() => {
    if (scenes.length > 0 && activeScene >= scenes.length) {
      setActiveScene(scenes.length - 1);
    }
  }, [scenes.length, activeScene]);

  const handleChange = useCallback((val: string) => {
    setDraft(val);
    setHasChanges(val !== guionBaseRef.current);
    setSaved(false);
  }, []);

  // Resincroniza títulos, SEO, keywords, timestamps, thumbnails, storyboard,
  // prompts de video/música y estrategia para que reflejen el guion editado.
  // Corre en segundo plano: NUNCA bloquea ni la UI ni los botones del modal.
  // Si no hay IA disponible, solo se persiste el guion (no se puede regenerar el resto sin modelo).
  const resyncActivos = useCallback(async (guionFinal: string) => {
    const state = useApp.getState();
    const proyecto = state.proyecto;
    if (!proyecto.assets) {
      setSyncState('idle');
      return;
    }

    if (!iaDisponible) {
      // Sin IA: el guion ya quedó persistido por updateGuion. No podemos regenerar el resto.
      setSyncState('idle');
      return;
    }

    if (!proyecto.ideaElegida) {
      setSyncState('error');
      setSyncError('No hay idea elegida: no se puede regenerar el resto de activos.');
      return;
    }

    setSyncState('syncing');
    setSyncError('');
    setSyncingActivos(true);
    try {
      const kb = await kbBuildContext(proyecto.id);
      const nuevos = await regenerarActivosDesdeGuion({
        nicho: proyecto.nicho,
        idea: proyecto.ideaElegida,
        guion: guionFinal,
        prevAssets: proyecto.assets,
        geminiDisponible: iaDisponible,
        knowledgeBase: kb.context,
        videoPlan: proyecto.videoPlan
          ? { formato: proyecto.videoPlan.formato, duracionSegundos: proyecto.videoPlan.duracionSegundos }
          : undefined,
      });
      // setAssets reemplaza el paquete completo y persiste en storage.
      setAssets(nuevos);
      setSyncState('success');
      setSyncingActivos(false);
      setTimeout(() => setSyncState('idle'), 3000);
    } catch (e: any) {
      console.error('[GuionEditor] Resync error:', e);
      setSyncState('error');
      setSyncError(e?.message || 'Error al regenerar activos.');
      setSyncingActivos(false);
    }
  }, [iaDisponible, setAssets, setSyncingActivos]);

  // Guarda el guion de forma INMEDIATA y SINCRÓNICA. La regeneración del resto
  // de activos se dispara en segundo plano y nunca bloquea esta acción.
  const persistGuion = useCallback((texto: string) => {
    try {
      updateGuion(texto);
    } catch (e) {
      console.error('[GuionEditor] updateGuion error:', e);
    }
    guionBaseRef.current = texto;
    setHasChanges(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    // Fire-and-forget: la regeneración corre aparte y actualiza la UI cuando termine.
    void resyncActivos(texto);
  }, [updateGuion, resyncActivos]);

  const handleSave = useCallback(() => {
    persistGuion(draft);
  }, [draft, persistGuion]);

  const handleDiscard = useCallback(() => {
    setDraft(guionBaseRef.current);
    setHasChanges(false);
    setSaved(false);
  }, []);

  const handleClose = useCallback(() => {
    if (hasChanges) {
      if (confirm('Tienes cambios sin guardar. ¿Cerrar de todas formas?')) onClose();
    } else {
      onClose();
    }
  }, [hasChanges, onClose]);

  // Guarda y cierra INMEDIATAMENTE. La resincronización continúa en segundo plano
  // y los demás apartados se actualizan solos cuando termina (gracias a setAssets).
  const handleSaveAndClose = useCallback(() => {
    persistGuion(draft);
    onClose();
  }, [draft, persistGuion, onClose]);

  const handleCopyAll = useCallback(() => {
    copyToClipboard(draft);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }, [draft]);

  // Escape para cerrar
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, handleClose]);

  if (!open) return null;

  const showEditor = panelView === 'split' || panelView === 'editor';
  const showPreview = panelView === 'split' || panelView === 'preview';

  return (
    <div className="fixed inset-0 z-50 flex p-3 md:p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative z-10 flex flex-col w-full max-w-7xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">

        {/* ── Header ─── */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">Editar guion</h2>
              {hasChanges && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Sin guardar
                </span>
              )}
              {saved && !hasChanges && syncState !== 'syncing' && syncState !== 'error' && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800">
                  <Check className="w-3 h-3" />
                  {iaDisponible ? 'Guardado y propagado a todos los activos' : 'Guion guardado (sin IA: el resto no se regeneró)'}
                </span>
              )}
              {syncState === 'syncing' && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/20 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Resincronizando títulos, SEO, thumbnails…
                </span>
              )}
              {syncState === 'error' && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800" title={syncError}>
                  <AlertCircle className="w-3 h-3" />
                  Error al resincronizar
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{nombreProyecto}</p>
          </div>

          {/* Stats */}
          <div className="hidden lg:flex items-center gap-0 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 divide-x divide-slate-200 dark:divide-slate-700">
            <span className="pr-3 flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-brand-500" />
              <strong className="text-slate-700 dark:text-slate-200">{stats.scenes}</strong> escenas
            </span>
            <span className="px-3 flex items-center gap-1.5">
              <Mic2 className="w-3 h-3 text-brand-500" />
              <strong className="text-slate-700 dark:text-slate-200">{stats.words}</strong> palabras
            </span>
            <span className="pl-3 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-brand-500" />
              {fmtTime(stats.readSec)}
            </span>
          </div>

          {/* Vistas */}
          <div className="hidden sm:flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
            {([
              { id: 'editor' as const, icon: Edit3, label: 'Solo editor' },
              { id: 'split' as const, icon: Layers, label: 'Editor + vista previa' },
              { id: 'preview' as const, icon: Eye, label: 'Solo vista previa' },
            ]).map((v) => (
              <button key={v.id} onClick={() => setPanelView(v.id)} title={v.label}
                className={`p-1.5 rounded-md transition-all ${panelView === v.id ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                <v.icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          {/* Acciones del header */}
          <div className="flex items-center gap-1.5">
            <button onClick={handleCopyAll} className="btn-secondary text-xs py-1 px-2.5 gap-1 hidden sm:inline-flex">
              {copiedAll ? <><Check className="w-3 h-3" />Copiado</> : <><Copy className="w-3 h-3" />Copiar</>}
            </button>
            {hasChanges && (
              <button onClick={handleDiscard} title="Descartar cambios" className="btn-secondary text-xs py-1 px-2.5 gap-1 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 hidden sm:inline-flex">
                <RotateCcw className="w-3 h-3" />Descartar
              </button>
            )}
            <button onClick={handleSave} disabled={!hasChanges}
              title={iaDisponible ? 'Guarda el guion y regenera el resto de activos en segundo plano' : 'Guarda el guion (sin IA no se regeneran los demás activos)'}
              className={`text-xs py-1 px-3 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                hasChanges
                  ? 'bg-brand-600 hover:bg-brand-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}>
              <Save className="w-3.5 h-3.5" />Guardar
            </button>
            <button onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Cuerpo ─── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Panel editor */}
          {showEditor && (
            <div className={`flex flex-col min-h-0 ${showPreview ? 'w-1/2 border-r border-slate-200 dark:border-slate-800' : 'flex-1'}`}>
              <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <Edit3 className="w-3.5 h-3.5" />Texto del guion
                </span>
                <span className="text-xs text-slate-400 tabular-nums">{stats.chars} car.</span>
              </div>
              <div className="flex-1 relative overflow-hidden">
                <textarea
                  value={draft}
                  onChange={(e) => handleChange(e.target.value)}
                  spellCheck lang="es"
                  className="absolute inset-0 w-full h-full resize-none p-5 text-sm leading-7 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950 font-mono focus:outline-none focus:ring-0 border-0 placeholder-slate-300 dark:placeholder-slate-600"
                  placeholder={`Escribe o pega tu guion aquí...\n\nEjemplo:\n\nHOOK (0-5s)\nEsta información te cambia la vida...\n(VISUAL: Cara sorprendida, zoom in)\n\nDESARROLLO (5-30s)\nLo que nadie te dice es que...`}
                />
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/10 border-t border-blue-100 dark:border-blue-900/20 flex-shrink-0">
                <Sparkles className="w-3 h-3 text-blue-500 flex-shrink-0" />
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Separa escenas con una línea en blanco. Usa <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded font-mono">HOOK (0-5s)</code> como título de escena.
                </p>
              </div>
            </div>
          )}

          {/* Panel vista previa */}
          {showPreview && (
            <div className={`flex flex-col min-h-0 ${showEditor ? 'w-1/2' : 'flex-1'}`}>
              <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <Eye className="w-3.5 h-3.5" />Vista previa en tiempo real
                </span>
                {scenes.length > 0 && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => setActiveScene((p) => Math.max(0, p - 1))} disabled={activeScene === 0}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-slate-500 min-w-[3.5rem] text-center">{activeScene + 1}/{scenes.length}</span>
                    <button onClick={() => setActiveScene((p) => Math.min(scenes.length - 1, p + 1))} disabled={activeScene >= scenes.length - 1}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                {scenes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Escribe en el editor para ver las escenas aquí.</p>
                  </div>
                ) : (
                  <div className="p-4">
                    {/* Escena activa destacada */}
                    {scenes[activeScene] && (
                      <div className="mb-4 rounded-2xl border-2 border-brand-300 dark:border-brand-600 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-brand-100 dark:bg-brand-900/30 border-b border-brand-200 dark:border-brand-800">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">{activeScene + 1}</span>
                            <span className="font-bold text-sm text-brand-800 dark:text-brand-200">{scenes[activeScene].label}</span>
                          </div>
                          {scenes[activeScene].time && (
                            <span className="text-xs font-mono bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-300 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-700">
                              {scenes[activeScene].time}
                            </span>
                          )}
                        </div>
                        <div className="p-4 space-y-3 bg-brand-50 dark:bg-brand-900/10">
                          {scenes[activeScene].visual && (
                            <div className="flex items-start gap-2">
                              <Eye className="w-3.5 h-3.5 text-brand-400 mt-0.5 flex-shrink-0" />
                              <p className="text-xs italic text-brand-700 dark:text-brand-300">{scenes[activeScene].visual}</p>
                            </div>
                          )}
                          <div className="flex items-start gap-2">
                            <Mic2 className="w-3.5 h-3.5 text-brand-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-brand-900 dark:text-brand-100 leading-relaxed font-medium">{scenes[activeScene].narration}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Resto de escenas */}
                    {scenes.map((scene, i) => i !== activeScene && (
                      <SceneCard key={i} row={scene} index={i} active={false} onClick={() => setActiveScene(i)} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ─── */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex-shrink-0">
          <p className="text-xs flex items-center gap-1.5">
            {hasChanges ? (
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-3.5 h-3.5" />
                {iaDisponible
                  ? 'Cambios pendientes — al guardar se regenerarán títulos, SEO, thumbnails, storyboard y prompts para coincidir con el guion.'
                  : 'Cambios pendientes — sin clave de IA solo se guardará el guion; el resto de activos no se podrá regenerar.'}
              </span>
            ) : syncState === 'syncing' ? (
              <span className="flex items-center gap-1.5 text-brand-600 dark:text-brand-300">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Resincronizando títulos, SEO, keywords, timestamps, thumbnails, storyboard, prompts y estrategia…
              </span>
            ) : syncState === 'error' ? (
              <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                <AlertCircle className="w-3.5 h-3.5" />
                {syncError || 'No se pudo resincronizar los activos. El guion sí se guardó.'}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                <Check className="w-3.5 h-3.5 text-green-500" />
                Sincronizado — el guion y todos los activos derivados están al día.
              </span>
            )}
          </p>
          <div className="flex gap-2">
            {hasChanges && (
              <button onClick={handleDiscard} className="btn-secondary text-xs py-1.5 px-3">Descartar</button>
            )}
            {/* Reintentar resincronización sin haber editado (caso de error o cambio de KB) */}
            {!hasChanges && syncState === 'error' && (
              <button
                onClick={() => void resyncActivos(guionBaseRef.current)}
                className="btn-secondary text-xs py-1.5 px-3 gap-1"
                title="Reintentar la resincronización del resto de activos"
              >
                <RefreshCw className="w-3.5 h-3.5" />Reintentar
              </button>
            )}
            <button
              onClick={hasChanges ? handleSaveAndClose : onClose}
              className={`text-xs py-1.5 px-4 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                hasChanges
                  ? 'bg-brand-600 hover:bg-brand-700 text-white'
                  : 'btn-secondary'
              }`}
            >
              {hasChanges
                ? <><Save className="w-3.5 h-3.5" />Guardar y propagar</>
                : <><X className="w-3.5 h-3.5" />Cerrar</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
