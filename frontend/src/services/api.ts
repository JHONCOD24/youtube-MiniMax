import { useApp } from '../store/useApp';
import { API_BASE, getApiBase } from './apiBase';

const BASE = API_BASE;

export { getApiBase };

function normalizeSecret(value?: string | null) {
  return String(value || '')
    .trim()
    .replace(/^Bearer\s+/i, '')
    .replace(/^['"`]+|['"`]+$/g, '')
    .trim();
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

async function request(path: string, body?: any, method: 'GET' | 'POST' = 'POST') {
  if (!BASE) {
    throw new ApiError(
      'Backend no configurado. Define VITE_API_URL al compilar el frontend (ej. https://tu-api.onrender.com/api) o usa la app en local con npm run dev.',
      503,
    );
  }

  const settings = useApp.getState().settings;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const youtubeKey = normalizeSecret(settings.youtubeKey);
  const geminiKey = normalizeSecret(settings.geminiKey);
  const claudeKey = normalizeSecret(settings.claudeKey);
  const mistralKey = normalizeSecret(settings.mistralKey);

  if (youtubeKey) headers['x-youtube-key'] = youtubeKey;
  if (geminiKey) headers['x-gemini-key'] = geminiKey;
  if (claudeKey) headers['x-claude-key'] = claudeKey;
  if (mistralKey) headers['x-mistral-key'] = mistralKey;

  const opts: RequestInit = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, opts);
  } catch {
    throw new ApiError(
      'No se pudo conectar con el backend. En local arranca con "npm run dev". En Vercel, verifica que /api/health responda JSON.',
      0,
    );
  }

  const contentType = res.headers.get('content-type') || '';
  let data: any = null;
  let rawText = '';
  try {
    rawText = await res.text();
    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch {
        data = null;
      }
    }
  } catch {
    /* body vacío o ilegible */
  }

  // Si Vercel no montó el backend, a veces devuelve HTML (login SSO o el SPA).
  if (!data && /text\/html/i.test(contentType)) {
    throw new ApiError(
      `El backend no respondió en ${BASE}${path} (recibí HTML en vez de JSON, status ${res.status}). ` +
        'En Vercel el Root Directory del proyecto debe ser la raíz del monorepo (no "frontend") y debe existir la función /api.',
      res.status || 502,
    );
  }

  if (!res.ok) {
    const msg = (() => {
      if (res.status === 401 && path.startsWith('/claude')) {
        return 'Claude: API key inválida. Ve a Ajustes, pega una key válida (sk-ant-...) y guarda.';
      }
      if (res.status === 404) {
        return (
          data?.error ||
          `Ruta API no encontrada (404): ${BASE}${path}. El backend no está desplegado o la ruta es incorrecta.`
        );
      }
      if (res.status === 429) {
        return data?.error || 'Demasiadas peticiones. Espera un momento e inténtalo de nuevo.';
      }
      if (res.status === 503) {
        return data?.error || 'Servicio no disponible. Revisa que la API key esté configurada (Ajustes o variables de entorno en Vercel).';
      }
      const base = data?.error || (rawText && rawText.length < 200 ? rawText : `Error ${res.status}`);
      if (data?.detail) {
        return `${base}\n\nRespuesta recibida:\n${data.detail.slice(0, 2000)}`;
      }
      return base;
    })();
    throw new ApiError(msg, res.status);
  }
  return data;
}

export const api = {
  health: () => request('/health', undefined, 'GET'),
  youtubeSearch: (q: string, maxResults = 12) => request('/youtube/search', { q, maxResults }),
  youtubeVideos: (ids: string[]) => request('/youtube/videos', { ids }),
  youtubeChannels: (ids: string[]) => request('/youtube/channels', { ids }),
  youtubeQuota: () => request('/youtube/quota', undefined, 'GET'),
  geminiText: (prompt: string, system?: string, model?: string) =>
    request('/gemini/text', { prompt, system, model }),
  geminiJSON: async (prompt: string, system?: string, schemaHint?: string, model?: string) => {
    const res = await request('/gemini/json', { prompt, system, schemaHint, model });
    return res?.data ?? res;
  },
  claudeText: (prompt: string, system?: string, model?: string) =>
    request('/claude/text', { prompt, system, model }),
  claudeJSON: async (prompt: string, system?: string, schemaHint?: string, model?: string) => {
    const res = await request('/claude/json', { prompt, system, schemaHint, model });
    return res?.data ?? res;
  },
  mistralText: (prompt: string, system?: string, model?: string) =>
    request('/mistral/text', { prompt, system, model }),
  mistralJSON: async (prompt: string, system?: string, schemaHint?: string, model?: string) => {
    const res = await request('/mistral/json', { prompt, system, schemaHint, model });
    return res?.data ?? res;
  },
};