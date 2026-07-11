// Servicio de Gemini: encapsula la API con reintentos y backoff.
// Alineado con modelos 2.5 del frontend; desactiva "thinking" para no comerse los tokens del JSON.
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

function isGemini25(model) {
  return /gemini-2\.5/i.test(String(model || ''));
}

/**
 * Llama a Gemini y devuelve { text, finishReason, truncated, usage }.
 */
async function callGemini({ model = DEFAULT_MODEL, contents, generationConfig, systemInstruction }, clientKey = null) {
  const usedModel = model || DEFAULT_MODEL;
  const body = {
    contents,
    generationConfig: { temperature: 0.8, ...generationConfig },
  };
  if (systemInstruction) {
    body.systemInstruction = { role: 'system', parts: [{ text: systemInstruction }] };
  }

  // Gemini 2.5 gasta tokens en "thinking" y deja el JSON a medias.
  // thinkingBudget: 0 desactiva el razonamiento interno y deja el cupo para la respuesta.
  if (isGemini25(usedModel)) {
    body.generationConfig = {
      ...body.generationConfig,
      thinkingConfig: {
        ...(body.generationConfig.thinkingConfig || {}),
        thinkingBudget: 0,
      },
    };
  }

  let attempt = 0;
  const maxAttempts = 3;
  let lastError;
  const url = buildUrl(usedModel, clientKey);

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
      const usage = data?.usageMetadata || null;

      if (!text) {
        // Si thinkingBudget:0 no es soportado, la API a veces responde vacío o error en otro camino.
        const err = new Error(
          finishReason
            ? `Gemini devolvió una respuesta vacía (${finishReason}).`
            : 'Gemini devolvió una respuesta vacía.',
        );
        err.status = 502;
        throw err;
      }
      const truncated = /MAX_TOKENS|LENGTH/i.test(String(finishReason));
      if (usage) {
        console.log(
          `[GEMINI] usage prompt=${usage.promptTokenCount || 0} candidates=${usage.candidatesTokenCount || 0} thoughts=${usage.thoughtsTokenCount || 0} total=${usage.totalTokenCount || 0} finish=${finishReason || '—'}`,
        );
      }
      return { text, finishReason, truncated, usage };
    }

    if (res) {
      let detail = '';
      let errJson = null;
      try {
        errJson = await res.json();
        detail = errJson?.error?.message || JSON.stringify(errJson);
      } catch {
        detail = await res.text().catch(() => '');
      }

      // Si thinkingConfig no es aceptado, reintentar sin él una sola vez.
      if (
        res.status === 400
        && /thinking/i.test(detail)
        && body.generationConfig?.thinkingConfig
      ) {
        console.warn('[GEMINI] thinkingConfig rechazado; reintentando sin thinkingConfig');
        delete body.generationConfig.thinkingConfig;
        attempt += 1;
        continue;
      }

      if (res.status === 429 || res.status === 503) {
        const wait = 500 * Math.pow(2, attempt);
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

// Esquema estricto para ideas: reduce basura y ayuda a no truncar.
const IDEAS_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    ideas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          titulo: { type: 'string' },
          hook: { type: 'string' },
          promesaValor: { type: 'string' },
          angulo: { type: 'string' },
          porQueViral: { type: 'string' },
          estructuraSugerida: { type: 'array', items: { type: 'string' } },
          justificacionMetricas: { type: 'string' },
          origen: { type: 'string' },
          fuentes: { type: 'array', items: { type: 'string' } },
          desgloseKB: { type: 'string' },
          desgloseInvestigacion: { type: 'string' },
        },
        required: ['titulo', 'hook', 'angulo', 'porQueViral'],
      },
    },
  },
  required: ['ideas'],
};

function looksLikeIdeasRequest(prompt = '', schemaHint = '') {
  const blob = `${prompt}\n${schemaHint}`.toLowerCase();
  return blob.includes('"ideas"') || blob.includes('ideas:') || /\bideas\b/.test(blob);
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
    'Sé MUY CONCISO: frases cortas. Prioriza completar el JSON entero antes que alargar un solo campo.',
    'Empieza con { y termina con }.',
    schemaHint ? `Esquema esperado: ${schemaHint}` : '',
  ].filter(Boolean).join('\n');

  const usedModel = model || DEFAULT_MODEL;
  const forIdeas = looksLikeIdeasRequest(prompt, schemaHint);

  console.log(`[GEMINI generateJSON] model=${usedModel} ideas=${forIdeas} promptLen=${prompt.length}`);

  const generationConfig = {
    temperature,
    responseMimeType: 'application/json',
    // 2.5 con thinking off: 8192 suele bastar; damos 16384 de margen.
    maxOutputTokens: forIdeas ? 16384 : 32768,
  };

  if (forIdeas) {
    generationConfig.responseSchema = IDEAS_RESPONSE_SCHEMA;
  }

  let raw;
  let truncated = false;
  let finishReason = '';

  try {
    const result = await callGemini({
      model: usedModel,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
      systemInstruction: fullSystem,
    }, clientKey);
    raw = result.text;
    truncated = result.truncated;
    finishReason = result.finishReason;
  } catch (e) {
    // Si responseSchema falla en algún modelo, reintentar sin esquema.
    if (forIdeas && generationConfig.responseSchema) {
      console.warn('[GEMINI] responseSchema falló, reintento sin esquema:', e.message);
      delete generationConfig.responseSchema;
      const result = await callGemini({
        model: usedModel,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
        systemInstruction: fullSystem,
      }, clientKey);
      raw = result.text;
      truncated = result.truncated;
      finishReason = result.finishReason;
    } else {
      throw e;
    }
  }

  console.log(`[GEMINI generateJSON] rawLen=${raw.length} finish=${finishReason || '—'} truncated=${!!truncated}`);

  try {
    const parsed = parseModelJson(raw, {
      preferredArrayKeys: ['ideas', 'titulos', 'vias', 'storyboard', 'thumbnails'],
    });
    if (truncated) {
      console.warn('[GEMINI generateJSON] Truncado por tokens; se recuperó JSON parcial usable.');
    }
    return parsed;
  } catch (err) {
    if (truncated || /MAX_TOKENS|LENGTH/i.test(finishReason)) {
      err.message = `${err.message} Gemini cortó la respuesta (${finishReason || 'MAX_TOKENS'}).`;
    }
    throw err;
  }
}

export const MODELS = { DEFAULT_MODEL, FLASH_LITE };
