import * as THREE from 'three';
import { Lote, LoteGeometry } from '../types';
import {
  convertGeoVerticesToLocal,
  calculatePolygonCenter,
  calculateBoundingBox,
  calculatePrincipalOrientation,
  SURVEYOR_ROTATION_RAD,
  LocalPoint2D
} from './geoProjection';
import { createLotBadgeTexture } from './proceduralTextures';

export { createLotBadgeTexture };

const REF_LON = -65.3775;
const REF_LAT = -24.5875;
const METROS_LON = 111000 * Math.cos(REF_LAT * (Math.PI / 180));
const METROS_LAT = 111000;

/**
 * Extrusión tipo maqueta arquitectónica con bisel (bevel)
 * y contorno de agrimensura nítido a 25° para delimitar pasajes y ochavas.
 */
export function buildPoligonoMasterplan(
  coordenadas: [number, number][],
  altura: number = 0.35
) {
  const shape = new THREE.Shape();

  coordenadas.forEach(([lon, lat], idx) => {
    const x = (lon - REF_LON) * METROS_LON;
    // Three.js ExtrudeGeometry extrudes shape (x, y) along +Z.
    // When rotateX(-Math.PI / 2) is applied: 3D X = shape.x, 3D Z = -shape.y.
    // To match local metric z = -(lat - REF_LAT) * METROS_LAT,
    // shape.y MUST be (lat - REF_LAT) * METROS_LAT so that 3D Z = -shape.y = -(lat - REF_LAT)*METROS_LAT.
    const y = (lat - REF_LAT) * METROS_LAT;

    if (idx === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });

  // Extrusión de maqueta con bordes catastrales exactos (sin bisel para evitar traslapes)
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: altura,
    bevelEnabled: false
  });

  // Orientar horizontalmente sobre el terreno
  geometry.rotateX(-Math.PI / 2);

  // Normalizar coordenadas UV para la cara superior del polígono (mapeo perfecto de textura de lote)
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox;
  if (bbox && geometry.groups.length > 0) {
    const minX = bbox.min.x;
    const maxX = bbox.max.x;
    const minZ = bbox.min.z;
    const maxZ = bbox.max.z;
    const spanX = Math.max(0.001, maxX - minX);
    const spanZ = Math.max(0.001, maxZ - minZ);

    const pos = geometry.attributes.position;
    const uvs = geometry.attributes.uv;
    const g0 = geometry.groups[0];
    if (g0 && pos && uvs) {
      for (let i = g0.start; i < g0.start + g0.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const u = (x - minX) / spanX;
        const v = (maxZ - z) / spanZ;
        uvs.setXY(i, u, v);
      }
      uvs.needsUpdate = true;
    }
  }

  // Contorno de agrimensura nítido
  const edgesGeometry = new THREE.EdgesGeometry(geometry, 25);

  // Mapeo de materiales para [sideMaterial, topMaterial]
  // Group 0 (tapas superior/inferior) -> materialIndex 1 (topMaterial)
  // Group 1 (costados extruidos y bisel) -> materialIndex 0 (sideMaterial)
  if (geometry.groups.length >= 2) {
    geometry.groups[0].materialIndex = 1;
    geometry.groups[1].materialIndex = 0;
  }

  return { geometry, edgesGeometry };
}

export interface LoteGeometryOptions {
  defaultHeight?: number;
  defaultWidth?: number;
  defaultDepth?: number;
}

export interface LoteGeometryResult {
  meshGeometry: THREE.BufferGeometry;
  outlineGeometry: THREE.BufferGeometry;
  center: { x: number; y: number; z: number };
  boundingBox: { width: number; height: number; depth: number };
  geometryType: 'Point' | 'Polygon';
  rotationY: number;
  isParametricFallback: boolean;
  error?: string;
}

/**
 * Validates and sanitizes polygon vertices:
 * - Strips duplicate closing vertex (if last === first)
 * - Strips consecutive duplicate vertices
 * - Ensures minimum of 3 unique vertices
 * - Preserves original vertex winding order
 */
export function sanitizePolygonVertices(rawPoints: LocalPoint2D[]): {
  valid: boolean;
  points: LocalPoint2D[];
  error?: string;
} {
  if (!rawPoints || rawPoints.length < 3) {
    return {
      valid: false,
      points: [],
      error: `Polygon has insufficient vertices (${rawPoints?.length || 0}). Minimum 3 required.`
    };
  }

  // Filter out consecutive duplicates (threshold 1mm = 0.001m)
  const deduped: LocalPoint2D[] = [];
  for (let i = 0; i < rawPoints.length; i++) {
    const cur = rawPoints[i];
    if (deduped.length === 0) {
      deduped.push(cur);
    } else {
      const prev = deduped[deduped.length - 1];
      const distSq = (cur.x - prev.x) ** 2 + (cur.z - prev.z) ** 2;
      if (distSq > 1e-6) {
        deduped.push(cur);
      }
    }
  }

  // Remove duplicate closing point if identical to first
  if (deduped.length > 2) {
    const first = deduped[0];
    const last = deduped[deduped.length - 1];
    const distSq = (first.x - last.x) ** 2 + (first.z - last.z) ** 2;
    if (distSq <= 1e-6) {
      deduped.pop();
    }
  }

  if (deduped.length < 3) {
    return {
      valid: false,
      points: deduped,
      error: `Polygon has fewer than 3 unique vertices after deduplication (${deduped.length}).`
    };
  }

  return {
    valid: true,
    points: deduped
  };
}

/**
 * Builds Three.js geometries for a lot.
 * Supports both Point (parametric fallback) and Polygon (real survey geometry).
 */
/**
 * Construye las geometrías de Three.js para un lote a partir de sus coordenadas geográficas
 * o fallback paramétrico métrico.
 * 
 * @param {Lote} lote - Datos catastrales del lote
 * @param {LoteGeometryOptions} [options] - Opciones de extrusión y dimensiones por defecto
 * @returns {LoteGeometryResult} Geometría de malla, bordes, centroide y caja envolvente
 */
export function buildLoteThreeGeometry(
  lote: Lote,
  options?: LoteGeometryOptions
): LoteGeometryResult {
  const lotHeight = options?.defaultHeight ?? 0.35;
  const defaultWidth = lote.width ?? options?.defaultWidth ?? 27.5;
  const defaultDepth = lote.depth ?? (lote as any).length ?? options?.defaultDepth ?? 9.3;
  const defaultRotY = lote.rotationY ?? (lote as any).rotation ?? SURVEYOR_ROTATION_RAD;

  const geom = lote.geometria;
  const rawCoords =
    (lote.geometriaReal && Array.isArray(lote.geometriaReal) && lote.geometriaReal.length >= 3 ? lote.geometriaReal : null) ||
    (geom ? (geom.coordenadas || (geom as any).coordinates) : null) || [];

  const isPolygon = Array.isArray(rawCoords) && rawCoords.length >= 3;

  // ====================================================
  // PATH B: REAL POLYGON GEOMETRY (buildPoligonoMasterplan)
  // ====================================================
  if (isPolygon) {
    const { geometry, edgesGeometry } = buildPoligonoMasterplan(
      rawCoords as [number, number][],
      lotHeight
    );

    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox || new THREE.Box3();
    const centerX = (bbox.min.x + bbox.max.x) / 2;
    const centerZ = (bbox.min.z + bbox.max.z) / 2;
    const width = Math.max(0.1, bbox.max.x - bbox.min.x);
    const depth = Math.max(0.1, bbox.max.z - bbox.min.z);

    // Keep lote.posX and lote.posZ synced with geometry centroid
    lote.posX = centerX;
    lote.posZ = centerZ;

    return {
      meshGeometry: geometry,
      outlineGeometry: edgesGeometry,
      center: { x: centerX, y: lotHeight / 2, z: centerZ },
      boundingBox: {
        width,
        height: lotHeight,
        depth
      },
      geometryType: 'Polygon',
      rotationY: 0,
      isParametricFallback: false
    };
  }

  // ====================================================
  // PATH A: PARAMETRIC BOX FALLBACK (POINT)
  // ====================================================
  const meshGeometry = new THREE.BoxGeometry(defaultWidth, lotHeight, defaultDepth);
  const outlineGeometry = new THREE.EdgesGeometry(meshGeometry, 25);

  return {
    meshGeometry,
    outlineGeometry,
    center: {
      x: lote.posX,
      y: lotHeight / 2,
      z: lote.posZ
    },
    boundingBox: {
      width: defaultWidth,
      height: lotHeight,
      depth: defaultDepth
    },
    geometryType: 'Point',
    rotationY: defaultRotY,
    isParametricFallback: true
  };
}
