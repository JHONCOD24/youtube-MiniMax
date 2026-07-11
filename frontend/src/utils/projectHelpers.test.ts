import { describe, it, expect } from 'vitest';
import {
  calcularPaso,
  proyectoTieneContenido,
  resolverGuardadoProyecto,
  upsertProyectoEnLista,
} from './projectHelpers';
import type { Project } from '../types';

function proyectoBase(overrides: Partial<Project> = {}): Project {
  return {
    id: 'abc',
    nombre: 'Proyecto test',
    nicho: '',
    fechaCreacion: '2026-01-01',
    fechaModificacion: '2026-01-01',
    knowledgeBase: [],
    videoPlan: { formato: 'short', duracionSegundos: 60, preset: 'short_rapido' },
    ...overrides,
  };
}

describe('calcularPaso', () => {
  it('devuelve 0 sin nicho', () => {
    expect(calcularPaso(proyectoBase())).toBe(0);
  });

  it('avanza según el contenido del proyecto', () => {
    expect(calcularPaso(proyectoBase({ nicho: 'Fitness' }))).toBe(1);
    expect(calcularPaso(proyectoBase({ nicho: 'Fitness', investigacion: { nicho: 'Fitness' } as any }))).toBe(2);
    expect(calcularPaso(proyectoBase({ ideaElegida: { id: '1', titulo: 'Idea', hook: '', angulo: '', porQueViral: '' } }))).toBe(3);
    expect(calcularPaso(proyectoBase({ assets: { tema: '', nicho: '', titulos: [], guion: '', descripcionSEO: '', keywords: [], timestamps: [], promptThumbnail: '', promptVideo: '', promptMusica: '', promptMusicaGemini: '', estrategiaPublicacion: {} as any } }))).toBe(4);
    expect(calcularPaso(proyectoBase({ monetizacion: { nicho: '', rpm: [0, 0], cpm: [0, 0], vias: [], proyeccion: { vistasMes: 0, ingresosAds: [0, 0], ingresosAfiliados: [0, 0], ingresosTotales: [0, 0] }, requisitos: [] } }))).toBe(5);
  });
});

describe('proyectoTieneContenido', () => {
  it('detecta borrador vacío', () => {
    expect(proyectoTieneContenido(proyectoBase())).toBe(false);
  });
  it('detecta nicho o investigación', () => {
    expect(proyectoTieneContenido(proyectoBase({ nicho: 'X' }))).toBe(true);
    expect(proyectoTieneContenido(proyectoBase({ investigacion: { nicho: 'X' } as any }))).toBe(true);
  });
});

describe('upsertProyectoEnLista', () => {
  it('inserta si no existe y actualiza si existe', () => {
    const a = proyectoBase({ nicho: 'A' });
    const lista1 = upsertProyectoEnLista(a, []);
    expect(lista1).toHaveLength(1);
    const a2 = { ...a, nicho: 'B' };
    const lista2 = upsertProyectoEnLista(a2, lista1);
    expect(lista2).toHaveLength(1);
    expect(lista2[0].nicho).toBe('B');
  });
});

describe('resolverGuardadoProyecto', () => {
  const ahora = '2026-06-16T12:00:00.000Z';

  it('agrega el proyecto si no existe en la lista', () => {
    const proyecto = proyectoBase({ nicho: 'Tech' });
    const { actualizado, nuevos } = resolverGuardadoProyecto(proyecto, [], ahora);
    expect(nuevos).toHaveLength(1);
    expect(actualizado.id).toBe('abc');
  });

  it('actualiza en su lugar y renombra con la idea, sin cambiar el id', () => {
    const proyecto = proyectoBase({
      nicho: 'Tech',
      ideaElegida: { id: 'i2', titulo: 'Nueva idea viral', hook: '', angulo: '', porQueViral: '' },
    });
    const existente = proyectoBase({ nombre: 'Nombre anterior' });
    const { actualizado, nuevos } = resolverGuardadoProyecto(proyecto, [existente], ahora);
    expect(nuevos).toHaveLength(1);
    expect(actualizado.id).toBe('abc');
    expect(actualizado.nombre).toBe('Nueva idea viral');
  });
});
