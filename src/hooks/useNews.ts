import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { rememberArticles } from '../lib/articles';
import { placeKey } from '../lib/geo';
import { getHeadlines, getTrending, NewsError, searchNews } from '../lib/newsapi';
import type { Category, Place } from '../lib/types';

// La cuota gratuita es de 100 peticiones/día: nada se vuelve a pedir antes de 10 minutos.
const STALE = 10 * 60_000;

const retry = (count: number, error: Error) =>
  count < 1 && error instanceof NewsError && (error.code === 'network' || error.code === 'upstream');

export function useHeadlines(place: Place, category: Category) {
  const query = useQuery({
    queryKey: ['headlines', placeKey(place), category],
    queryFn: () => getHeadlines(place, category),
    staleTime: STALE,
    retry,
  });
  useEffect(() => {
    if (query.data) rememberArticles(query.data.articles);
  }, [query.data]);
  return query;
}

export function useTrending(place: Place) {
  const query = useQuery({
    queryKey: ['trending', placeKey(place)],
    queryFn: () => getTrending(place),
    staleTime: STALE,
    retry,
  });
  useEffect(() => {
    if (query.data) rememberArticles(query.data);
  }, [query.data]);
  return query;
}

export function useSearch(q: string) {
  const query = useQuery({
    queryKey: ['search', q],
    queryFn: () => searchNews(q),
    enabled: q.length >= 2,
    staleTime: STALE,
    retry,
  });
  useEffect(() => {
    if (query.data) rememberArticles(query.data.articles);
  }, [query.data]);
  return query;
}
