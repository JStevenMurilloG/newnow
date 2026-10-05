// Función serverless (Netlify): mismo contrato que el middleware de desarrollo.
// GET /api/news?endpoint=top-headlines&country=co
import { proxyNews } from '../../server/newsProxy';

// Netlify expone el global `Netlify.env`; el acceso por globalThis no falla
// aunque el runtime no lo defina (por ejemplo, al correr las pruebas de Node).
const netlify = (globalThis as { Netlify?: { env?: { get(key: string): string | undefined } } }).Netlify;
const nodeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const key = netlify?.env?.get('NEWSAPI_KEY') ?? nodeEnv?.NEWSAPI_KEY;
  const { status, body } = await proxyNews(url.searchParams, key);
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': status === 200 ? 'public, s-maxage=600, stale-while-revalidate=300' : 'no-store',
    },
  });
}

export const config = { path: '/api/news' };