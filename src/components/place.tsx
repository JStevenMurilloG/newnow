import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { REGIONS } from '../data/regions';
import { placeKey, placePath, placeTrail, WORLD } from '../lib/geo';
import { formatCount, timeAgo } from '../lib/time';
import { CATEGORIES, type Article, type Category, type Place } from '../lib/types';
import { CategoryArt } from './CategoryArt';
import { Flag } from './Flag';
import { Icon } from './Icon';
import { Skeleton } from './feedback';

export function Breadcrumb({ place }: { place: Place }) {
  const trail = placeTrail(place);
  return (
    <nav className="breadcrumb" aria-label="Ubicación">
      <ol>
        {trail.map((p, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={placeKey(p)}>
              {i > 0 && <Icon name="arrow-right" size={14} />}
              {last ? (
                <span aria-current="page">{p.name}</span>
              ) : (
                <Link to={placePath(p)} preventScrollReset>
                  {p.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function PlaceIcon({ place, size = 'md' }: { place: Place; size?: 'sm' | 'md' | 'lg' }) {
  if (place.country) return <Flag code={place.country} size={size} />;
  return (
    <span className={`flag flag--${size} flag--world`} aria-hidden="true">
      <Icon name={place.kind === 'world' ? 'globe' : 'pin'} size={size === 'lg' ? 26 : 16} />
    </span>
  );
}

/** Contador que sube hasta el valor: es el remate del aterrizaje en un lugar. */
function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(value);
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 720);
      const current = Math.round(origin + (value - origin) * (1 - Math.pow(1 - p, 3)));
      from.current = current;
      setShown(current);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  // el lector de pantalla recibe el valor final, no cada paso
  return (
    <strong aria-label={formatCount(value)}>
      <span aria-hidden="true">{formatCount(shown)}</span>
    </strong>
  );
}

interface StatsProps {
  total: number | undefined;
  updatedAt: number;
  now: number;
}

/** «128 noticias · Actualizado hace 2 min» */
export function PlaceStats({ total, updatedAt, now }: StatsProps) {
  if (total === undefined) return <Skeleton className="skeleton--line skeleton--stats" />;
  return (
    <p className="place-stats">
      <span>
        <CountUp value={total} /> {total === 1 ? 'noticia disponible' : 'noticias disponibles'}
      </span>
      <span className="place-stats__time">
        <span className="live-dot" aria-hidden="true" />
        Actualizado {timeAgo(updatedAt, now)}
      </span>
    </p>
  );
}

export function RegionChips({ place }: { place: Place }) {
  const options: Place[] = [WORLD, ...REGIONS.map((r) => ({ kind: 'region', code: r.id, name: r.name }) as Place)];
  return (
    <div className="chips" role="list" aria-label="Regiones">
      {options.map((p) => (
        <Link
          key={p.code}
          role="listitem"
          to={placePath(p)}
          preventScrollReset
          className="chip"
          aria-current={placeKey(p) === placeKey(place) ? 'true' : undefined}
        >
          {p.kind === 'world' && <Icon name="globe" size={16} />}
          {p.name}
        </Link>
      ))}
    </div>
  );
}

interface CategoryProps {
  place: Place;
  category: Category;
  onSelect: (c: Category) => void;
}

export function CategoryChips({ category, onSelect }: Omit<CategoryProps, 'place'>) {
  return (
    <div className="chips chips--filters" role="group" aria-label="Categorías">
      {CATEGORIES.map((c) => (
        <button key={c.id} type="button" className="chip" aria-pressed={c.id === category} onClick={() => onSelect(c.id)}>
          {c.label}
        </button>
      ))}
    </div>
  );
}

export function CategoryCards({ place, category, onSelect }: CategoryProps) {
  const where = place.kind === 'world' ? 'en el mundo' : `en ${place.name}`;
  const sections = CATEGORIES.filter((c) => c.id !== 'general');
  return (
    <div className="cat-grid">
      {sections.map((c, i) => {
        const id = c.id as Exclude<Category, 'general'>;
        const active = c.id === category;
        return (
          <button
            key={c.id}
            type="button"
            className="cat-card enter"
            style={{ '--i': i } as CSSProperties}
            data-cat={c.id}
            aria-pressed={active}
            onClick={() => onSelect(active ? 'general' : c.id)}
          >
            <CategoryArt category={id} />
            <span className="cat-card__kicker">
              <Icon name={c.id} size={16} />
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="cat-card__name">{c.label}</span>
            <span className="cat-card__text">
              {c.blurb} {where}
            </span>
            <span className="cat-card__go">
              {active ? 'Viendo ahora' : 'Ver sección'}
              <Icon name={active ? 'check' : 'arrow-right'} size={16} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface SheetProps {
  place: Place;
  total: number | undefined;
  articles: Article[] | undefined;
  failed: boolean;
  onClose: () => void;
  onSeeAll: () => void;
}

/** Bottom sheet móvil con el resumen del lugar seleccionado. Se cierra arrastrando hacia abajo. */
export function PlaceSheet({ place, total, articles, failed, onClose, onSeeAll }: SheetProps) {
  const sheet = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; dy: number } | null>(null);

  const onDown = (e: React.PointerEvent) => {
    drag.current = { startY: e.clientY, dy: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current || !sheet.current) return;
    drag.current.dy = Math.max(0, e.clientY - drag.current.startY);
    sheet.current.style.transform = `translateY(${drag.current.dy}px)`;
    sheet.current.style.transition = 'none';
  };
  const onUp = () => {
    if (!drag.current || !sheet.current) return;
    const { dy } = drag.current;
    drag.current = null;
    sheet.current.style.transition = '';
    sheet.current.style.transform = '';
    if (dy > 70) onClose();
  };

  return (
    <div ref={sheet} className="place-sheet glass" role="region" aria-label={`Noticias de ${place.name}`}>
      <div className="place-sheet__handle" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <span className="modal__grip" aria-hidden="true" />
      </div>
      <header className="place-sheet__head">
        <PlaceIcon place={place} />
        <div>
          <h2>{place.name}</h2>
          <p>
            {total === undefined ? (failed ? 'No disponible' : 'Buscando noticias…') : `${formatCount(total)} noticias`}
          </p>
        </div>
        <button type="button" className="icon-btn icon-btn--sm" aria-label="Cerrar" onClick={onClose}>
          <Icon name="close" size={18} />
        </button>
      </header>
      <p className="place-sheet__label">Últimas noticias</p>
      <ul className="place-sheet__list">
        {articles
          ? articles.slice(0, 3).map((a) => (
              <li key={a.id}>
                <Link to={`/a/${a.id}`} viewTransition>
                  <span>{a.title}</span>
                  <small>
                    {a.source} · {timeAgo(a.publishedAt)}
                  </small>
                </Link>
              </li>
            ))
          : !failed && Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="skeleton--row" />)}
        {articles?.length === 0 && <li className="place-sheet__empty">Sin noticias recientes para este lugar.</li>}
        {failed && <li className="place-sheet__empty">No se pudieron cargar las noticias.</li>}
      </ul>
      <button type="button" className="btn btn--primary btn--block" onClick={onSeeAll}>
        Ver todas las noticias
      </button>
    </div>
  );
}
