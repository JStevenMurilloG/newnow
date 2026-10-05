import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BookmarkButton, ShareButton } from '../components/actions';
import { EmptyState } from '../components/feedback';
import { Icon } from '../components/Icon';
import { SmartImage } from '../components/SmartImage';
import { recallArticle } from '../lib/articles';
import { fullDate, timeAgo } from '../lib/time';
import { useUI } from '../store/ui';

function ReadingProgress({ target }: { target: React.RefObject<HTMLElement> }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const el = target.current;
      if (!el) return;
      const total = el.offsetTop + el.offsetHeight - window.innerHeight;
      setProgress(total <= 0 ? 1 : Math.min(1, Math.max(0, window.scrollY / total)));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [target]);
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label="Progreso de lectura"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
    >
      <span style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}

export default function Article() {
  const { id } = useParams();
  const navigate = useNavigate();
  const saved = useUI((s) => s.bookmarks.find((b) => b.id === id));
  const article = recallArticle(id) ?? saved;
  const body = useRef<HTMLElement>(null);

  useEffect(() => {
    if (article) document.title = `${article.title} — NewsNow`;
    return () => {
      document.title = 'NewsNow — Las noticias del mundo, en tus manos';
    };
  }, [article]);

  const back = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate('/', { viewTransition: true });
  };

  if (!article) {
    return (
      <div className="page">
        <EmptyState
          title="No encontramos esta noticia"
          action={
            <Link to="/" className="btn btn--primary">
              Ir a la portada
            </Link>
          }
        >
          Las noticias solo se conservan durante tu sesión, salvo que las guardes. Vuelve a la portada para
          encontrarla de nuevo.
        </EmptyState>
      </div>
    );
  }

  // NewsAPI entrega solo un extracto: si repite la descripción no se muestra dos veces
  const excerpt = article.content && !article.description.startsWith(article.content.slice(0, 60)) ? article.content : '';

  return (
    <>
      <ReadingProgress target={body} />
      <article className="reader" ref={body}>
        <div className="reader__bar">
          <button type="button" className="btn btn--ghost btn--sm" onClick={back}>
            <Icon name="arrow-left" size={16} />
            Volver
          </button>
          <div className="reader__actions">
            <BookmarkButton article={article} label />
            <ShareButton article={article} label />
          </div>
        </div>

        <header className="reader__head">
          <p className="meta">
            <span className="meta__source">{article.source}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={article.publishedAt} title={fullDate(article.publishedAt)}>
              {timeAgo(article.publishedAt)}
            </time>
          </p>
          <h1 className="reader__title">
            {article.title}
          </h1>
          {article.author && <p className="reader__author">Por {article.author}</p>}
        </header>

        <SmartImage
          src={article.image}
          label={article.source}
          className="reader__media"
          style={{ viewTransitionName: 'article-image' }}
          eager
        />

        <div className="reader__body">
          {article.description && <p className="reader__lead">{article.description}</p>}
          {excerpt && <p>{excerpt}</p>}

          <aside className="reader__source">
            <div>
              <h2>Sigue leyendo en {article.source}</h2>
              <p>NewsNow muestra un extracto. La historia completa está en el medio que la publicó.</p>
            </div>
            <a className="btn btn--primary" href={article.url} target="_blank" rel="noopener noreferrer">
              Leer en la fuente
              <Icon name="external" size={18} />
            </a>
          </aside>
          <p className="reader__date">Publicado el {fullDate(article.publishedAt)}</p>
        </div>
      </article>
    </>
  );
}
