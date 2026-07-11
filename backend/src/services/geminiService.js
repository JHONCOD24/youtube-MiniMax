// Servicio de Gemini: encapsula la API con reintentos y backoff.
// Por defecto usa gemini-2.5-flash (rápido y generoso en free tier).
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
      // No tragarse errores con status propio (p. ej. 503 de key faltante).
      if (e && e.status) throw e;
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
    'INSTRUCCIÓN ESTRICTA DE FORMATO: Tu respuesta debe ser EXCLUSIVAMENTE un objeto JSON válido.',
    'No escribas prosa, no uses bloques de código ```, no agregues explicaciones antes ni después.',
    'No incluyas comentarios // ni /* */. No uses comillas tipográficas (“ ” ‘ ’).',
    'No pongas comas trailing antes de } o ].',
    'Empieza tu respuesta con el primer caracter del JSON ( { o [ ) y termina con el último ( } o ] ).',
    schemaHint ? `Esquema esperado: ${schemaHint}` : '',
  ].filter(Boolean).join('\n');

  console.log(`[GEMINI generateJSON] Calling model=${model || DEFAULT_MODEL}. Prompt len: ${prompt.length}, System instruction len: ${fullSystem.length}`);

  const raw = await callGemini({
    model: model || DEFAULT_MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature, responseMimeType: 'application/json', maxOutputTokens: 8192 },
    systemInstruction: fullSystem,
  }, clientKey);

  console.log(`[GEMINI generateJSON] Received raw length: ${raw.length}`);

  // Limpiar el JSON si viene envuelto en markdown
  let cleaned = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/, '')
    .trim();

  // --- Estrategia multi-capa para extraer JSON ---
  try {
    const parsed = JSON.parse(cleaned);
    console.log(`[GEMINI generateJSON] Direct parse successful. Keys: ${Object.keys(parsed).join(', ')}`);
    return parsed;
  } catch (_) {
    console.log('[GEMINI generateJSON] Direct parse failed, trying alternative methods...');
  }

  function extractBalanced(text, open, close) {
    let start = -1;
    let depth = 0;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === open) {
        if (depth === 0) start = i;
        depth++;
      } else if (c === close) {
        depth--;
        if (depth === 0 && start >= 0) {
          const candidate = text.slice(start, i + 1);
          try { return JSON.parse(candidate); } catch (_) { /* sigue */ }
          try { return JSON.parse(repairJson(candidate)); } catch (_) { /* sigue */ }
          start = -1;
        }
      }
    }
    return undefined;
  }

  const result = extractBalanced(cleaned, '{', '}') || extractBalanced(cleaned, '[', ']');
  if (result) {
    console.log(`[GEMINI generateJSON] Parsed via extractBalanced. Keys: ${Object.keys(result).join(', ')}`);
    return result;
  }

  const bracesMatch = cleaned.match(/(\{[\s\S]*\})/);
  if (bracesMatch) {
    try {
      const parsed = JSON.parse(bracesMatch[1]);
      console.log(`[GEMINI generateJSON] Parsed via braces regex. Keys: ${Object.keys(parsed).join(', ')}`);
      return parsed;
    } catch (_) { /* sigue */ }
    try {
      const parsed = JSON.parse(repairJson(bracesMatch[1]));
      console.log(`[GEMINI generateJSON] Parsed via repaired braces regex. Keys: ${Object.keys(parsed).join(', ')}`);
      return parsed;
    } catch (_) { /* sigue */ }
  }

  const bracketsMatch = cleaned.match(/(\[[\s\S]*\])/);
  if (bracketsMatch) {
    try {
      const parsed = JSON.parse(bracketsMatch[1]);
      console.log(`[GEMINI generateJSON] Parsed via brackets regex. Keys: ${Object.keys(parsed).join(', ')}`);
      return parsed;
    } catch (_) { /* sigue */ }
    try {
      const parsed = JSON.parse(repairJson(bracketsMatch[1]));
      console.log(`[GEMINI generateJSON] Parsed via repaired brackets regex. Keys: ${Object.keys(parsed).join(', ')}`);
      return parsed;
    } catch (_) { /* sigue */ }
  }

  console.error('[GEMINI generateJSON] All parsing strategies failed. Raw content snippet:', raw.slice(0, 500));
  const err = new Error('No se pudo parsear el JSON devuelto por Gemini.');
  err.status = 502;
  err.detail = raw.slice(0, 1000);
  err.rawLength = raw.length;
  throw err;
}

function repairJson(text) {
  let s = text;
  s = s.replace(/\/\*[\s\S]*?\*\//g, '');
  s = s.replace(/(^|[^:])\/\/.*$/gm, '$1');
  s = s.replace(/[“”«»]/g, '"').replace(/[‘’´`]/g, "'");
  s = s.replace(/,(\s*[}\]])/g, '$1');
  return s.trim();
}

export const MODELS = { DEFAULT_MODEL, FLASH_LITE };
