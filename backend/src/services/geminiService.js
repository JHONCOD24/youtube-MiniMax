// Servicio de Gemini: encapsula la API con reintentos y backoff.
// Por defecto usa gemini-2.5-flash (alineado con el frontend).
import { parseModelJson } from './jsonParse.js';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

const DEFAULT_MODEL = 'gemini-2.5-flash';
const FLASH_LITE = 'gemini-2.5-flash-lite';

function resolveGeminiKey(clientKey = null) {
  const key = String(clientKey || process.env.GEMINI_API_KEY || '')
    .trim()
    .replace(/^Bearer\s+/i, '')
    .replace(/^['"`]+|['"`]+$/g, '')
    .trim();
  if (!key) {
    const err = new Error(
      'Gemini API key no configurada. Pégala en Ajustes y pulsa Probar, o define GEMINI_API_KEY en Vercel.',
    );
    err.status = 503;
    throw err;
  }
  return key;
}

function buildUrl(model, clientKey = null) {
  const key = resolveGeminiKey(clientKey);
  return `${BASE_URL}/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
}

/**
 * Llama a Gemini y devuelve { text, finishReason, truncated }.
 * truncated=true cuando el modelo cortó por MAX_TOKENS u otro límite.
 */
async function callGemini({ model = DEFAULT_MODEL, contents, generationConfig, systemInstruction }, clientKey = null) {
  const body = {
    contents,
    generationConfig: { temperature: 0.8, ...generationConfig },
  };
  if (systemInstruction) {
    body.systemInstruction = { role: 'system', parts: [{ text: systemInstruction }] };
  }

  let attempt = 0;
  const maxAttempts = 3;
  let lastError;

  // Validar la key ANTES del bucle: si falta, error 503 claro (no confundir con red).
  const url = buildUrl(model, clientKey);

  while (attempt < maxAttempts) {
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (e) {
      if (e && e.status) throw e;
      lastError = new Error('No se pudo conectar con Gemini. Revisa tu conexión.');
      lastError.status = 502;
    }

    if (res && res.ok) {
      const data = await res.json();
      const candidate = data?.candidates?.[0];
      const text = candidate?.content?.parts?.map((p) => p.text || '').join('') || '';
      const finishReason = candidate?.finishReason || data?.promptFeedback?.blockReason || '';
      if (!text) {
        const err = new Error(
          finishReason
            ? `Gemini devolvió una respuesta vacía (${finishReason}).`
            : 'Gemini devolvió una respuesta vacía.',
        );
        err.status = 502;
        throw err;
      }
      const truncated = /MAX_TOKENS|LENGTH/i.test(String(finishReason));
      return { text, finishReason, truncated };
    }

    if (res) {
      let detail = '';
      try {
        const j = await res.json();
        detail = j?.error?.message || JSON.stringify(j);
      } catch {
        detail = await res.text().catch(() => '');
      }
      // 429/503: reintentar con backoff
      if (res.status === 429 || res.status === 503) {
        const wait = 500 * Math.pow(2, attempt); // 0.5s, 1s, 2s
        await new Promise((r) => setTimeout(r, wait));
        attempt += 1;
        lastError = new Error(`Gemini ${res.status} (reintentando): ${detail}`);
        continue;
      }
      const err = new Error(`Gemini ${res.status}: ${detail || res.statusText}`);
      err.status = res.status;
      throw err;
    }

    attempt += 1;
  }

  throw lastError || new Error('Gemini no respondió tras varios reintentos');
}

// --- API pública ---
export async function generateText({ prompt, system, temperature = 0.8, model }, clientKey = null) {
  const { text } = await callGemini({
    model: model || DEFAULT_MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature, maxOutputTokens: 8192 },
    systemInstruction: system,
  }, clientKey);
  return text;
}

export async function generateJSON({ prompt, system, temperature = 0.7, model, schemaHint }, clientKey = null) {
  const fullSystem = [
    system || '',
    'INSTRUCCIÓN ESTRICTA DE FORMATO: Tu respuesta debe ser EXCLUSIVAMENTE un objeto JSON válido y COMPLETO.',
    'No escribas prosa, no uses bloques de código ```, no agregues explicaciones antes ni después.',
    'No incluyas comentarios // ni /* */. No uses comillas tipográficas (“ ” ‘ ’).',
    'No pongas comas trailing antes de } o ].',
    'Sé CONCISO en cada campo de texto (máx. 1-2 frases cortas) para no truncar el JSON.',
    'Empieza tu respuesta con el primer caracter del JSON ( { o [ ) y termina con el último ( } o ] ).',
    schemaHint ? `Esquema esperado: ${schemaHint}` : '',
  ].filter(Boolean).join('\n');

  const usedModel = model || DEFAULT_MODEL;
  console.log(`[GEMINI generateJSON] model=${usedModel}. Prompt len: ${prompt.length}`);

  // 8192 a menudo corta packs grandes (10 ideas, assets…). 32k da margen en 2.5-flash.
  const { text: raw, truncated, finishReason } = await callGemini({
    model: usedModel,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      responseMimeType: 'application/json',
      maxOutputTokens: 32768,
    },
    systemInstruction: fullSystem,
  }, clientKey);

  console.log(`[GEMINI generateJSON] raw len=${raw.length} finishReason=${finishReason || '—'} truncated=${!!truncated}`);

  try {
    const parsed = parseModelJson(raw, { preferredArrayKeys: ['ideas', 'titulos', 'vias', 'storyboard', 'thumbnails'] });
    if (truncated) {
      console.warn('[GEMINI generateJSON] Respuesta truncada por tokens; se recuperó JSON parcial usable.');
    }
    return parsed;
  } catch (err) {
    if (truncated) {
      err.message = `${err.message} Gemini cortó la respuesta por límite de tokens (${finishReason}).`;
    }
    throw err;
  }
}

export const MODELS = { DEFAULT_MODEL, FLASH_LITE };
