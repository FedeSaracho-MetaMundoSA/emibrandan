import { Amenidad3D } from '../types';

export const AMENIDADES_3D_DATA: Amenidad3D[] = [
  {
    id: 'planta_agua',
    nombre: 'Planta de Agua Potable',
    tipo: 'infrastructure',
    posicion3D: [-110, 0, -320],
    posicionGPS: { lat: -24.5820, lon: -65.3785 },
    distanciaKm: 1.5,
    color: '#4A90E2',
    label: 'Planta de Agua Potable',
    descripcion: 'Infraestructura de captación, almacenamiento y potabilización que abastece de agua presurizada a todo el desarrollo Riveras de Pucheta.',
    detalles: [
      'Capacidad de reserva de 150.000 litros en tanques elevados',
      'Bombas redundantes automatizadas con monitoreo 24/7',
      'Red matriz subterránea con conexiones domiciliarias'
    ]
  },
  {
    id: 'hoteles',
    nombre: 'Hoteles La Caldera',
    tipo: 'hotel',
    posicion3D: [350, 0, -80],
    posicionGPS: { lat: -24.5840, lon: -65.3710 },
    distanciaKm: 2.0,
    color: '#D4A574',
    label: 'Hoteles La Caldera',
    descripcion: 'Polo hotelero y ecoturístico con hosterías boutique de montaña, posadas de campo y gastronomía tradicional salteña.',
    detalles: [
      'Alojamiento con spa y piscinas climatizadas',
      'Restaurantes de cocina regional y asadores al aire libre',
      'Circuitos de cabalgatas y senderismo hacia la precordillera'
    ]
  },
  {
    id: 'caldera_central',
    nombre: 'Caldera Central',
    tipo: 'infrastructure',
    posicion3D: [-140, 0, 330],
    posicionGPS: { lat: -24.5940, lon: -65.3790 },
    distanciaKm: 1.8,
    color: '#C0392B',
    label: 'Caldera Central',
    descripcion: 'Centro operativo e infraestructura técnica de soporte municipal y de servicios para la microrregión.',
    detalles: [
      'Subestación transformadora eléctrica regional',
      'Chimenea técnica de evacuación de 32 metros de altura',
      'Punto de distribución de servicios y cuadrillas de mantenimiento'
    ]
  },
  {
    id: 'plaza_principal',
    nombre: 'Plaza Principal La Caldera',
    tipo: 'plaza',
    posicion3D: [-370, 0, 30],
    posicionGPS: { lat: -24.5872, lon: -65.3850 },
    distanciaKm: 3.0,
    color: '#2D5016',
    label: 'Plaza Principal La Caldera',
    descripcion: 'Centro cívico, cultural y recreativo del municipio de La Caldera con arboleda centenaria, fuentes y anfiteatro.',
    detalles: [
      '20.000 m² de espacio verde arbolado y parquizado',
      'Fuente de agua central iluminada con paseos peatonales',
      'Bancos coloniales, luminarias LED y sectores de descanso'
    ],
    subPuntos: [
      { id: 'p-a', nombre: 'Acceso Peatonal', color: '#EF4444', offset: [-45, 0, 35] },
      { id: 'p-b', nombre: 'Zona Recreativa', color: '#10B981', offset: [35, 0, 45] },
      { id: 'p-c', nombre: 'Estacionamiento', color: '#EAB308', offset: [-40, 0, -35] },
      { id: 'p-d', nombre: 'Juegos Infantiles', color: '#3B82F6', offset: [40, 0, -30] }
    ]
  },
  {
    id: 'rio_la_caldera',
    nombre: 'Río La Caldera',
    tipo: 'river',
    posicion3D: [240, 0, 20],
    posicionGPS: { lat: -24.5875, lon: -65.3745 },
    distanciaKm: 0.1,
    color: '#1E90FF',
    label: 'Río La Caldera',
    descripcion: 'Afluente natural de agua de deshielo que recorre el flanco este del desarrollo, proveyendo un microclima fresco y vistas privilegiadas.',
    detalles: [
      'Costanera frentista directa a las Manzanas L y K',
      'Lecho natural de montaña con arboleda ribereña',
      'Paseo peatonal y senda ecológica proyectada'
    ]
  }
];
