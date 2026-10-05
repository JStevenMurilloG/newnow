import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { Link, useViewTransitionState } from 'react-router-dom';
import { usePlace } from '../hooks/usePlace';
import { articleSpot, type Spot } from '../lib/hotspots';
import { timeAgo } from '../lib/time';
import type { Article } from '../lib/types';
import { useScene } from '../store/scene';
import { BookmarkButton, ShareButton } from './actions';
import { Icon } from './Icon';
import { SmartImage } from './SmartImage';

const hrefOf = (a: Article) => `/a/${a.id}`;
const FRESH_MS = 3 * 60 * 60_000;

/** La imagen comparte nombre con la del lector para la View Transition listado ↔ detalle. */
function useSharedImage(href: string): CSSProperties | undefined {
  return useViewTransitionState(href) ? { viewTransitionName: 'article-image' } : undefined;
}

/**
 * Enlaza un titular con su lugar en el globo: al detener el cursor (o el foco) sobre él, el lugar
 * se enciende en el planeta y en el orbe. La espera evita que reaccione a cada pasada del ratón.
 */
function useSpotLink(article: Article) {
  const { place } = usePlace();
  const spot = useMemo(() => articleSpot(article, place?.country), [article, place?.country]);
  const setSpot = useScene((s) => s.setSpot);
  const lit = useScene((s) => !!spot && s.spot?.id === spot.id);
  const timer = useRef(0);

  const leave = () => {
    clearTimeout(timer.current);
    if (spot && useScene.getState().spot?.id === spot.id) setSpot(null);
  };
  // al desmontarse (cambio de lugar, navegación) no deja su lugar encendido
  const id = spot?.id;
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if (id && useScene.getState().spot?.id === id) useScene.getState().setSpot(null);
    },
    [id],
  );

  const enter = () => {
    if (!spot) return;
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSpot(spot), 150);
  };

  return {
    spot,
    lit,
    handlers: spot
      ? {
          onPointerEnter: (e: React.PointerEvent) => e.pointerType === 'mouse' && enter(),
          onPointerLeave: leave,
          onFocus: enter,
          onBlur: leave,
        }
      : {},
  };
}

function Meta({ article, spot }: { article: Article; spot?: Spot | null }) {
  return (
    <p className="meta">
      <span className="meta__source">{article.source}</span>
      <span aria-hidden="true">·</span>
      <time dateTime={article.publishedAt}>{timeAgo(article.publishedAt)}</time>
      {spot && (
        <span className="meta__place">
          <Icon name="pin" size={13} />
          {spot.label}
        </span>
      )}
    </p>
  );
}

interface CardProps {
  article: Article;
  variant?: 'default' | 'row';
  /** posición para la animación escalonada */
  index?: number;
}

export function NewsCard({ article, variant = 'default', index = 0 }: CardProps) {
  const href = hrefOf(article);
  const shared = useSharedImage(href);
  const { spot, lit, handlers } = useSpotLink(article);
  return (
    <article
      className={`card card--${variant} enter`}
      style={{ '--i': index } as CSSProperties}
      data-lit={lit ? '' : undefined}
      {...handlers}
    >
      <SmartImage src={article.image} label={article.source} className="card__media" style={shared} />
      <div className="card__body">
        <Meta article={article} spot={spot} />
        <h3 className="card__title">
          <Link to={href} viewTransition className="stretched">
            {article.title}
          </Link>
        </h3>
        {variant === 'default' && article.description && <p className="card__text">{article.description}</p>}
        <div className="card__actions">
          <BookmarkButton article={article} />
          <ShareButton article={article} />
        </div>
      </div>
    </article>
  );
}

export function FeaturedNews({ article }: { article: Article }) {
  const href = hrefOf(article);
  const shared = useSharedImage(href);
  const { spot, handlers } = useSpotLink(article);
  return (
    <article className="featured enter" {...handlers}>
      <SmartImage src={article.image} label={article.source} className="featured__media" style={shared} eager />
      <div className="featured__body">
        <span className="tag">
          <Icon name="bolt" size={14} filled />
          Destacada
        </span>
        <h3 className="featured__title">
          <Link to={href} viewTransition className="stretched">
            {article.title}
          </Link>
        </h3>
        {article.description && <p className="featured__text">{article.description}</p>}
        <div className="featured__foot">
          <Meta article={article} spot={spot} />
          <div className="card__actions">
            <BookmarkButton article={article} />
            <ShareButton article={article} />
          </div>
        </div>
      </div>
    </article>
  );
}

function TrendingItem({ article, index }: { article: Article; index: number }) {
  const { spot, lit, handlers } = useSpotLink(article);
  return (
    <li className="trending__item enter" style={{ '--i': index } as CSSProperties} data-lit={lit ? '' : undefined} {...handlers}>
      <span className="trending__rank" aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </span>
      <div>
        <Link to={hrefOf(article)} viewTransition className="trending__link stretched">
          {article.title}
        </Link>
        <Meta article={article} spot={spot} />
      </div>
    </li>
  );
}

export function TrendingList({ articles }: { articles: Article[] }) {
  return (
    <ol className="trending__list">
      {articles.map((a, i) => (
        <TrendingItem key={a.id} article={a} index={i} />
      ))}
    </ol>
  );
}

/** «Última hora» solo si de verdad es reciente; NewsAPI gratuito llega con un día de retraso. */
export const isFresh = (article: Article, now = Date.now()) =>
  now - new Date(article.publishedAt).getTime() < FRESH_MS;

export function BreakingBanner({ article }: { article: Article }) {
  const fresh = isFresh(article);
  return (
    <Link to={hrefOf(article)} viewTransition className="breaking enter" data-fresh={fresh ? '' : undefined}>
      <span className="breaking__label">
        {fresh && <span className="live-dot" aria-hidden="true" />}
        {fresh ? 'Última hora' : 'Titular del día'}
      </span>
      <span className="breaking__title">{article.title}</span>
      <span className="breaking__time">{timeAgo(article.publishedAt)}</span>
      <Icon name="chevron-right" size={18} />
    </Link>
  );
}
