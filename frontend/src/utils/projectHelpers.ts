import type { Project } from '../types';

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

/**
 * Inserta o actualiza el proyecto en la lista, SIEMPRE con el mismo id.
 * (Antes se creaba un id nuevo al cambiar el nombre por la idea: eso confundía
 * y hacía parecer que se “perdía” el trabajo.)
 */
export function upsertProyectoEnLista(proyecto: Project, proyectos: Project[]): Project[] {
  const idx = proyectos.findIndex((p) => p.id === proyecto.id);
  if (idx < 0) return [...proyectos, proyecto];
  return [...proyectos.slice(0, idx), proyecto, ...proyectos.slice(idx + 1)];
}

/**
 * Guarda “oficial” en la lista de Proyectos.
 * Renombra con el título de la idea si existe, pero conserva el id.
 */
export function resolverGuardadoProyecto(
  proyecto: Project,
  proyectos: Project[],
  ahora: string,
  _nuevoId?: () => string,
): { actualizado: Project; nuevos: Project[] } {
  const nombreDestino = proyecto.ideaElegida?.titulo?.trim() || proyecto.nombre || 'Proyecto sin nombre';
  const actualizado: Project = {
    ...proyecto,
    nombre: nombreDestino,
    fechaModificacion: ahora,
  };
  return {
    actualizado,
    nuevos: upsertProyectoEnLista(actualizado, proyectos),
  };
}
