import { geoEquirectangular, geoGraticule10, geoPath } from 'd3-geo';
import { BORDERS, LAND, type Country } from '../lib/geo';

export type GlobeTheme = 'dark' | 'light';

const PALETTE = {
  dark: {
    oceanTop: '#0a1330',
    oceanMid: '#060b1f',
    graticule: 'rgba(120, 150, 255, 0.07)',
    land: '#26386b',
    landEdge: 'rgba(138, 176, 255, 0.75)',
    border: 'rgba(160, 190, 255, 0.28)',
    fill: 'rgba(72, 132, 255, 0.62)',
    fillCore: 'rgba(139, 92, 246, 0.5)',
    stroke: '#bcd4ff',
    glow: '#4d8dff',
  },
  light: {
    oceanTop: '#c9d8fb',
    oceanMid: '#dbe6fd',
    graticule: 'rgba(40, 70, 160, 0.07)',
    land: '#ffffff',
    landEdge: 'rgba(60, 96, 200, 0.6)',
    border: 'rgba(60, 96, 200, 0.26)',
    fill: 'rgba(31, 94, 255, 0.55)',
    fillCore: 'rgba(109, 61, 240, 0.4)',
    stroke: '#1f4fe0',
    glow: '#3d7bff',
  },
};

function context(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  const projection = geoEquirectangular()
    .scale(canvas.width / (2 * Math.PI))
    .translate([canvas.width / 2, canvas.height / 2])
    .precision(0.2);
  return { ctx, path: geoPath(projection, ctx) };
}

/** Mapa equirectangular del planeta pintado desde los datos vectoriales (sin imágenes externas). */
export function paintEarth(theme: GlobeTheme, width: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = width / 2;
  const { ctx, path } = context(canvas);
  const c = PALETTE[theme];
  const k = width / 2048;

  const ocean = ctx.createLinearGradient(0, 0, 0, canvas.height);
  ocean.addColorStop(0, c.oceanTop);
  ocean.addColorStop(0.5, c.oceanMid);
  ocean.addColorStop(1, c.oceanTop);
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  path(geoGraticule10());
  ctx.strokeStyle = c.graticule;
  ctx.lineWidth = k;
  ctx.stroke();

  ctx.beginPath();
  path(LAND);
  ctx.fillStyle = c.land;
  ctx.fill();
  ctx.strokeStyle = c.landEdge;
  ctx.lineWidth = 1.4 * k;
  ctx.lineJoin = 'round';
  ctx.stroke();

  ctx.beginPath();
  path(BORDERS);
  ctx.strokeStyle = c.border;
  ctx.lineWidth = 0.8 * k;
  ctx.stroke();

  return canvas;
}

/** Relleno y halo de los países seleccionados sobre un lienzo transparente. */
export function paintHighlight(canvas: HTMLCanvasElement, countries: Country[], theme: GlobeTheme) {
  const { ctx, path } = context(canvas);
  const c = PALETTE[theme];
  const k = canvas.width / 2048;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (countries.length === 0) return;

  ctx.beginPath();
  for (const country of countries) path(country.feature);

  // halo exterior
  ctx.save();
  ctx.shadowColor = c.glow;
  ctx.shadowBlur = 26 * k;
  ctx.strokeStyle = c.glow;
  ctx.lineWidth = 3 * k;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = c.fill;
  ctx.fill();
  ctx.fillStyle = c.fillCore;
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  ctx.strokeStyle = c.stroke;
  ctx.lineWidth = (countries.length > 1 ? 1 : 1.6) * k;
  ctx.stroke();
}

/** Punto luminoso suave para ciudades. */
export function paintDot(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.25)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return canvas;
}
