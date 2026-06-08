// Indicador de cuota de YouTube (en la barra lateral).
import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { api } from '../services/api';

export function QuotaIndicator() {
  const [quota, setQuota] = useState<{ used: number; limit: number } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    const cargar = async () => {
      try {
        const q = await api.youtubeQuota();
        if (alive) setQuota({ used: q.used, limit: q.limit });
      } catch {
        if (alive) setError(true);
      }
    };
    cargar();
    const t = setInterval(cargar, 60_000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  if (error) {
    return <div className="text-xs text-slate-500 flex items-center gap-2"><Activity className="w-3 h-3" /> Backend no disponible</div>;
  }
  if (!quota) {
    return <div className="text-xs text-slate-500 flex items-center gap-2"><Activity className="w-3 h-3 animate-pulse" /> Cuota: cargando…</div>;
  }
  const pct = Math.min(100, (quota.used / quota.limit) * 100);
  const color = pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="text-xs">
      <div className="flex items-center justify-between mb-1">
        <span className="text-slate-500 flex items-center gap-1"><Activity className="w-3 h-3" /> Cuota YouTube</span>
        <span className="text-slate-700 dark:text-slate-300 font-mono">{quota.used}/{quota.limit}</span>
      </div>
      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
