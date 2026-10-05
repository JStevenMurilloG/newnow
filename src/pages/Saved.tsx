import { Link } from 'react-router-dom';
import { EmptyState } from '../components/feedback';
import { NewsCard } from '../components/NewsCard';
import { useUI } from '../store/ui';

export default function Saved() {
  const bookmarks = useUI((s) => s.bookmarks);
  return (
    <div className="page">
      <header className="page__head">
        <h1 className="page__title">Guardados</h1>
        <p className="page__sub">
          {bookmarks.length === 0
            ? 'Tu lista de lectura, disponible también sin conexión.'
            : `${bookmarks.length} ${bookmarks.length === 1 ? 'noticia guardada' : 'noticias guardadas'} en este dispositivo`}
        </p>
      </header>
      {bookmarks.length === 0 ? (
        <EmptyState
          icon="bookmark"
          title="Aún no has guardado nada"
          action={
            <Link to="/" className="btn btn--primary">
              Explorar noticias
            </Link>
          }
        >
          Toca el marcador de cualquier noticia para leerla después.
        </EmptyState>
      ) : (
        <div className="grid">
          {bookmarks.map((a, i) => (
            <NewsCard key={a.id} article={a} index={Math.min(i, 9)} />
          ))}
        </div>
      )}
    </div>
  );
}
