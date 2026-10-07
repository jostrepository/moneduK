// Almacén en memoria RAM compartido entre pantallas
export let estudiantesRegistrados: any[] = [];

export function agregarEstudiante(estudiante: any) {
  estudiantesRegistrados.push(estudiante);
}