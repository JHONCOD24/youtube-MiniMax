export function resolveApiBase(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return String(envUrl).replace(/\/$/, '');

  // Si no se define una variable de entorno, asume que el backend
  // está montado en la misma URL bajo /api (ya sea por Vite proxy en local, o Vercel en prod).
  return '/api';
}

export const API_BASE = resolveApiBase();

export function getApiBase(): string {
  return API_BASE;
}