// Servicio de Claude: encapsula la API con reintentos y backoff.
// Por defecto usa claude-sonnet-4-6.
import { parseModelJson } from './jsonParse.js';

const BASE_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-6';

function normalizeApiKey(value) {
  return String(value || '')
    .trim()
    .replace(/^Bearer\s+/i, '')
    .replace(/^['"`]+|['"`]+$/g, '')
    .trim();
}

async function callClaude({ model = DEFAULT_MODEL, messages, temperature = 0.8, system, responseFormat }, clientKey = null) {
  const apiKey = normalizeApiKey(clientKey) || normalizeApiKey(process.env.CLAUDE_API_KEY);
  if (!apiKey) {
    const err = new Error('Claude API key no configurada en el backend (.env)');
    err.status = 503;
    throw err;
  }

  if (!apiKey.startsWith('sk-ant-')) {
    const err = new Error('Claude: formato de API key inválido. Debe empezar por "sk-ant-".');
    err.status = 400;
    throw err;
  }

  const body = {
    model,
    max_tokens: 8192,
    temperature,
    messages,
  };
  if (system) {
    body.system = system;
  }
  if (responseFormat) {
    // No todos los modelos soportan response_format. En lugar de eso,
    // forzamos el formato vía system prompt + parseo tolerante.
  }

  let attempt = 0;
  const maxAttempts = 3;
  let lastError;

  while (attempt < maxAttempts) {
    let res;
    try {
      res = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });
    } catch (e) {
      if (e && e.status) throw e;
      lastError = new Error('No se pudo conectar con Claude. Revisa tu conexión.');
      lastError.status = 502;
    }

    if (res && res.ok) {
      const data = await res.json();
      const text = data?.content?.[0]?.text || '';
      if (!text) {
        const err = new Error('Claude devolvió una respuesta vacía.');
        err.status = 502;
        throw err;
      }
      return text;
    }

    if (res) {
      let detail = '';
      try {
        const j = await res.json();
        detail = j?.error?.message || JSON.stringify(j);
      } catch {
        detail = await res.text().catch(() => '');
      }

      if (res.status === 401) {
        const err = new Error('Claude: API key inválida. Ve a Ajustes y pega una key válida (sk-ant-...) o configúrala en backend/.env (CLAUDE_API_KEY) y reinicia el backend.');
        err.status = 401;
        throw err;
      }

      if (res.status === 403) {
        const err = new Error('Claude: acceso denegado. Verifica que tu API key esté activa y con permisos en Anthropic.');
        err.status = 403;
        throw err;
      }

      // 429/503: reintentar con backoff
      if (res.status === 429 || res.status === 503) {
        const wait = 500 * Math.pow(2, attempt); // 0.5s, 1s, 2s
        await new Promise((r) => setTimeout(r, wait));
        attempt += 1;
        lastError = new Error(`Claude ${res.status} (reintentando): ${detail}`);
        continue;
      }
      const err = new Error(`Claude ${res.status}: ${detail || res.statusText}`);
      err.status = res.status;
      throw err;
    }

    attempt += 1;
  }

  throw lastError || new Error('Claude no respondió tras varios reintentos');
}

// --- API pública ---
export async function generateText({ prompt, system, temperature = 0.8, model }, clientKey = null) {
  return callClaude({
    model: model || DEFAULT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature,
    system,
  }, clientKey);
}

export async function generateJSON({ prompt, system, temperature = 0.7, model, schemaHint }, clientKey = null) {
  const fullSystem = [
    system || '',
    'INSTRUCCIÓN ESTRICTA DE FORMATO: Tu respuesta debe ser EXCLUSIVAMENTE un objeto JSON válido.',
    'No escribas prosa, no uses bloques de código ```, no agregues explicaciones antes ni después.',
    'No incluyas comentarios // ni /* */. No uses comillas tipográficas (“ ” ‘ ’).',
    'No pongas comas trailing antes de } o ].',
    'Empieza tu respuesta con el primer caracter del JSON ( { o [ ) y termina con el último ( } o ] ).',
    schemaHint ? `Esquema esperado: ${schemaHint}` : '',
  ].filter(Boolean).join('\n');

  const raw = await callClaude({
    model: model || DEFAULT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature,
    system: fullSystem,
    responseFormat: true,
  }, clientKey);

  try {
    return parseModelJson(raw, { preferredArrayKeys: ['ideas', 'titulos', 'vias', 'storyboard', 'thumbnails'] });
  } catch (err) {
    err.message = (err.message || '').replace('la IA', 'Claude') || 'No se pudo parsear el JSON devuelto por Claude.';
    throw err;
  }
}
