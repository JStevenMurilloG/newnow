import { Line } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { CITIES } from '../data/cities';
import { findCountryAt, type Country } from '../lib/geo';
import { mirror } from './mirror';
import { countryRings, lonLatToVec3, vec3ToLonLat } from './pick';
import { paintDot, paintEarth, paintHighlight, type GlobeTheme } from './textures';

const COLORS = {
  dark: { rim: '#5b8dff', rimMix: 0.55, shade: 0.5, glowA: '#3d7bff', glowB: '#8b5cf6', glow: 0.85, city: '#d6e4ff', pulse: '#8ab6ff', active: '#ffffff', line: '#e2ecff', hover: '#9db9ff' },
  light: { rim: '#7ea0ff', rimMix: 0.45, shade: 0.22, glowA: '#3d7bff', glowB: '#8b5cf6', glow: 0.55, city: '#1f5eff', pulse: '#1f5eff', active: '#6d3df0', line: '#1238b8', hover: '#3d6df0' },
};

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vN;
  void main() {
    vUv = uv;
    vN = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// La luz vive en espacio de cámara: el planeta siempre se ve iluminado desde arriba a la izquierda.
const EARTH_FRAGMENT = /* glsl */ `
  uniform sampler2D map;
  uniform vec3 rim;
  uniform float rimMix;
  uniform float shade;
  varying vec2 vUv;
  varying vec3 vN;
  void main() {
    vec3 c = texture2D(map, vUv).rgb;
    float d = clamp(dot(vN, normalize(vec3(-0.45, 0.55, 0.7))), 0.0, 1.0);
    c *= (1.0 - shade) + shade * 1.3 * d;
    float f = pow(1.0 - clamp(vN.z, 0.0, 1.0), 2.6);
    gl_FragColor = vec4(mix(c, rim, f * rimMix), 1.0);
  }
`;

const ATMOSPHERE_FRAGMENT = /* glsl */ `
  uniform vec3 colorA;
  uniform vec3 colorB;
  uniform float strength;
  varying vec3 vN;
  void main() {
    // cara trasera: -vN.z vale 0 en el borde exterior y crece hacia el limbo del planeta
    float i = pow(smoothstep(0.0, 0.56, -vN.z), 1.9);
    vec3 c = mix(colorA, colorB, smoothstep(-0.7, 0.7, vN.x - vN.y * 0.5));
    gl_FragColor = vec4(c, i * strength);
  }
`;

interface EarthProps {
  theme: GlobeTheme;
  size: number;
  onHover: (country: Country | null, event: PointerEvent | MouseEvent, lonLat: [number, number] | null) => void;
  onPick: (country: Country, event: MouseEvent) => void;
}

export function Earth({ theme, size, onHover, onPick }: EarthProps) {
  const material = useMemo(() => {
    const map = new THREE.CanvasTexture(paintEarth(theme, size));
    map.anisotropy = 8;
    const c = COLORS[theme];
    return new THREE.ShaderMaterial({
      uniforms: {
        map: { value: map },
        rim: { value: new THREE.Color(c.rim) },
        rimMix: { value: c.rimMix },
        shade: { value: c.shade },
      },
      vertexShader: VERTEX,
      fragmentShader: EARTH_FRAGMENT,
    });
  }, [theme, size]);

  useEffect(
    () => () => {
      material.uniforms.map.value.dispose();
      material.dispose();
    },
    [material],
  );

  const move = (e: ThreeEvent<PointerEvent>) => {
    if (e.buttons) return; // arrastrando
    const lonLat = vec3ToLonLat(e.point);
    onHover(findCountryAt(...lonLat), e.nativeEvent, lonLat);
  };

  const click = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return; // fue un arrastre, no un toque
    const country = findCountryAt(...vec3ToLonLat(e.point));
    if (country) onPick(country, e.nativeEvent);
  };

  return (
    <mesh material={material} onPointerMove={move} onPointerOut={(e) => onHover(null, e.nativeEvent, null)} onClick={click}>
      <sphereGeometry args={[1, 96, 96]} />
    </mesh>
  );
}

export function Atmosphere({ theme }: { theme: GlobeTheme }) {
  const material = useMemo(() => {
    const c = COLORS[theme];
    return new THREE.ShaderMaterial({
      uniforms: {
        colorA: { value: new THREE.Color(c.glowA) },
        colorB: { value: new THREE.Color(c.glowB) },
        strength: { value: c.glow },
      },
      vertexShader: VERTEX,
      fragmentShader: ATMOSPHERE_FRAGMENT,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
  }, [theme]);
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh material={material}>
      <sphereGeometry args={[1.17, 64, 64]} />
    </mesh>
  );
}

/** Relleno + halo (textura) y contorno nítido (líneas) del lugar seleccionado, con fundido al cambiar. */
export function Highlight({ countries, theme, size }: { countries: Country[]; theme: GlobeTheme; size: number }) {
  const { canvas, texture } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size / 2;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return { canvas, texture };
  }, [size]);
  useEffect(() => () => texture.dispose(), [texture]);

  const [shown, setShown] = useState<Country[]>([]);
  const target = useRef({ countries, theme, texture });
  target.current = { countries, theme, texture };
  const state = useRef({ painted: null as unknown, key: '', opacity: 0 });
  const fill = useRef<THREE.MeshBasicMaterial>(null);
  const lines = useRef<THREE.Group>(null);

  useFrame(({ clock }, dt) => {
    const s = state.current;
    const t = target.current;
    const key = `${t.theme}|${t.countries.map((c) => c.code).join(',')}`;
    if (s.key !== key || s.painted !== t.texture) {
      s.opacity = Math.max(0, s.opacity - dt * 5);
      if (s.opacity === 0) {
        paintHighlight(canvas, t.countries, t.theme);
        t.texture.needsUpdate = true;
        s.key = key;
        s.painted = t.texture;
        setShown(t.countries);
      }
    } else if (t.countries.length > 0 && s.opacity < 1) {
      s.opacity = Math.min(1, s.opacity + dt * 2.2);
    }
    if (fill.current) fill.current.opacity = s.opacity * (0.88 + 0.12 * Math.sin(clock.elapsedTime * 2.2));
    lines.current?.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | undefined;
      if (m) m.opacity = s.opacity;
    });
  });

  const rings = useMemo(() => (shown.length === 1 ? countryRings(shown[0], 1.004) : []), [shown]);

  return (
    <>
      <mesh raycast={() => null}>
        <sphereGeometry args={[1.002, 96, 96]} />
        <meshBasicMaterial ref={fill} map={texture} transparent opacity={0} depthWrite={false} />
      </mesh>
      <group ref={lines}>
        {rings.map((points, i) => (
          <Line key={`${shown[0].code}-${i}`} points={points} color={COLORS[theme].line} lineWidth={1.5} transparent depthWrite={false} />
        ))}
      </group>
    </>
  );
}

/** Contorno tenue del país bajo el cursor. */
export function HoverOutline({ country, theme }: { country: Country; theme: GlobeTheme }) {
  const rings = useMemo(() => countryRings(country, 1.003), [country]);
  return (
    <>
      {rings.map((points, i) => (
        <Line key={i} points={points} color={COLORS[theme].hover} lineWidth={1} transparent opacity={0.8} depthWrite={false} />
      ))}
    </>
  );
}

export function CityPoints({ theme }: { theme: GlobeTheme }) {
  const { geometry, map } = useMemo(() => {
    const positions = new Float32Array(CITIES.length * 3);
    const v = new THREE.Vector3();
    CITIES.forEach((c, i) => lonLatToVec3(c.lon, c.lat, 1.006, v).toArray(positions, i * 3));
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return { geometry, map: new THREE.CanvasTexture(paintDot()) };
  }, []);
  useEffect(
    () => () => {
      geometry.dispose();
      map.dispose();
    },
    [geometry, map],
  );
  return (
    <points geometry={geometry} raycast={() => null}>
      <pointsMaterial
        map={map}
        color={COLORS[theme].city}
        size={0.042}
        sizeAttenuation
        transparent
        depthWrite={false}
        blending={theme === 'dark' ? THREE.AdditiveBlending : THREE.NormalBlending}
      />
    </points>
  );
}

export interface Spot {
  id: string;
  lon: number;
  lat: number;
  /** radio máximo del anillo */
  size: number;
}

const Z = new THREE.Vector3(0, 0, 1);

/** Anillos que laten sobre los lugares con actividad informativa. */
export function Pulses({ spots, theme, still }: { spots: Spot[]; theme: GlobeTheme; still: boolean }) {
  const group = useRef<THREE.Group>(null);
  const placed = useMemo(
    () =>
      spots.map((s) => {
        const position = lonLatToVec3(s.lon, s.lat, 1.008);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(Z, position.clone().normalize());
        return { ...s, position, quaternion };
      }),
    [spots],
  );

  useFrame(({ clock }) => {
    group.current?.children.forEach((child, i) => {
      const ring = child.children[0] as THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
      const phase = still ? 0.6 : (clock.elapsedTime * 0.42 + i * 0.37) % 1;
      ring.scale.setScalar(ring.userData.size * (0.2 + 0.8 * phase));
      ring.material.opacity = (1 - phase) * 0.8;
    });
  });

  const color = COLORS[theme].pulse;
  return (
    <group ref={group}>
      {placed.map((s) => (
        <group key={s.id} position={s.position} quaternion={s.quaternion}>
          <mesh userData={{ size: s.size }} raycast={() => null}>
            <ringGeometry args={[0.84, 1, 48]} />
            <meshBasicMaterial color={color} transparent depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
          <mesh scale={0.0075} raycast={() => null}>
            <circleGeometry args={[1, 20]} />
            <meshBasicMaterial color={color} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** El lugar resaltado desde un titular: un doble anillo más brillante y rápido que los demás. */
export function ActiveSpot({ lon, lat, theme, still }: { lon: number; lat: number; theme: GlobeTheme; still: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { position, quaternion } = useMemo(() => {
    const position = lonLatToVec3(lon, lat, 1.012);
    return { position, quaternion: new THREE.Quaternion().setFromUnitVectors(Z, position.clone().normalize()) };
  }, [lon, lat]);

  useFrame(({ clock }) => {
    group.current?.children.forEach((child, i) => {
      if (i > 1) return;
      const ring = child as THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
      const phase = still ? 0.5 + i * 0.3 : (clock.elapsedTime * 0.9 + i * 0.5) % 1;
      ring.scale.setScalar(0.02 + 0.075 * phase);
      ring.material.opacity = 1 - phase;
    });
  });

  const color = COLORS[theme].active;
  return (
    <group ref={group} position={position} quaternion={quaternion}>
      {[0, 1].map((i) => (
        <mesh key={i} raycast={() => null}>
          <ringGeometry args={[0.8, 1, 48]} />
          <meshBasicMaterial color={color} transparent depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <mesh scale={0.013} raycast={() => null}>
        <circleGeometry args={[1, 24]} />
        <meshBasicMaterial color={color} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/**
 * Dibuja la escena y copia el fotograma al orbe de la barra superior. Con prioridad positiva
 * este componente asume el render: la copia tiene que ocurrir justo después, antes de que el
 * navegador vacíe el búfer de WebGL.
 */
export function MirrorFeed() {
  const frame = useRef(0);
  useFrame(({ gl, scene, camera }) => {
    gl.render(scene, camera);
    const target = mirror.target;
    if (!target || (!mirror.live && frame.current++ % 20 !== 0)) return;
    const ctx = target.getContext('2d');
    if (!ctx) return;
    const source = gl.domElement;
    // recorte cuadrado centrado, sin el margen vacío que rodea al planeta
    const side = Math.min(source.width, source.height) * 0.8;
    ctx.clearRect(0, 0, target.width, target.height);
    ctx.drawImage(source, (source.width - side) / 2, (source.height - side) / 2, side, side, 0, 0, target.width, target.height);
  }, 1);
  return null;
}
