import type { Article } from './types';

// NewsAPI no tiene endpoint por id: el lector recupera el artículo de lo ya visto en la sesión.
const KEY = 'newsnow-articles';
const LIMIT = 300;

const cache = new Map<string, Article>();

try {
  const stored = JSON.parse(sessionStorage.getItem(KEY) ?? '[]') as Article[];
  for (const a of stored) cache.set(a.id, a);
} catch {
  // sin sessionStorage (modo privado, tests): se queda en memoria
}

export function rememberArticles(list: Article[]) {
  let changed = false;
  for (const a of list) {
    if (!cache.has(a.id)) changed = true;
    cache.set(a.id, a);
  }
  if (!changed) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify([...cache.values()].slice(-LIMIT)));
  } catch {
    // cuota llena: no es crítico
  }
}

export const recallArticle = (id: string | undefined) => (id ? cache.get(id) : undefined);
