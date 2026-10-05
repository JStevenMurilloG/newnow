import { useEffect, useMemo, useRef, useState } from 'react';
import { usePicker } from '../components/CountrySelector';
import { EmptyState, ErrorState, FeedSkeleton, Skeleton } from '../components/feedback';
import { Hero } from '../components/Hero';
import { Icon } from '../components/Icon';
import { BreakingBanner, FeaturedNews, isFresh, NewsCard, TrendingList } from '../components/NewsCard';
import { Breadcrumb, CategoryCards, CategoryChips, PlaceSheet, RegionChips } from '../components/place';
import { useIsMobile, useReducedMotion } from '../hooks/useMediaQuery';
import { useHeadlines, useTrending } from '../hooks/useNews';
import { useNow, usePlace } from '../hooks/usePlace';
import { placeKey, placeTitle, WORLD } from '../lib/geo';
import { findHotspots } from '../lib/hotspots';
import { formatCount } from '../lib/time';
import { CATEGORIES, type Category, type Place } from '../lib/types';
import { useUI } from '../store/ui';
import NotFound from './NotFound';

const PAGE = 9;
/** Aterrizaje: el feed sale, la cámara vuela y el contenido nuevo llega cuando el vuelo se asienta. */
const LEAVE_MS = 180;
const ARRIVE_MS = 980;

type Phase = 'idle' | 'leaving' | 'flying';

export default function Home() {
  const { place, category, selectPlace, selectCategory } = usePlace();
  if (!place) return <NotFound />;
  return <HomeView place={place} category={category} selectPlace={selectPlace} selectCategory={selectCategory} />;
}

interface ViewProps {
  place: Place;
  category: Category;
  selectPlace: (p: Place) => void;
  selectCategory: (c: Category) => void;
}

function HomeView({ place, category, selectPlace, selectCategory }: ViewProps) {
  const key = placeKey(place);
  const world = place.kind === 'world';
  const now = useNow();
  const mobile = useIsMobile();
  const reduced = useReducedMotion();
  const toast = useUI((s) => s.toast);
  const notify = useUI((s) => s.notify);
  const openPicker = usePicker((s) => s.setOpen);

  const feed = useRef<HTMLElement>(null);
  const [sheet, setSheet] = useState(!world);
  const [visible, setVisible] = useState(PAGE);

  // El hero y el globo siguen a `place` al instante; el feed va un paso por detrás (`feedPlace`)
  // para poder salir con el contenido anterior antes de mostrar el nuevo.
  const [feedPlace, setFeedPlace] = useState(place);
  const [phase, setPhase] = useState<Phase>('idle');
  const shown = useRef(feedPlace);
  shown.current = feedPlace;
  const feedKey = placeKey(feedPlace);
  const feedWorld = feedPlace.kind === 'world';

  const heroNews = useHeadlines(place, category);
  const news = useHeadlines(feedPlace, category);
  const trending = useTrending(feedPlace);

  const articles = news.data?.articles;
  const hotspots = useMemo(() => findHotspots(heroNews.data?.articles ?? []), [heroNews.data]);

  useEffect(() => {
    if (placeKey(shown.current) === key) {
      setPhase('idle');
      return;
    }
    // si el globo no está a la vista no hay vuelo que esperar: solo un fundido corto
    const heroGone = window.scrollY > window.innerHeight * 0.6;
    const leave = reduced ? 0 : LEAVE_MS;
    const arrive = reduced ? 0 : heroGone ? LEAVE_MS + 120 : ARRIVE_MS;
    setPhase('leaving');
    const swap = window.setTimeout(() => {
      setFeedPlace(place);
      setPhase('flying');
    }, leave);
    const land = window.setTimeout(() => setPhase('idle'), arrive);
    return () => {
      clearTimeout(swap);
      clearTimeout(land);
    };
  }, [key, place, reduced]);

  // reacción al cambio de lugar: toast + bottom sheet móvil
  const previous = useRef(key);
  useEffect(() => {
    if (previous.current === key) return;
    previous.current = key;
    toast(world ? 'Mostrando noticias de todo el mundo' : `Mostrando noticias de ${place.name}`, { icon: 'globe' });
    setSheet(!world);
  }, [key, world, place.name, toast]);

  useEffect(() => setVisible(PAGE), [feedKey, category]);

  // Esc vuelve a Mundo (si no hay ningún diálogo abierto)
  useEffect(() => {
    if (world) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('dialog[open]')) selectPlace(WORLD);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [world, selectPlace]);

  const top = articles?.[0];
  const heroTop = heroNews.data?.articles[0];
  useEffect(() => {
    if (!heroTop || category !== 'general') return;
    const label = isFresh(heroTop) ? 'Última hora' : 'Titular del día';
    notify({
      id: `top:${heroTop.id}`,
      title: world ? label : `${label} · ${place.name}`,
      body: heroTop.title,
      href: `/a/${heroTop.id}`,
    });
  }, [heroTop, category, world, place.name, notify]);

  const seeNews = () => {
    setSheet(false);
    feed.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const rest = articles?.slice(1) ?? [];
  const trend = (trending.data?.length ? trending.data : rest.slice(PAGE)).filter((a) => a.id !== top?.id).slice(0, 5);
  const label = CATEGORIES.find((c) => c.id === category)!.label;

  return (
    <>
      <Hero
        place={place}
        hotspots={hotspots}
        total={heroNews.data?.total}
        updatedAt={heroNews.dataUpdatedAt}
        now={now}
        onSelect={selectPlace}
        onSeeNews={seeNews}
      />

      <section className="feed" ref={feed} aria-labelledby="feed-title" data-phase={phase === 'idle' ? undefined : phase}>
        {top && category === 'general' && <BreakingBanner key={top.id} article={top} />}

        <RegionChips place={place} />

        <header className="feed__head" key={feedKey}>
          <div className="enter">
            <Breadcrumb place={feedPlace} />
            <h2 id="feed-title" className="feed__title">
              {placeTitle(feedPlace)}
            </h2>
            <p className="feed__sub">
              {news.data ? (
                <>
                  {formatCount(news.data.total)} resultados ·{' '}
                  {news.data.mode === 'headlines' ? 'Titulares principales' : `Artículos que mencionan ${feedPlace.name}`}
                </>
              ) : news.isError ? (
                'Sin datos por ahora'
              ) : (
                <Skeleton className="skeleton--line skeleton--xs" />
              )}
            </p>
          </div>
          {!feedWorld && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => selectPlace(WORLD)}>
              <Icon name="arrow-left" size={16} />
              Volver a Mundo
            </button>
          )}
        </header>

        <CategoryChips category={category} onSelect={selectCategory} />

        <div className="feed__body" key={`${feedKey}:${category}`} aria-busy={news.isPending}>
          {news.isPending ? (
            <FeedSkeleton />
          ) : !articles ? (
            <ErrorState error={news.error} onRetry={() => news.refetch()} />
          ) : articles.length === 0 ? (
            <EmptyState
              title={`No hay noticias de ${label.toLowerCase()} para ${feedPlace.name}`}
              action={
                category !== 'general' ? (
                  <button type="button" className="btn btn--ghost" onClick={() => selectCategory('general')}>
                    Quitar filtro
                  </button>
                ) : (
                  <button type="button" className="btn btn--ghost" onClick={() => openPicker(true)}>
                    Elegir otro lugar
                  </button>
                )
              }
            >
              NewsAPI no devolvió artículos recientes. Prueba con otra categoría u otro lugar.
            </EmptyState>
          ) : (
            <>
              <div className="lead">
                <FeaturedNews article={top!} />
                <aside className="trending" aria-labelledby="trending-title">
                  <h3 id="trending-title" className="section-title">
                    <Icon name="trending" size={18} />
                    Tendencias
                  </h3>
                  {trending.isPending ? (
                    <div className="trending--skeleton">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Skeleton key={i} className="skeleton--row" />
                      ))}
                    </div>
                  ) : trend.length > 0 ? (
                    <TrendingList articles={trend} />
                  ) : (
                    <p className="trending__empty">Sin tendencias para este lugar por ahora.</p>
                  )}
                </aside>
              </div>

              {rest.length > 0 && (
                <>
                  <h3 className="section-title">
                    <Icon name="clock" size={18} />
                    Lo último
                  </h3>
                  <div className="grid">
                    {rest.slice(0, visible).map((a, i) => (
                      <NewsCard key={a.id} article={a} index={i % PAGE} />
                    ))}
                  </div>
                  {visible < rest.length && (
                    <div className="feed__more">
                      <button type="button" className="btn btn--ghost" onClick={() => setVisible((v) => v + PAGE)}>
                        Ver más noticias
                        <Icon name="chevron-down" size={18} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <h3 className="section-title section-title--lg">Explora por categoría</h3>
        <CategoryCards
          place={feedPlace}
          category={category}
          onSelect={(c) => {
            selectCategory(c);
            feed.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        />
      </section>

      {mobile && sheet && !world && (
        <PlaceSheet
          key={key}
          place={place}
          total={heroNews.data?.total}
          articles={heroNews.data?.articles}
          failed={heroNews.isError && !heroNews.data}
          onClose={() => setSheet(false)}
          onSeeAll={seeNews}
        />
      )}
    </>
  );
}
