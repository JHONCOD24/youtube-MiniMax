// Helpers de localStorage con tipado seguro y avisos de error visibles.
export type StorageResult = { ok: true } | { ok: false; error: string };

const storageErrorListeners = new Set<(msg: string) => void>();

export function onStorageError(fn: (msg: string) => void): () => void {
  storageErrorListeners.add(fn);
  return () => storageErrorListeners.delete(fn);
}

function notifyStorageError(msg: string) {
  storageErrorListeners.forEach((fn) => fn(msg));
}

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T): StorageResult {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch (e: unknown) {
    const isQuota = e instanceof DOMException && e.name === 'QuotaExceededError';
    const msg = isQuota
      ? 'No hay espacio suficiente. Exporta y elimina proyectos antiguos.'
      : 'No se pudo guardar. Verifica el almacenamiento del navegador.';
    console.warn('No se pudo guardar en localStorage', e);
    notifyStorageError(msg);
    return { ok: false, error: msg };
  }
}

export const KEYS = {
  proyectos: 'ynl.proyectos',
  proyectoActivo: 'ynl.proyectoActivo',
  settings: 'ynl.settings',
  theme: 'ynl.theme',
  hooksBanco: 'ynl.hooksBanco',
  plantillas: 'ynl.plantillas',
};