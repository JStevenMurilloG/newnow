import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CardSkeleton, EmptyState, ErrorState } from '../components/feedback';
import { Icon } from '../components/Icon';
import { NewsCard } from '../components/NewsCard';
import { useSearch } from '../hooks/useNews';
import { formatCount } from '../lib/time';

const SUGGESTIONS = ['Inteligencia artificial', 'Cambio climático', 'Economía', 'Elecciones', 'Champions League'];

export default function Search() {
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const [value, setValue] = useState(q);
  const results = useSearch(q);

  useEffect(() => setValue(q), [q]);

  const go = (text: string) => setParams(text ? { q: text } : {});
  const submit = (e: FormEvent) => {
    e.preventDefault();
    go(value.trim());
  };

  return (
    <div className="page">
      <header className="page__head">
        <h1 className="page__title">Buscar</h1>
        <form className="field field--lg" role="search" onSubmit={submit}>
          <Icon name="search" />
          <input
            type="search"
            autoFocus
            placeholder="¿Qué quieres saber hoy?"
            aria-label="Buscar noticias"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button type="submit" className="btn btn--primary btn--sm">
            Buscar
          </button>
        </form>
      </header>

      {q.length < 2 ? (
        <EmptyState icon="search" title="Busca cualquier tema, persona o lugar">
          <span className="chips chips--center">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" className="chip" onClick={() => go(s)}>
                {s}
              </button>
            ))}
          </span>
        </EmptyState>
      ) : results.isPending ? (
        <div className="grid" role="status" aria-label="Buscando">
          {Array.from({ length: 6 }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : !results.data ? (
        <ErrorState error={results.error} onRetry={() => results.refetch()} />
      ) : results.data.articles.length === 0 ? (
        <EmptyState icon="search" title={`Sin resultados para «${q}»`}>
          Revisa la ortografía o prueba con términos más generales.
        </EmptyState>
      ) : (
        <>
          <p className="page__sub">
            {formatCount(results.data.total)} resultados para «{q}»
          </p>
          <div className="grid" key={q}>
            {results.data.articles.map((a, i) => (
              <NewsCard key={a.id} article={a} index={Math.min(i, 9)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
