import type { Project, VideoIdea, VideoPlan } from '../types';

export function calcularPaso(p: Project): number {
  if (p.monetizacion) return 5;
  if (p.assets) return 4;
  if (p.ideaElegida) return 3;
  if (p.investigacion) return 2;
  if (p.nicho) return 1;
  return 0;
}

/** True si el proyecto tiene trabajo real (no es un borrador vacío). */
export function proyectoTieneContenido(p: Project | null | undefined): boolean {
  if (!p) return false;
  return Boolean(
    p.nicho
    || p.investigacion
    || (p.ideasGeneradas && p.ideasGeneradas.length)
    || p.ideaElegida
    || p.assets
    || p.monetizacion
    || (p.knowledgeBase && p.knowledgeBase.length)
    || (p.planPublicacion && p.planPublicacion.length),
  );
}

export function upsertProyectoEnLista(proyecto: Project, proyectos: Project[]): Project[] {
  const idx = proyectos.findIndex((p) => p.id === proyecto.id);
  if (idx < 0) return [...proyectos, proyecto];
  return [...proyectos.slice(0, idx), proyecto, ...proyectos.slice(idx + 1)];
}

/** Compara dos ideas: por id si existe, si no por título. */
export function ideasSonDistintas(a?: VideoIdea | null, b?: VideoIdea | null): boolean {
  if (!a && !b) return false;
  if (!a || !b) return true;
  if (a.id && b.id) return a.id !== b.id;
  return (a.titulo || '').trim() !== (b.titulo || '').trim();
}

/**
 * ¿Hay que abrir una rama nueva al elegir esta idea?
 * Sí si ya había otra idea elegida distinta (cada idea = proyecto independiente).
 */
export function debeRamificarPorIdea(proyecto: Project, nuevaIdea: VideoIdea): boolean {
  if (!proyecto.ideaElegida) return false;
  return ideasSonDistintas(proyecto.ideaElegida, nuevaIdea);
}

/**
 * Crea un proyecto-hermano: misma investigación/nicho/lista de ideas,
 * pero idea nueva y sin activos/monetización de la idea anterior.
 */
export function crearRamaConIdea(
  base: Project,
  idea: VideoIdea,
  nuevoId: () => string,
  plan?: VideoPlan,
): Project {
  const ahora = new Date().toISOString();
  const familiaId = base.familiaId || base.id;
  return {
    ...base,
    id: nuevoId(),
    familiaId,
    nombre: idea.titulo?.trim() || base.nombre || 'Nueva idea',
    ideaElegida: idea,
    // Lo específico de la idea anterior no se arrastra
    assets: undefined,
    monetizacion: undefined,
    planPublicacion: [],
    videoPlan: plan || base.videoPlan || { formato: 'short', duracionSegundos: 60, preset: 'short_rapido' },
    fechaCreacion: ahora,
    fechaModificacion: ahora,
    // knowledgeBase meta se copia; el contenido IndexedDB se clona aparte
  };
}

/**
 * Congela el proyecto actual en la lista (con nombre = título de su idea)
 * y devuelve la lista actualizada. No cambia el id del proyecto actual.
 */
export function congelarProyectoEnLista(proyecto: Project, proyectos: Project[], ahora: string): Project[] {
  const nombre = proyecto.ideaElegida?.titulo?.trim() || proyecto.nombre || 'Proyecto';
  const congelado: Project = {
    ...proyecto,
    nombre,
    familiaId: proyecto.familiaId || proyecto.id,
    fechaModificacion: ahora,
  };
  return upsertProyectoEnLista(congelado, proyectos);
}

/**
 * Guarda “oficial” en la lista de Proyectos.
 * - Si no hay idea distinta a la ya listada → actualiza el mismo id.
 * - Si la idea cambió y el listado ya tenía otra idea con este id → crea rama nueva
 *   (el caller también puede haber ramificado antes en setIdea).
 */
export function resolverGuardadoProyecto(
  proyecto: Project,
  proyectos: Project[],
  ahora: string,
  nuevoId: () => string = () => Math.random().toString(36).slice(2, 10),
): { actualizado: Project; nuevos: Project[]; ramifico: boolean } {
  const nombreDestino = proyecto.ideaElegida?.titulo?.trim() || proyecto.nombre || 'Proyecto sin nombre';
  const existente = proyectos.find((p) => p.id === proyecto.id);

  // Si en la lista ya está este id con OTRA idea, no sobrescribir: nueva rama
  if (
    existente
    && proyecto.ideaElegida
    && existente.ideaElegida
    && ideasSonDistintas(existente.ideaElegida, proyecto.ideaElegida)
  ) {
    const rama = crearRamaConIdea(
      { ...proyecto, assets: proyecto.assets, monetizacion: proyecto.monetizacion },
      proyecto.ideaElegida,
      nuevoId,
      proyecto.videoPlan,
    );
    // Recuperar assets/monetizacion de la rama actual (sí son de esta idea)
    const actualizado: Project = {
      ...rama,
      assets: proyecto.assets,
      monetizacion: proyecto.monetizacion,
      nombre: nombreDestino,
      fechaModificacion: ahora,
    };
    // Asegurar que el existente queda con su nombre de idea
    const listaConViejo = congelarProyectoEnLista(existente, proyectos, ahora);
    return {
      actualizado,
      nuevos: upsertProyectoEnLista(actualizado, listaConViejo),
      ramifico: true,
    };
  }

  const actualizado: Project = {
    ...proyecto,
    nombre: nombreDestino,
    familiaId: proyecto.familiaId || proyecto.id,
    fechaModificacion: ahora,
  };
  return {
    actualizado,
    nuevos: upsertProyectoEnLista(actualizado, proyectos),
    ramifico: false,
  };
}
