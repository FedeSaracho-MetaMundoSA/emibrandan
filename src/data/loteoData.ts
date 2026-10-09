import { Lote, ManzanaConfig, ManzanaKey, DataSourceMode, LoteGeometry } from '../types';
import realLotesJSON from './riveras_pucheta_reales_con_geometria.json';
import { isLoteVendido } from './lotesVendidos';
import {
  CENTER_LAT,
  CENTER_LON,
  LAT_TO_METERS,
  LON_TO_METERS,
  SURVEYOR_ROTATION_RAD,
  gpsToLocal
} from '../utils/geoProjection';

// Re-export projection constants for full backwards compatibility
export {
  CENTER_LAT,
  CENTER_LON,
  LAT_TO_METERS,
  LON_TO_METERS,
  SURVEYOR_ROTATION_RAD
};

export const PROYECTO_INFO = {
  nombre: 'Riveras de Pucheta',
  subtitulo: 'Loteo Residencial Privado',
  ubicacion: 'Salta, Argentina',
  fecha_georeferencia: '2025-10-27',
  coordenadas: {
    lat: -24.58749,
    lon: -65.37728,
    formatted: '24°35\'15.0"S 65°22\'38.2"W'
  },
  rio: 'Río La Caldera',
  totalLotes: 378,
  superficieTotalM2: 114600,
  superficieEstandarM2: 300,
  medidasEstandar: '10.00m x 30.00m',
  manzanas: ['A', 'B', 'C', 'E', 'G', 'I', 'K', 'L'] as ManzanaKey[],
  desglose_por_manzana: {
    A: 72,
    B: 49,
    C: 23,
    E: 72,
    G: 72,
    I: 63,
    K: 7,
    L: 20
  },
  amenidades: [
    { nombre: 'Acceso directo a Costanera Río La Caldera', icon: 'Waves' },
    { nombre: 'Red eléctrica subterránea y alumbrado LED', icon: 'Zap' },
    { nombre: 'Red de agua corriente potable', icon: 'Droplets' },
    { nombre: 'Calles consolidadas y cordón cuneta', icon: 'Compass' },
    { nombre: 'Área Recreación Activa (0.95 ha) y Club House', icon: 'Trees' },
    { nombre: 'Áreas de Recreación Pasiva y Paseo Ribereño (0.71 ha)', icon: 'Flower2' },
    { nombre: 'Seguridad y pórtico de control de acceso 24hs', icon: 'ShieldCheck' }
  ]
};

export const MANZANAS_CONFIG: Record<string, ManzanaConfig> = {
  A: {
    key: 'A',
    nombre: 'Manzana A',
    color: '#EF4444', // Red-500
    descripcion: 'Ubicada en sector oeste, frente a ingreso principal y reserva.',
    totalLotes: 72,
    filas: 2
  },
  B: {
    key: 'B',
    nombre: 'Manzana B',
    color: '#F97316', // Orange-500
    descripcion: 'Sector oeste-central sobre Avenida de acceso principal.',
    totalLotes: 49,
    filas: 2
  },
  C: {
    key: 'C',
    nombre: 'Manzana C',
    color: '#F59E0B', // Amber-500
    descripcion: 'Sector central sur, adyacente a bulevar y paseo.',
    totalLotes: 23,
    filas: 1
  },
  E: {
    key: 'E',
    nombre: 'Manzana E',
    color: '#10B981', // Emerald-500
    descripcion: 'Sector intermedio central, excelente orientación y vistas.',
    totalLotes: 72,
    filas: 2
  },
  G: {
    key: 'G',
    nombre: 'Manzana G',
    color: '#06B6D4', // Cyan-500
    descripcion: 'Sector central-este, entorno arbolado y tranquilo.',
    totalLotes: 72,
    filas: 2
  },
  I: {
    key: 'I',
    nombre: 'Manzana I',
    color: '#3B82F6', // Blue-500
    descripcion: 'Sector este, proximidad inmediata a Avenida Costanera.',
    totalLotes: 63,
    filas: 2
  },
  K: {
    key: 'K',
    nombre: 'Manzana K',
    color: '#8B5CF6', // Purple-500
    descripcion: 'Lotes especiales frente a Recreación Pasiva y Ribera.',
    totalLotes: 7,
    filas: 1
  },
  L: {
    key: 'L',
    nombre: 'Manzana L',
    color: '#EC4899', // Pink-500
    descripcion: 'Lotes premium con vista directa al Río La Caldera y Recreación Activa.',
    totalLotes: 20,
    filas: 1
  }
};

// Base prices (USD/m²) for demo simulation
const BASE_PRICE_M2 = 48;

/**
 * Configuration for commercial data source.
 * - 'demo': Deterministic simulated status (available/reserved/sold) and calculated prices for testing UI.
 * - 'real': Strict canonical data from riveras_pucheta_reales_con_geometria.json
 *           (all lots initially 'disponible', precio_usd: null until official list is loaded).
 */
export const DATA_SOURCE_CONFIG: {
  defaultMode: DataSourceMode;
} = {
  defaultMode: 'real'
};

/**
 * Deterministic status simulator for demonstration mode.
 */
function getDemoStatus(num: number, manzana: string): 'disponible' | 'reservado' | 'vendido' {
  if (isLoteVendido(num)) return 'vendido';
  return 'disponible';
}

/**
 * Generates the complete 378 lotes array directly using the real survey data
 * provided in riveras_pucheta_reales_con_geometria.json (derived from doc.kml / KMZ oficial).
 *
 * @param mode 'demo' (simulated pricing & availability) | 'real' (canonical data from JSON)
 */
export function generateAllLotes(mode: DataSourceMode = DATA_SOURCE_CONFIG.defaultMode): Lote[] {
  const isDemo = mode === 'demo';

  return (realLotesJSON.lotes as any[]).map((item) => {
    const lon = item.centroide ? item.centroide[0] : (item.geometria?.coordenadas?.[0] ?? -65.3775);
    const lat = item.centroide ? item.centroide[1] : (item.geometria?.coordenadas?.[1] ?? -24.5875);
    const mza = item.manzana as ManzanaKey;
    const num = item.numero;

    // Convert GPS coordinates to metric coordinates using centralized geoProjection
    const { x: posX, z: posZ } = gpsToLocal(lon, lat);

    const area = item.propiedades?.area_m2 || 300;
    const perimetro = item.propiedades?.perimetro ?? null;
    const frente_m = item.propiedades?.frente_m ?? 10;
    const fondo_m = item.propiedades?.fondo_m ?? 30;

    // Corner lot detection based on official survey boundaries
    const isEsquina = (mza === 'A' && (num === 1 || num === 36 || num === 37 || num === 72)) ||
                      (mza === 'B' && (num === 73 || num === 97 || num === 98 || num === 121)) ||
                      (mza === 'C' && (num === 122 || num === 144)) ||
                      (mza === 'E' && (num === 145 || num === 180 || num === 181 || num === 216)) ||
                      (mza === 'G' && (num === 217 || num === 252 || num === 253 || num === 288)) ||
                      (mza === 'I' && (num === 289 || num === 320 || num === 321 || num === 351)) ||
                      (mza === 'K' && (num === 352 || num === 358)) ||
                      (mza === 'L' && (num === 359 || num === 378));

    const isRiverFront = mza === 'L' || mza === 'K';

    // Commercial status & price resolution according to official sold list
    const isSold = isLoteVendido(num);
    const estado: 'disponible' | 'reservado' | 'vendido' = isSold ? 'vendido' : 'disponible';
    let precio_usd: number | null;

    if (isSold) {
      precio_usd = null;
    } else {
      precio_usd = isRiverFront ? 8000 : (isEsquina ? 7500 : 7000);
    }

    // River orientation for east lots, west for inner lots
    let orientacion: 'Norte' | 'Sur' | 'Este (Río)' | 'Oeste' = 'Oeste';
    if (isRiverFront) {
      orientacion = 'Este (Río)';
    } else if (mza === 'I' || mza === 'G') {
      orientacion = num % 2 === 0 ? 'Este (Río)' : 'Oeste';
    } else {
      orientacion = num % 2 === 0 ? 'Este (Río)' : 'Oeste';
    }

    const ringCoords = item.geometria?.tipo === 'Polygon' ? item.geometria.coordenadas : null;

    return {
      id: item.id,
      nombre: item.nombre || String(num),
      numero: num,
      manzana: mza,
      area_m2: area,
      perimetro,
      frente_m,
      fondo_m,
      estado,
      status: estado,
      precio_usd,
      geometria: item.geometria as LoteGeometry,
      geometriaReal: ringCoords,
      posX,
      posZ,
      width: 27.5,
      depth: 9.3,
      length: 9.3,
      rotationY: SURVEYOR_ROTATION_RAD,
      rotation: SURVEYOR_ROTATION_RAD,
      lat,
      lon,
      orientacion,
      esquina: isEsquina,
      irregular: area !== 300,
      destacado: isRiverFront || isEsquina || num === 1,
      notas: isRiverFront ? 'Lote de ribera con vista panorámica al Río La Caldera' : undefined,
      metadata: {
        isDemo,
        simulationMode: isDemo ? 'demo_algorithmic' : 'canonical_kml',
        origen: 'doc.kml'
      }
    };
  });
}

export const REAL_LOTES_DATA: Lote[] = generateAllLotes('real');
export const DEMO_LOTES_DATA: Lote[] = generateAllLotes('demo');
export const LOTES_DATA: Lote[] = generateAllLotes(DATA_SOURCE_CONFIG.defaultMode);

export function getLoteStats(lotes: Lote[]) {
  const total = lotes.length;
  const disponibles = lotes.filter((l) => (l.estado || l.status) === 'disponible').length;
  const reservados = lotes.filter((l) => (l.estado || l.status) === 'reservado').length;
  const vendidos = lotes.filter((l) => (l.estado || l.status) === 'vendido').length;
  const areaTotal = lotes.reduce((acc, curr) => acc + curr.area_m2, 0);

  return {
    total,
    disponibles,
    reservados,
    vendidos,
    porcentajeDisponible: Math.round((disponibles / total) * 100),
    areaTotal: Math.round(areaTotal)
  };
}
