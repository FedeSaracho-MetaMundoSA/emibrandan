/**
 * Configuración comercial e institucional oficial para Riveras de Pucheta
 * Desarrolla y Garantiza: Concretar Desarrollos (+15 años de trayectoria)
 * Comercialización: ArgenSALTA Propiedades
 */
import { Lote } from '../types';

export const PROMO_CONFIG = {
  // Desarrolladora Propietaria (Dueña del desarrollo)
  desarrolladora: {
    nombre: 'Concretar Desarrollos',
    subtitulo: 'Dueña y Desarrolladora del Proyecto',
    trayectoria: '+15 Años de Trayectoria y Respaldo',
    logo: '/concretar.jpg',
    descripcion: 'Empresa desarrolladora con más de 15 años liderando urbanizaciones responsables y obras de infraestructura en el Norte Argentino.'
  },

  // Comercializadora PropTech
  comercializadora: {
    nombre: 'ArgenSALTA Propiedades',
    subtitulo: 'Comercialización PropTech 3D & Asesoramiento',
    logo: '/logo.jpeg',
    sitioWeb: 'https://argensaltapropiedades.com.ar',
    descripcion: 'Líder en asesoramiento comercial, inversiones estratégicas y tecnología 3D interactiva en Salta.'
  },

  // Propietario / Dueño de ArgenSALTA
  dueno: {
    nombre: 'José Luis',
    cargo: 'Dueño & Director de ArgenSALTA',
    empresa: 'ArgenSALTA Propiedades',
    sitioWeb: 'https://argensaltapropiedades.com.ar',
    telefonoDirecto: '3875843438',
    telefonoDirectoFormatted: '+54 9 387 584-3438',
    whatsappNumber: '5493875843438',
    tarjetaOficialUrl: 'https://argensaltapropiedades.com.ar'
  },

  // Retrocompatibilidad con código existente
  promotor: 'ArgenSALTA',
  promotorSubtitulo: 'Comercialización Oficial & PropTech',

  // Identidad del Proyecto
  proyectoNombre: 'Riveras de Pucheta',
  tipoBarrio: 'Barrio Privado Cerrado Residencial de Montaña',
  ubicacion: 'La Caldera, Salta, Argentina',
  distanciaCapital: 'A sólo 25 minutos de Salta Capital por RN 9 (camino de cornisa panorámico)',

  // Fecha y Posesión
  fechaEntrega: 'Posesión Diciembre 2026',
  posesionTexto: 'Entrega y Posesión Programada: Diciembre 2026',

  // Naturaleza y Entorno de La Caldera
  naturaleza: {
    titulo: 'Naturaleza Pura & Microclima Serrano',
    subtitulo: 'El verde de La Caldera a tu alcance',
    descripcion: 'Ubicado en el corazón verde de La Caldera, Riveras de Pucheta ofrece un microclima templado privilegiado, aire puro de montaña de yungas, abundante flora autóctona y el relajante murmullo del Río Pucheta.',
    puntosClave: [
      'Microclima templado y fresco durante todo el año',
      'Aire puro de montaña y paisajes protegidos',
      'Vegetación exuberante de yungas y especies autóctonas',
      'Margen ribereña natural junto al Río Pucheta',
      'Tranquilidad absoluta para vida familiar y descanso de fin de semana'
    ]
  },

  // Servicios e Infraestructura Proyectadas
  servicios: {
    titulo: 'Infraestructura & Servicios Proyectados',
    subtitulo: 'Servicios Proyectados: Obras de Agua y Luz programadas en desarrollo',
    items: [
      {
        nombre: 'Red de Agua Potable (Servicio Proyectado)',
        estado: 'Obra de agua proyectada y programada en desarrollo',
        icono: 'Droplets',
        detalle: 'Red de distribución interna proyectada con conexión en puerta de cada lote.'
      },
      {
        nombre: 'Red de Energía Eléctrica - Luz (Servicio Proyectado)',
        estado: 'Obra de electrificación y luz proyectada y programada',
        icono: 'Zap',
        detalle: 'Electrificación general y tendido proyectado con alumbrado de calles.'
      },
      {
        nombre: 'Calles Consolidadas y Delimitación',
        estado: 'Trazado, apertura y enripiado en marcha',
        icono: 'Road',
        detalle: 'Calles principales y secundarias enripiadas de fácil transitabilidad todo el año.'
      },
      {
        nombre: 'Barrio Privado Cerrado & Seguridad',
        estado: 'Pórtico de ingreso y control perimetral proyectado',
        icono: 'ShieldCheck',
        detalle: 'Acceso jerarquizado para residentes y delimitación integral del predio.'
      }
    ]
  },

  // Precios y Plazos de Oportunidad
  precioActualUSD: 7000,
  precioContadoSubtexto: 'Precio oficial de contado (no es tarifa promocional)',
  avisoUrgencia: 'VALOR OFICIAL DE CONTADO: USD 7.000 · Financiación Directa: Entrega USD 5.000 + 15 cuotas de USD 200.',
  ahorroUSD: 0,

  // Plan de Financiación Propia Directa
  financiacion: {
    tipo: 'Financiación Propia Directa (Sin Bancos)',
    entregaUSD: 5000,
    cuotasCantidad: 15,
    cuotaMontoUSD: 200,
    totalFinanciadoUSD: 8000,
    descripcion: 'Entrega inicial de USD 5.000 y 15 cuotas fijas de USD 200 (Total Financiado USD 8.000) o USD 7.000 de contado.',
    sinBancos: true,
    tasaInteres: '0% de interés en cuotas fijas en dólares'
  },

  // Contacto Oficial
  telefonoOficial: '3875557009',
  telefonoOficialFormatted: '387 555-7009',
  whatsappNumber: '5493875557009',
};

/**
 * Genera el enlace oficial de WhatsApp con mensaje personalizado y detallado
 */
export function getOficialWhatsAppUrl(lote?: Lote | null, planCuotas: boolean = false): string {
  let text = '';
  if (lote) {
    if (planCuotas) {
      text = `Hola ArgenSALTA y Concretar Desarrollos! Me interesa consultar la financiación del Lote ${lote.id} (Manzana ${lote.manzana}, ${lote.area_m2.toFixed(1)} m²) en Riveras de Pucheta (La Caldera, Salta). Plan financiado: Entrega USD 5.000 y 15 cuotas de USD 200 (o Contado USD 7.000). ¿Sigue disponible?`;
    } else {
      text = `Hola ArgenSALTA! Quisiera recibir información técnica y asesoramiento sobre el Lote ${lote.id} (Manzana ${lote.manzana}, ${lote.area_m2.toFixed(1)} m²) en Riveras de Pucheta (La Caldera, Salta) a precio contado de USD 7.000 con obras viales en marcha.`;
    }
  } else {
    text = `Hola ArgenSALTA y Concretar Desarrollos! Quisiera recibir información del Barrio Privado Riveras de Pucheta en La Caldera, Salta. Me interesa la propuesta con máquinas trabajando en terreno, precio de contado USD 7.000 y el plan financiado (Entrega USD 5.000 + 15 cuotas de USD 200).`;
  }

  return `https://wa.me/${PROMO_CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
}
