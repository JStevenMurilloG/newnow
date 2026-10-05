import { afterEach, describe, expect, it, vi } from 'vitest';
import { countryByCode, countryPlace, findCountryAt, placeFromParams, placePath, WORLD } from './geo';
import { findHotspots } from './hotspots';
import { getHeadlines, NewsError, normalize, placeQuery } from './newsapi';

const raw = (n: number, extra = {}) => ({
  source: { name: 'Fuente' },
  title: `Titular ${n}`,
  description: 'Descripción',
  url: `https://example.com/${n}`,
  urlToImage: 'https://example.com/a.jpg',
  publishedAt: '2026-10-04T10:00:00Z',
  content: 'Texto del artículo… [+1234 chars]',
  ...extra,
});

const ok = (articles: unknown[], totalResults = articles.length) =>
  new Response(JSON.stringify({ status: 'ok', totalResults, articles }), { status: 200 });

function mockFetch(...responses: Response[]) {
  const fn = vi.fn();
  responses.forEach((r) => fn.mockResolvedValueOnce(r));
  vi.stubGlobal('fetch', fn);
  return fn;
}

const paramsOf = (fn: ReturnType<typeof vi.fn>, i: number) => new URL(fn.mock.calls[i][0], 'http://x').searchParams;

afterEach(() => vi.unstubAllGlobals());

describe('normalize', () => {
  it('descarta eliminados y duplicados, y limpia título y contenido', () => {
    const out = normalize([
      raw(1, { title: 'Algo pasó - Fuente' }),
      raw(1),
      raw(2, { title: '[Removed]' }),
      raw(3, { urlToImage: null }),
      raw(4, { url: '' }),
    ]);
    expect(out.map((a) => a.title)).toEqual(['Algo pasó', 'Titular 3']);
    expect(out[0].content).toBe('Texto del artículo…');
    expect(out[1].image).toBeNull();
    expect(out[0].id).not.toBe(out[1].id);
  });
});

describe('getHeadlines', () => {
  const colombia = countryPlace(countryByCode('co')!);

  it('usa /top-headlines por país cuando devuelve resultados', async () => {
    const fetch = mockFetch(ok([raw(1)], 128));
    const r = await getHeadlines(colombia);
    expect(r).toMatchObject({ total: 128, mode: 'headlines' });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(paramsOf(fetch, 0).get('endpoint')).toBe('top-headlines');
    expect(paramsOf(fetch, 0).get('country')).toBe('co');
  });

  it('cae a /everything cuando /top-headlines viene vacío', async () => {
    const fetch = mockFetch(ok([]), ok([raw(1), raw(2)], 57));
    const r = await getHeadlines(colombia, 'business');
    expect(r).toMatchObject({ total: 57, mode: 'search' });
    const p = paramsOf(fetch, 1);
    expect(p.get('endpoint')).toBe('everything');
    expect(p.get('q')).toContain('"Colombia"');
    expect(p.get('q')).toContain('economía');
    expect(p.get('language')).toBe('es');
  });

  it('va directo a /everything para países sin titulares y para regiones', async () => {
    const fetch = mockFetch(ok([raw(1)]), ok([raw(2)]));
    await getHeadlines(countryPlace(countryByCode('is')!));
    await getHeadlines(placeFromParams({ region: 'europe' })!);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(paramsOf(fetch, 0).get('endpoint')).toBe('everything');
    expect(paramsOf(fetch, 0).get('q')).toBe('"Islandia"');
    expect(paramsOf(fetch, 0).get('language')).toBe('es');
    expect(paramsOf(fetch, 1).get('q')).toContain('Europa');
  });

  it('reintenta en inglés si un país sin idioma propio no tiene cobertura en español', async () => {
    const fetch = mockFetch(ok([]), ok([raw(1)], 9));
    const r = await getHeadlines(countryPlace(countryByCode('is')!));
    expect(r.total).toBe(9);
    expect(paramsOf(fetch, 1).get('q')).toBe('"Iceland"');
    expect(paramsOf(fetch, 1).get('language')).toBe('en');
  });

  it('traduce los errores de NewsAPI', async () => {
    mockFetch(new Response(JSON.stringify({ status: 'error', code: 'rateLimited' }), { status: 429 }));
    await expect(getHeadlines(WORLD)).rejects.toMatchObject({ code: 'rateLimited' });
    mockFetch(new Response(JSON.stringify({ status: 'error', code: 'apiKeyMissing' }), { status: 401 }));
    await expect(getHeadlines(WORLD)).rejects.toBeInstanceOf(NewsError);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    await expect(getHeadlines(WORLD)).rejects.toMatchObject({ code: 'network' });
  });
});

describe('geo', () => {
  it('resuelve coordenadas a países', () => {
    expect(findCountryAt(-74.07, 4.71)?.code).toBe('co');
    expect(findCountryAt(-3.7, 40.42)?.code).toBe('es');
    expect(findCountryAt(139.69, 35.68)?.code).toBe('jp');
    expect(findCountryAt(-160, 64)?.code).toBe('us');
    expect(findCountryAt(-30, 0)).toBeNull();
  });

  it('nombra en español y construye rutas', () => {
    expect(countryByCode('us')?.name).toBe('Estados Unidos');
    const bogota = placeFromParams({ country: 'co', city: 'bogota' })!;
    expect(bogota).toMatchObject({ kind: 'city', name: 'Bogotá' });
    expect(placePath(bogota)).toBe('/c/co/bogota');
    expect(placeFromParams({ country: 'zz' })).toBeNull();
    expect(placeQuery(bogota).q).toBe('"Bogotá" OR "Bogota"');
  });

  it('detecta lugares mencionados en titulares', () => {
    const spots = findHotspots(
      normalize([raw(1, { title: 'Cumbre en París sobre el clima' }), raw(2, { title: 'Japan election results' })]),
    );
    expect(spots.map((s) => s.id).sort()).toEqual(['city:paris', 'country:jp']);
  });
});
