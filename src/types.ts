export type LoteEstado = 'disponible' | 'reservado' | 'vendido';

export type ManzanaKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L';

// ==========================================
// GEOMETRY DEFINITIONS (POINT & POLYGON SUPPORT)
// ==========================================

export type GeoPointTuple = [number, number]; // [longitude, latitude]

export interface GeoPointObj {
  lon: number;
  lat: number;
}

export interface LoteGeometryPoint {
  tipo: 'Point';
  type?: 'Point';
  coordenadas: GeoPointTuple;
  coordinates?: GeoPointObj | GeoPointTuple;
}

export interface LoteGeometryPolygon {
  tipo: 'Polygon';
  type?: 'Polygon';
  coordenadas: GeoPointTuple[]; // Closed or open ring of [lon, lat] vertices
  coordinates?: GeoPointObj[] | GeoPointTuple[];
}

export type LoteGeometry = LoteGeometryPoint | LoteGeometryPolygon;

export type DataSourceMode = 'demo' | 'real';

export interface Lote {
  id: string; // e.g. "A-1"
  nombre?: string;
  numero: number;
  manzana: ManzanaKey;
  area_m2: number;
  perimetro?: number | null;
  frente_m?: number;
  fondo_m?: number;
  estado: LoteEstado;
  status?: LoteEstado; // JSON structure compatibility
  precio_usd: number | null;
  geometria?: LoteGeometry;
  // Real polygon vertices from KML [lon, lat][]
  geometriaReal?: [number, number][] | null;
  // Local 3D grid positioning (in meters relative to subdivision origin)
  posX: number;
  posZ: number;
  width?: number;  // along X (depth 28-30m)
  depth?: number;  // along Z (frontage ~9.5-10m)
  length?: number; // alias for depth
  rotationY?: number;
  rotation?: number; // alias for rotationY
  // Geographic coords (Centroid or representative point)
  lat: number;
  lon: number;
  orientacion?: 'Norte' | 'Sur' | 'Este (Río)' | 'Oeste' | 'Norte-Sur' | string;
  esquina?: boolean;
  irregular?: boolean;
  destacado?: boolean;
  notas?: string;
  metadata?: Record<string, unknown>;
}

// Exact JSON schema as requested by user
export interface UbicacionJSON {
  ciudad: string;
  provincia: string;
  pais: string;
  lat: number;
  lon: number;
}

export interface EstadisticasProyectoJSON {
  total_lotes: number;
  area_total_m2: number;
  manzanas: string[];
}

export interface ProyectoHeaderJSON {
  nombre: string;
  ubicacion: UbicacionJSON;
  estadisticas: EstadisticasProyectoJSON;
}

export interface LoteJSONItem {
  id: string;
  numero: number;
  area_m2: number;
  lat: number;
  lon: number;
  status: LoteEstado;
  // Optional extended metadata
  manzana?: ManzanaKey;
  estado?: LoteEstado;
  precio_usd?: number;
  frente_m?: number;
  fondo_m?: number;
}

export interface ManzanaDataJSON {
  nombre: string;
  cantidad_lotes: number;
  color: string;
  lotes: Lote[];
}

export interface AmenidadItem {
  nombre: string;
  lat: number;
  lon: number;
  tipo: string;
}

export interface AmenidadesJSON {
  hoteles: AmenidadItem[];
  plazas: AmenidadItem[];
}

export interface ProyectoDataJSON {
  proyecto: ProyectoHeaderJSON;
  manzanas: Record<string, ManzanaDataJSON>;
  amenidades: AmenidadesJSON;
}

export interface ManzanaConfig {
  key: ManzanaKey;
  nombre: string;
  color: string;
  descripcion: string;
  totalLotes: number;
  filas: number;
}

export type ColorMode = 'natural' | 'manzana' | 'estado';
export type CameraPreset = 'isometric' | 'topDown' | 'river' | 'entrance' | 'panorama' | 'custom';
export type MobileTab = '3d' | 'info' | 'mapa' | 'lotes';

export interface Amenidad3DSubPunto {
  id: string;
  nombre: string;
  color: string;
  offset: [number, number, number];
}

export interface Amenidad3D {
  id: string;
  nombre: string;
  tipo: 'infrastructure' | 'hotel' | 'plaza' | 'river';
  posicion3D: [number, number, number];
  posicionGPS: { lat: number; lon: number };
  color: string;
  distanciaKm: number;
  descripcion: string;
  label: string;
  detalles: string[];
  subPuntos?: Amenidad3DSubPunto[];
}

export interface AreaRange {
  min: number;
  max: number;
}

export interface RealTimeStats {
  totalLotes: number;
  disponibles: number;
  reservados: number;
  vendidos: number;
  porcentajeDisponible: number;
  porcentajeReservado: number;
  porcentajeVendido: number;
  areaTotalM2: number;
  areaPromedioM2: number;
  precioPromedioUSD: number;
  filteredCount: number;
  filteredAreaM2: number;
  estadisticasPorManzana: Record<string, {
    total: number;
    disponibles: number;
    reservados: number;
    vendidos: number;
    areaTotal: number;
  }>;
}

export interface FilterState {
  manzana: string; // 'all' or specific key
  estado: string;  // 'all' or specific status
  searchQuery: string;
  minArea: number;
  maxArea: number;
  colorMode: ColorMode;
}
