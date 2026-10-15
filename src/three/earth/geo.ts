/**
 * Georeferencing for the Earth → Bergen story (see public/assets/geo/geo.json).
 *
 * World frame: a local east/up/south frame with its origin on the sphere surface at the
 * centre of the 36 km Bergen square. Units are kilometres. +X = east, +Y = up, −Z = north.
 * The globe is a sphere of radius R centred at (0, −R, 0) and rotated so that three's
 * SphereGeometry UVs (plate carrée) land on the right longitudes/latitudes.
 */
import * as THREE from "three";

export const R = 6371;
const D2R = Math.PI / 180;

/** Centre of the Bergen Sentinel-2 / DEM square (EPSG:32632, 36 km). */
export const ORIGIN = { lat: 60.380007, lon: 5.300064 };

/** Unit vector on the sphere in three's globe convention (lon 0 → +X, 90E → −Z). */
export function dirOf(lat: number, lon: number, out = new THREE.Vector3()) {
  const la = lat * D2R;
  const lo = lon * D2R;
  return out.set(Math.cos(la) * Math.cos(lo), Math.sin(la), -Math.cos(la) * Math.sin(lo));
}
function eastOf(lon: number, out = new THREE.Vector3()) {
  const lo = lon * D2R;
  return out.set(-Math.sin(lo), 0, -Math.cos(lo));
}
function northOf(lat: number, lon: number, out = new THREE.Vector3()) {
  const la = lat * D2R;
  const lo = lon * D2R;
  return out.set(-Math.sin(la) * Math.cos(lo), Math.cos(la), Math.sin(la) * Math.sin(lo));
}

// Globe (geocentric) → local frame: rows are east, up, −north at the origin.
const E0 = eastOf(ORIGIN.lon);
const U0 = dirOf(ORIGIN.lat, ORIGIN.lon);
const N0 = northOf(ORIGIN.lat, ORIGIN.lon);
/** Rotation that maps geocentric directions into the local frame. */
export const GLOBE_ROTATION = new THREE.Matrix4().makeBasis(E0, U0, N0.clone().negate()).transpose();
export const GLOBE_QUATERNION = new THREE.Quaternion().setFromRotationMatrix(GLOBE_ROTATION);
export const GLOBE_CENTRE = new THREE.Vector3(0, -R, 0);

/** Local position of a point at (lat, lon) and height h (km) above the sphere. */
export function toLocal(lat: number, lon: number, h = 0, out = new THREE.Vector3()) {
  return dirOf(lat, lon, out)
    .multiplyScalar(R + h)
    .applyMatrix4(GLOBE_ROTATION)
    .add(GLOBE_CENTRE);
}

/** Local east / north / up unit vectors at (lat, lon). */
export function basisAt(lat: number, lon: number, e: THREE.Vector3, n: THREE.Vector3, u: THREE.Vector3) {
  eastOf(lon, e).applyMatrix4(GLOBE_ROTATION);
  northOf(lat, lon, n).applyMatrix4(GLOBE_ROTATION);
  dirOf(lat, lon, u).applyMatrix4(GLOBE_ROTATION);
}

type Corners = { nw: [number, number]; ne: [number, number]; sw: [number, number] };

/** An image square draped in the local frame: origin = SW corner, axes along image right / image up. */
export type Square = {
  size: number;
  origin: THREE.Vector3;
  right: THREE.Vector3;
  up: THREE.Vector3;
};

function square(c: Corners, size: number): Square {
  const nw = toLocal(c.nw[1], c.nw[0]);
  const ne = toLocal(c.ne[1], c.ne[0]);
  const sw = toLocal(c.sw[1], c.sw[0]);
  const right = ne.clone().sub(nw).setY(0).normalize();
  const up = nw.clone().sub(sw).setY(0).normalize();
  return { size, origin: sw.setY(0), right, up };
}

/** 36 km Sentinel-2 + DEM square (corners from geo.json). */
export const BERGEN: Square = square({ nw: [4.954361, 60.531758], ne: [5.609141, 60.550009], sw: [4.994194, 60.20932] }, 36);
/** 6 km detail square around Laksevåg. */
export const DETAIL: Square = square({ nw: [5.23264, 60.410383], ne: [5.341338, 60.413417], sw: [5.238852, 60.356627] }, 6);

/** Local horizontal position (y = 0) of square UV (u right, v up). */
export function squarePoint(s: Square, u: number, v: number, out = new THREE.Vector3()) {
  return out
    .copy(s.origin)
    .addScaledVector(s.right, u * s.size)
    .addScaledVector(s.up, v * s.size);
}

/** Drop of the sphere below the tangent plane at horizontal distance d (km). */
export const curvatureDrop = (x: number, z: number) => -(x * x + z * z) / (2 * R);

/** Western Norway BMNG 500 m crop (plate carrée). */
export const REGION = { lonMin: 0.5, lonMax: 10.5, latMin: 57.4, latMax: 63.4 };
