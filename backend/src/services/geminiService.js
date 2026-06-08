// Servicio de Gemini: encapsula la API con reintentos y backoff.
// Por defecto usa gemini-2.5-flash (rápido y generoso en free tier).
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

const DEFAULT_MODEL = 'gemini-2.5-flash';
const FLASH_LITE = 'gemini-2.5-flash-lite';

function buildUrl(model, clientKey = null) {
  const key = clientKey || process.env.GEMINI_API_KEY;
  if (!key) {
    const err = new Error('Gemini API key no configurada en el backend (.env)');
    err.status = 503;
    throw err;
  }
  return `${BASE_URL}/models/${model}:generateContent?key=${key}`;
}

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

  while (attempt < maxAttempts) {
    let res;
    try {
      res = await fetch(buildUrl(model, clientKey), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (e) {
      lastError = new Error('No se pudo conectar con Gemini. Revisa tu conexión.');
      lastError.status = 502;
    }

    if (res && res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
      if (!text) {
        const err = new Error('Gemini devolvió una respuesta vacía.');
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
  return callGemini({
    model: model || DEFAULT_MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature },
    systemInstruction: system,
  }, clientKey);
}

export async function generateJSON({ prompt, system, temperature = 0.7, model, schemaHint }, clientKey = null) {
  const fullSystem = [
    system || '',
    'Responde EXCLUSIVAMENTE con un JSON válido, sin texto adicional, sin markdown, sin comentarios.',
    schemaHint ? `Esquema esperado: ${schemaHint}` : '',
  ].filter(Boolean).join('\n');

  const raw = await callGemini({
    model: model || DEFAULT_MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature, responseMimeType: 'application/json' },
    systemInstruction: fullSystem,
  }, clientKey);

  // A veces el modelo envuelve el JSON en ```json ... ```. Lo limpiamos.
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const err = new Error('No se pudo parsear el JSON devuelto por Gemini.');
    err.status = 502;
    err.detail = raw.slice(0, 500);
    throw err;
  }
}

export const MODELS = { DEFAULT_MODEL, FLASH_LITE };
