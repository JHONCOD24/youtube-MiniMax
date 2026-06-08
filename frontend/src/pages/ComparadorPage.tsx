// Comparador de nichos (hasta 3) lado a lado.
import { useState } from 'react';
import { NICHOS } from '../data/niches';
import { GitCompare, Loader2, X, ChevronDown, Check, Plus, Sparkles, Layers } from 'lucide-react';
import { api } from '../services/api';
import { formatNumber } from '../utils/format';
import type { Niche } from '../types';

interface CompData { nombre: string; cpm: [number, number]; vistas: number; competencia: string; vph: number; suscriptores?: number; }

export function ComparadorPage() {
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [datos, setDatos] = useState<CompData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para nichos personalizados
  const [customNiches, setCustomNiches] = useState<Niche[]>([]);
  const [customName, setCustomName] = useState('');
  const [customMinCpm, setCustomMinCpm] = useState<number | ''>('');
  const [customMaxCpm, setCustomMaxCpm] = useState<number | ''>('');

  const toggle = (id: string) => {
    setSeleccion((s) => s.includes(id) ? s.filter((x) => x !== id) : s.length < 3 ? [...s, id] : s);
  };

  const addCustomNiche = () => {
    if (!customName.trim()) return;
    const min = customMinCpm === '' ? 3 : Number(customMinCpm);
    const max = customMaxCpm === '' ? 12 : Number(customMaxCpm);
    const nuevo: Niche = {
      id: `custom-${Math.random().toString(36).slice(2, 8)}`,
      nombre: customName.trim(),
      descripcion: 'Nicho personalizado para comparar',
      icono: 'Sparkles',
      cpm: [min, max],
      saturacion: 'media',
      potencial: 'medio',
    };
    setCustomNiches((prev) => [...prev, nuevo]);
    setSeleccion((s) => s.length < 3 ? [...s, nuevo.id] : s);
    setCustomName('');
    setCustomMinCpm('');
    setCustomMaxCpm('');
  };

  const removeCustomNiche = (id: string) => {
    setCustomNiches((prev) => prev.filter((n) => n.id !== id));
    setSeleccion((s) => s.filter((x) => x !== id));
  };

  const comparar = async () => {
    if (seleccion.length < 2) { setError('Selecciona al menos 2 nichos.'); return; }
    setError(''); setLoading(true);
    try {
      const results: CompData[] = [];
      const allNiches = [...NICHOS, ...customNiches];
      for (const id of seleccion) {
        const n = allNiches.find((x) => x.id === id);
        if (!n) continue;
        try {
          const search = await api.youtubeSearch(n.nombre, 10);
          const ids = search.items.map((v: any) => v.videoId).filter(Boolean);
          const stats = ids.length ? await api.youtubeVideos(ids) : { items: [] };
          const total = stats.items.reduce((s: number, v: any) => s + (v.views || 0), 0);
          const vphArr = stats.items.map((v: any) => {
            const hrs = Math.max(1, (Date.now() - new Date(v.publishedAt).getTime()) / 36e5);
            return (v.views || 0) / hrs;
          });
          const vph = vphArr.length ? Math.round(vphArr.reduce((a: number, b: number) => a + b, 0) / vphArr.length) : 0;
          results.push({
            nombre: n.nombre,
            cpm: n.cpm,
            vistas: Math.round(total / Math.max(1, stats.items.length)),
            competencia: stats.items.length > 0 ? `${stats.items.length} videos top analizados` : '—',
            vph,
          });
        } catch {
          results.push({ nombre: n.nombre, cpm: n.cpm, vistas: 0, competencia: 'Sin datos', vph: 0 });
        }
      }
      setDatos(results);
    } catch (e: any) {
      setError(e?.message || 'Error comparando.');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Comparador de nichos</h1>
        <p className="text-slate-600 dark:text-slate-300">Hasta 3 nichos lado a lado. Decide con datos de YouTube en tiempo real.</p>
      </header>

      {/* Lista colapsable de predefinidos */}
      <details className="group border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/20 dark:bg-slate-900/10 shadow-sm" open={seleccion.length === 0}>
        <summary className="cursor-pointer select-none flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-semibold text-sm">
          <span className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            Seleccionar de los 15 nichos predefinidos
          </span>
          <ChevronDown className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" />
        </summary>
        <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {NICHOS.map((n) => {
            const sel = seleccion.includes(n.id);
            return (
              <button key={n.id} onClick={() => toggle(n.id)}
                className={`p-3.5 rounded-xl border text-left text-sm transition relative group ${
                  sel ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}>
                <div className="flex items-start justify-between gap-1.5 mb-1.5">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">{n.nombre}</span>
                  {sel && <Check className="w-4 h-4 text-brand-500 shrink-0" />}
                </div>
                <div className="flex items-center justify-between gap-2 mt-auto">
                  <span className="text-xs text-slate-500">CPM ${n.cpm[0]}–${n.cpm[1]}</span>
                  <span className={`chip text-[9px] py-0.5 px-2 rounded-full capitalize font-medium ${
                    n.saturacion === 'baja' ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400' :
                    n.saturacion === 'media' ? 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400' :
                    'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400'
                  }`}>{n.saturacion}</span>
                </div>
              </button>
            );
          })}
        </div>
      </details>

      {/* Formulario de nichos personalizados */}
      <div className="card p-5 space-y-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Plus className="w-5 h-5 text-brand-500" />
          Añadir nicho personalizado para la comparación
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          Escribe cualquier otro nicho que te interese. Al comparar, consultaremos estadísticas en tiempo real en la base de datos de YouTube para medir su alcance promedio.
        </p>
        <div className="grid sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5">
            <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Nombre del nicho</label>
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Ej: asmr teclados, minimalismo financiero, domótica..."
              className="input text-sm mt-1"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">CPM Mínimo estimado (USD)</label>
            <input
              type="number"
              value={customMinCpm}
              onChange={(e) => setCustomMinCpm(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="3"
              className="input text-sm mt-1"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">CPM Máximo estimado (USD)</label>
            <input
              type="number"
              value={customMaxCpm}
              onChange={(e) => setCustomMaxCpm(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="12"
              className="input text-sm mt-1"
            />
          </div>
          <button
            onClick={addCustomNiche}
            disabled={!customName.trim()}
            className="btn-primary sm:col-span-1 h-[42px] flex items-center justify-center"
          >
            Añadir
          </button>
        </div>

        {/* Listado de nichos personalizados cargados */}
        {customNiches.length > 0 && (
          <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tus nichos personalizados:</p>
            <div className="flex flex-wrap gap-2">
              {customNiches.map((n) => {
                const sel = seleccion.includes(n.id);
                return (
                  <div
                    key={n.id}
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-sm transition cursor-pointer select-none ${
                      sel ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                    onClick={() => toggle(n.id)}
                  >
                    <span className="font-semibold">{n.nombre}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">(${n.cpm[0]}–${n.cpm[1]} CPM)</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCustomNiche(n.id);
                      }}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      title="Eliminar nicho"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Controles de comparación */}
      <div className="flex items-center gap-3">
        <button onClick={comparar} disabled={loading || seleccion.length < 2} className="btn-primary">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analizando YouTube…</> : <><GitCompare className="w-4 h-4" /> Comparar ({seleccion.length})</>}
        </button>
        {seleccion.length > 0 && <button onClick={() => { setSeleccion([]); setDatos([]); }} className="btn-ghost text-sm">Limpiar selección</button>}
        {error && <span className="text-sm text-red-600 dark:text-red-300">{error}</span>}
      </div>

      {/* Resultados de comparación */}
      {datos.length > 0 && !loading && (
        <div className="card p-6 md:p-7 space-y-4 animate-slide-up">
          <h3 className="text-lg font-bold tracking-tight">Resultados de la comparación</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/40">
                  <th className="text-left py-3 px-4 text-slate-500 font-semibold uppercase tracking-wider text-xs">Métrica</th>
                  {datos.map((d, i) => <th key={i} className="text-left py-3 px-4 font-bold text-slate-800 dark:text-slate-100">{d.nombre}</th>)}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900">
                <Row label="CPM estimado (USD)" values={datos.map((d) => `$${d.cpm[0]}–$${d.cpm[1]}`)} />
                <Row label="Vistas promedio" values={datos.map((d) => formatNumber(d.vistas))} />
                <Row label="VPH promedio" values={datos.map((d) => formatNumber(d.vph))} />
                <Row label="Datos analizados" values={datos.map((d) => d.competencia)} />
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            * Más vistas promedio y VPH en la búsqueda de YouTube, combinado con un CPM alto, representa la mejor oportunidad.
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ label, values }: { label: string; values: string[] }) {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
      <td className="py-3.5 px-4 font-medium text-slate-500 dark:text-slate-400">{label}</td>
      {values.map((v, i) => <td key={i} className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100">{v}</td>)}
    </tr>
  );
}
