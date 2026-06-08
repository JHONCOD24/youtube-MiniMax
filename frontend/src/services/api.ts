import { useApp } from '../store/useApp';

// Capa fina sobre fetch. Lanza errores con mensajes en español.
const BASE = '/api';

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
  const settings = useApp.getState().settings;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const youtubeKey = normalizeSecret(settings.youtubeKey);
  const geminiKey = normalizeSecret(settings.geminiKey);
  const claudeKey = normalizeSecret(settings.claudeKey);
  const mistralKey = normalizeSecret(settings.mistralKey);
  
  if (youtubeKey) {
    headers['x-youtube-key'] = youtubeKey;
  }
  if (geminiKey) {
    headers['x-gemini-key'] = geminiKey;
  }
  if (claudeKey) {
    headers['x-claude-key'] = claudeKey;
  }
  if (mistralKey) {
    headers['x-mistral-key'] = mistralKey;
  }

  const opts: RequestInit = {
    method,
    headers,
  };
  if (body) opts.body = JSON.stringify(body);

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, opts);
  } catch (e: any) {
    throw new ApiError('No se pudo conectar con el backend. Verifica que esté corriendo y que el proxy del frontend apunte al puerto correcto.');
  }

  let data: any = null;
  try { data = await res.json(); } catch { /* puede no haber body */ }

  if (!res.ok) {
    const msg = (() => {
      if (res.status === 401 && path.startsWith('/claude')) {
        return 'Claude: API key inválida. Ve a Ajustes, pega una key válida (sk-ant-...) y guarda.';
      }
      const base = data?.error || `Error ${res.status}`;
      // Si el backend incluyó detail, mostrarlo para depuración
      if (data?.detail) {
        return `${base}\n\nRespuesta recibida:\n${data.detail.slice(0, 400)}`;
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
