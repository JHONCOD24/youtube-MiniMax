// Mis proyectos: lista, abrir, duplicar, borrar, importar (.json / .md) y descargar.
import { useApp } from '../store/useApp';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen, Copy, Trash2, Plus, ArrowRight, Upload, FileUp,
  CheckCircle2, AlertCircle, X, Download, FileJson, FileCode,
  FileDown, ChevronDown,
} from 'lucide-react';
import { formatDate, downloadFile } from '../utils/format';
import { exportToPdf } from '../utils/exportPdf';
import { exportToDocx } from '../utils/exportDocx';
import { parseProjectFile } from '../utils/importProject';
import { useState, useRef, useEffect } from 'react';
import type { Project } from '../types';

// ─── Menú de descarga por proyecto ───────────────────────────────────────────
function DownloadMenu({ proyecto }: { proyecto: Project }) {
  const [open, setOpen] = useState(false);
  const [loadingFmt, setLoadingFmt] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Cierra al hacer click fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toMarkdown = () => {
    const p = proyecto;
    const lines: string[] = [];
    lines.push(`# ${p.nombre}`);
    lines.push(`\n**Nicho:** ${p.nicho}${p.nichoPersonalizado ? ' (personalizado)' : ''}`);
    lines.push(`**Fecha:** ${new Date(p.fechaCreacion).toLocaleString('es-ES')}\n`);
    if (p.investigacion) {
      lines.push(`## Investigación\n**Veredicto:** ${p.investigacion.veredicto.toUpperCase()}\n`);
      lines.push(p.investigacion.resumen || '');
      lines.push(`\n**Sub-nichos:** ${p.investigacion.subNichos?.join(', ')}`);
      lines.push(`\n**Top videos:**`);
      p.investigacion.topVideos?.slice(0, 5).forEach((v) => lines.push(`- ${v.title} — ${v.views} vistas`));
    }
    if (p.ideaElegida) {
      lines.push(`\n## Idea elegida\n**Título:** ${p.ideaElegida.titulo}\n**Hook:** ${p.ideaElegida.hook}`);
    }
    if (p.assets) {
      lines.push(`\n## Títulos`);
      p.assets.titulos?.forEach((t) => lines.push(`- ${t.texto}`));
      lines.push(`\n## Guion\n${p.assets.guion}`);
      lines.push(`\n## Descripción SEO\n${p.assets.descripcionSEO}`);
      lines.push(`\n**Keywords:** ${p.assets.keywords?.join(', ')}`);
    }
    if (p.monetizacion) {
      lines.push(`\n## Monetización\nCPM: $${p.monetizacion.cpm[0]}-$${p.monetizacion.cpm[1]} | RPM: $${p.monetizacion.rpm[0]}-$${p.monetizacion.rpm[1]}`);
      p.monetizacion.vias?.forEach((v) => lines.push(`- **${v.nombre}** (${v.potencial}): ${v.descripcion}`));
    }
    return lines.join('\n');
  };

  const actions = [
    {
      id: 'pdf',
      label: 'Descargar PDF',
      sublabel: 'Presentación lista para compartir',
      icon: FileDown,
      color: 'text-red-500',
      bg: 'hover:bg-red-50 dark:hover:bg-red-900/20',
      action: async () => {
        setLoadingFmt('pdf');
        try { exportToPdf(proyecto); } finally { setLoadingFmt(null); setOpen(false); }
      },
    },
    {
      id: 'doc',
      label: 'Descargar Word (.doc)',
      sublabel: 'Documento editable con estilos',
      icon: FileDown,
      color: 'text-blue-500',
      bg: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
      action: async () => {
        setLoadingFmt('doc');
        try { await exportToDocx(proyecto); } finally { setLoadingFmt(null); setOpen(false); }
      },
    },
    {
      id: 'json',
      label: 'Descargar JSON',
      sublabel: 'Backup completo del proyecto',
      icon: FileJson,
      color: 'text-green-500',
      bg: 'hover:bg-green-50 dark:hover:bg-green-900/20',
      action: () => {
        downloadFile(`${proyecto.nombre}.json`, JSON.stringify(proyecto, null, 2), 'application/json');
        setOpen(false);
      },
    },
    {
      id: 'md',
      label: 'Descargar Markdown (.md)',
      sublabel: 'Texto formateado reutilizable',
      icon: FileCode,
      color: 'text-brand-500',
      bg: 'hover:bg-brand-50 dark:hover:bg-brand-900/20',
      action: () => {
        downloadFile(`${proyecto.nombre}.md`, toMarkdown(), 'text/markdown');
        setOpen(false);
      },
    },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-secondary p-2 gap-1"
        title="Descargar proyecto"
      >
        <Download className="w-4 h-4" />
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 bottom-full mb-2 z-30 w-64 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-fade-in">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Descargar como</p>
          </div>
          {actions.map((act) => (
            <button
              key={act.id}
              onClick={act.action}
              disabled={loadingFmt === act.id}
              className={`w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors ${act.bg} disabled:opacity-50`}
            >
              <act.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${act.color}`} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {loadingFmt === act.id ? 'Generando...' : act.label}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{act.sublabel}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export function ProyectosPage() {
  const { proyectos, cargarProyecto, eliminarProyecto, duplicarProyecto, nuevoProyecto, importarProyecto } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [importStatus, setImportStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [importing, setImporting] = useState(false);

  async function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    if (arr.length === 0) return;
    setImporting(true);
    const results: { name: string; ok: boolean; msg: string }[] = [];
    for (const f of arr) {
      try {
        const text = await f.text();
        const proj = parseProjectFile(f.name, text);
        importarProyecto(proj);
        results.push({ name: f.name, ok: true, msg: proj.nombre });
      } catch (e: any) {
        results.push({ name: f.name, ok: false, msg: e?.message || 'Error desconocido' });
      }
    }
    const okCount = results.filter((r) => r.ok).length;
    const failCount = results.length - okCount;
    const firstFail = results.find((r) => !r.ok);
    setImporting(false);
    setImportStatus({
      ok: failCount === 0,
      msg: failCount === 0
        ? `✅ ${okCount} proyecto${okCount > 1 ? 's' : ''} importado${okCount > 1 ? 's' : ''} correctamente.`
        : `⚠️ ${okCount} ok, ${failCount} con error. ${firstFail?.name}: ${firstFail?.msg}`,
    });
    setTimeout(() => setImportStatus(null), 6000);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) handleFiles(e.target.files);
    e.target.value = '';
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Mis proyectos</h1>
          <p className="text-slate-600 dark:text-slate-300">{proyectos.length} proyectos guardados localmente.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fileInputRef.current?.click()} className="btn-secondary" disabled={importing}>
            <FileUp className="w-4 h-4" /> {importing ? 'Importando…' : 'Importar .json / .md'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.md,.markdown,.txt,application/json,text/markdown,text/plain"
            multiple
            className="hidden"
            onChange={onPick}
          />
          <button onClick={() => { nuevoProyecto(); navigate('/nicho'); }} className="btn-primary">
            <Plus className="w-4 h-4" /> Nuevo proyecto
          </button>
        </div>
      </header>

      {/* Zona de drop */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`card p-6 border-2 border-dashed cursor-pointer transition-colors text-center ${
          dragOver
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
            : 'border-slate-300 dark:border-slate-700 hover:border-brand-400'
        }`}
      >
        <Upload className={`w-8 h-8 mx-auto mb-2 ${dragOver ? 'text-brand-500' : 'text-slate-400'}`} />
        <p className="font-medium text-slate-700 dark:text-slate-200">
          Arrastra un archivo <code className="text-xs px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800">.json</code> o <code className="text-xs px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800">.md</code> aquí
        </p>
        <p className="text-xs text-slate-500 mt-1">
          O haz click para seleccionar. El proyecto se cargará completo en el pipeline listo para editar.
        </p>
      </div>

      {/* Banner de estado */}
      {importStatus && (
        <div className={`card p-3 flex items-start gap-2 ${
          importStatus.ok
            ? '!bg-green-50 dark:!bg-green-900/20 border border-green-200 dark:border-green-800'
            : '!bg-amber-50 dark:!bg-amber-900/20 border border-amber-200 dark:border-amber-800'
        }`}>
          {importStatus.ok
            ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            : <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />}
          <p className="text-sm flex-1">{importStatus.msg}</p>
          <button onClick={() => setImportStatus(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {proyectos.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">Aún no tienes proyectos guardados.</p>
          <button onClick={() => navigate('/nicho')} className="btn-primary inline-flex">
            Empezar el primero <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {proyectos.map((p) => (
            <div key={p.id} className="card p-5 space-y-3 flex flex-col">
              {/* Nombre y nicho */}
              <div className="min-w-0">
                <h3 className="font-bold text-base truncate text-slate-800 dark:text-slate-100" title={p.nombre}>{p.nombre}</h3>
                <p className="text-sm text-slate-500 truncate">{p.nicho || 'Sin nicho'}</p>
                <p className="text-xs text-slate-400 mt-0.5">Modificado: {formatDate(p.fechaModificacion)}</p>
              </div>

              {/* Chips de estado */}
              <div className="flex flex-wrap gap-1.5">
                {p.investigacion && <span className="chip">📊 Investigación</span>}
                {p.ideaElegida && <span className="chip">💡 Idea</span>}
                {p.assets && <span className="chip">🎬 Activos</span>}
                {p.monetizacion && <span className="chip">💰 Monetización</span>}
              </div>

              {/* Acciones */}
              <div className="flex gap-2 pt-1 mt-auto">
                <button
                  onClick={() => { cargarProyecto(p.id); navigate('/nicho'); }}
                  className="btn-primary text-xs flex-1 py-2"
                >
                  Abrir
                </button>
                <DownloadMenu proyecto={p} />
                <button
                  onClick={() => duplicarProyecto(p.id)}
                  className="btn-secondary p-2"
                  title="Duplicar"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { if (confirm(`¿Eliminar "${p.nombre}"?`)) eliminarProyecto(p.id); }}
                  className="btn-secondary p-2 hover:!bg-red-50 hover:!text-red-600 dark:hover:!bg-red-900/30"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
