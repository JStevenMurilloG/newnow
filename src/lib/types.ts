export interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  image: string | null;
  source: string;
  author: string | null;
  publishedAt: string;
}

export type PlaceKind = 'world' | 'region' | 'country' | 'city';

export interface Place {
  kind: PlaceKind;
  /** 'world', id de región, ISO alpha-2 en minúsculas o slug de ciudad */
  code: string;
  name: string;
  /** ISO alpha-2 del país: presente en países y ciudades */
  country?: string;
}

export const CATEGORIES = [
  { id: 'general', label: 'Portada', blurb: 'Lo más importante del momento', terms: '' },
  { id: 'business', label: 'Economía', blurb: 'Mercados, empresas y finanzas', terms: 'economía OR economy OR business OR mercados' },
  { id: 'technology', label: 'Tecnología', blurb: 'Innovación, IA y ciencia aplicada', terms: 'tecnología OR technology OR tech' },
  { id: 'science', label: 'Ciencia', blurb: 'Descubrimientos e investigación', terms: 'ciencia OR science OR research' },
  { id: 'health', label: 'Salud', blurb: 'Medicina, bienestar y salud pública', terms: 'salud OR health' },
  { id: 'sports', label: 'Deportes', blurb: 'Resultados, fichajes y competiciones', terms: 'deportes OR sports OR fútbol OR football' },
  { id: 'entertainment', label: 'Cultura', blurb: 'Cine, música y espectáculos', terms: 'cultura OR entertainment OR cine OR música' },
] as const;

export type Category = (typeof CATEGORIES)[number]['id'];

export const isCategory = (value: string | null): value is Category =>
  CATEGORIES.some((c) => c.id === value);
