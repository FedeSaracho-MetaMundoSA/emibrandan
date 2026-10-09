export interface AmenidadCercana {
  id: string;
  nombre: string;
  categoria: 'hotel' | 'plaza' | 'servicio';
  subtitulo: string;
  lat: number;
  lon: number;
  descripcion: string;
  direccion?: string;
}

export const COORDENADAS_PROYECTO = {
  lat: -24.5875,
  lon: -65.3775,
  nombre: 'Riveras de Pucheta',
  subtitulo: 'Proyecto Central • La Caldera, Salta',
  ciudad: 'Salta',
  provincia: 'Salta',
  pais: 'Argentina'
};

export const AMENIDADES_CERCANAS: AmenidadCercana[] = [
  {
    id: 'hotel-1',
    nombre: 'Hotel Boutique San Lorenzo Chico',
    categoria: 'hotel',
    subtitulo: 'Hotel Boutique & Spa de Montaña',
    lat: -24.5822,
    lon: -65.3725,
    descripcion: 'Alojamiento boutique con spa, restaurante de cocina regional y piscina climatizada.',
    direccion: 'Camino a las Costas Km 3.5'
  },
  {
    id: 'hotel-2',
    nombre: 'Posada Las Yungas & Cabañas',
    categoria: 'hotel',
    subtitulo: 'Posada de Campo y Ecoturismo',
    lat: -24.5930,
    lon: -65.3712,
    descripcion: 'Cabañas turísticas con vistas panorámicas a la precordillera y senderos naturales.',
    direccion: 'Ruta Provincial 28'
  },
  {
    id: 'plaza-1',
    nombre: 'Plaza Central Pucheta',
    categoria: 'plaza',
    subtitulo: 'Parque Público & Recreación',
    lat: -24.5860,
    lon: -65.3795,
    descripcion: 'Espacio verde parquizado con juegos infantiles, bancos de descanso y arbolado nativo.',
    direccion: 'Acceso Central Riveras'
  },
  {
    id: 'plaza-2',
    nombre: 'Parque Ecológico Ribera del Río',
    categoria: 'plaza',
    subtitulo: 'Reserva Natural & Sendas Aeróbicas',
    lat: -24.5898,
    lon: -65.3820,
    descripcion: 'Parque lineal costanero sobre el Río La Caldera con ciclovía y miradores de aves.',
    direccion: 'Avenida Costanera Este'
  },
  {
    id: 'servicio-1',
    nombre: 'Paseo Comercial Pucheta & Supermercado',
    categoria: 'servicio',
    subtitulo: 'Supermercado, Farmacia & Cafetería',
    lat: -24.5842,
    lon: -65.3815,
    descripcion: 'Centro de conveniencia diario con supermercado exprés, farmacia y cafetería al paso.',
    direccion: 'Rotonda de Ingreso Norte'
  },
  {
    id: 'servicio-2',
    nombre: 'Estación de Servicios YPF & Minimarket',
    categoria: 'servicio',
    subtitulo: 'Combustibles, Cajero 24hs & Market',
    lat: -24.5925,
    lon: -65.3740,
    descripcion: 'Estación de servicio con tienda Full abierta 24hs, cajero automático Banelco y gomería.',
    direccion: 'Ruta 9 y Empalme Pucheta'
  }
];

/**
 * Calcula la distancia en metros entre dos coordenadas geográficas mediante la fórmula de Haversine
 */
export function calcularDistanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Radio terrestre en metros
  const rad = Math.PI / 180;
  const φ1 = lat1 * rad;
  const φ2 = lat2 * rad;
  const Δφ = (lat2 - lat1) * rad;
  const Δλ = (lon2 - lon1) * rad;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Formatea una distancia en metros a texto amigable ("450 m" o "1.4 km")
 */
export function formatearDistancia(metros: number): string {
  if (metros < 1000) {
    return `${metros} m`;
  }
  return `${(metros / 1000).toFixed(1)} km`;
}
