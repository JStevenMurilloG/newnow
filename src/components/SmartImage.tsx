import { useState, type CSSProperties } from 'react';

interface Props {
  src: string | null;
  /** texto para el marcador cuando no hay imagen */
  label: string;
  className?: string;
  style?: CSSProperties;
  eager?: boolean;
}

/** Imagen con fundido al cargar y marcador degradado si falta o falla. */
export function SmartImage({ src, label, className = '', style, eager = false }: Props) {
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>(src ? 'loading' : 'failed');

  return (
    <div className={`media ${className}`} style={style} data-state={state}>
      <span className="media__placeholder" aria-hidden="true">
        {label.slice(0, 1).toUpperCase()}
      </span>
      {src && state !== 'failed' && (
        <img
          src={src}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setState('ready')}
          onError={() => setState('failed')}
        />
      )}
    </div>
  );
}
