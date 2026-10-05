import { geoDistance, geoInterpolate } from 'd3-geo';
import { Vector3 } from 'three';
import type { Country } from '../lib/geo';

const RAD = Math.PI / 180;

// Coincide con el mapeo UV de SphereGeometry: lon 0 mira hacia +X y el norte hacia +Y.
export function lonLatToVec3(lon: number, lat: number, radius = 1, target = new Vector3()): Vector3 {
  const phi = lat * RAD;
  const lambda = lon * RAD;
  return target.set(
    radius * Math.cos(phi) * Math.cos(lambda),
    radius * Math.sin(phi),
    -radius * Math.cos(phi) * Math.sin(lambda),
  );
}

export function vec3ToLonLat(v: Vector3): [number, number] {
  const n = v.clone().normalize();
  return [Math.atan2(-n.z, n.x) / RAD, Math.asin(n.y) / RAD];
}

/** Contornos del país como polilíneas 3D, densificando los tramos largos para que sigan la curvatura. */
export function countryRings(country: Country, radius: number): Vector3[][] {
  const g = country.feature.geometry;
  const polygons = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  return polygons.map(([outer]) => {
    const points: Vector3[] = [];
    for (let i = 0; i < outer.length - 1; i++) {
      const a = outer[i] as [number, number];
      const b = outer[i + 1] as [number, number];
      const steps = Math.max(1, Math.ceil(geoDistance(a, b) / (2 * RAD)));
      const lerp = geoInterpolate(a, b);
      for (let s = 0; s < steps; s++) {
        const [lon, lat] = lerp(s / steps);
        points.push(lonLatToVec3(lon, lat, radius));
      }
    }
    points.push(points[0].clone());
    return points;
  });
}
