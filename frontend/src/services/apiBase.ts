export function resolveApiBase(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return String(envUrl).replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return '/api';
  }

  return '';
}

export const API_BASE = resolveApiBase();

export function getApiBase(): string {
  return API_BASE;
}