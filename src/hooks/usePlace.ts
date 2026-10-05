import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMatches, useNavigate, useSearchParams } from 'react-router-dom';
import { placeFromParams, placePath } from '../lib/geo';
import { isCategory, type Category, type Place } from '../lib/types';

/**
 * El lugar seleccionado vive en la URL: es compartible y funciona con atrás/adelante.
 * Se lee de la ruta hija más profunda porque la portada es una ruta contenedora que no se desmonta
 * al cambiar de lugar (así el globo conserva su estado).
 */
export function usePlace() {
  const matches = useMatches();
  const { region, country, city } = matches[matches.length - 1]?.params ?? {};
  const [search] = useSearchParams();
  const navigate = useNavigate();

  const place = useMemo(() => placeFromParams({ region, country, city }), [region, country, city]);
  const cat = search.get('cat');
  const category: Category = isCategory(cat) ? cat : 'general';

  const selectPlace = useCallback(
    (p: Place) => navigate(placePath(p), { preventScrollReset: true }),
    [navigate],
  );

  const selectCategory = useCallback(
    (c: Category) =>
      navigate({ search: c === 'general' ? '' : `?cat=${c}` }, { preventScrollReset: true, replace: true }),
    [navigate],
  );

  return { place, category, selectPlace, selectCategory };
}

/** Reloj que avanza cada `ms` para refrescar textos como «hace 2 min». */
export function useNow(ms = 30_000) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}
