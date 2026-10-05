import { Link } from 'react-router-dom';
import { EmptyState } from '../components/feedback';

export default function NotFound() {
  return (
    <div className="page">
      <EmptyState
        icon="globe"
        title="Este lugar no está en el mapa"
        action={
          <Link to="/" className="btn btn--primary">
            Volver a Mundo
          </Link>
        }
      >
        La página que buscas no existe o el enlace está incompleto.
      </EmptyState>
    </div>
  );
}
