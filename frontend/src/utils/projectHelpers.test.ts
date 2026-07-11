import { describe, it, expect } from 'vitest';
import {
  calcularPaso,
  proyectoTieneContenido,
  resolverGuardadoProyecto,
  upsertProyectoEnLista,
  debeRamificarPorIdea,
  crearRamaConIdea,
  ideasSonDistintas,
  congelarProyectoEnLista,
} from './projectHelpers';
import type { Project, VideoIdea } from '../types';

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

const idea = (id: string, titulo: string): VideoIdea => ({
  id,
  titulo,
  hook: '',
  angulo: '',
  porQueViral: '',
});

describe('calcularPaso', () => {
  it('devuelve 0 sin nicho', () => {
    expect(calcularPaso(proyectoBase())).toBe(0);
  });

  it('avanza según el contenido del proyecto', () => {
    expect(calcularPaso(proyectoBase({ nicho: 'Fitness' }))).toBe(1);
    expect(calcularPaso(proyectoBase({ nicho: 'Fitness', investigacion: { nicho: 'Fitness' } as any }))).toBe(2);
    expect(calcularPaso(proyectoBase({ ideaElegida: idea('1', 'Idea') }))).toBe(3);
  });
});

describe('ideas y ramas', () => {
  it('detecta ideas distintas por id', () => {
    expect(ideasSonDistintas(idea('a', 'X'), idea('b', 'X'))).toBe(true);
    expect(ideasSonDistintas(idea('a', 'X'), idea('a', 'Y'))).toBe(false);
  });

  it('debe ramificar solo si ya había otra idea', () => {
    expect(debeRamificarPorIdea(proyectoBase(), idea('1', 'A'))).toBe(false);
    expect(debeRamificarPorIdea(proyectoBase({ ideaElegida: idea('1', 'A') }), idea('1', 'A'))).toBe(false);
    expect(debeRamificarPorIdea(proyectoBase({ ideaElegida: idea('1', 'A') }), idea('2', 'B'))).toBe(true);
  });

  it('crearRamaConIdea genera id nuevo y limpia activos', () => {
    const base = proyectoBase({
      nicho: 'Virgen',
      ideaElegida: idea('1', 'Idea A'),
      assets: { tema: 'x', nicho: 'y', titulos: [], guion: 'g', descripcionSEO: '', keywords: [], timestamps: [], promptThumbnail: '', promptVideo: '', promptMusica: '', promptMusicaGemini: '', estrategiaPublicacion: {} as any },
    });
    const rama = crearRamaConIdea(base, idea('2', 'Idea B'), () => 'nuevo99');
    expect(rama.id).toBe('nuevo99');
    expect(rama.ideaElegida?.titulo).toBe('Idea B');
    expect(rama.assets).toBeUndefined();
    expect(rama.nicho).toBe('Virgen');
    expect(rama.familiaId).toBe('abc');
  });

  it('congelar deja la idea anterior en la lista con su nombre', () => {
    const p = proyectoBase({ ideaElegida: idea('1', 'Idea A'), nombre: 'Borrador' });
    const lista = congelarProyectoEnLista(p, [], '2026-01-02');
    expect(lista).toHaveLength(1);
    expect(lista[0].nombre).toBe('Idea A');
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
    const { actualizado, nuevos, ramifico } = resolverGuardadoProyecto(proyecto, [], ahora, () => 'x');
    expect(nuevos).toHaveLength(1);
    expect(actualizado.id).toBe('abc');
    expect(ramifico).toBe(false);
  });

  it('si la idea cambió respecto a la lista, crea rama nueva y conserva la vieja', () => {
    const existente = proyectoBase({
      ideaElegida: idea('1', 'Idea vieja'),
      nombre: 'Idea vieja',
      assets: { tema: 'a', nicho: 'n', titulos: [], guion: 'g1', descripcionSEO: '', keywords: [], timestamps: [], promptThumbnail: '', promptVideo: '', promptMusica: '', promptMusicaGemini: '', estrategiaPublicacion: {} as any },
    });
    const proyecto = {
      ...existente,
      ideaElegida: idea('2', 'Idea nueva'),
      assets: { tema: 'b', nicho: 'n', titulos: [], guion: 'g2', descripcionSEO: '', keywords: [], timestamps: [], promptThumbnail: '', promptVideo: '', promptMusica: '', promptMusicaGemini: '', estrategiaPublicacion: {} as any },
    };
    const { actualizado, nuevos, ramifico } = resolverGuardadoProyecto(proyecto, [existente], ahora, () => 'rama-xyz');
    expect(ramifico).toBe(true);
    expect(nuevos).toHaveLength(2);
    expect(actualizado.id).toBe('rama-xyz');
    expect(actualizado.nombre).toBe('Idea nueva');
    expect(actualizado.assets?.guion).toBe('g2');
    const vieja = nuevos.find((p) => p.id === 'abc');
    expect(vieja?.nombre).toBe('Idea vieja');
    expect(vieja?.assets?.guion).toBe('g1');
  });
});
