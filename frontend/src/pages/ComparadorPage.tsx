// Comparador de nichos (hasta 3) lado a lado.
import { useState } from 'react';
import { NICHOS } from '../data/niches';
import { GitCompare, Loader2, X } from 'lucide-react';
import { api } from '../services/api';
import { formatNumber } from '../utils/format';

interface CompData { nombre: string; cpm: [number, number]; vistas: number; competencia: string; vph: number; suscriptores?: number; }

export function ComparadorPage() {
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [datos, setDatos] = useState<CompData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggle = (id: string) => {
    setSeleccion((s) => s.includes(id) ? s.filter((x) => x !== id) : s.length < 3 ? [...s, id] : s);
  };

  const comparar = async () => {
    if (seleccion.length < 2) { setError('Selecciona al menos 2 nichos.'); return; }
    setError(''); setLoading(true);
    try {
      const results: CompData[] = [];
      for (const id of seleccion) {
        const n = NICHOS.find((x) => x.id === id);
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
        <p className="text-slate-600 dark:text-slate-300">Hasta 3 nichos lado a lado. Decide con datos.</p>
      </header>

      <div className="card p-5">
        <p className="text-sm text-slate-500 mb-3">Selecciona 2 o 3 nichos para comparar:</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {NICHOS.map((n) => {
            const sel = seleccion.includes(n.id);
            return (
              <button key={n.id} onClick={() => toggle(n.id)}
                className={`p-3 rounded-lg border text-left text-sm transition ${
                  sel ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{n.nombre}</span>
                  {sel && <X className="w-4 h-4 text-brand-500" onClick={(e) => { e.stopPropagation(); toggle(n.id); }} />}
                </div>
                <span className="text-xs text-slate-500">CPM ${n.cpm[0]}–${n.cpm[1]}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button onClick={comparar} disabled={loading || seleccion.length < 2} className="btn-primary">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Comparando…</> : <><GitCompare className="w-4 h-4" /> Comparar ({seleccion.length})</>}
          </button>
          {seleccion.length > 0 && <button onClick={() => { setSeleccion([]); setDatos([]); }} className="btn-ghost">Limpiar</button>}
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      {datos.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold mb-3">Resultados</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left py-2">Métrica</th>
                  {datos.map((d, i) => <th key={i} className="text-left py-2 px-2">{d.nombre}</th>)}
                </tr>
              </thead>
              <tbody>
                <Row label="CPM" values={datos.map((d) => `$${d.cpm[0]}–$${d.cpm[1]}`)} />
                <Row label="Vistas promedio top 10" values={datos.map((d) => formatNumber(d.vistas))} />
                <Row label="VPH promedio" values={datos.map((d) => formatNumber(d.vph))} />
                <Row label="Datos" values={datos.map((d) => d.competencia)} />
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-3">Más vistas/VPH + CPM alto = mejor oportunidad (a igualdad de competencia).</p>
        </div>
      )}
    </div>
  );
}

function Row({ label, values }: { label: string; values: string[] }) {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800/50">
      <td className="py-2 font-medium text-slate-500">{label}</td>
      {values.map((v, i) => <td key={i} className="py-2 px-2 font-mono">{v}</td>)}
    </tr>
  );
}
