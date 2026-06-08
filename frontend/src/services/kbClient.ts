import type { KnowledgeDocMeta } from '../types';
import { kbPut, kbDelete, kbListByProject, kbTotalBytes, type KbDocRecord } from './kbDb';

function uid() {
  // @ts-ignore
  return (globalThis.crypto?.randomUUID?.() as string | undefined) || Math.random().toString(36).slice(2, 10);
}

function ext(name: string) {
  const i = (name || '').lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

async function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(r.error);
    r.onload = () => resolve(String(r.result || ''));
    r.readAsText(file);
  });
}

async function extractText(file: File): Promise<string> {
  const e = ext(file.name);
  if (e === 'txt' || e === 'md') return readAsText(file);

  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/kb/extract', { method: 'POST', body: fd });
  let data: any = null;
  try { data = await res.json(); } catch { /* empty */ }
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
  return String(data?.text || '').trim();
}

export async function kbIngestFiles(projectId: string, files: File[], maxBytes = 10 * 1024 * 1024): Promise<KnowledgeDocMeta[]> {
  const current = await kbTotalBytes(projectId);
  const incoming = files.reduce((s, f) => s + (f.size || 0), 0);
  if (current + incoming > maxBytes) {
    throw new Error('Límite excedido: máximo 10 MB por proyecto.');
  }

  const metas: KnowledgeDocMeta[] = [];
  for (const file of files) {
    const id = uid();
    const text = await extractText(file);
    const createdAt = new Date().toISOString();
    const rec: KbDocRecord = {
      id,
      projectId,
      name: file.name,
      mime: file.type || 'application/octet-stream',
      size: file.size || 0,
      createdAt,
      text,
    };
    await kbPut(rec);
    metas.push({ id, name: rec.name, mime: rec.mime, size: rec.size, createdAt });
  }
  return metas;
}

export async function kbRemove(projectId: string, id: string): Promise<void> {
  await kbDelete(id);
  const existing = await kbListByProject(projectId);
  if (existing.length === 0) return;
}

export async function kbBuildContext(projectId: string, maxChars = 20000): Promise<{ context: string; sources: string[] }> {
  const docs = await kbListByProject(projectId);
  const sources = docs.map((d) => `${d.id}:${d.name}`);
  let out = '';
  for (const d of docs) {
    const header = `\n\n[KB:${d.id}] ${d.name}\n`;
    const chunk = (d.text || '').slice(0, Math.max(0, maxChars - out.length - header.length));
    if (!chunk) break;
    out += header + chunk;
    if (out.length >= maxChars) break;
  }
  return { context: out.trim(), sources };
}
