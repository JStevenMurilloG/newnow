import { lazy, Suspense, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useResolvedTheme } from '../hooks/useMediaQuery';
import { citiesOf, cityPlace, COUNTRIES, countryPlace, placeKey, placePath, WORLD, type Country } from '../lib/geo';
import type { Hotspot } from '../lib/hotspots';
import type { Place } from '../lib/types';
import { useScene } from '../store/scene';
import { useUI } from '../store/ui';
import { usePicker } from './CountrySelector';
import { Icon } from './Icon';
import { Breadcrumb, PlaceIcon, PlaceStats } from './place';

const Globe = lazy(() => import('../globe/Globe'));

interface Props {
  place: Place;
  hotspots: Hotspot[];
  total: number | undefined;
  updatedAt: number;
  now: number;
  onSelect: (place: Place) => void;
  onSeeNews: () => void;
}

export function Hero({ place, hotspots, total, updatedAt, now, onSelect, onSeeNews }: Props) {
  const theme = useResolvedTheme(useUI((s) => s.theme));
  const openPicker = usePicker((s) => s.setOpen);
  const stage = useRef<HTMLDivElement>(null);
  const world = place.kind === 'world';
  const cities = place.country ? citiesOf(place.country) : [];

  // parallax suave del planeta al hacer scroll
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        stage.current?.style.setProperty('--parallax', `${Math.min(window.scrollY, 700) * 0.14}px`);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // cuando el globo sale de pantalla, la barra superior muestra el orbe acompañante
  const setHeroVisible = useScene((s) => s.setHeroVisible);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setHeroVisible(entry.intersectionRatio > 0.25), {
      threshold: [0, 0.25, 0.5],
    });
    io.observe(el);
    return () => {
      io.disconnect();
      setHeroVisible(true);
    };
  }, [setHeroVisible]);

  const pick = (country: Country) => onSelect(countryPlace(country));

  return (
    <section className="hero" data-selected={world ? undefined : ''}>
      <div className="hero__stage" ref={stage}>
        <div className="hero__orbit" aria-hidden="true" />
        <Suspense fallback={<div className="globe globe--fallback"><div className="globe__poster" /></div>}>
          <Globe place={place} hotspots={hotspots} theme={theme} onSelect={pick} />
        </Suspense>
      </div>

      <div className="hero__copy" key={placeKey(place)}>
        {world ? (
          <>
            <p className="eyebrow">
              <span className="live-dot" aria-hidden="true" />
              Explora el mundo
            </p>
            <h1 className="hero__title">
              Las noticias del mundo, <em>en tus manos.</em>
            </h1>
            <p className="hero__lead">
              Gira el planeta y selecciona cualquier país o región para descubrir lo que está pasando allí ahora
              mismo.
            </p>
            <div className="hero__cta">
              <button type="button" className="btn btn--primary" onClick={() => openPicker(true)}>
                <Icon name="globe" size={18} />
                Explorar mundo
              </button>
              <button type="button" className="btn btn--ghost" onClick={onSeeNews}>
                Últimas noticias
                <Icon name="arrow-right" size={18} />
              </button>
            </div>
            <dl className="hero__facts">
              <div>
                <dt>Países</dt>
                <dd>{COUNTRIES.length}</dd>
              </div>
              <div>
                <dt>Lugares en titulares</dt>
                <dd>{hotspots.length || '—'}</dd>
              </div>
              <div>
                <dt>Titulares</dt>
                <dd>{total ?? '—'}</dd>
              </div>
            </dl>
          </>
        ) : (
          <>
            <Breadcrumb place={place} />
            <div className="hero__place">
              <PlaceIcon place={place} size="lg" />
              <h1 className="hero__title hero__title--place">{place.name}</h1>
            </div>
            <PlaceStats total={total} updatedAt={updatedAt} now={now} />
            {cities.length > 0 && (
              <div className="chips chips--cities" aria-label="Ciudades">
                {cities.map((c) => (
                  <Link
                    key={c.slug}
                    to={placePath(cityPlace(c))}
                    preventScrollReset
                    className="chip chip--sm"
                    aria-current={place.kind === 'city' && place.code === c.slug ? 'true' : undefined}
                  >
                    <Icon name="pin" size={14} />
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
            <div className="hero__cta">
              <button type="button" className="btn btn--primary" onClick={onSeeNews}>
                Ver noticias
                <Icon name="arrow-right" size={18} />
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => onSelect(WORLD)}>
                <Icon name="arrow-left" size={18} />
                Volver a Mundo
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
