import { geoArea, geoBounds, geoCentroid, geoContains } from 'd3-geo';
import type { Feature, MultiLineString, MultiPolygon, Polygon } from 'geojson';
import isoCountries from 'i18n-iso-countries';
import { feature, mesh } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import atlas from 'world-atlas/countries-110m.json';
import { citiesOf, cityBySlug, type City } from '../data/cities';
import { regionById } from '../data/regions';
import type { Place } from './types';

type CountryFeature = Feature<Polygon | MultiPolygon, { name: string }>;

export interface Country {
  /** ISO alpha-2 en minúsculas */
  code: string;
  name: string;
  nameEn: string;
  feature: CountryFeature;
  /** [lon, lat] del polígono principal */
  centroid: [number, number];
  bounds: [[number, number], [number, number]];
  /** extensión angular aproximada en grados, para decidir el zoom */
  span: number;
}

const topo = atlas as unknown as Topology<{
  countries: GeometryCollection<{ name: string }>;
  land: GeometryCollection;
}>;

export const LAND = feature(topo, topo.objects.land);
export const BORDERS: MultiLineString = mesh(topo, topo.objects.countries, (a, b) => a !== b);

const es = new Intl.DisplayNames(['es'], { type: 'region' });
const en = new Intl.DisplayNames(['en'], { type: 'region' });

function mainPolygon(f: CountryFeature): Feature<Polygon> {
  const g = f.geometry;
  if (g.type === 'Polygon') return { type: 'Feature', properties: {}, geometry: g };
  let best = g.coordinates[0];
  let bestArea = -1;
  for (const coordinates of g.coordinates) {
    const area = geoArea({ type: 'Polygon', coordinates });
    if (area > bestArea) {
      bestArea = area;
      best = coordinates;
    }
  }
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: best } };
}

function build(): Country[] {
  const out: Country[] = [];
  const collection = feature(topo, topo.objects.countries);
  for (const f of collection.features as CountryFeature[]) {
    if (f.id == null) continue;
    const alpha2 = isoCountries.numericToAlpha2(String(f.id).padStart(3, '0'));
    if (!alpha2) continue;
    const main = mainPolygon(f);
    const centroid = geoCentroid(main);
    const [[w, s], [e, n]] = geoBounds(main);
    const dLon = ((e - w + 360) % 360) * Math.cos((centroid[1] * Math.PI) / 180);
    out.push({
      code: alpha2.toLowerCase(),
      name: es.of(alpha2) ?? f.properties.name,
      nameEn: en.of(alpha2) ?? f.properties.name,
      feature: f,
      centroid,
      bounds: geoBounds(f),
      span: Math.max(dLon, n - s),
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export const COUNTRIES = build();
const byCode = new Map(COUNTRIES.map((c) => [c.code, c]));

export const countryByCode = (code: string | undefined) => (code ? byCode.get(code.toLowerCase()) : undefined);

function inBounds(c: Country, lon: number, lat: number) {
  const [[w, s], [e, n]] = c.bounds;
  if (lat < s || lat > n) return false;
  // w > e cuando el país cruza el antimeridiano
  return w <= e ? lon >= w && lon <= e : lon >= w || lon <= e;
}

export function findCountryAt(lon: number, lat: number): Country | null {
  for (const c of COUNTRIES) {
    if (inBounds(c, lon, lat) && geoContains(c.feature, [lon, lat])) return c;
  }
  return null;
}

// ---------- Lugares ----------

export const WORLD: Place = { kind: 'world', code: 'world', name: 'Mundo' };

export const placeKey = (p: Place) => `${p.kind}:${p.code}`;

export function placeFromParams(params: { region?: string; country?: string; city?: string }): Place | null {
  if (params.region) {
    const r = regionById(params.region);
    return r ? { kind: 'region', code: r.id, name: r.name } : null;
  }
  if (params.country) {
    const c = countryByCode(params.country);
    if (!c) return null;
    if (params.city) {
      const city = cityBySlug(params.city);
      return city && city.country === c.code
        ? { kind: 'city', code: city.slug, name: city.name, country: c.code }
        : null;
    }
    return { kind: 'country', code: c.code, name: c.name, country: c.code };
  }
  return WORLD;
}

export function placePath(p: Place): string {
  switch (p.kind) {
    case 'region':
      return `/r/${p.code}`;
    case 'country':
      return `/c/${p.code}`;
    case 'city':
      return `/c/${p.country}/${p.code}`;
    default:
      return '/';
  }
}

export const countryPlace = (c: Country): Place => ({ kind: 'country', code: c.code, name: c.name, country: c.code });
export const cityPlace = (c: City): Place => ({ kind: 'city', code: c.slug, name: c.name, country: c.country });

export const placeTitle = (p: Place) => (p.kind === 'world' ? 'Noticias del mundo' : `Noticias de ${p.name}`);

/** Migas de pan: Mundo → País → Ciudad */
export function placeTrail(p: Place): Place[] {
  if (p.kind === 'world') return [WORLD];
  if (p.kind === 'city') {
    const c = countryByCode(p.country);
    return c ? [WORLD, countryPlace(c), p] : [WORLD, p];
  }
  return [WORLD, p];
}

export interface Focus {
  lon: number;
  lat: number;
  distance: number;
}

export const WORLD_DISTANCE = 3.95;

export function placeFocus(p: Place): Focus | null {
  if (p.kind === 'region') {
    const r = regionById(p.code)!;
    return { lon: r.center[0], lat: r.center[1], distance: r.distance };
  }
  if (p.kind === 'country') {
    const c = countryByCode(p.code)!;
    const distance = Math.min(3, Math.max(1.75, 1.55 + c.span * 0.028));
    return { lon: c.centroid[0], lat: c.centroid[1], distance };
  }
  if (p.kind === 'city') {
    const city = cityBySlug(p.code)!;
    return { lon: city.lon, lat: city.lat, distance: 1.65 };
  }
  return null;
}

/** Países que se iluminan para un lugar */
export function placeCountries(p: Place): Country[] {
  if (p.kind === 'region') {
    return regionById(p.code)!.countries.flatMap((code) => countryByCode(code) ?? []);
  }
  const c = countryByCode(p.country);
  return c ? [c] : [];
}

export { citiesOf };
