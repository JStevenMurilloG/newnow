// Lógica compartida entre el middleware de Vite (dev/preview) y la función serverless.
// La API key solo existe aquí, nunca en el bundle del cliente.

const ENDPOINTS = new Set(['top-headlines', 'everything']);
const PARAMS = new Set([
  'q',
  'country',
  'category',
  'language',
  'sources',
  'sortBy',
  'searchIn',
  'from',
  'to',
  'pageSize',
  'page',
]);

export interface ProxyResult {
  status: number;
  body: string;
}

const error = (status: number, code: string, message: string): ProxyResult => ({
  status,
  body: JSON.stringify({ status: 'error', code, message }),
});

export async function proxyNews(query: URLSearchParams, key: string | undefined): Promise<ProxyResult> {
  if (!key) return error(401, 'apiKeyMissing', 'Falta NEWSAPI_KEY en el servidor.');

  const endpoint = query.get('endpoint') ?? '';
  if (!ENDPOINTS.has(endpoint)) return error(400, 'parameterInvalid', 'Endpoint no permitido.');

  const url = new URL(`https://newsapi.org/v2/${endpoint}`);
  for (const [name, value] of query) {
    if (PARAMS.has(name) && value.length <= 500) url.searchParams.set(name, value);
  }

  try {
    const res = await fetch(url, { headers: { 'X-Api-Key': key, 'User-Agent': 'NewsNow/0.1' } });
    return { status: res.status, body: await res.text() };
  } catch {
    return error(502, 'upstream', 'No se pudo contactar con NewsAPI.');
  }
}
