// Función serverless (Vercel): mismo contrato que el middleware de desarrollo.
// GET /api/news?endpoint=top-headlines&country=co
import type { IncomingMessage, ServerResponse } from 'node:http';
import { proxyNews } from '../server/newsProxy';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '', 'http://localhost');
  const { status, body } = await proxyNews(url.searchParams, process.env.NEWSAPI_KEY);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', status === 200 ? 'public, s-maxage=600, stale-while-revalidate=300' : 'no-store');
  res.end(body);
}
