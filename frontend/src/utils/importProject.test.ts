import { describe, it, expect } from 'vitest';
import { parseJsonProject, parseMarkdownProject } from './importProject';

describe('parseJsonProject', () => {
  it('parsea un proyecto válido', () => {
    const raw = JSON.stringify({
      nombre: 'Mi video',
      nicho: 'Productividad',
      investigacion: { nicho: 'Productividad', resumen: 'OK' },
    });
    const p = parseJsonProject(raw);
    expect(p.nombre).toBe('Mi video');
    expect(p.nicho).toBe('Productividad');
    expect(p.investigacion?.resumen).toBe('OK');
  });

  it('acepta envoltorio { proyecto: ... }', () => {
    const raw = JSON.stringify({ proyecto: { nombre: 'Envuelto', nicho: 'Crypto' } });
    const p = parseJsonProject(raw);
    expect(p.nombre).toBe('Envuelto');
  });

  it('rechaza JSON inválido', () => {
    expect(() => parseJsonProject('{mal json')).toThrow(/JSON inválido/);
  });
});

describe('parseMarkdownProject', () => {
  it('extrae nicho e idea del markdown exportado', () => {
    const md = `# Video de prueba
**Nicho:** Finanzas personales

## Idea
**Título:** Cómo ahorrar $100 al mes
**Hook:** Nadie te dice esto
**Ángulo:** Enfoque LATAM
`;
    const p = parseMarkdownProject(md);
    expect(p.nombre).toBe('Video de prueba');
    expect(p.nicho).toBe('Finanzas personales');
    expect(p.ideaElegida?.titulo).toBe('Cómo ahorrar $100 al mes');
    expect(p.ideaElegida?.hook).toBe('Nadie te dice esto');
  });
});