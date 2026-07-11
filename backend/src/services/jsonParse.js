// Utilidades para parsear JSON de modelos de IA.
// Los modelos a menudo recortan la respuesta (MAX_TOKENS) y dejan un JSON incompleto.
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
  // Si no había key, el match puede ser "[ {" — retroceder al '['
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

    if (!closed) break; // último objeto incompleto → paramos
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

  // Si quedó una cadena abierta, ciérrala
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

  // Contar llaves/corchetes fuera de strings
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

  // Quitar comas colgantes antes de cerrar
  s = s.replace(/,\s*$/, '');
  while (stack.length) {
    const open = stack.pop();
    s += open === '{' ? '}' : ']';
  }
  return s;
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

  // 3) Extraer objetos completos de arrays conocidos (JSON truncado a mitad)
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

  // 6) Tras cerrar, reintentar extracción parcial
  for (const key of preferredArrayKeys) {
    const partial = extractCompleteObjectsFromArray(closed, key);
    if (partial && Array.isArray(partial[key]) && partial[key].length > 0) {
      console.log(`[jsonParse] Recuperado tras closeTruncated: ${partial[key].length} ítems en "${key}"`);
      return partial;
    }
  }

  const err = new Error(
    'No se pudo parsear el JSON devuelto por la IA (respuesta incompleta o malformada). Prueba de nuevo; si se repite, usa un modelo más capaz o genera menos ideas.',
  );
  err.status = 502;
  err.detail = String(raw || '').slice(0, 1000);
  err.rawLength = String(raw || '').length;
  throw err;
}
