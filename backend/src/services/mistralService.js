// Servicio de Mistral AI: encapsula la API con reintentos y backoff.
// Por defecto usa mistral-large-latest (el modelo de propósito general más potente de Mistral).
import { parseModelJson } from './jsonParse.js';

const BASE_URL = 'https://api.mistral.ai/v1/chat/completions';
const DEFAULT_MODEL = 'mistral-large-latest';

function normalizeApiKey(value) {
  return String(value || '')
    .trim()
    .replace(/^Bearer\s+/i, '')
    .replace(/^['"`]+|['"`]+$/g, '')
    .trim();
}

async function callMistral({ model = DEFAULT_MODEL, messages, temperature = 0.8, system, responseFormat }, clientKey = null) {
  const apiKey = normalizeApiKey(clientKey) || normalizeApiKey(process.env.MISTRAL_API_KEY);
  if (!apiKey) {
    const err = new Error('Mistral API key no configurada en el backend (.env)');
    err.status = 503;
    throw err;
  }

  // Estructura de mensajes para Mistral
  const formattedMessages = [];
  if (system) {
    formattedMessages.push({ role: 'system', content: system });
  }
  formattedMessages.push(...messages);

  const body = {
    model: model || DEFAULT_MODEL,
    temperature,
    messages: formattedMessages,
  };

  if (responseFormat) {
    body.response_format = { type: 'json_object' };
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
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });
    } catch (e) {
      if (e && e.status) throw e;
      lastError = new Error('No se pudo conectar con Mistral. Revisa tu conexión.');
      lastError.status = 502;
    }

    if (res && res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || '';
      if (!text) {
        const err = new Error('Mistral devolvió una respuesta vacía.');
        err.status = 502;
        throw err;
      }
      return text;
    }

    if (res) {
      let detail = '';
      try {
        const j = await res.json();
        detail = j?.message || j?.error?.message || JSON.stringify(j);
      } catch {
        detail = await res.text().catch(() => '');
      }

      if (res.status === 401) {
        const err = new Error('Mistral: API key inválida. Ve a Ajustes y pega una key válida o configúrala en backend/.env (MISTRAL_API_KEY) y reinicia.');
        err.status = 401;
        throw err;
      }

      // 429/503: reintentar con backoff
      if (res.status === 429 || res.status === 503) {
        const wait = 500 * Math.pow(2, attempt); // 0.5s, 1s, 2s
        await new Promise((r) => setTimeout(r, wait));
        attempt += 1;
        lastError = new Error(`Mistral ${res.status} (reintentando): ${detail}`);
        continue;
      }
      const err = new Error(`Mistral ${res.status}: ${detail || res.statusText}`);
      err.status = res.status;
      throw err;
    }

    attempt += 1;
  }

  throw lastError || new Error('Mistral no respondió tras varios reintentos');
}

// --- API pública ---
export async function generateText({ prompt, system, temperature = 0.8, model }, clientKey = null) {
  return callMistral({
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

  const raw = await callMistral({
    model: model || DEFAULT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature,
    system: fullSystem,
    responseFormat: true,
  }, clientKey);

  try {
    return parseModelJson(raw, { preferredArrayKeys: ['ideas', 'titulos', 'vias', 'storyboard', 'thumbnails'] });
  } catch (err) {
    err.message = (err.message || '').replace('la IA', 'Mistral') || 'No se pudo parsear el JSON devuelto por Mistral.';
    throw err;
  }
}
