// GuionViewer v7: vista de lectura por escenas con tabla de produccion en escritorio.
import { useMemo, useState } from 'react';
import { Check, Clock, Copy, Eye, ListChecks, Mic2, TimerReset } from 'lucide-react';
import { copyToClipboard } from '../utils/format';

interface ScriptRow {
  label: string;
  time: string;
  visual: string;
  narration: string;
  _secStart: number;
}

function toSec(s: string): number {
  const t = s.trim().replace(/\s/g, '');
  if (t.includes(':')) {
    const [m, sec] = t.split(':').map(Number);
    return (m || 0) * 60 + (sec || 0);
  }
  const n = parseInt(t.replace(/[^0-9]/g, ''), 10);
  return Number.isNaN(n) ? 0 : n;
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function extractTime(header: string): { time: string; sec: number } {
  const paren = header.match(/\(([^)]+)\)/);
  if (!paren) return { time: '', sec: -1 };
  const inner = paren[1].trim();

  if (/^al\s+final/i.test(inner)) return { time: 'Final', sec: 99999 };

  const range = inner.match(/^([\d:]+\s*s?)\s*[-–—]\s*([\d:]+\s*s?)$/);
  if (range) {
    const s = toSec(range[1]);
    const e = toSec(range[2]);
    return { time: `${fmt(s)}-${fmt(e)}`, sec: s };
  }

  const single = inner.match(/^([\d:]+)\s*s?$/);
  if (single) {
    const s = toSec(single[1]);
    return { time: fmt(s), sec: s };
  }

  return { time: inner, sec: 0 };
}

function extractLabel(header: string): string {
  return header
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^#+\s*/, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/[:\-–—]+$/, '')
    .trim();
}

function esHeader(line: string): boolean {
  const clean = line.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^#+\s*/, '').trim();
  if (!clean || clean.length > 80) return false;
  if (/\(\s*[\d:]/.test(clean)) return true;
  if (/\(\s*al\s+final/i.test(clean)) return true;

  const letters = clean.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '');
  if (letters.length >= 3 && letters === letters.toUpperCase()) return true;
  return clean.endsWith(':') && clean.length <= 40;
}

// Prefijos de narración: estas palabras al inicio de línea indican texto hablado, NO visual.
const NARRATION_PREFIXES = /^(voz\s+en\s+off|narrador|locutor|host|presenter|off|vo)\s*[:–—]\s*/i;

// Prefijos visuales/técnicos: estas palabras al inicio de línea son indicaciones de producción.
const VISUAL_PREFIXES = /^(visual|audio|música|musica|efecto|nota|cámara|camara|plano|toma|corte|transición|transicion|escena|sfx|bgm|fx|pantalla|texto\s+en\s+pantalla|on\s*screen|overlay)\s*[:–—]?\s*/i;

// Términos cinematográficos para detectar cues visuales inline entre paréntesis.
const CINEMATIC_TERMS = /\b(zoom|toma|plano|fundido|efecto|música|sonido|cámara|camara|pantalla|texto|slow|fast|cut|fade|pan|tilt|dolly|pull|push|wide|close|medium|shot|angle|track|crane|drone|steadicam|handheld|arc|pivot|rack|focus|blur|transition|overlay|caption|lower\s*third|b-roll|broll|insert|reaction|closeup|close-up|establish|establishing)\b/i;

function extractVisual(body: string): { visual: string; narration: string } {
  const lines = body.split('\n');
  const visualLines: string[] = [];
  const narrationLines: string[] = [];

  for (const line of lines) {
    const raw = line.trim();
    if (!raw) continue;

    // Quitar decoración markdown (*texto*, **texto**) para el análisis de patrones
    const t = raw.replace(/^\*{1,2}(.*?)\*{1,2}$/, '$1').trim();

    // 1. Línea entera entre corchetes: [VISUAL: ...] o [indicación visual]
    const bracketFull = t.match(/^\[([^\]]{2,})\]\s*$/);
    if (bracketFull) { visualLines.push(bracketFull[1].trim()); continue; }

    // 2. Línea entera entre paréntesis: (indicación visual)
    const parenFull = t.match(/^\(([^)]{2,})\)\s*$/);
    if (parenFull) { visualLines.push(parenFull[1].trim()); continue; }

    // 3. Prefijo de narración explícito → siempre narración aunque contenga términos visuales
    if (NARRATION_PREFIXES.test(t)) {
      const texto = t.replace(NARRATION_PREFIXES, '').replace(/^["'"'"']|["'"'"']$/g, '').trim();
      if (texto) narrationLines.push(texto);
      continue;
    }

    // 4. Prefijo visual/técnico → siempre visual
    if (VISUAL_PREFIXES.test(t)) { visualLines.push(t); continue; }

    // 5. Emoji de producción al inicio de línea → visual
    if (/^[🎬🎥📸🎙🎚🎛🎞📽🎦]/u.test(raw)) { visualLines.push(raw); continue; }

    // 6. Narración normal — extraer indicaciones visuales inline entre paréntesis
    //    Solo si el contenido del paréntesis tiene términos cinematográficos.
    const visualExtracted: string[] = [];
    const cleanedText = t.replace(/\(([^)]{3,80})\)/g, (match, inner) => {
      if (CINEMATIC_TERMS.test(inner)) {
        visualExtracted.push(inner.trim());
        return ''; // lo quitamos de la narración
      }
      return match; // lo dejamos en la narración (es un paréntesis normal)
    }).replace(/\s{2,}/g, ' ').trim();

    if (visualExtracted.length) visualLines.push(...visualExtracted);

    // Quitar comillas externas de presentación del texto narrado
    const narText = cleanedText.replace(/^["'"'"']|["'"'"']$/g, '').trim();
    if (narText) narrationLines.push(narText);
  }

  return {
    visual: visualLines.join(' · ').trim(),
    narration: narrationLines.join(' ').trim() || body.trim(),
  };
}

function parsear(texto: string): ScriptRow[] {
  if (!texto?.trim()) return [];

  let txt = texto.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  txt = txt.replace(/^```[\s\S]*?\n/, '').replace(/\n```$/, '');

  const bloques = txt.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const rows: ScriptRow[] = [];

  if (bloques.length >= 2) {
    for (const bloque of bloques) {
      const lineas = bloque.split('\n');
      const header = lineas[0].trim();

      if (esHeader(header)) {
        const { time, sec } = extractTime(header);
        const label = extractLabel(header);
        const body = lineas.slice(1).join('\n').trim();
        const { visual, narration } = extractVisual(body || bloque);
        rows.push({ label: label || `Escena ${rows.length + 1}`, time, visual, narration, _secStart: sec });
      } else {
        const { visual, narration } = extractVisual(bloque);
        rows.push({ label: `Bloque ${rows.length + 1}`, time: '', visual, narration, _secStart: -1 });
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
          const { time, sec } = extractTime(cur.header);
          const label = extractLabel(cur.header);
          const body = cur.bodyLines.join('\n').trim();
          const { visual, narration } = extractVisual(body);
          rows.push({ label: label || `Escena ${rows.length + 1}`, time, visual, narration, _secStart: sec });
        }
        cur = { header: t, bodyLines: [] };
      } else if (cur) {
        cur.bodyLines.push(raw);
      } else {
        cur = { header: '', bodyLines: [raw] };
      }
    }

    if (cur) {
      const { time, sec } = extractTime(cur.header);
      const label = extractLabel(cur.header);
      const body = cur.bodyLines.join('\n').trim();
      const { visual, narration } = extractVisual(body);
      rows.push({ label: label || `Escena ${rows.length + 1}`, time: time || '', visual, narration: narration || body, _secStart: sec });
    }
  }

  const withTime = rows.filter((r) => r._secStart >= 0);
  const noTime = rows.filter((r) => r._secStart < 0);
  withTime.sort((a, b) => a._secStart - b._secStart);

  return [...withTime, ...noTime].filter((r) => r.narration.trim() || r.visual.trim());
}

function copyAsTable(rows: ScriptRow[]) {
  const header = 'Escena\tTiempo\tIndicacion visual / audio\tTexto narrado';
  const body = rows.map((r) => `${r.label}\t${r.time}\t${r.visual}\t${r.narration}`).join('\n');
  copyToClipboard(`${header}\n${body}`);
}

function copyAsReadable(rows: ScriptRow[]) {
  const body = rows.map((r, i) => [
    `${i + 1}. ${r.label}${r.time ? ` (${r.time})` : ''}`,
    `Visual / audio: ${r.visual}`,
    `Narracion: ${r.narration}`,
  ].join('\n')).join('\n\n');
  copyToClipboard(body);
}

function CopyBtn({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false);
  const click = () => {
    copyToClipboard(text);
    setOk(true);
    setTimeout(() => setOk(false), 1800);
  };

  return (
    <button
      onClick={click}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
        ok
          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
          : 'text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      {ok ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      <span>{ok ? 'Copiado' : label}</span>
    </button>
  );
}

export function GuionViewer({ guion }: { guion: string }) {
  const [copyAll, setCopyAll] = useState(false);
  const rows = useMemo(() => parsear(guion), [guion]);
  const stats = useMemo(() => {
    const timed = rows.filter((r) => r._secStart >= 0);
    const last = timed.length ? timed[timed.length - 1] : null;
    const words = rows.reduce((acc, row) => acc + row.narration.split(/\s+/).filter(Boolean).length, 0);

    return {
      scenes: rows.length,
      duration: last?.time || 'Flexible',
      words,
    };
  }, [rows]);

  const doCopyAll = () => {
    copyAsReadable(rows);
    setCopyAll(true);
    setTimeout(() => setCopyAll(false), 2000);
  };

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6">
        <p className="text-[15px] leading-[1.85] text-slate-700 dark:text-slate-200 whitespace-pre-wrap max-w-none">{guion}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 p-4 md:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Stat icon={ListChecks} label="Escenas" value={String(stats.scenes)} />
            <Stat icon={TimerReset} label="Ritmo" value={stats.duration} />
            <Stat icon={Mic2} label="Palabras" value={String(stats.words)} />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button onClick={() => copyAsTable(rows)} className="btn-secondary w-full sm:w-auto">
              <Copy className="w-4 h-4" />
              Copiar tabla
            </button>
            <button
              onClick={doCopyAll}
              className={`btn-primary w-full sm:w-auto ${copyAll ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : ''}`}
            >
              <Copy className="w-4 h-4" />
              {copyAll ? 'Copiado' : 'Copiar guion'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {rows.map((row, i) => (
          <article key={`${row.label}-${i}`} className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="flex flex-col lg:grid lg:grid-cols-[160px_minmax(0,1fr)]">
              <aside className="border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/30 p-4">
                <div className="flex lg:flex-col items-center lg:items-start justify-between gap-3">
                  <span className="inline-flex items-center rounded-full bg-brand-50 dark:bg-brand-900/20 px-3 py-1 text-xs font-bold text-brand-700 dark:text-brand-300">
                    Escena {i + 1}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-950/50 px-3 py-1 text-xs font-mono font-bold text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                    <Clock className="w-3.5 h-3.5" />
                    {row.time || 'Sin tiempo'}
                  </span>
                </div>
              </aside>

              <div className="p-4 md:p-5 space-y-4 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="text-base md:text-lg font-bold leading-snug text-slate-900 dark:text-white">
                      {row.label}
                    </h4>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      Lectura sugerida para grabacion y edicion
                    </p>
                  </div>
                  <CopyBtn text={row.narration} label="Narracion" />
                </div>

                <div className="grid lg:grid-cols-[minmax(180px,260px)_minmax(0,1fr)] gap-3">
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <Eye className="w-4 h-4 text-brand-500" />
                      Visual / audio
                    </div>
                    <p className={`text-sm leading-7 ${row.visual ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500 italic'}`}>
                      {row.visual || '—'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white dark:bg-slate-950/30 p-4 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <Mic2 className="w-4 h-4 text-brand-500" />
                      Texto narrado
                    </div>
                    <p className="text-[15px] md:text-base leading-8 text-slate-800 dark:text-slate-100">
                      {row.narration}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden xl:block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Tabla compacta de produccion</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap" style={{ width: '100px' }}>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Tiempo</span>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300" style={{ width: '180px' }}>
                  Escena
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300" style={{ width: '200px' }}>
                  Visual / Audio
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                  Texto Narrado
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-4 py-3 align-top">
                    <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-2 py-0.5 rounded">
                      {row.time || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-200 font-semibold">
                      {row.label}
                    </p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className={`text-[13px] leading-relaxed italic ${row.visual ? 'text-slate-500 dark:text-slate-400' : 'text-slate-300 dark:text-slate-600'}`}>
                      {row.visual || '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3 align-top relative group">
                    <p className="text-[14px] leading-[1.75] text-slate-800 dark:text-slate-100 font-medium">
                      {row.narration}
                    </p>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <CopyBtn text={row.narration} label="Texto" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 min-w-0">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        <Icon className="w-3.5 h-3.5 text-brand-500" />
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-1 text-sm md:text-base font-bold text-slate-900 dark:text-white truncate">{value}</p>
    </div>
  );
}
