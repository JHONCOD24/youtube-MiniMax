// Helpers de localStorage con tipado seguro.
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('No se pudo guardar en localStorage', e);
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
