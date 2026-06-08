// Paso 1: Selección de nicho.
import { useState } from 'react';
import { useApp } from '../store/useApp';
import { NICHOS } from '../data/niches';
import * as Icons from 'lucide-react';
import { Search, Sparkles, BookOpen, Upload, Trash2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { kbIngestFiles, kbIngestText } from '../services/kbClient';
import { kbDelete } from '../services/kbDb';
import { formatNumber } from '../utils/format';

export function NichoPage() {
  const { setNicho, proyecto, addKnowledgeDocs, removeKnowledgeDoc } = useApp();
  const [query, setQuery] = useState('');
  const [kbError, setKbError] = useState('');
  const [kbLoading, setKbLoading] = useState(false);
  const [showPasteForm, setShowPasteForm] = useState(false);
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteText, setPasteText] = useState('');
  const navigate = useNavigate();

  const filtrados = NICHOS.filter((n) =>
    n.nombre.toLowerCase().includes(query.toLowerCase()) ||
    n.descripcion.toLowerCase().includes(query.toLowerCase())
  );

  const elegir = (nichoId: string) => {
    const n = NICHOS.find((x) => x.id === nichoId);
    if (!n) return;
    setNicho(n.nombre);
    navigate('/investigacion');
  };

  const personalizar = () => {
    const v = query.trim();
    if (!v) return;
    setNicho(v, v);
    navigate('/investigacion');
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Paso 1 · Elige tu nicho</h1>
        <p className="text-slate-600 dark:text-slate-300">
          15 nichos pre-seleccionados por potencial viral y CPM. O escribe el tuyo personalizado.
        </p>
      </header>

      {/* Buscador / personalizado */}
      <div className="card p-4 md:p-5">
        <label className="label">Nicho personalizado</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && personalizar()}
              placeholder='Ej: "minimalismo digital", "crianza Montessori", "low cost Europa"…'
              className="input pl-10"
            />
          </div>
          <button onClick={personalizar} disabled={!query.trim()} className="btn-primary">
            <Sparkles className="w-4 h-4" /> Investigar este nicho
          </button>
        </div>
        {proyecto.nichoPersonalizado && (
          <p className="text-xs text-slate-500 mt-2">Último personalizado: {proyecto.nichoPersonalizado}</p>
        )}
      </div>

      <div className="card p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 font-bold">
              <BookOpen className="w-5 h-5 text-brand-500" />
              Base de conocimiento (por proyecto)
            </div>
            <p className="text-sm text-slate-500">
              Sube PDF/DOCX/TXT/MD. Se usa para enriquecer la investigación y para trazar qué ideas vienen de tus documentos.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setShowPasteForm(!showPasteForm);
                setKbError('');
                setPasteTitle('');
                setPasteText('');
              }}
              className="btn-secondary"
              disabled={kbLoading}
            >
              <Icons.Plus className="w-4 h-4" /> Pegar texto
            </button>

            <label className="btn-secondary cursor-pointer">
              {kbLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo…</> : <><Upload className="w-4 h-4" /> Subir archivos</>}
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
                disabled={kbLoading}
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  e.target.value = '';
                  if (!files.length) return;
                  setKbError('');
                  setKbLoading(true);
                  try {
                    const metas = await kbIngestFiles(proyecto.id, files);
                    addKnowledgeDocs(metas);
                  } catch (err: any) {
                    setKbError(err?.message || 'No se pudieron cargar los archivos.');
                  } finally {
                    setKbLoading(false);
                  }
                }}
              />
            </label>
          </div>
        </div>

        {showPasteForm && (
          <div className="mt-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-3">
            <h4 className="text-sm font-bold">Pegar texto para la base de conocimientos</h4>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-slate-500 font-medium">Título del documento</label>
                <input
                  value={pasteTitle}
                  onChange={(e) => setPasteTitle(e.target.value)}
                  placeholder="Ej: Guion de referencia, Info del nicho, Plantilla..."
                  className="input text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Contenido del texto</label>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Pega aquí la información, guion o notas..."
                  className="input text-sm min-h-[120px] mt-1 font-mono"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowPasteForm(false)}
                className="btn-secondary text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const title = pasteTitle.trim();
                  const text = pasteText.trim();
                  if (!text) {
                    setKbError('Por favor ingresa algún texto.');
                    return;
                  }
                  setKbError('');
                  setKbLoading(true);
                  try {
                    const meta = await kbIngestText(proyecto.id, title || 'Texto copiado', text);
                    addKnowledgeDocs([meta]);
                    setShowPasteForm(false);
                    setPasteTitle('');
                    setPasteText('');
                  } catch (err: any) {
                    setKbError(err?.message || 'Error al guardar el texto.');
                  } finally {
                    setKbLoading(false);
                  }
                }}
                className="btn-primary text-xs"
                disabled={!pasteText.trim()}
              >
                Guardar documento
              </button>
            </div>
          </div>
        )}

        {kbError && <div className="mt-3 text-sm text-red-600 dark:text-red-300">{kbError}</div>}

        <div className="mt-4 space-y-2">
          {(proyecto.knowledgeBase || []).length === 0 && (
            <div className="text-sm text-slate-500">
              No hay archivos todavía. Sube guiones, research, PDFs de tu nicho, plantillas o notas.
            </div>
          )}
          {(proyecto.knowledgeBase || []).map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{d.name}</p>
                <p className="text-xs text-slate-500 truncate">{d.mime} · {formatNumber(d.size)} bytes</p>
              </div>
              <button
                className="btn-ghost p-2"
                title="Eliminar"
                onClick={async () => {
                  await kbDelete(d.id);
                  removeKnowledgeDoc(d.id);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Cuadrícula */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtrados.map((n) => {
          const Icon = (Icons as any)[n.icono] || Icons.Circle;
          return (
            <button
              key={n.id}
              onClick={() => elegir(n.id)}
              className="card p-5 text-left hover:shadow-lg hover:-translate-y-1 transition group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 flex items-center justify-center group-hover:from-brand-500 group-hover:to-accent-500 transition">
                  <Icon className="w-6 h-6 text-brand-600 dark:text-brand-400 group-hover:text-white transition" />
                </div>
                <SaturationBadge level={n.saturacion} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">{n.nombre}</h3>
              <p className="text-xs text-slate-500 mb-3 line-clamp-2">{n.descripcion}</p>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <span className="chip">CPM ${n.cpm[0]}–${n.cpm[1]}</span>
                <PotentialBadge level={n.potencial} />
                {n.cpmLatam && <span className="chip bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">Monetiza en LATAM</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SaturationBadge({ level }: { level: 'baja' | 'media' | 'alta' }) {
  const map = {
    baja: { c: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300', l: 'Saturación baja' },
    media: { c: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300', l: 'Saturación media' },
    alta: { c: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300', l: 'Saturación alta' },
  } as const;
  const it = map[level];
  return <span className={`chip ${it.c}`}>{it.l}</span>;
}

function PotentialBadge({ level }: { level: 'bajo' | 'medio' | 'alto' }) {
  const map = {
    bajo: { e: '⚪️', l: 'Potencial bajo' },
    medio: { e: '🟡', l: 'Potencial medio' },
    alto: { e: '🟢', l: 'Potencial alto' },
  } as const;
  const it = map[level];
  return <span className="chip">{it.e} {it.l}</span>;
}
