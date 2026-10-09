// src/utils/kmlParser.ts
import { Lote, ManzanaKey } from '../types';
import realLotesJSON from '../data/riveras_pucheta_reales_con_geometria.json';
import { LOTES_VENDIDOS_LIST, LOTES_VENDIDOS_SET } from '../data/lotesVendidos';
import { PROMO_CONFIG } from '../data/promoConfig';

/**
 * Coordenada geográfica estándar WGS84
 */
export interface CoordenadaLatLng {
  lat: number;
  lng: number;
}

/**
 * Estructura de lote resultante del mapeo catastral KML oficial
 */
export interface LoteMapeado extends Lote {
  numero: number;
  manzana: ManzanaKey;
  estado: 'disponible' | 'vendido';
  poligono: CoordenadaLatLng[];
  centroide: CoordenadaLatLng;
}

// 5. Listado oficial de lotes vendidos según el plano catastral (181 lotes vendidos)
export const LOTES_VENDIDOS_CATASTRAL: number[] = LOTES_VENDIDOS_LIST;
export const LOTES_VENDIDOS = LOTES_VENDIDOS_SET;

/**
 * 6. Asignación de manzana correspondiente:
 * 1-72: A, 73-121: B, 122-144: C, 145-216: E, 217-288: G, 289-351: I, 352-358: K, 359-374+: L
 */
export function obtenerManzana(num: number): ManzanaKey {
  if (num <= 72) return 'A';
  if (num <= 121) return 'B';
  if (num <= 144) return 'C';
  if (num <= 216) return 'E';
  if (num <= 288) return 'G';
  if (num <= 351) return 'I';
  if (num <= 358) return 'K';
  return 'L';
}

// Constantes de proyección cartográfica local para Riveras de Pucheta (La Caldera, Salta)
export const REF_LON = -65.3775;
export const REF_LAT = -24.5875;
export const METROS_LON = 111000 * Math.cos(REF_LAT * (Math.PI / 180));
export const METROS_LAT = 111000;

interface ParsedPolygon {
  ringLatLng: CoordenadaLatLng[];
  ringLonLatTuples: [number, number][];
  centroid: CoordenadaLatLng;
  areaM2: number;
}

interface ParsedLabel {
  numero: number;
  lat: number;
  lng: number;
}

// Caché en memoria para evitar parseos redundantes
let cachedLotesMapeados: LoteMapeado[] | null = null;

/**
 * Genera el listado de lotes con polígonos garantizados a partir del dataset JSON
 * en caso de que el entorno no soporte DOMParser o la lectura XML falle.
 */
function generarLotesMapeadosFallback(): LoteMapeado[] {
  return (realLotesJSON.lotes as any[]).map((item) => {
    const lon = item.centroide ? item.centroide[0] : (item.geometria?.coordenadas?.[0] ?? -65.3775);
    const lat = item.centroide ? item.centroide[1] : (item.geometria?.coordenadas?.[1] ?? -24.5875);
    const num = item.numero;
    const mza = item.manzana as ManzanaKey;
    const isSold = LOTES_VENDIDOS.has(num);
    const estado: 'disponible' | 'vendido' = isSold ? 'vendido' : 'disponible';
    const centroide: CoordenadaLatLng = { lat, lng: lon };

    const ringTuples: [number, number][] = (item.geometria?.coordenadas as [number, number][]) || [];
    const poligono: CoordenadaLatLng[] = ringTuples.map(([xLon, yLat]) => ({ lat: yLat, lng: xLon }));

    return {
      id: item.id || `${mza}-${num}`,
      numero: num,
      manzana: mza,
      nombre: `Lote ${num}`,
      estado,
      status: estado,
      poligono,
      centroide,
      area_m2: item.propiedades?.area_m2 || 300,
      frente_m: item.propiedades?.frente_m || 10,
      fondo_m: item.propiedades?.fondo_m || 30,
      lat,
      lon,
      posX: (lon - REF_LON) * METROS_LON,
      posZ: (lat - REF_LAT) * METROS_LAT * -1,
      width: 27.5,
      depth: 9.3,
      length: 9.3,
      rotationY: -0.364,
      rotation: -0.364,
      orientacion: num % 2 === 0 ? 'Este (Río)' : 'Oeste',
      precio_usd: isSold ? null : PROMO_CONFIG.precioActualUSD,
      destacado: num === 1 || num === 360 || num === 374 || num === 378,
      geometriaReal: ringTuples,
      geometria: { tipo: 'Polygon', coordenadas: ringTuples },
      metadata: {
        origen: 'doc.kml_canonico',
        verticesKml: poligono.length,
      },
    };
  });
}

/**
 * Parsea el texto KML utilizando el DOMParser nativo del navegador.
 */
function parsearKmlString(xmlText: string): LoteMapeado[] {
  if (typeof DOMParser === 'undefined') {
    return generarLotesMapeadosFallback();
  }

  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, 'text/xml');

  const parserError = xml.querySelector('parsererror');
  if (parserError) {
    throw new Error(`Error de sintaxis XML en doc.kml: ${parserError.textContent}`);
  }

  const labels: ParsedLabel[] = [];
  const candidatePolygons: ParsedPolygon[] = [];

  // Obtenemos todas las carpetas (Folders) del KML
  const folders = xml.getElementsByTagName('Folder');

  for (let f = 0; f < folders.length; f++) {
    const folder = folders[f];
    const folderNameEl = folder.getElementsByTagName('name')[0];
    const folderName = folderNameEl?.textContent?.trim() || '';

    // 2. Extraer números de lote de carpetas TextoM (<Placemark> con <Point>)
    if (folderName.includes('TextoM')) {
      const placemarks = folder.getElementsByTagName('Placemark');
      for (let p = 0; p < placemarks.length; p++) {
        const pm = placemarks[p];
        const nameEl = pm.getElementsByTagName('name')[0];
        const rawName = nameEl?.textContent?.trim() || '';
        const num = parseInt(rawName, 10);

        // Filtramos únicamente nombres numéricos correspondientes a lotes
        if (!isNaN(num) && num > 0 && /^\d+$/.test(rawName)) {
          const pointEl = pm.getElementsByTagName('Point')[0];
          if (pointEl) {
            const coordsEl = pointEl.getElementsByTagName('coordinates')[0];
            if (coordsEl?.textContent) {
              const parts = coordsEl.textContent.trim().split(',');
              const lon = parseFloat(parts[0]);
              const lat = parseFloat(parts[1]);
              if (!isNaN(lon) && !isNaN(lat)) {
                labels.push({ numero: num, lat, lng: lon });
              }
            }
          }
        }
      }
    }

    // 3. Extraer polígonos de carpetas Polilínea (<Placemark> con <MultiGeometry>)
    if (folderName.includes('Polilínea') || folderName.includes('Polil')) {
      const placemarks = folder.getElementsByTagName('Placemark');
      for (let p = 0; p < placemarks.length; p++) {
        const pm = placemarks[p];
        const multiGeo = pm.getElementsByTagName('MultiGeometry')[0];
        if (!multiGeo) continue;

        const lineStrings = multiGeo.getElementsByTagName('LineString');
        const ringLatLng: CoordenadaLatLng[] = [];
        const ringLonLatTuples: [number, number][] = [];

        for (let ls = 0; ls < lineStrings.length; ls++) {
          const coordsEl = lineStrings[ls].getElementsByTagName('coordinates')[0];
          const coordsText = coordsEl?.textContent?.trim() || '';
          const rawTokens = coordsText.split(/\s+/);

          for (const token of rawTokens) {
            if (!token) continue;
            const parts = token.split(',');
            if (parts.length >= 2) {
              const lon = parseFloat(parts[0]);
              const lat = parseFloat(parts[1]);

              if (!isNaN(lon) && !isNaN(lat)) {
                // Evitar vértices consecutivos repetidos
                const last = ringLatLng[ringLatLng.length - 1];
                if (!last || Math.abs(last.lng - lon) > 1e-7 || Math.abs(last.lat - lat) > 1e-7) {
                  ringLatLng.push({ lat, lng: lon });
                  ringLonLatTuples.push([lon, lat]);
                }
              }
            }
          }
        }

        // Asegurar camino cerrado [{ lat, lng }]
        if (ringLatLng.length >= 3) {
          const first = ringLatLng[0];
          const last = ringLatLng[ringLatLng.length - 1];
          if (Math.abs(first.lat - last.lat) > 1e-7 || Math.abs(first.lng - last.lng) > 1e-7) {
            ringLatLng.push({ lat: first.lat, lng: first.lng });
            ringLonLatTuples.push([first.lng, first.lat]);
          }

          // Cálculo del centroide del polígono
          const vertexCount = ringLatLng.length - 1;
          let sumLat = 0;
          let sumLng = 0;
          for (let v = 0; v < vertexCount; v++) {
            sumLat += ringLatLng[v].lat;
            sumLng += ringLatLng[v].lng;
          }
          const centroid: CoordenadaLatLng = {
            lat: sumLat / vertexCount,
            lng: sumLng / vertexCount
          };

          // Cálculo del área en m² usando fórmula Shoelace
          let signedArea = 0;
          for (let k = 0; k < ringLatLng.length - 1; k++) {
            const x1 = (ringLatLng[k].lng - REF_LON) * METROS_LON;
            const y1 = (ringLatLng[k].lat - REF_LAT) * METROS_LAT;
            const x2 = (ringLatLng[k + 1].lng - REF_LON) * METROS_LON;
            const y2 = (ringLatLng[k + 1].lat - REF_LAT) * METROS_LAT;
            signedArea += (x1 * y2 - x2 * y1);
          }
          const areaM2 = Math.abs(signedArea) / 2;

          candidatePolygons.push({
            ringLatLng,
            ringLonLatTuples,
            centroid,
            areaM2
          });
        }
      }
    }
  }

  // 4. Asociar cada número de lote con su polígono más cercano comparando centroides
  const lotesMapeados: LoteMapeado[] = [];
  const usedPolygonIndices = new Set<number>();

  // Filtramos candidatos descartando perímetros macro de toda la finca (> 2500 m²)
  const parcelPolygons = candidatePolygons.filter((p) => p.areaM2 <= 2500 && p.areaM2 >= 100);

  for (const label of labels) {
    const num = label.numero;
    let bestPoly: ParsedPolygon | null = null;
    let bestPolyIndex = -1;
    let minDistance = Infinity;

    for (let i = 0; i < parcelPolygons.length; i++) {
      const poly = parcelPolygons[i];
      const dLat = poly.centroid.lat - label.lat;
      const dLng = poly.centroid.lng - label.lng;
      const dist = dLat * dLat + dLng * dLng;

      if (dist < minDistance) {
        minDistance = dist;
        bestPoly = poly;
        bestPolyIndex = i;
      }
    }

    if (bestPolyIndex !== -1) {
      usedPolygonIndices.add(bestPolyIndex);
    }

    // 5. Asignar estado según listado catastral
    const isSold = LOTES_VENDIDOS.has(num);
    const estado: 'disponible' | 'vendido' = isSold ? 'vendido' : 'disponible';

    // 6. Asignar manzana correspondiente
    const manzana = obtenerManzana(num);

    // Metros cuadrados reales calculados o default
    const areaM2 = bestPoly && bestPoly.areaM2 >= 150 && bestPoly.areaM2 <= 1500
      ? Math.round(bestPoly.areaM2 * 10) / 10
      : 300;

    // Geometría cerrada garantizada
    const poligonoCoords: CoordenadaLatLng[] = bestPoly
      ? bestPoly.ringLatLng
      : [
          { lat: label.lat - 0.0001, lng: label.lng - 0.0001 },
          { lat: label.lat - 0.0001, lng: label.lng + 0.0001 },
          { lat: label.lat + 0.0001, lng: label.lng + 0.0001 },
          { lat: label.lat + 0.0001, lng: label.lng - 0.0001 },
          { lat: label.lat - 0.0001, lng: label.lng - 0.0001 }
        ];

    const centroideCoord: CoordenadaLatLng = bestPoly
      ? bestPoly.centroid
      : { lat: label.lat, lng: label.lng };

    const loteMapeado: LoteMapeado = {
      id: `${manzana}-${num}`,
      numero: num,
      manzana,
      nombre: `Lote ${num}`,
      estado,
      status: estado,
      poligono: poligonoCoords,
      centroide: centroideCoord,
      area_m2: areaM2,
      frente_m: 10,
      fondo_m: 30,
      lat: centroideCoord.lat,
      lon: centroideCoord.lng,
      posX: (centroideCoord.lng - REF_LON) * METROS_LON,
      posZ: (centroideCoord.lat - REF_LAT) * METROS_LAT * -1,
      width: 27.5,
      depth: 9.3,
      length: 9.3,
      rotationY: -0.364,
      rotation: -0.364,
      orientacion: 'Norte-Sur',
      precio_usd: isSold ? null : PROMO_CONFIG.precioActualUSD,
      destacado: num === 1 || num === 360 || num === 374,
      geometriaReal: bestPoly ? bestPoly.ringLonLatTuples : null,
      geometria: bestPoly
        ? { tipo: 'Polygon', coordenadas: bestPoly.ringLonLatTuples }
        : { tipo: 'Point', coordenadas: [label.lng, label.lat] },
      metadata: {
        origen: 'doc.kml',
        verticesKml: poligonoCoords.length
      }
    };

    lotesMapeados.push(loteMapeado);
  }

  // 7. Ordenar por número de lote ascendente
  lotesMapeados.sort((a, b) => a.numero - b.numero);

  if (lotesMapeados.length === 0) {
    return generarLotesMapeadosFallback();
  }

  return lotesMapeados;
}

/**
 * Carga los lotes desde el KML oficial de Riveras de Pucheta.
 * Prioriza el KML embebido en compilación (cero latencia y sin fallos de red),
 * con fallback a fetch y dataset georreferenciado pre-calculado.
 */
export async function cargarLotesKml(): Promise<LoteMapeado[]> {
  if (cachedLotesMapeados && cachedLotesMapeados.length > 0) {
    return cachedLotesMapeados;
  }

  try {
    // 1. Prioridad: KML diferido por carga dinámica (lazy chunking para no inflar bundle inicial)
    try {
      const { DOC_KML_RAW } = await import('../data/docKmlString');
      if (DOC_KML_RAW && typeof DOC_KML_RAW === 'string' && DOC_KML_RAW.length > 500) {
        const parsed = parsearKmlString(DOC_KML_RAW);
        if (parsed.length > 0) {
          cachedLotesMapeados = parsed;
          return parsed;
        }
      }
    } catch {
      // Continuar con fallback si el import dinámico fallara
    }

    // 2. Fallback por red si fuera necesario (intentando rutas relativas seguras)
    const possiblePaths = ['./doc.kml', 'doc.kml', '/doc.kml'];
    for (const path of possiblePaths) {
      try {
        const response = await fetch(path);
        if (response.ok) {
          const xmlText = await response.text();
          if (xmlText && xmlText.length > 500) {
            const parsed = parsearKmlString(xmlText);
            if (parsed.length > 0) {
              cachedLotesMapeados = parsed;
              return parsed;
            }
          }
        }
      } catch {
        // Silencioso: intentamos la siguiente ruta o fallback
      }
    }

    // 3. Fallback infalible garantizado con los 374 lotes y geometría real
    const fallback = generarLotesMapeadosFallback();
    cachedLotesMapeados = fallback;
    return fallback;
  } catch {
    // Garantizar que nunca propague una excepción fatal
    const fallback = generarLotesMapeadosFallback();
    cachedLotesMapeados = fallback;
    return fallback;
  }
}

/**
 * Función de compatibilidad con LotesContext y utilidades existentes
 */
export async function cargarLotesDesdeKML(): Promise<Lote[]> {
  return cargarLotesKml();
}
