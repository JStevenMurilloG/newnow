import { CITIES } from '../data/cities';
import { COUNTRIES } from './geo';
import type { Article } from './types';

/** Un lugar del mapa mencionado en titulares. */
export interface Spot {
  id: string;
  label: string;
  lon: number;
  lat: number;
  /** ISO alpha-2 del país, para la bandera */
  country: string;
}

export interface Hotspot extends Spot {
  /** titulares cargados que mencionan el lugar */
  count: number;
  /** el primero de esos titulares */
  headline: string;
}

const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

interface Needle extends Spot {
  patterns: RegExp[];
}

const word = (name: string) => new RegExp(`(^|[^a-z])${fold(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`);

// Las ciudades van primero: son más específicas que su país.
const NEEDLES: Needle[] = [
  ...CITIES.map((c) => ({
    id: `city:${c.slug}`,
    label: c.name,
    lon: c.lon,
    lat: c.lat,
    country: c.country,
    patterns: [c.name, c.alt].filter((n): n is string => !!n).map(word),
  })),
  // Georgia, Chad, Jordania y Níger chocan con nombres propios frecuentes en titulares en inglés
  ...COUNTRIES.filter((c) => !['ge', 'td', 'jo', 'ne'].includes(c.code)).map((c) => ({
    id: `country:${c.code}`,
    label: c.name,
    lon: c.centroid[0],
    lat: c.centroid[1],
    country: c.code,
    patterns: [...new Set([c.name, c.nameEn])].map(word),
  })),
];

const cache = new Map<string, Needle[]>();

function matches(article: Article): Needle[] {
  let found = cache.get(article.id);
  if (!found) {
    const text = fold(`${article.title} ${article.description}`);
    found = NEEDLES.filter((n) => n.patterns.some((p) => p.test(text)));
    cache.set(article.id, found);
  }
  return found;
}

const toSpot = ({ id, label, lon, lat, country }: Needle): Spot => ({ id, label, lon, lat, country });

/**
 * El lugar más específico que menciona un artículo. `exceptCountry` descarta el país que ya se
 * está viendo: en la página de Colombia interesa «Bogotá» o «Brasil», no «Colombia».
 */
export function articleSpot(article: Article, exceptCountry?: string): Spot | null {
  const found = matches(article).find((n) => n.id !== `country:${exceptCountry}`);
  return found ? toSpot(found) : null;
}

/** Lugares mencionados en los titulares ya cargados: alimentan los indicadores del globo. */
export function findHotspots(articles: Article[], limit = 12): Hotspot[] {
  const found = new Map<string, Hotspot>();
  for (const a of articles) {
    for (const n of matches(a)) {
      const spot = found.get(n.id);
      if (spot) spot.count++;
      else found.set(n.id, { ...toSpot(n), count: 1, headline: a.title });
    }
  }
  return [...found.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}
