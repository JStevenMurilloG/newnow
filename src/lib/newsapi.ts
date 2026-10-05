import { cityBySlug } from '../data/cities';
import { regionById } from '../data/regions';
import { countryByCode } from './geo';
import { CATEGORIES, type Article, type Category, type Place } from './types';

export type NewsErrorCode = 'rateLimited' | 'apiKeyMissing' | 'apiKeyInvalid' | 'network' | 'upstream';

export class NewsError extends Error {
  constructor(
    public code: NewsErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'NewsError';
  }
}

export interface NewsResult {
  articles: Article[];
  /** totalResults que informa NewsAPI */
  total: number;
  /** de qué endpoint salieron los datos */
  mode: 'headlines' | 'search';
}

interface RawArticle {
  source?: { name?: string | null } | null;
  author?: string | null;
  title?: string | null;
  description?: string | null;
  url?: string | null;
  urlToImage?: string | null;
  publishedAt?: string | null;
  content?: string | null;
}

/** Países que NewsAPI documenta para /top-headlines?country= */
const HEADLINE_COUNTRIES = new Set(
  'ae ar at au be bg br ca ch cn co cu cz de eg fr gb gr hk hu id ie il in it jp kr lt lv ma mx my ng nl no nz ph pl pt ro rs ru sa se sg si sk th tr tw ua us ve za'.split(
    ' ',
  ),
);

/** Idioma principal (entre los que admite NewsAPI) para la búsqueda de respaldo */
const LANGUAGE: Record<string, string> = {};
const assign = (lang: string, codes: string) => codes.split(' ').forEach((c) => (LANGUAGE[c] = lang));
assign('es', 'es mx co ar cl pe ve ec bo py uy cr pa gt hn sv ni do cu pr');
assign('en', 'us gb ca au nz ie in ng za ke gh ph');
assign('fr', 'fr');
assign('de', 'de at ch');
assign('it', 'it');
assign('pt', 'br pt ao mz');
assign('ru', 'ru by kz');
assign('ar', 'sa ae eg ma dz tn iq sy jo lb ly qa kw om ye sd');
assign('he', 'il');
assign('nl', 'nl be');
assign('no', 'no');
assign('sv', 'se');
assign('zh', 'cn tw');

const WORLD_SOURCES = 'bbc-news,reuters,associated-press,al-jazeera-english,bloomberg,the-washington-post';

function mapError(status: number, code: string | undefined, message?: string): NewsError {
  if (status === 429 || code === 'rateLimited' || code === 'apiKeyExhausted') return new NewsError('rateLimited', message);
  if (code === 'apiKeyMissing') return new NewsError('apiKeyMissing', message);
  if (code === 'apiKeyInvalid' || code === 'apiKeyDisabled' || status === 401) return new NewsError('apiKeyInvalid', message);
  return new NewsError('upstream', message);
}

async function call(endpoint: 'top-headlines' | 'everything', params: Record<string, string | undefined>) {
  const qs = new URLSearchParams({ endpoint });
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);

  let res: Response;
  try {
    res = await fetch(`/api/news?${qs}`);
  } catch {
    throw new NewsError('network');
  }
  let body: { status?: string; code?: string; message?: string; totalResults?: number; articles?: RawArticle[] };
  try {
    body = await res.json();
  } catch {
    throw new NewsError('upstream');
  }
  if (!res.ok || body.status !== 'ok') throw mapError(res.status, body.code, body.message);
  return { articles: body.articles ?? [], total: body.totalResults ?? 0 };
}

export function hashId(input: string): string {
  let a = 5381;
  let b = 52711;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    a = ((a << 5) + a) ^ ch;
    b = ((b << 5) + b) ^ ch;
  }
  return (a >>> 0).toString(36) + (b >>> 0).toString(36);
}

export function normalize(raw: RawArticle[]): Article[] {
  const seen = new Set<string>();
  const out: Article[] = [];
  for (const r of raw) {
    const url = r.url?.trim();
    let title = r.title?.trim();
    if (!url || !title || title === '[Removed]' || url.includes('removed.com')) continue;
    const source = r.source?.name?.trim() || new URL(url).hostname.replace(/^www\./, '');
    // /top-headlines añade « - Fuente» al final del titular
    if (title.endsWith(` - ${source}`)) title = title.slice(0, -source.length - 3).trim();
    const titleKey = title.toLowerCase();
    if (seen.has(url) || seen.has(titleKey)) continue;
    seen.add(url);
    seen.add(titleKey);
    out.push({
      id: hashId(url),
      title,
      description: r.description?.trim() ?? '',
      content: (r.content ?? '').replace(/\s*\[\+\d+ chars\]\s*$/, '').trim(),
      url,
      image: r.urlToImage && /^https?:\/\//.test(r.urlToImage) ? r.urlToImage : null,
      source,
      author: r.author?.trim() || null,
      publishedAt: r.publishedAt ?? '',
    });
  }
  return out;
}

const quote = (s: string) => `"${s}"`;

/**
 * Consulta de /everything que representa un lugar. Siempre fija un idioma: sin él NewsAPI mezcla
 * resultados en cualquier lengua. Se usa el idioma local cuando NewsAPI lo admite y español si no.
 */
export function placeQuery(place: Place): { q: string; language: string } {
  if (place.kind === 'region') return { q: regionById(place.code)!.query, language: 'es' };
  if (place.kind === 'city') {
    const city = cityBySlug(place.code)!;
    const names = city.alt && city.alt !== city.name ? `${quote(city.name)} OR ${quote(city.alt)}` : quote(city.name);
    return { q: names, language: LANGUAGE[city.country] ?? 'es' };
  }
  const c = countryByCode(place.code)!;
  const language = LANGUAGE[c.code] ?? 'es';
  const native = new Intl.DisplayNames([language], { type: 'region' }).of(c.code.toUpperCase()) ?? c.nameEn;
  return { q: quote(native), language };
}

const WEEK = 7 * 24 * 60 * 60_000;

function searchPlace(
  place: Place,
  category: Category,
  sortBy: string,
  pageSize: number,
  query = placeQuery(place),
) {
  const { q, language } = query;
  const terms = CATEGORIES.find((c) => c.id === category)?.terms;
  return call('everything', {
    q: terms ? `(${q}) AND (${terms})` : q,
    language,
    sortBy,
    // lo más popular solo tiene sentido como tendencia si es reciente
    from: sortBy === 'popularity' ? new Date(Date.now() - WEEK).toISOString().slice(0, 10) : undefined,
    pageSize: String(pageSize),
  });
}

const PAGE = 40;

export async function getHeadlines(place: Place, category: Category = 'general'): Promise<NewsResult> {
  const cat = category === 'general' ? undefined : category;

  if (place.kind === 'world') {
    const r = await call('top-headlines', { language: 'en', category: cat, pageSize: String(PAGE) });
    return { articles: normalize(r.articles), total: r.total, mode: 'headlines' };
  }

  if (place.kind === 'country' && HEADLINE_COUNTRIES.has(place.code)) {
    const r = await call('top-headlines', { country: place.code, category: cat, pageSize: String(PAGE) });
    const articles = normalize(r.articles);
    if (articles.length > 0) return { articles, total: r.total, mode: 'headlines' };
  }

  let r = await searchPlace(place, category, 'publishedAt', PAGE);
  if (r.articles.length === 0 && place.kind === 'country' && !LANGUAGE[place.code]) {
    // sin cobertura en español: último intento con el nombre en inglés
    const english = { q: quote(countryByCode(place.code)!.nameEn), language: 'en' };
    r = await searchPlace(place, category, 'publishedAt', PAGE, english);
  }
  return { articles: normalize(r.articles), total: r.total, mode: 'search' };
}

export async function getTrending(place: Place): Promise<Article[]> {
  const r =
    place.kind === 'world'
      ? await call('top-headlines', { sources: WORLD_SOURCES, pageSize: '12' })
      : await searchPlace(place, 'general', 'popularity', 12);
  return normalize(r.articles);
}

export async function searchNews(query: string, place?: Place): Promise<NewsResult> {
  const scoped = place && place.kind !== 'world' ? placeQuery(place) : null;
  const r = await call('everything', {
    q: scoped ? `(${query}) AND (${scoped.q})` : query,
    language: scoped?.language,
    sortBy: 'publishedAt',
    pageSize: '30',
  });
  return { articles: normalize(r.articles), total: r.total, mode: 'search' };
}
