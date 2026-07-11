import { describe, it, expect } from 'vitest';
import { calcularPaso, resolverGuardadoProyecto } from './projectHelpers';
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

describe('resolverGuardadoProyecto', () => {
  const ahora = '2026-06-16T12:00:00.000Z';

  it('agrega el proyecto si no existe en la lista', () => {
    const proyecto = proyectoBase({ nicho: 'Tech' });
    const { actualizado, nuevos } = resolverGuardadoProyecto(proyecto, [], ahora, () => 'nuevo-id');
    expect(nuevos).toHaveLength(1);
    expect(actualizado.id).toBe('abc');
  });

  it('actualiza en su lugar si el nombre no cambió', () => {
    const proyecto = proyectoBase({
      nicho: 'Tech',
      ideaElegida: { id: 'i1', titulo: 'Mismo título', hook: '', angulo: '', porQueViral: '' },
    });
    const existente = { ...proyecto, nombre: 'Mismo título' };
    const { actualizado, nuevos } = resolverGuardadoProyecto(proyecto, [existente], ahora, () => 'nuevo-id');
    expect(nuevos).toHaveLength(1);
    expect(actualizado.id).toBe('abc');
    expect(actualizado.nombre).toBe('Mismo título');
  });

  it('crea un proyecto nuevo si la idea cambió el nombre', () => {
    const proyecto = proyectoBase({
      ideaElegida: { id: 'i2', titulo: 'Nueva idea viral', hook: '', angulo: '', porQueViral: '' },
    });
    const existente = proyectoBase({ nombre: 'Nombre anterior' });
    const { actualizado, nuevos } = resolverGuardadoProyecto(proyecto, [existente], ahora, () => 'xyz999');
    expect(nuevos).toHaveLength(2);
    expect(actualizado.id).toBe('xyz999');
    expect(actualizado.nombre).toBe('Nueva idea viral');
  });
});