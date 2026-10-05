// Genera los iconos PNG de la PWA sin dependencias: node scripts/make-icons.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const body = Buffer.concat([Buffer.from(type), data]);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc(body), body.length + 4);
  return out;
};

const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const BG = [6, 10, 24];
const LIGHT = [127, 176, 255];
const BLUE = [42, 85, 216];
const VIOLET = [74, 43, 181];

function icon(size, scale) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const r = size * scale;
  const c = size / 2;
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    for (let x = 0; x < size; x++) {
      const dx = x - c;
      const dy = y - c;
      const d = Math.hypot(dx, dy);
      // esfera con luz arriba a la izquierda
      const t = Math.min(1, Math.hypot(dx + r * 0.3, dy + r * 0.36) / (r * 1.5));
      let color = t < 0.55 ? mix(LIGHT, BLUE, t / 0.55) : mix(BLUE, VIOLET, (t - 0.55) / 0.45);
      // ecuador y meridiano
      const meridian = Math.abs(Math.hypot(dx / 0.42, dy) - r) < size * 0.012;
      const equator = Math.abs(dy) < size * 0.012;
      if ((meridian || equator) && d < r) color = mix(color, [255, 255, 255], 0.35);
      // destello
      if (Math.hypot(dx + r * 0.42, dy + r * 0.42) < r * 0.15) color = [255, 255, 255];
      const edge = Math.min(1, Math.max(0, r - d + 0.5));
      const glow = d > r ? Math.max(0, 1 - (d - r) / (size * 0.12)) ** 2 * 0.35 : 0;
      const [R, G, B] = mix(mix(BG, [61, 123, 255], glow), color, edge);
      const o = row + 1 + x * 4;
      raw[o] = R;
      raw[o + 1] = G;
      raw[o + 2] = B;
      raw[o + 3] = 255;
    }
  }
  const head = Buffer.alloc(13);
  head.writeUInt32BE(size, 0);
  head.writeUInt32BE(size, 4);
  head.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', head),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/icon-192.png', icon(192, 0.34));
writeFileSync('public/icons/icon-512.png', icon(512, 0.34));
// maskable: el contenido cabe en la zona segura central (80 %)
writeFileSync('public/icons/icon-maskable-512.png', icon(512, 0.27));
console.log('Iconos generados en public/icons');
