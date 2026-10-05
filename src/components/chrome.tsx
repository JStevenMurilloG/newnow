import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useMatches, useNavigate, useSearchParams } from 'react-router-dom';
import { REGIONS } from '../data/regions';
import { placeFromParams, WORLD } from '../lib/geo';
import { mirror } from '../globe/mirror';
import { timeAgo } from '../lib/time';
import { useScene } from '../store/scene';
import { useUI, type Theme } from '../store/ui';
import { usePicker } from './CountrySelector';
import { Flag } from './Flag';
import { Icon, type IconName } from './Icon';

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="NewsNow, inicio">
      <span className="logo__mark" aria-hidden="true" />
      <span className="logo__text">
        News<b>Now</b>
      </span>
    </Link>
  );
}

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Inicio', icon: 'home' },
  { to: '/search', label: 'Buscar', icon: 'search' },
  { to: '/saved', label: 'Guardados', icon: 'bookmark' },
];

/** En la portada cualquier lugar (/c/co, /r/europe) cuenta como «Inicio». */
function useHomeActive() {
  const { pathname } = useLocation();
  return pathname === '/' || pathname.startsWith('/c/') || pathname.startsWith('/r/');
}

export function Sidebar() {
  const home = useHomeActive();
  const saved = useUI((s) => s.bookmarks.length);
  const openPicker = usePicker((s) => s.setOpen);
  return (
    <aside className="sidebar">
      <Logo />
      <nav className="sidebar__nav" aria-label="Principal">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) => `nav-link${(item.to === '/' ? home : isActive) ? ' is-active' : ''}`}
          >
            <Icon name={item.icon} />
            {item.label}
            {item.to === '/saved' && saved > 0 && <span className="nav-link__count">{saved}</span>}
          </NavLink>
        ))}
        <button type="button" className="nav-link" onClick={() => openPicker(true)}>
          <Icon name="globe" />
          Explorar países
        </button>
      </nav>

      <p className="sidebar__label">Regiones</p>
      <nav className="sidebar__nav" aria-label="Regiones">
        {REGIONS.map((r) => (
          <NavLink key={r.id} to={`/r/${r.id}`} className={({ isActive }) => `nav-link nav-link--sub${isActive ? ' is-active' : ''}`}>
            <span className="nav-link__dot" aria-hidden="true" />
            {r.name}
          </NavLink>
        ))}
      </nav>

      <p className="sidebar__foot">
        Datos de{' '}
        <a href="https://newsapi.org" target="_blank" rel="noreferrer">
          NewsAPI.org
        </a>
      </p>
    </aside>
  );
}

export function BottomNav() {
  const home = useHomeActive();
  const openPicker = usePicker((s) => s.setOpen);
  return (
    <nav className="bottom-nav glass" aria-label="Principal">
      <NavLink to="/" className={`bottom-nav__item${home ? ' is-active' : ''}`}>
        <Icon name="home" />
        Inicio
      </NavLink>
      <button type="button" className="bottom-nav__item" onClick={() => openPicker(true)}>
        <Icon name="globe" />
        Explorar
      </button>
      <NavLink to="/search" className={({ isActive }) => `bottom-nav__item${isActive ? ' is-active' : ''}`}>
        <Icon name="search" />
        Buscar
      </NavLink>
      <NavLink to="/saved" className={({ isActive }) => `bottom-nav__item${isActive ? ' is-active' : ''}`}>
        <Icon name="bookmark" />
        Guardados
      </NavLink>
    </nav>
  );
}

function SearchBox() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const [value, setValue] = useState('');

  useEffect(() => {
    setValue(pathname === '/search' ? (params.get('q') ?? '') : '');
  }, [pathname, params]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <form className="field topbar__search" role="search" onSubmit={submit}>
      <Icon name="search" size={18} />
      <input
        type="search"
        placeholder="Buscar noticias, temas, fuentes…"
        aria-label="Buscar noticias"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </form>
  );
}

const THEMES: { id: Theme; label: string; icon: IconName }[] = [
  { id: 'system', label: 'Tema del sistema', icon: 'auto' },
  { id: 'dark', label: 'Tema oscuro', icon: 'moon' },
  { id: 'light', label: 'Tema claro', icon: 'sun' },
];

export function ThemeSwitcher() {
  const theme = useUI((s) => s.theme);
  const setTheme = useUI((s) => s.setTheme);
  const toast = useUI((s) => s.toast);
  const index = THEMES.findIndex((t) => t.id === theme);
  const current = THEMES[index];
  const next = THEMES[(index + 1) % THEMES.length];
  return (
    <button
      type="button"
      className="icon-btn theme-switch"
      aria-label={`${current.label}. Cambiar a ${next.label.toLowerCase()}`}
      title={current.label}
      onClick={() => {
        setTheme(next.id);
        toast(next.label, { icon: next.icon, duration: 1800 });
      }}
    >
      <span key={current.id} className="theme-switch__icon">
        <Icon name={current.icon} />
      </span>
    </button>
  );
}

export function NotificationCenter() {
  const notifications = useUI((s) => s.notifications);
  const markAllRead = useUI((s) => s.markAllRead);
  const clear = useUI((s) => s.clearNotifications);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
      markAllRead();
    };
  }, [open, markAllRead]);

  return (
    <div className="notif" ref={root}>
      <button
        type="button"
        className="icon-btn"
        aria-label={unread ? `Notificaciones, ${unread} sin leer` : 'Notificaciones'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="bell" />
        {unread > 0 && <span className="notif__badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="notif__panel glass" role="dialog" aria-label="Notificaciones">
          <header className="notif__head">
            <h2>Notificaciones</h2>
            {notifications.length > 0 && (
              <button type="button" className="link-btn" onClick={clear}>
                Borrar todo
              </button>
            )}
          </header>
          {notifications.length === 0 ? (
            <p className="notif__empty">
              Aún no hay nada. Aquí verás la última hora de los lugares que explores.
            </p>
          ) : (
            <ul className="notif__list">
              {notifications.map((n) => (
                <li key={n.id}>
                  <Link to={n.href} viewTransition className="notif__item" data-unread={n.read ? undefined : ''} onClick={() => setOpen(false)}>
                    <span className="notif__title">{n.title}</span>
                    <span className="notif__body">{n.body}</span>
                    <span className="notif__time">{timeAgo(n.time)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Orbe acompañante: cuando el globo sale de pantalla, una miniatura viva del planeta (copiada del
 * canvas principal) lo sustituye en la barra. Muestra el lugar del titular bajo el cursor y
 * devuelve al globo al pulsarlo.
 */
function Orb() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const home = useHomeActive();
  const heroVisible = useScene((s) => s.heroVisible);
  const spot = useScene((s) => s.spot);
  const show = home && !heroVisible;

  useEffect(() => {
    mirror.target = canvas.current;
    return () => {
      mirror.target = null;
      mirror.live = false;
    };
  }, []);

  useEffect(() => {
    mirror.live = show;
  }, [show]);

  return (
    <div className="orb" data-show={show ? '' : undefined}>
      <button
        type="button"
        className="orb__button"
        aria-label="Volver al globo"
        tabIndex={show ? 0 : -1}
        aria-hidden={!show}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <canvas ref={canvas} width={96} height={96} />
      </button>
      {show && spot && (
        <span className="orb__label glass" key={spot.id}>
          <Flag code={spot.country} size="sm" />
          {spot.label}
        </span>
      )}
    </div>
  );
}

export function Topbar() {
  // la barra vive en el layout: los parámetros del lugar están en la ruta hija
  const matches = useMatches();
  const place = placeFromParams(matches[matches.length - 1]?.params ?? {}) ?? WORLD;
  const openPicker = usePicker((s) => s.setOpen);
  return (
    <header className="topbar glass">
      <div className="topbar__logo">
        <Logo />
      </div>
      <SearchBox />
      <div className="topbar__actions">
        <Orb />
        <button type="button" className="place-btn" onClick={() => openPicker(true)} aria-label={`Lugar: ${place.name}. Cambiar`}>
          {place.country ? <Flag code={place.country} size="sm" /> : <Icon name="globe" size={18} />}
          <span className="place-btn__name">{place.name}</span>
          <Icon name="chevron-down" size={16} />
        </button>
        <NotificationCenter />
        <ThemeSwitcher />
      </div>
    </header>
  );
}

export function Toaster() {
  const toasts = useUI((s) => s.toasts);
  const dismiss = useUI((s) => s.dismissToast);

  useEffect(() => {
    const timers = toasts
      .filter((t) => t.duration > 0)
      .map((t) => window.setTimeout(() => dismiss(t.id), t.duration));
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismiss]);

  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast glass">
          {t.icon && <Icon name={t.icon as IconName} size={18} />}
          <span>{t.message}</span>
          {t.action && (
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                t.action!.run();
                dismiss(t.id);
              }}
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
