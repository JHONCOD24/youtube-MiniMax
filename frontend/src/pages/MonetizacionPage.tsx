// Paso 5: Monetización.
import { useState } from 'react';
import { useApp } from '../store/useApp';
import { generarMonetizacion } from '../services/geminiClient';
import { NICHOS } from '../data/niches';
import { DollarSign, Loader2, CheckCircle2, Circle, RefreshCw, AlertTriangle } from 'lucide-react';
import { formatNumber } from '../utils/format';

export function MonetizacionPage() {
  const { proyecto, setMonetizacion, settings, backendKeys } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const geminiDisponible = settings.proveedorIA === 'claude'
    ? Boolean(settings.claudeKey) || backendKeys.claude
    : settings.proveedorIA === 'mistral'
    ? Boolean(settings.mistralKey) || backendKeys.mistral
    : Boolean(settings.geminiKey) || backendKeys.gemini;
  const m = proyecto.monetizacion;
  const nichoObj = NICHOS.find((n) => n.nombre === proyecto.nicho) || null;
  // Si la idea elegida cambió desde que se calculó la monetización, los datos quedaron desactualizados.
  const desactualizado = Boolean(m && proyecto.ideaElegida && m.ideaId !== proyecto.ideaElegida.id);

  const generar = async () => {
    setError(''); setLoading(true);
    try {
      const data = await generarMonetizacion({
        nicho: nichoObj,
        nichoNombre: proyecto.nicho,
        idea: proyecto.ideaElegida,
        geminiDisponible,
      });
      setMonetizacion(data);
    } catch (e: any) {
      setError(e?.message || 'Error.');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Paso 5 · Monetización</h1>
          <p className="text-slate-600 dark:text-slate-300">Nicho: <b>{proyecto.nicho}</b></p>
        </div>
        <button
          onClick={generar}
          disabled={loading}
          className={desactualizado ? 'btn-primary !bg-amber-500 hover:!bg-amber-600' : 'btn-primary'}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Calculando…</>
          ) : desactualizado ? (
            <><RefreshCw className="w-4 h-4" /> Regenerar monetización</>
          ) : m ? (
            <><RefreshCw className="w-4 h-4" /> Recalcular</>
          ) : (
            <><DollarSign className="w-4 h-4" /> Calcular monetización</>
          )}
        </button>
      </header>

      {desactualizado && !loading && (
        <div className="card p-4 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Cambiaste la idea elegida. Estos datos corresponden a una idea anterior, presiona "Regenerar monetización" para actualizarlos.
        </div>
      )}

      {error && <div className="card p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-200">{error}</div>}

      {loading && (
        <div className="card p-8 text-center">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-2" />
          <p>Analizando vías de monetización para "{proyecto.nicho}"…</p>
        </div>
      )}

      {m && !loading && (
        <div className="space-y-4 animate-slide-up">
          <div className="grid sm:grid-cols-3 gap-3">
            <Stat label="CPM estimado" value={`$${m.cpm[0]}–$${m.cpm[1]}`} />
            <Stat label="RPM estimado" value={`$${m.rpm[0]}–$${m.rpm[1]}`} />
            <Stat label="Vistas/mes (escenario 6m)" value={formatNumber(m.proyeccion.vistasMes)} />
          </div>

          <div className="card p-5">
            <h3 className="font-bold mb-3">Vías de monetización</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {m.vias.map((v, i) => (
                <div key={i} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold">{v.nombre}</p>
                    <span className={`chip ${
                      v.potencial === 'alto' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' :
                      v.potencial === 'medio' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300' :
                      'bg-slate-100 dark:bg-slate-800'
                    }`}>Potencial {v.potencial}</span>
                  </div>
                  <p className="text-sm text-slate-500">{v.descripcion}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-bold mb-3">Proyección de ingresos (mensual)</h3>
            <div className="space-y-2 text-sm">
              <Row label="AdSense" value={`$${m.proyeccion.ingresosAds[0]} – $${m.proyeccion.ingresosAds[1]}`} />
              <Row label="Afiliados" value={`$${m.proyeccion.ingresosAfiliados[0]} – $${m.proyeccion.ingresosAfiliados[1]}`} />
              <div className="border-t border-slate-200 dark:border-slate-800 my-2" />
              <Row label="TOTAL estimado" value={`$${m.proyeccion.ingresosTotales[0]} – $${m.proyeccion.ingresosTotales[1]}`} highlight />
            </div>
            <p className="text-xs text-slate-500 mt-3">⚠️ Estimaciones orientativas. Los ingresos reales dependen de duración, retención, CTR, nicho y país de la audiencia.</p>
          </div>

          <div className="card p-5">
            <h3 className="font-bold mb-3">Checklist de monetización YouTube</h3>
            <ul className="space-y-2">
              {m.requisitos.map((r, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  {r.cumplido
                    ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                    : <Circle className="w-5 h-5 text-slate-400" />}
                  <span className={r.cumplido ? 'line-through text-slate-500' : ''}>{r.texto}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${highlight ? 'font-bold text-lg' : ''}`}>
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
