/**
 * Centralized Geospatial Projection Utility
 * Project: Riveras de Pucheta (La Caldera, Salta, Argentina)
 *
 * Converts between geographic WGS84 coordinates (longitude, latitude)
 * and local metric Cartesian coordinates (X, Z) used by the Three.js WebGL scene.
 */

// Official reference anchor for Riveras de Pucheta (aligned with doc.kml)
export const CENTER_LAT = -24.5875;
export const CENTER_LON = -65.3775;

// Geodetic scaling constants (WGS84 approximation for La Caldera, Salta)
export const LAT_TO_METERS = 111000;
export const LON_TO_METERS = 111000 * Math.cos((CENTER_LAT * Math.PI) / 180);

// Catastral surveyor rotation angle (-20.9° in radians)
export const SURVEYOR_ROTATION_RAD = -0.364;

export interface LocalPoint2D {
  x: number;
  z: number;
}

export interface GeoPoint2D {
  lon: number;
  lat: number;
}

export interface BoundingBox2D {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  width: number;
  depth: number;
}

/**
 * Converts WGS84 (longitude, latitude) into local Three.js (x, z) coordinates in meters.
 * In Three.js:
 *   +X is East
 *   -Z is North (hence the inverted sign for latitude)
 */
export function gpsToLocal(lon: number, lat: number): LocalPoint2D {
  const x = Math.round((lon - CENTER_LON) * LON_TO_METERS * 100) / 100;
  const z = Math.round(-(lat - CENTER_LAT) * LAT_TO_METERS * 100) / 100;
  return { x, z };
}

/**
 * Converts local Three.js (x, z) in meters back to WGS84 (longitude, latitude).
 */
export function localToGps(x: number, z: number): GeoPoint2D {
  const lon = CENTER_LON + x / LON_TO_METERS;
  const lat = CENTER_LAT - z / LAT_TO_METERS;
  return { lon, lat };
}

/**
 * Converts an array of geographic vertices (either [lon, lat] tuples or {lon, lat} objects)
 * into an array of local metric 2D points [{x, z}, ...].
 */
export function convertGeoVerticesToLocal(
  vertices: Array<[number, number] | { lon: number; lat: number }>
): LocalPoint2D[] {
  return vertices.map((v) => {
    if (Array.isArray(v)) {
      return gpsToLocal(v[0], v[1]);
    }
    return gpsToLocal(v.lon, v.lat);
  });
}

/**
 * Calculates the geometric centroid of a 2D polygon.
 * If the polygon has a duplicate closing point (last === first), it is excluded from the average.
 */
export function calculatePolygonCenter(points: LocalPoint2D[]): LocalPoint2D {
  if (!points || points.length === 0) {
    return { x: 0, z: 0 };
  }

  // Work with unique ring points
  let pts = points;
  if (
    pts.length > 2 &&
    Math.abs(pts[0].x - pts[pts.length - 1].x) < 1e-6 &&
    Math.abs(pts[0].z - pts[pts.length - 1].z) < 1e-6
  ) {
    pts = pts.slice(0, -1);
  }

  const n = pts.length;
  if (n === 0) return { x: 0, z: 0 };

  // For polygons with 3+ points, calculate signed area centroid if area > 0
  if (n >= 3) {
    let signedArea = 0;
    let cx = 0;
    let cz = 0;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const factor = pts[i].x * pts[j].z - pts[j].x * pts[i].z;
      signedArea += factor;
      cx += (pts[i].x + pts[j].x) * factor;
      cz += (pts[i].z + pts[j].z) * factor;
    }
    signedArea *= 0.5;

    if (Math.abs(signedArea) > 1e-4) {
      return {
        x: Math.round((cx / (6 * signedArea)) * 100) / 100,
        z: Math.round((cz / (6 * signedArea)) * 100) / 100
      };
    }
  }

  // Fallback to arithmetic mean of vertices
  let sumX = 0;
  let sumZ = 0;
  for (let i = 0; i < n; i++) {
    sumX += pts[i].x;
    sumZ += pts[i].z;
  }
  return {
    x: Math.round((sumX / n) * 100) / 100,
    z: Math.round((sumZ / n) * 100) / 100
  };
}

/**
 * Calculates the axis-aligned bounding box (AABB) of local 2D points.
 */
export function calculateBoundingBox(points: LocalPoint2D[]): BoundingBox2D {
  if (!points || points.length === 0) {
    return { minX: 0, maxX: 0, minZ: 0, maxZ: 0, width: 0, depth: 0 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const pt of points) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.z < minZ) minZ = pt.z;
    if (pt.z > maxZ) maxZ = pt.z;
  }

  const width = Math.round((maxX - minX) * 100) / 100;
  const depth = Math.round((maxZ - minZ) * 100) / 100;

  return { minX, maxX, minZ, maxZ, width, depth };
}

/**
 * Calculates the principal orientation angle (radians) of a polygon.
 * Analyzes the longest boundary segment to detect the frontage/depth direction,
 * falling back to the project's official surveyor rotation (-20.9°).
 */
export function calculatePrincipalOrientation(points: LocalPoint2D[]): number {
  if (!points || points.length < 2) {
    return SURVEYOR_ROTATION_RAD;
  }

  // Remove duplicate closing point if present
  let pts = points;
  if (
    pts.length > 2 &&
    Math.abs(pts[0].x - pts[pts.length - 1].x) < 1e-6 &&
    Math.abs(pts[0].z - pts[pts.length - 1].z) < 1e-6
  ) {
    pts = pts.slice(0, -1);
  }

  let maxLenSq = -1;
  let bestAngle = SURVEYOR_ROTATION_RAD;

  for (let i = 0; i < pts.length; i++) {
    const next = pts[(i + 1) % pts.length];
    const dx = next.x - pts[i].x;
    const dz = next.z - pts[i].z;
    const lenSq = dx * dx + dz * dz;

    if (lenSq > maxLenSq && lenSq > 1e-3) {
      maxLenSq = lenSq;
      // Angle relative to X axis in local coordinates
      bestAngle = Math.atan2(dz, dx);
    }
  }

  return bestAngle;
}

/**
 * Calculates the 2D polygon area using the Shoelace formula (in square meters).
 */
export function calculatePolygonArea(points: LocalPoint2D[]): number {
  if (!points || points.length < 3) return 0;

  let pts = points;
  if (
    pts.length > 2 &&
    Math.abs(pts[0].x - pts[pts.length - 1].x) < 1e-6 &&
    Math.abs(pts[0].z - pts[pts.length - 1].z) < 1e-6
  ) {
    pts = pts.slice(0, -1);
  }

  let area = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += pts[i].x * pts[j].z - pts[j].x * pts[i].z;
  }
  return Math.abs(area) * 0.5;
}

/**
 * Calculates the 2D polygon perimeter in meters.
 */
export function calculatePolygonPerimeter(points: LocalPoint2D[]): number {
  if (!points || points.length < 2) return 0;

  let pts = points;
  if (
    pts.length > 2 &&
    Math.abs(pts[0].x - pts[pts.length - 1].x) < 1e-6 &&
    Math.abs(pts[0].z - pts[pts.length - 1].z) < 1e-6
  ) {
    pts = pts.slice(0, -1);
  }

  let perimeter = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const dx = pts[j].x - pts[i].x;
    const dz = pts[j].z - pts[i].z;
    perimeter += Math.sqrt(dx * dx + dz * dz);
  }
  return Math.round(perimeter * 100) / 100;
}
