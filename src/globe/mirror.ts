/**
 * Puente entre el globo y el orbe de la barra superior: el globo copia su último fotograma en
 * `target`. Vive fuera de los módulos 3D para que la barra no cargue three.js.
 */
export const mirror = {
  target: null as HTMLCanvasElement | null,
  /** el orbe está a la vista: se copia cada fotograma en vez de uno de cada veinte */
  live: false,
};
