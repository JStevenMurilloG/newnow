import { Canvas } from '@react-three/fiber';
import { geoDistance } from 'd3-geo';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Flag } from '../components/Flag';
import { Icon } from '../components/Icon';
import { useIsMobile, useMediaQuery, useReducedMotion } from '../hooks/useMediaQuery';
import { placeCountries, placeFocus, placeKey, WORLD_DISTANCE, type Country } from '../lib/geo';
import type { Hotspot } from '../lib/hotspots';
import type { Place } from '../lib/types';
import { useScene } from '../store/scene';
import { CameraRig, type GlobeApi } from './CameraRig';
import { lonLatToVec3 } from './pick';
import { ActiveSpot, Atmosphere, CityPoints, Earth, Highlight, HoverOutline, MirrorFeed, Pulses, type Spot } from './scene';
import type { GlobeTheme } from './textures';

interface Props {
  place: Place;
  hotspots: Hotspot[];
  theme: GlobeTheme;
  onSelect: (country: Country) => void;
}

const START = lonLatToVec3(-58, 14, WORLD_DISTANCE).toArray();
/** radio (en radianes) alrededor de un indicador en el que el cursor lo «toca» */
const NEAR = (2.6 * Math.PI) / 180;
/** tiempo que el globo sigue dibujando fuera de pantalla tras un cambio, para que el orbe lo refleje */
const SETTLE_MS = 1700;

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export default function Globe({ place, hotspots, theme, onSelect }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const api = useRef<GlobeApi | null>(null);
  const tipTimer = useRef(0);

  const [hover, setHover] = useState<Country | null>(null);
  const [near, setNear] = useState<Hotspot | null>(null);
  const [active, setActive] = useState(false);
  const [touched, setTouched] = useState(false);
  const [visible, setVisible] = useState(true);
  const [settling, setSettling] = useState(false);
  const webgl = useMemo(hasWebGL, []);

  const mobile = useIsMobile();
  const coarse = useMediaQuery('(pointer: coarse)');
  const reduced = useReducedMotion();
  const size = mobile ? 2048 : 4096;

  const spot = useScene((s) => s.spot);
  const setSpot = useScene((s) => s.setSpot);
  const heroVisible = useScene((s) => s.heroVisible);

  const key = placeKey(place);
  const focus = useMemo(() => placeFocus(place), [place]);
  const selected = useMemo(() => placeCountries(place), [place]);

  const spots = useMemo<Spot[]>(() => {
    const list: Spot[] = hotspots.map((h) => ({
      id: h.id,
      lon: h.lon,
      lat: h.lat,
      size: 0.03 + Math.min(h.count, 6) * 0.006,
    }));
    if (focus && place.kind !== 'region') {
      list.push({ id: `focus:${key}`, lon: focus.lon, lat: focus.lat, size: place.kind === 'city' ? 0.05 : 0.1 });
    }
    return list;
  }, [hotspots, focus, place.kind, key]);

  // el render se detiene cuando el globo sale de pantalla…
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '80px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // …salvo un momento tras cambiar de lugar o al aparecer el orbe, que copia sus fotogramas
  useEffect(() => {
    setSettling(true);
    const id = window.setTimeout(() => setSettling(false), SETTLE_MS);
    return () => clearTimeout(id);
  }, [key, heroVisible]);

  useEffect(() => () => clearTimeout(tipTimer.current), []);

  const moveTip = (event: { clientX: number; clientY: number }) => {
    const rect = wrap.current?.getBoundingClientRect();
    if (!rect || !tip.current) return;
    tip.current.style.transform = `translate(${event.clientX - rect.left}px, ${event.clientY - rect.top}px)`;
  };

  const onHover = useCallback(
    (country: Country | null, event: PointerEvent | MouseEvent, lonLat: [number, number] | null) => {
      if ((event as PointerEvent).pointerType === 'touch') return;
      const closest =
        (lonLat && hotspots.find((h) => geoDistance(lonLat, [h.lon, h.lat]) < NEAR)) || null;
      if (country || closest) moveTip(event);
      setHover(country);
      setNear(closest);
      setSpot(closest); // enciende también los titulares de ese lugar en el feed
    },
    [hotspots, setSpot],
  );

  const onPick = useCallback(
    (country: Country, event: MouseEvent) => {
      setTouched(true);
      onSelect(country);
      if ((event as PointerEvent).pointerType === 'touch') {
        // en táctil no hay hover: la etiqueta aparece un momento donde se tocó
        moveTip(event);
        setHover(country);
        clearTimeout(tipTimer.current);
        tipTimer.current = window.setTimeout(() => setHover(null), 1600);
      }
    },
    [onSelect],
  );

  if (!webgl) {
    return (
      <div className="globe globe--fallback" role="img" aria-label="Planeta Tierra">
        <div className="globe__poster" />
        <p className="globe__nogl">Tu navegador no admite gráficos 3D. Usa el selector de países para explorar.</p>
      </div>
    );
  }

  return (
    <div
      ref={wrap}
      className="globe"
      data-hover={hover ? '' : undefined}
      onPointerDown={() => setActive(true)}
      onPointerLeave={() => {
        setActive(false);
        if (!coarse) {
          setHover(null);
          setNear(null);
          setSpot(null);
        }
      }}
    >
      <Canvas
        flat
        dpr={[1, 2]}
        frameloop={visible || settling || spot ? 'always' : 'never'}
        camera={{ fov: 38, near: 0.1, far: 20, position: START }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        aria-label="Globo terráqueo interactivo. Arrastra para girar y selecciona un país para ver sus noticias."
        role="application"
      >
        <Atmosphere theme={theme} />
        <Earth theme={theme} size={size} onHover={onHover} onPick={onPick} />
        <Highlight countries={selected} theme={theme} size={size} />
        {hover && !selected.includes(hover) && <HoverOutline country={hover} theme={theme} />}
        <CityPoints theme={theme} />
        <Pulses spots={spots} theme={theme} still={reduced} />
        {spot && <ActiveSpot lon={spot.lon} lat={spot.lat} theme={theme} still={reduced} />}
        <CameraRig
          focus={focus}
          focusKey={key}
          reduced={reduced}
          zoomEnabled={active || coarse}
          api={api}
          onInteract={() => setTouched(true)}
        />
        <MirrorFeed />
      </Canvas>

      <div ref={tip} className="globe__tip-anchor" aria-hidden="true">
        {near ? (
          <div className="globe__tip globe__tip--story glass" key={near.id}>
            <span className="globe__tip-place">
              <Flag code={near.country} size="sm" />
              {near.label}
              <small>
                {near.count} {near.count === 1 ? 'titular' : 'titulares'}
              </small>
            </span>
            <span className="globe__tip-headline">{near.headline}</span>
          </div>
        ) : (
          hover && (
            <div className="globe__tip glass" key={hover.code}>
              <Flag code={hover.code} />
              {hover.name}
            </div>
          )
        )}
      </div>

      <div className="globe__zoom">
        <button type="button" className="icon-btn icon-btn--sm glass" aria-label="Acercar" onClick={() => api.current?.zoom(0.78)}>
          <Icon name="plus" />
        </button>
        <button type="button" className="icon-btn icon-btn--sm glass" aria-label="Alejar" onClick={() => api.current?.zoom(1.28)}>
          <Icon name="minus" />
        </button>
      </div>

      <p className="globe__hint" data-hidden={touched ? '' : undefined}>
        {coarse ? 'Desliza para girar · toca un país' : 'Arrastra para girar · haz clic en un país'}
      </p>
    </div>
  );
}
