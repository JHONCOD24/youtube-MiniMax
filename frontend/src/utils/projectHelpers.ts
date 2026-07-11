import type { Project } from '../types';

export function calcularPaso(p: Project): number {
  if (p.monetizacion) return 5;
  if (p.assets) return 4;
  if (p.ideaElegida) return 3;
  if (p.investigacion) return 2;
  if (p.nicho) return 1;
  return 0;
}

export function resolverGuardadoProyecto(
  proyecto: Project,
  proyectos: Project[],
  ahora: string,
  nuevoId: () => string,
): { actualizado: Project; nuevos: Project[] } {
  const nombreDestino = proyecto.ideaElegida?.titulo?.trim() || proyecto.nombre;
  const existente = proyectos.find((p) => p.id === proyecto.id);

  if (!existente || nombreDestino === existente.nombre) {
    const actualizado = { ...proyecto, nombre: nombreDestino, fechaModificacion: ahora };
    const nuevos = existente
      ? proyectos.map((p) => (p.id === actualizado.id ? actualizado : p))
      : [...proyectos, actualizado];
    return { actualizado, nuevos };
  }

  const actualizado = {
    ...proyecto,
    id: nuevoId(),
    nombre: nombreDestino,
    fechaCreacion: ahora,
    fechaModificacion: ahora,
  };
  return { actualizado, nuevos: [...proyectos, actualizado] };
}