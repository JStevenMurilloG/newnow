import type { ReactNode } from 'react';
import { NewsError } from '../lib/newsapi';
import { Icon, type IconName } from './Icon';

export function Skeleton({ className = '' }: { className?: string }) {
  return <span className={`skeleton ${className}`} aria-hidden="true" />;
}

export function CardSkeleton() {
  return (
    <div className="card card--skeleton" aria-hidden="true">
      <Skeleton className="skeleton--media" />
      <div className="card__body">
        <Skeleton className="skeleton--line skeleton--xs" />
        <Skeleton className="skeleton--line" />
        <Skeleton className="skeleton--line skeleton--md" />
      </div>
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div role="status" aria-label="Cargando noticias">
      <div className="lead">
        <Skeleton className="skeleton--featured" />
        <div className="trending trending--skeleton">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="skeleton--row" />
          ))}
        </div>
      </div>
      <div className="grid">
        {Array.from({ length: 6 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

interface StateProps {
  icon?: IconName;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ icon = 'inbox', title, children, action }: StateProps) {
  return (
    <div className="state">
      <div className="state__icon">
        <Icon name={icon} size={26} />
      </div>
      <h3 className="state__title">{title}</h3>
      {children && <p className="state__text">{children}</p>}
      {action}
    </div>
  );
}

const ERRORS: Record<string, { icon: IconName; title: string; text: string }> = {
  rateLimited: {
    icon: 'clock',
    title: 'Se alcanzó el límite de consultas',
    text: 'El plan gratuito de NewsAPI permite 100 peticiones al día. Lo que ya viste sigue disponible; inténtalo de nuevo más tarde.',
  },
  apiKeyMissing: {
    icon: 'alert',
    title: 'Falta la API key de NewsAPI',
    text: 'Crea un archivo .env.local con NEWSAPI_KEY=tu_key y reinicia el servidor de desarrollo.',
  },
  apiKeyInvalid: {
    icon: 'alert',
    title: 'La API key no es válida',
    text: 'Revisa el valor de NEWSAPI_KEY en .env.local y reinicia el servidor de desarrollo.',
  },
  network: {
    icon: 'wifi',
    title: 'Sin conexión',
    text: 'No pudimos conectar. Comprueba tu conexión a internet y vuelve a intentarlo.',
  },
  upstream: {
    icon: 'alert',
    title: 'No se pudieron cargar las noticias',
    text: 'El servicio de noticias no respondió como se esperaba. Vuelve a intentarlo en un momento.',
  },
};

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const code = error instanceof NewsError ? error.code : 'upstream';
  const e = ERRORS[code];
  const canRetry = onRetry && code !== 'apiKeyMissing' && code !== 'apiKeyInvalid';
  return (
    <div className="state state--error" role="alert">
      <div className="state__icon">
        <Icon name={e.icon} size={26} />
      </div>
      <h3 className="state__title">{e.title}</h3>
      <p className="state__text">{e.text}</p>
      {canRetry && (
        <button type="button" className="btn btn--ghost" onClick={onRetry}>
          <Icon name="refresh" size={18} />
          Reintentar
        </button>
      )}
    </div>
  );
}
