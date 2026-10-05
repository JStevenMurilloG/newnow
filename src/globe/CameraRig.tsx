import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import { Quaternion, Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { WORLD_DISTANCE, type Focus } from '../lib/geo';
import { lonLatToVec3, vec3ToLonLat } from './pick';

export interface GlobeApi {
  zoom: (factor: number) => void;
}

interface Flight {
  from: Vector3;
  rotation: Quaternion;
  angle: number;
  fromDistance: number;
  toDistance: number;
  duration: number;
  t: number;
}

interface Props {
  focus: Focus | null;
  focusKey: string;
  reduced: boolean;
  zoomEnabled: boolean;
  api: MutableRefObject<GlobeApi | null>;
  onInteract: () => void;
}

const MIN = 1.4;
const MAX = 4.8;
const IDLE_MS = 4000;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const identity = new Quaternion();
const q = new Quaternion();

export function CameraRig({ focus, focusKey, reduced, zoomEnabled, api, onInteract }: Props) {
  const controls = useRef<OrbitControlsImpl>(null);
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / s.size.height);
  // en lienzos verticales el planeta se aleja para caber a lo ancho
  const fit = Math.max(1, 1 / aspect);

  const flight = useRef<Flight | null>(null);
  const dragging = useRef(false);
  const idleSince = useRef(performance.now());

  const fly = useCallback(
    (to: Vector3, toDistance: number, duration = 1.25) => {
      const from = camera.position.clone().normalize();
      flight.current = {
        from,
        rotation: new Quaternion().setFromUnitVectors(from, to),
        angle: from.angleTo(to),
        fromDistance: camera.position.length(),
        toDistance,
        duration,
        t: reduced ? 1 : 0,
      };
    },
    [camera, reduced],
  );

  useEffect(() => {
    if (focus) {
      fly(lonLatToVec3(focus.lon, focus.lat), focus.distance * fit);
    } else {
      const [lon, lat] = vec3ToLonLat(camera.position);
      fly(lonLatToVec3(lon, clamp(lat, -15, 22)), WORLD_DISTANCE * fit);
    }
  }, [focusKey, fit]);

  useEffect(() => {
    api.current = {
      zoom: (factor) =>
        fly(camera.position.clone().normalize(), clamp(camera.position.length() * factor, MIN, MAX * fit), 0.45),
    };
    return () => {
      api.current = null;
    };
  }, [api, camera, fit, fly]);

  // drei actualiza los controles antes (prioridad -1); aquí solo se mueve la cámara durante un vuelo
  useFrame((_, dt) => {
    const c = controls.current;
    const f = flight.current;
    if (f) {
      // al reanudar el render tras estar fuera de pantalla, dt puede llegar inflado
      f.t = Math.min(1, f.t + Math.min(dt, 0.05) / f.duration);
      const e = ease(f.t);
      const distance =
        f.fromDistance + (f.toDistance - f.fromDistance) * e + Math.sin(Math.PI * e) * f.angle * 0.28;
      camera.position
        .copy(f.from)
        .applyQuaternion(q.copy(identity).slerp(f.rotation, e))
        .multiplyScalar(distance);
      camera.lookAt(0, 0, 0);
      if (f.t >= 1) {
        flight.current = null;
        idleSince.current = performance.now();
      }
    }
    if (!c) return;
    c.rotateSpeed = 0.17 * (camera.position.length() - 0.85);
    c.autoRotate =
      !reduced && !focus && !f && !dragging.current && performance.now() - idleSince.current > IDLE_MS;
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableZoom={zoomEnabled}
      enableDamping
      dampingFactor={0.08}
      zoomSpeed={0.6}
      autoRotateSpeed={0.3}
      minDistance={MIN}
      maxDistance={MAX * fit}
      minPolarAngle={0.25}
      maxPolarAngle={Math.PI - 0.25}
      onStart={() => {
        dragging.current = true;
        flight.current = null;
        onInteract();
      }}
      onEnd={() => {
        dragging.current = false;
        idleSince.current = performance.now();
      }}
    />
  );
}
