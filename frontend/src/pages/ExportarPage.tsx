// Paso 6: Exportar y checklist de publicación.
import { useApp } from '../store/useApp';
import { downloadFile, copyToClipboard } from '../utils/format';
import { exportToPdf } from '../utils/exportPdf';
import { exportToDocx } from '../utils/exportDocx';
import {
  Download, Copy, Check, FileJson, FileText, FileCode,
  ListChecks, FileDown, Loader2, Sparkles,
} from 'lucide-react';
import { useState } from 'react';

type ExportFormat = 'md' | 'txt' | 'json' | 'pdf' | 'docx';

export function ExportarPage() {
  const { proyecto } = useApp();
  const [copyOk, setCopyOk] = useState(false);
  const [loading, setLoading] = useState<ExportFormat | null>(null);
  const p = proyecto;

  const toMarkdown = () => {
    const lines: string[] = [];
    lines.push(`# ${p.nombre}`);
    lines.push(`\n**Nicho:** ${p.nicho}${p.nichoPersonalizado ? ' (personalizado)' : ''}`);
    lines.push(`**Fecha:** ${new Date(p.fechaCreacion).toLocaleString('es-ES')}\n`);

    if (p.investigacion) {
      lines.push(`## Investigación`);
      lines.push(`**Veredicto:** ${p.investigacion.veredicto.toUpperCase()}\n`);
      lines.push(p.investigacion.resumen);
      lines.push(`\n**Sub-nichos:** ${p.investigacion.subNichos.join(', ')}`);
      lines.push(`**Ángulos:** ${p.investigacion.angulos.join(', ')}`);
      lines.push(`\n**Top videos:**`);
      p.investigacion.topVideos.slice(0, 5).forEach((v) => lines.push(`- ${v.title} — ${v.views} vistas`));
    }

    if (p.ideaElegida) {
      lines.push(`\n## Idea elegida`);
      lines.push(`**Título:** ${p.ideaElegida.titulo}`);
      lines.push(`**Hook:** ${p.ideaElegida.hook}`);
      lines.push(`**Ángulo:** ${p.ideaElegida.angulo}`);
    }

    if (p.assets) {
      lines.push(`\n## Títulos`);
      p.assets.titulos.forEach((t) => lines.push(`- ${t.texto}  _( ${t.razon} )_`));
      lines.push(`\n## Guion`);
      lines.push(p.assets.guion);
      lines.push(`\n## Descripción SEO`);
      lines.push(p.assets.descripcionSEO);
      lines.push(`\n**Keywords:** ${p.assets.keywords.join(', ')}`);
      lines.push(`\n## Timestamps`);
      p.assets.timestamps.forEach((t) => lines.push(`- ${t}`));
      lines.push(`\n## Prompt Thumbnail\n\`\`\`\n${p.assets.promptThumbnail}\n\`\`\``);
      lines.push(`\n## Prompt Video\n\`\`\`\n${p.assets.promptVideo}\n\`\`\``);
      lines.push(`\n## Prompt Música (Suno)\n\`\`\`\n${p.assets.promptMusica}\n\`\`\``);
      lines.push(`\n## Prompt Música (Gemini)\n\`\`\`\n${p.assets.promptMusicaGemini}\n\`\`\``);
    }

    if (p.monetizacion) {
      lines.push(`\n## Monetización`);
      lines.push(`CPM: $${p.monetizacion.cpm[0]}-$${p.monetizacion.cpm[1]} | RPM: $${p.monetizacion.rpm[0]}-$${p.monetizacion.rpm[1]}`);
      p.monetizacion.vias.forEach((v) => lines.push(`- **${v.nombre}** (${v.potencial}): ${v.descripcion}`));
    }

    return lines.join('\n');
  };

  const toTxt = () => toMarkdown().replace(/[*#`]/g, '');

  const copiarTodo = async () => {
    await copyToClipboard(toMarkdown());
    setCopyOk(true);
    setTimeout(() => setCopyOk(false), 1800);
  };

  const handlePdf = async () => {
    setLoading('pdf');
    try {
      exportToPdf(p);
    } catch (e) {
      console.error('Error generando PDF', e);
    } finally {
      setLoading(null);
    }
  };

  const handleDocx = async () => {
    setLoading('docx');
    try {
      await exportToDocx(p);
    } catch (e) {
      console.error('Error generando DOCX', e);
    } finally {
      setLoading(null);
    }
  };

  const checklist = [
    { label: 'Investigación completa', done: !!p.investigacion },
    { label: 'Idea elegida', done: !!p.ideaElegida },
    { label: 'Títulos definidos', done: (p.assets?.titulos?.length || 0) > 0 },
    { label: 'Guion listo', done: !!p.assets?.guion },
    { label: 'Descripción + tags listos', done: !!p.assets?.descripcionSEO },
    { label: 'Prompt de thumbnail', done: !!p.assets?.promptThumbnail },
    { label: 'Prompt de video', done: !!p.assets?.promptVideo },
    { label: 'Música definida', done: !!p.assets?.promptMusica },
    { label: 'Estrategia de publicación', done: !!p.assets?.estrategiaPublicacion },
    { label: 'Plan de monetización', done: !!p.monetizacion },
  ];

  const completados = checklist.filter((c) => c.done).length;
  const pct = Math.round((completados / checklist.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="relative overflow-hidden rounded-[1.25rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-brand-600 to-accent-500" />
        <div className="p-5 md:p-7">
          <div className="flex items-start gap-3 mb-2">
            <span className="chip bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border-brand-100 dark:border-brand-800">Paso 6</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Exportar proyecto</h1>
          <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
            Descarga tu trabajo en el formato que necesites — desde datos crudos hasta un documento listo para presentar.
          </p>
        </div>
      </header>

      {/* Checklist */}
      <div className="card p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-brand-500" />
            Checklist de publicación
          </h3>
          <span className={`chip font-semibold ${pct === 100 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' : ''}`}>
            {completados}/{checklist.length} — {pct}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          {checklist.map((c, i) => (
            <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${c.done ? 'bg-green-50 dark:bg-green-900/10' : 'bg-slate-50 dark:bg-slate-800/30'}`}>
              {c.done
                ? <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                : <span className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 flex-shrink-0" />
              }
              <span className={c.done ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Exportar como presentación */}
      <div className="card overflow-hidden">
        <div className="p-5 md:p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-brand-500" />
            <h3 className="font-bold text-base">Exportar como documento de presentación</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Genera un documento completo y pulido con portada, secciones organizadas, tablas de métricas y todo el contenido del proyecto.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-px bg-slate-100 dark:bg-slate-800">
          {/* PDF */}
          <button
            onClick={handlePdf}
            disabled={loading === 'pdf'}
            className="group bg-white dark:bg-slate-900 p-6 flex flex-col items-start gap-3 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-colors disabled:opacity-60"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                {loading === 'pdf'
                  ? <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
                  : <FileDown className="w-6 h-6 text-red-500" />
                }
              </div>
              <span className="chip text-xs font-semibold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 border-red-100 dark:border-red-800">PDF</span>
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-brand-700 dark:group-hover:text-brand-300">
                {loading === 'pdf' ? 'Generando PDF...' : 'Descargar PDF (.pdf)'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Portada, métricas en tarjetas, tablas de videos, activos y monetización. Ideal para compartir o archivar.
              </p>
            </div>
          </button>

          {/* DOCX */}
          <button
            onClick={handleDocx}
            disabled={loading === 'docx'}
            className="group bg-white dark:bg-slate-900 p-6 flex flex-col items-start gap-3 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-colors disabled:opacity-60"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                {loading === 'docx'
                  ? <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  : <FileDown className="w-6 h-6 text-blue-500" />
                }
              </div>
              <span className="chip text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border-blue-100 dark:border-blue-800">WORD</span>
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-brand-700 dark:group-hover:text-brand-300">
                {loading === 'docx' ? 'Generando Word...' : 'Descargar Word (.docx)'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Documento editable con estilos aplicados, tablas de storyboard, guion completo y todos los prompts.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Exportar datos crudos */}
      <div className="card p-5 md:p-6">
        <h3 className="font-bold text-base mb-1">Exportar datos crudos</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          Formatos para reutilizar el contenido en otras herramientas o hacer un backup del proyecto.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <button
            onClick={() => downloadFile(`${p.nombre}.md`, toMarkdown(), 'text/markdown')}
            className="btn-secondary flex-col py-4 gap-2 hover:border-brand-300 dark:hover:border-brand-700"
          >
            <FileCode className="w-6 h-6 text-brand-500" />
            <span className="text-sm font-semibold">Markdown</span>
            <span className="text-xs text-slate-400">.md</span>
          </button>

          <button
            onClick={() => downloadFile(`${p.nombre}.txt`, toTxt(), 'text/plain')}
            className="btn-secondary flex-col py-4 gap-2 hover:border-brand-300 dark:hover:border-brand-700"
          >
            <FileText className="w-6 h-6 text-accent-500" />
            <span className="text-sm font-semibold">Texto plano</span>
            <span className="text-xs text-slate-400">.txt</span>
          </button>

          <button
            onClick={() => downloadFile(`${p.nombre}.json`, JSON.stringify(p, null, 2), 'application/json')}
            className="btn-secondary flex-col py-4 gap-2 hover:border-brand-300 dark:hover:border-brand-700"
          >
            <FileJson className="w-6 h-6 text-green-500" />
            <span className="text-sm font-semibold">JSON completo</span>
            <span className="text-xs text-slate-400">.json — backup</span>
          </button>

          <button
            onClick={copiarTodo}
            className="btn-primary flex-col py-4 gap-2"
          >
            {copyOk
              ? <><Check className="w-6 h-6" /><span className="text-sm font-semibold">¡Copiado!</span></>
              : <><Copy className="w-6 h-6" /><span className="text-sm font-semibold">Copiar todo</span><span className="text-xs opacity-75">Al portapapeles</span></>
            }
          </button>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 leading-relaxed">
          El archivo JSON sirve como backup completo. Puedes importarlo de nuevo desde la página "Mis Proyectos" en cualquier momento.
        </p>
      </div>
    </div>
  );
}
