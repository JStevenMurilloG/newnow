import { shareArticle } from '../lib/share';
import type { Article } from '../lib/types';
import { useIsBookmarked, useUI } from '../store/ui';
import { Icon } from './Icon';

export function BookmarkButton({ article, label = false }: { article: Article; label?: boolean }) {
  const saved = useIsBookmarked(article.id);
  const toggle = useUI((s) => s.toggleBookmark);
  const toast = useUI((s) => s.toast);

  return (
    <button
      type="button"
      className={label ? 'btn btn--ghost bookmark' : 'icon-btn icon-btn--sm bookmark'}
      aria-pressed={saved}
      aria-label={label ? undefined : saved ? 'Quitar de guardados' : 'Guardar noticia'}
      onClick={() => toast(toggle(article) ? 'Guardada para leer después' : 'Quitada de guardados', { icon: 'bookmark' })}
    >
      <Icon name="bookmark" size={18} filled={saved} />
      {label && (saved ? 'Guardada' : 'Guardar')}
    </button>
  );
}

export function ShareButton({ article, label = false }: { article: Article; label?: boolean }) {
  const toast = useUI((s) => s.toast);

  const share = async () => {
    const result = await shareArticle(article);
    if (result === 'copied') toast('Enlace copiado al portapapeles', { icon: 'check' });
    if (result === 'failed') toast('No se pudo compartir el enlace', { icon: 'alert' });
  };

  return (
    <button
      type="button"
      className={label ? 'btn btn--ghost' : 'icon-btn icon-btn--sm'}
      aria-label={label ? undefined : 'Compartir noticia'}
      onClick={share}
    >
      <Icon name="share" size={18} />
      {label && 'Compartir'}
    </button>
  );
}
