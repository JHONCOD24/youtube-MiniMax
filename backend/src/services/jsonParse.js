// Utilidades para parsear JSON de modelos de IA.
// Los modelos a menudo recortan la respuesta (MAX_TOKENS / thinking) y dejan un JSON incompleto.
// Aquí intentamos recuperar lo usable en vez de fallar del todo.

export function repairJson(text) {
  let s = String(text || '');
  s = s.replace(/\/\*[\s\S]*?\*\//g, '');
  s = s.replace(/(^|[^:])\/\/.*$/gm, '$1');
  s = s.replace(/[“”«»]/g, '"').replace(/[‘’´`]/g, "'");
  s = s.replace(/,(\s*[}\]])/g, '$1');
  return s.trim();
}

export function stripCodeFences(raw) {
  return String(raw || '')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/, '')
    .trim();
}

function readJsonString(src, startQuoteIdx) {
  // startQuoteIdx apunta a la comilla de apertura
  if (src[startQuoteIdx] !== '"') return null;
  let i = startQuoteIdx + 1;
  let out = '';
  while (i < src.length) {
    const c = src[i];
    if (c === '\\') {
      if (i + 1 >= src.length) return null; // escape truncado
      out += src[i + 1];
      i += 2;
      continue;
    }
    if (c === '"') return { value: out, end: i + 1 };
    out += c;
    i += 1;
  }
  // String sin cerrar: devolvemos lo que hay (respuesta truncada)
  return { value: out, end: src.length, unclosed: true };
}

/**
 * Extrae objetos JSON completos de un array truncado.
 * Ejemplo: { "ideas": [ {...}, {...}, { "titulo": "incompleto...
 * → devuelve solo los objetos cerrados correctamente.
 */
export function extractCompleteObjectsFromArray(text, arrayKey) {
  const src = String(text || '');
  const keyRe = arrayKey
    ? new RegExp(`"${arrayKey}"\\s*:\\s*\\[`)
    : /\[\s*\{/;
  const m = src.match(keyRe);
  if (!m) return null;

  let i = m.index + m[0].length;
  if (!arrayKey) {
    i = m.index + 1;
  }

  const items = [];
  while (i < src.length) {
    while (i < src.length && /[\s,]/.test(src[i])) i += 1;
    if (i >= src.length || src[i] === ']') break;
    if (src[i] !== '{') break;

    const start = i;
    let depth = 0;
    let inStr = false;
    let esc = false;
    let closed = false;

    for (; i < src.length; i += 1) {
      const c = src[i];
      if (inStr) {
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') {
        inStr = true;
        continue;
      }
      if (c === '{') depth += 1;
      else if (c === '}') {
        depth -= 1;
        if (depth === 0) {
          const chunk = src.slice(start, i + 1);
          try {
            items.push(JSON.parse(repairJson(chunk)));
          } catch {
            /* objeto malformado: se descarta */
          }
          i += 1;
          closed = true;
          break;
        }
      }
    }

    if (!closed) break;
  }

  if (!items.length) return null;
  return arrayKey ? { [arrayKey]: items } : items;
}

/**
 * Intenta cerrar un JSON truncado de forma best-effort (strings + llaves/corchetes).
 */
export function closeTruncatedJson(text) {
  let s = repairJson(text);
  if (!s) return s;

  let inStr = false;
  let esc = false;
  for (let i = 0; i < s.length; i += 1) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') {
      inStr = true;
    }
  }
  if (inStr) s += '"';

  const stack = [];
  inStr = false;
  esc = false;
  for (let i = 0; i < s.length; i += 1) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === '{' || c === '[') stack.push(c);
    else if (c === '}' || c === ']') {
      const open = stack[stack.length - 1];
      if ((c === '}' && open === '{') || (c === ']' && open === '[')) stack.pop();
    }
  }

  s = s.replace(/,\s*$/, '');
  while (stack.length) {
    const open = stack.pop();
    s += open === '{' ? '}' : ']';
  }
  return s;
}

/**
 * Último recurso: aunque el JSON esté roto, si hay campos "titulo","hook", etc.
 * armamos objetos mínimos. Sirve cuando se corta la PRIMERA idea a mitad.
 */
export function extractIdeasByFields(text) {
  const src = String(text || '');
  if (!/"titulo"\s*:/i.test(src)) return null;

  const titleMatches = [];
  const re = /"titulo"\s*:\s*"/gi;
  let m;
  while ((m = re.exec(src)) !== null) {
    const str = readJsonString(src, m.index + m[0].length - 1);
    if (!str || !str.value.trim()) continue;
    titleMatches.push({
      titulo: str.value.trim(),
      fieldStart: m.index,
      afterTitle: str.end,
    });
  }
  if (!titleMatches.length) return null;

  const getStringField = (chunk, field) => {
    const fr = new RegExp(`"${field}"\\s*:\\s*"`, 'i');
    const fm = fr.exec(chunk);
    if (!fm) return '';
    const s = readJsonString(chunk, fm.index + fm[0].length - 1);
    return s ? s.value.trim() : '';
  };

  const getStringArray = (chunk, field) => {
    const fr = new RegExp(`"${field}"\\s*:\\s*\\[`, 'i');
    const fm = fr.exec(chunk);
    if (!fm) return [];
    let i = fm.index + fm[0].length;
    const items = [];
    while (i < chunk.length) {
      while (i < chunk.length && /[\s,]/.test(chunk[i])) i += 1;
      if (i >= chunk.length || chunk[i] === ']') break;
      if (chunk[i] !== '"') break;
      const s = readJsonString(chunk, i);
      if (!s) break;
      if (s.value.trim()) items.push(s.value.trim());
      i = s.end;
      if (s.unclosed) break;
    }
    return items;
  };

  const ideas = titleMatches.map((t, idx) => {
    const end = idx + 1 < titleMatches.length ? titleMatches[idx + 1].fieldStart : src.length;
    const chunk = src.slice(t.fieldStart, end);
    return {
      titulo: t.titulo,
      hook: getStringField(chunk, 'hook'),
      promesaValor: getStringField(chunk, 'promesaValor'),
      angulo: getStringField(chunk, 'angulo'),
      porQueViral: getStringField(chunk, 'porQueViral'),
      estructuraSugerida: getStringArray(chunk, 'estructuraSugerida'),
      justificacionMetricas: getStringField(chunk, 'justificacionMetricas'),
      origen: getStringField(chunk, 'origen') || 'ai',
      fuentes: getStringArray(chunk, 'fuentes'),
      desgloseKB: getStringField(chunk, 'desgloseKB'),
      desgloseInvestigacion: getStringField(chunk, 'desgloseInvestigacion'),
    };
  }).filter((idea) => idea.titulo);

  if (!ideas.length) return null;
  console.log(`[jsonParse] Recuperadas ${ideas.length} ideas por campos sueltos (JSON roto/truncado)`);
  return { ideas };
}

/**
 * Parseo multi-estrategia del JSON que devuelven los LLMs.
 * Devuelve el objeto parseado o lanza Error con status 502.
 */
export function parseModelJson(raw, { preferredArrayKeys = ['ideas', 'titulos', 'vias'] } = {}) {
  const cleaned = stripCodeFences(raw);

  // 1) Directo
  try {
    return JSON.parse(cleaned);
  } catch {
    /* sigue */
  }

  // 2) Tras repair
  try {
    return JSON.parse(repairJson(cleaned));
  } catch {
    /* sigue */
  }

  // 3) Extraer objetos completos de arrays conocidos
  for (const key of preferredArrayKeys) {
    const partial = extractCompleteObjectsFromArray(cleaned, key);
    if (partial && Array.isArray(partial[key]) && partial[key].length > 0) {
      console.log(`[jsonParse] Recuperado JSON truncado: ${partial[key].length} ítems en "${key}"`);
      return partial;
    }
  }

  // 4) Array raíz de objetos
  const rootArr = extractCompleteObjectsFromArray(cleaned, null);
  if (Array.isArray(rootArr) && rootArr.length > 0) {
    return { ideas: rootArr };
  }

  // 5) Cerrar truncado y reintentar
  const closed = closeTruncatedJson(cleaned);
  try {
    return JSON.parse(closed);
  } catch {
    /* sigue */
  }
  try {
    return JSON.parse(repairJson(closed));
  } catch {
    /* sigue */
  }

  // 6) Tras cerrar, reintentar extracción parcial de objetos completos
  for (const key of preferredArrayKeys) {
    const partial = extractCompleteObjectsFromArray(closed, key);
    if (partial && Array.isArray(partial[key]) && partial[key].length > 0) {
      console.log(`[jsonParse] Recuperado tras closeTruncated: ${partial[key].length} ítems en "${key}"`);
      return partial;
    }
  }

  // 7) Último recurso: armar ideas/campos aunque el primer objeto nunca se cerró
  if (preferredArrayKeys.includes('ideas') || /"titulo"\s*:/i.test(cleaned)) {
    const loose = extractIdeasByFields(cleaned) || extractIdeasByFields(closed);
    if (loose?.ideas?.length) return loose;
  }

  const err = new Error(
    'No se pudo parsear el JSON devuelto por Gemini (respuesta incompleta). Prueba de nuevo; si se repite, cambia a Gemini 2.5 Flash-Lite en Ajustes.',
  );
  err.status = 502;
  err.detail = String(raw || '').slice(0, 1200);
  err.rawLength = String(raw || '').length;
  throw err;
}
