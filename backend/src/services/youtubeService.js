// Servicio de YouTube: hace fetch a la API, maneja caché en memoria
// y mantiene un contador de cuota estimada (10.000 unidades/día).
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Coste estimado por endpoint (según docs oficiales de YouTube)
const COSTS = {
  '/search': 100,
  '/videos': 1,
  '/channels': 1,
  default: 1,
};

// --- Caché en memoria (TTL por entrada) ---
export const cache = {
  store: new Map(),
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  },
  set(key, value, ttlMs) {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  },
  clear() { this.store.clear(); },
};

// --- Cuota estimada del día ---
// Nota: la cuota oficial de YouTube se reinicia a medianoche hora del Pacífico.
// Aquí llevamos un contador en memoria para informar al usuario; se reinicia
// al reiniciar el servidor.
const quota = {
  date: new Date().toISOString().slice(0, 10),
  used: 0,
  limit: 10000,
};

function maybeResetQuota() {
  const today = new Date().toISOString().slice(0, 10);
  if (quota.date !== today) {
    quota.date = today;
    quota.used = 0;
  }
}

export function getQuotaUsage() {
  maybeResetQuota();
  return { ...quota, resetAtPacific: 'medianoche PT' };
}

export function resetQuotaUsage() {
  quota.used = 0;
  quota.date = new Date().toISOString().slice(0, 10);
}

function trackQuota(endpoint) {
  maybeResetQuota();
  quota.used += COSTS[endpoint] ?? COSTS.default;
}

// --- Fetch con manejo de errores ---
export async function youtubeGet(endpoint, params = {}, clientKey = null) {
  const apiKey = String(clientKey || process.env.YOUTUBE_API_KEY || '')
    .trim()
    .replace(/^Bearer\s+/i, '')
    .replace(/^['"`]+|['"`]+$/g, '')
    .trim();
  if (!apiKey) {
    const err = new Error(
      'YouTube API key no configurada. Pégala en Ajustes y pulsa Probar, o define YOUTUBE_API_KEY en Vercel.',
    );
    err.status = 503;
    throw err;
  }

  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('key', apiKey);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, String(v));
    }
  }

  let res;
  try {
    res = await fetch(url.toString());
  } catch (e) {
    const err = new Error('No se pudo conectar con YouTube. Revisa tu conexión.');
    err.status = 502;
    throw err;
  }

  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      detail = j?.error?.message || JSON.stringify(j);
    } catch {
      detail = await res.text().catch(() => '');
    }
    const err = new Error(
      res.status === 403 && /quota/i.test(detail)
        ? 'Cuota de YouTube agotada. Espera al reinicio (medianoche hora del Pacífico) o usa otra key.'
        : `YouTube ${res.status}: ${detail || res.statusText}`,
    );
    err.status = res.status;
    throw err;
  }

  trackQuota(endpoint);
  return res.json();
}
