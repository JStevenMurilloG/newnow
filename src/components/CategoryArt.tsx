import type { CSSProperties } from 'react';
import type { Category } from '../lib/types';

/**
 * Ilustración de fondo de cada sección. Todas comparten trazo y lienzo (160×100, `currentColor`
 * = tono de la sección); lo que cambia es el motivo. Las clases `art__*` las anima el CSS solo
 * mientras la tarjeta tiene el cursor o el foco.
 */
const i = (n: number) => ({ '--n': n }) as CSSProperties;

const BARS = [34, 22, 46, 30, 58, 40, 70];
const EQ = [30, 52, 74, 44, 86, 60, 38, 70, 48, 80, 34, 56];

const ART: Record<Exclude<Category, 'general'>, JSX.Element> = {
  // Economía: velas que crecen y una cotización que se dibuja
  business: (
    <>
      {BARS.map((h, n) => (
        <rect key={n} className="art__grow" style={i(n)} x={8 + n * 22} y={96 - h} width="10" height={h} rx="2" fill="currentColor" stroke="none" opacity="0.22" />
      ))}
      <polyline className="art__draw" pathLength="1" points="2,74 24,60 46,66 68,42 90,50 112,26 134,34 157,8" />
      <circle className="art__pop" cx="157" cy="8" r="3.5" fill="currentColor" stroke="none" />
    </>
  ),
  // Tecnología: placa de circuito con un pulso que la recorre
  technology: (
    <>
      {Array.from({ length: 40 }, (_, n) => (
        <circle key={n} cx={10 + (n % 8) * 20} cy={10 + Math.floor(n / 8) * 20} r="1.3" fill="currentColor" stroke="none" opacity="0.3" />
      ))}
      <path d="M0,70 H50 V30 H90 V50 H130 V10 H160" opacity="0.45" />
      <path d="M30,90 V70 M110,90 V50 M70,10 V30" opacity="0.45" />
      <path className="art__travel" pathLength="1" d="M0,70 H50 V30 H90 V50 H130 V10 H160" strokeWidth="2.6" />
      {[
        [50, 70],
        [50, 30],
        [90, 30],
        [90, 50],
        [130, 50],
        [130, 10],
      ].map(([cx, cy]) => (
        <rect key={`${cx}-${cy}`} x={cx - 3.5} y={cy - 3.5} width="7" height="7" rx="1.5" fill="var(--surface)" />
      ))}
    </>
  ),
  // Ciencia: órbitas alrededor de un núcleo
  science: (
    <g className="art__spin">
      <ellipse cx="104" cy="50" rx="52" ry="19" />
      <ellipse cx="104" cy="50" rx="52" ry="19" transform="rotate(60 104 50)" />
      <ellipse cx="104" cy="50" rx="52" ry="19" transform="rotate(120 104 50)" />
      <circle cx="104" cy="50" r="5.5" fill="currentColor" stroke="none" />
      <circle cx="156" cy="50" r="3" fill="currentColor" stroke="none" />
      <circle cx="78" cy="5" r="3" fill="currentColor" stroke="none" />
      <circle cx="78" cy="95" r="3" fill="currentColor" stroke="none" />
    </g>
  ),
  // Salud: electrocardiograma con un latido que avanza
  health: (
    <>
      <path d="M0,56 H34 l7,-9 l7,9 h12 l8,-36 l11,66 l8,-30 h16 l7,-8 l7,8 H160" opacity="0.4" />
      <path className="art__travel art__travel--beat" pathLength="1" d="M0,56 H34 l7,-9 l7,9 h12 l8,-36 l11,66 l8,-30 h16 l7,-8 l7,8 H160" strokeWidth="2.6" />
    </>
  ),
  // Deportes: media cancha y la trayectoria de un balón
  sports: (
    <>
      <rect x="44" y="6" width="150" height="88" rx="4" opacity="0.4" />
      <path d="M118,6 V94" opacity="0.4" />
      <circle cx="118" cy="50" r="20" opacity="0.4" />
      <path d="M44,30 H66 V70 H44" opacity="0.4" />
      <path className="art__draw art__draw--dashed" d="M6,90 Q62,-22 138,46" />
      <circle className="art__pop" cx="138" cy="46" r="5" fill="currentColor" stroke="none" />
    </>
  ),
  // Cultura: ecualizador
  entertainment: (
    <>
      {EQ.map((h, n) => (
        <rect key={n} className="art__eq" style={i(n)} x={6 + n * 13} y={(100 - h) / 2} width="6" height={h} rx="3" fill="currentColor" stroke="none" opacity={0.3 + (h / 86) * 0.5} />
      ))}
    </>
  ),
};

export function CategoryArt({ category }: { category: Exclude<Category, 'general'> }) {
  return (
    <svg
      className="cat-art"
      viewBox="0 0 160 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ART[category]}
    </svg>
  );
}
