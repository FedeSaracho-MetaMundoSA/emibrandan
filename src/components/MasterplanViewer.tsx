// Source: Google Maps Platform Code Assist
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { cargarLotesKml, LoteMapeado, CoordenadaLatLng } from '../utils/kmlParser';
import { Lote, ColorMode } from '../types';
import { Canvas3D } from './Canvas3D';
import { ErrorBoundary, Canvas3DErrorFallback } from './errors';
import { LoadingSpinner } from '../utils/lazyLoader';
import { EscudoConcretar } from './EscudoConcretar';
import { PROMO_CONFIG, getOficialWhatsAppUrl } from '../data/promoConfig';
import { 
  Plane, 
  Compass, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Camera, 
  Layers, 
  Eye, 
  Sparkles,
  Loader2,
  AlertCircle,
  Key,
  Globe,
  Box,
  Check,
  X,
  ExternalLink,
  MessageSquare,
  FileText,
  Ruler,
  Calculator,
  Share2,
  Navigation
} from 'lucide-react';

interface MasterplanViewerProps {
  lotes?: Lote[];
  selectedLote: Lote | null;
  onSelectLote: (lote: Lote | null) => void;
  colorMode?: ColorMode;
  onChangeColorMode?: (mode: ColorMode) => void;
  selectedManzanaFilter?: string;
  filteredLoteIds?: Set<string>;
  className?: string;
}

const PUCHETA_CENTER = { lat: -24.5873, lng: -65.3773 };
const DEFAULT_ZOOM = 17.2;
const SEMANTIC_ZOOM_THRESHOLD = 16.5;

/**
 * Calcula la distancia haversine en metros entre dos coordenadas geográficas
 */
function calcularDistanciaMetros(
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number }
): number {
  const R = 6371000;
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calcula el rumbo cuadrantal topográfico (ej: N 14.5° E) entre dos coordenadas
 */
function calcularRumboTopografico(
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number }
): string {
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  let azimut = (Math.atan2(y, x) * 180) / Math.PI;
  azimut = (azimut + 360) % 360;

  if (azimut >= 0 && azimut < 90) {
    return `N ${azimut.toFixed(1)}° E`;
  } else if (azimut >= 90 && azimut < 180) {
    return `S ${(180 - azimut).toFixed(1)}° E`;
  } else if (azimut >= 180 && azimut < 270) {
    return `S ${(azimut - 180).toFixed(1)}° O`;
  } else {
    return `N ${(360 - azimut).toFixed(1)}° O`;
  }
}

/**
 * Validador de Google Maps API Key
 * Evita llamar a Google Maps JS API con claves vacías, nulas o placeholders,
 * previniendo el error 'ApiProjectMapError' en el navegador.
 */
function isKeyValid(key: string | null | undefined): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  return (
    trimmed.length > 15 &&
    trimmed !== 'MY_GOOGLE_MAPS_API_KEY' &&
    !trimmed.includes('YOUR_') &&
    trimmed !== 'undefined'
  );
}

export const MasterplanViewer: React.FC<MasterplanViewerProps> = ({
  lotes: lotesProp = [],
  selectedLote,
  onSelectLote,
  colorMode = 'estado',
  onChangeColorMode,
  selectedManzanaFilter = 'all',
  filteredLoteIds,
  className = ''
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const mapsLibRef = useRef<google.maps.MapsLibrary | null>(null);
  const markerLibRef = useRef<google.maps.MarkerLibrary | null>(null);

  // Referencias para polígonos y pines de Google Maps
  const polygonsMapRef = useRef<Map<number, google.maps.Polygon>>(new Map());
  const markersMapRef = useRef<Map<number, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const badgeElementsMapRef = useRef<Map<number, HTMLDivElement>>(new Map());

  // Clave API de Google Maps (desde entorno, clave provista o localStorage)
  const envKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || 'AIzaSyAR0-2J_zEyfaiAJozCSUziZ9zTbE1daIM';
  const [apiKey, setApiKey] = useState<string>(() => {
    const local = typeof window !== 'undefined' ? localStorage.getItem('gmaps_custom_api_key') : null;
    return local || envKey;
  });

  const hasValidKey = isKeyValid(apiKey);

  // Modo de visualización: 3D Studio interactivo de alta velocidad como predeterminado
  const [activeMode, setActiveMode] = useState<'3d' | 'satellite'>('3d');

  // Modal para configuración de API Key
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [keySavedToast, setKeySavedToast] = useState(false);

  // Estados del visor satelital
  const [kmlLotes, setKmlLotes] = useState<LoteMapeado[]>([]);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'dron' | 'cenital'>('cenital');
  const [heading, setHeading] = useState<number>(0);
  const [currentZoom, setCurrentZoom] = useState<number>(DEFAULT_ZOOM);
  const [hoveredLoteNum, setHoveredLoteNum] = useState<number | null>(null);

  // Carga independiente de datos KML al montar el componente
  useEffect(() => {
    let isCancelled = false;
    cargarLotesKml()
      .then((parsed) => {
        if (!isCancelled && parsed && parsed.length > 0) {
          setKmlLotes(parsed);
        }
      })
      .catch((err) => {
        console.warn('Nota: usando datos cartográficos de respaldo:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Conteo de lotes disponibles vs vendidos para la leyenda
  const counts = useMemo(() => {
    const dataSource = kmlLotes.length > 0 ? kmlLotes : lotesProp;
    let disponibles = 0;
    let vendidos = 0;
    dataSource.forEach((l) => {
      if (l.estado === 'vendido') vendidos++;
      else disponibles++;
    });
    return { total: dataSource.length, disponibles, vendidos };
  }, [kmlLotes, lotesProp]);

  // Estados de la tarjeta flotante inmersiva (Dark Mode / Estudio FBX)
  const [cardActiveTab, setCardActiveTab] = useState<'comercial' | 'mensura' | 'cuotas'>('comercial');
  const [anticipoPorcentaje, setAnticipoPorcentaje] = useState<number>(30);
  const [cuotasCantidad, setCuotasCantidad] = useState<number>(36);
  const [copiedFicha, setCopiedFicha] = useState<boolean>(false);

  // Mapeo del lote seleccionado con su polígono KML completo
  const selectedLoteMapeado = useMemo(() => {
    if (!selectedLote) return null;
    const found = kmlLotes.find((l) => l.numero === selectedLote.numero || l.id === selectedLote.id);
    if (found) return found;

    // Si selectedLote ya tiene geometriaReal incorporada desde el dataset KML
    if (selectedLote.geometriaReal && Array.isArray(selectedLote.geometriaReal) && selectedLote.geometriaReal.length >= 3) {
      const poly: CoordenadaLatLng[] = selectedLote.geometriaReal.map(([xLon, yLat]) => ({ lat: yLat, lng: xLon }));
      return {
        ...selectedLote,
        poligono: poly,
        centroide: { lat: selectedLote.lat, lng: selectedLote.lon },
        estado: (selectedLote.estado || selectedLote.status || 'disponible') as 'disponible' | 'vendido'
      } as LoteMapeado;
    }

    return null;
  }, [selectedLote, kmlLotes]);

  // Cálculo de vértices, lados, rumbos y distancias de mensura
  const technicalPolygonData = useMemo(() => {
    if (!selectedLote) return null;
    const poly = selectedLoteMapeado?.poligono || [];

    if (poly.length >= 3) {
      const isClosed =
        poly.length > 3 &&
        Math.abs(poly[0].lat - poly[poly.length - 1].lat) < 1e-7 &&
        Math.abs(poly[0].lng - poly[poly.length - 1].lng) < 1e-7;
      const cleanVertices = isClosed ? poly.slice(0, poly.length - 1) : poly;

      const lados = cleanVertices.map((v, idx) => {
        const next = cleanVertices[(idx + 1) % cleanVertices.length];
        const dist = calcularDistanciaMetros(v, next);
        const rumbo = calcularRumboTopografico(v, next);
        return {
          desde: `V${idx + 1}`,
          hasta: `V${((idx + 1) % cleanVertices.length) + 1}`,
          distanciaM: Math.round(dist * 10) / 10,
          rumbo,
        };
      });

      const perimetroTotal = lados.reduce((acc, l) => acc + l.distanciaM, 0);

      return {
        vertices: cleanVertices.map((v, i) => ({
          id: `V${i + 1}`,
          lat: v.lat,
          lng: v.lng,
        })),
        lados,
        perimetroTotal: Math.round(perimetroTotal * 10) / 10,
        verticeCount: cleanVertices.length,
      };
    }

    const lat = selectedLote.lat;
    const lon = selectedLote.lon;
    const dLat = 0.00008;
    const dLng = 0.00012;
    const fallbackVertices = [
      { id: 'V1', lat: lat - dLat, lng: lon - dLng },
      { id: 'V2', lat: lat - dLat, lng: lon + dLng },
      { id: 'V3', lat: lat + dLat, lng: lon + dLng },
      { id: 'V4', lat: lat + dLat, lng: lon - dLng },
    ];
    const lados = fallbackVertices.map((v, idx) => {
      const next = fallbackVertices[(idx + 1) % fallbackVertices.length];
      const dist = calcularDistanciaMetros(v, next);
      const rumbo = calcularRumboTopografico(v, next);
      return {
        desde: v.id,
        hasta: next.id,
        distanciaM: Math.round(dist * 10) / 10,
        rumbo,
      };
    });
    const perimetroTotal = lados.reduce((acc, l) => acc + l.distanciaM, 0);

    return {
      vertices: fallbackVertices,
      lados,
      perimetroTotal: Math.round(perimetroTotal * 10) / 10,
      verticeCount: 4,
    };
  }, [selectedLote, selectedLoteMapeado]);

  // Cálculos para el simulador de cuotas y oferta comercial
  const lotePrecioUsd = useMemo(() => {
    if (!selectedLote) return PROMO_CONFIG.precioActualUSD;
    if (selectedLote.estado === 'vendido') return 0;
    return PROMO_CONFIG.precioActualUSD;
  }, [selectedLote]);

  const anticipoMontoUsd = useMemo(() => {
    return PROMO_CONFIG.financiacion.entregaUSD;
  }, []);

  const saldoAFinanciarUsd = useMemo(() => {
    return PROMO_CONFIG.financiacion.cuotasCantidad * PROMO_CONFIG.financiacion.cuotaMontoUSD;
  }, []);

  const cuotaMensualUsd = useMemo(() => {
    return PROMO_CONFIG.financiacion.cuotaMontoUSD;
  }, []);

  const TIPO_CAMBIO_ARS = 1250;
  const cuotaMensualArs = useMemo(() => {
    return cuotaMensualUsd * TIPO_CAMBIO_ARS;
  }, [cuotaMensualUsd]);

  const anticipoMontoArs = useMemo(() => {
    return anticipoMontoUsd * TIPO_CAMBIO_ARS;
  }, [anticipoMontoUsd]);

  const handleCopyFicha = () => {
    if (!selectedLote) return;
    const isVendido = selectedLote.estado === 'vendido';
    const info = `FICHA DE LOTE · RIVERAS DE PUCHETA (Promueve ${PROMO_CONFIG.promotor})
Lote: ${selectedLote.numero ?? selectedLote.id} | Manzana: ${selectedLote.manzana}
Superficie: ${selectedLote.area_m2 ? selectedLote.area_m2.toFixed(1) : '300'} m² (${selectedLote.frente_m ?? 10}m frente × ${selectedLote.fondo_m ?? 30}m fondo)
Estado: ${selectedLote.estado.toUpperCase()}
${isVendido ? 'LOTE VENDIDO / ADJUDICADO' : `Precio Total Contado: USD $${PROMO_CONFIG.precioActualUSD.toLocaleString('en-US')} (Precio Base Oficial)`}
Plan Financiación: Entrega USD $${PROMO_CONFIG.financiacion.entregaUSD.toLocaleString('en-US')} + ${PROMO_CONFIG.financiacion.cuotasCantidad} cuotas fijas de USD $${PROMO_CONFIG.financiacion.cuotaMontoUSD}
Teléfono Oficial: ${PROMO_CONFIG.telefonoOficialFormatted}
Ubicación GPS: ${selectedLote.lat.toFixed(6)}, ${selectedLote.lon.toFixed(6)}
La Caldera, Salta, Argentina`;
    navigator.clipboard.writeText(info).then(() => {
      setCopiedFicha(true);
      setTimeout(() => setCopiedFicha(false), 2000);
    });
  };

  const whatsappCuotasUrl = useMemo(() => {
    return getOficialWhatsAppUrl(selectedLote, true);
  }, [selectedLote]);

  const whatsappComercialUrl = useMemo(() => {
    return getOficialWhatsAppUrl(selectedLote, false);
  }, [selectedLote]);

  // Manejador para interceptar errores de autenticación o activación de Google Maps
  useEffect(() => {
    const handleAuthError = () => {
      setMapError('Maps JavaScript API no está activada en tu proyecto de Google Cloud (ApiNotActivatedMapError). El Plano 3D Arquitectónico está activo.');
      setActiveMode('3d');
      setIsMapLoading(false);
    };

    window.addEventListener('gmaps_auth_error', handleAuthError);

    return () => {
      window.removeEventListener('gmaps_auth_error', handleAuthError);
    };
  }, []);

  // 1. Inicialización de Google Maps SOLO cuando el usuario solicita explícitamente el modo 'satellite' y se dispone de una clave válida
  useEffect(() => {
    if (activeMode !== 'satellite') return;

    if ((window as unknown as { __GMAPS_AUTH_FAILED__?: boolean }).__GMAPS_AUTH_FAILED__) {
      setMapError('La clave actual no tiene habilitada la biblioteca Maps JavaScript API en Google Cloud Console. Continúa utilizando el Plano 3D Arquitectónico.');
      setActiveMode('3d');
      return;
    }

    if (!hasValidKey) {
      setMapError('Para acceder a la vista satelital fotorealista en vivo, configura tu VITE_GOOGLE_MAPS_API_KEY.');
      setActiveMode('3d');
      return;
    }

    let isCancelled = false;

    const initMap = async () => {
      setIsMapLoading(true);
      setMapError(null);

      try {
        // Configurar loader de Google Maps
        try {
          setOptions({
            key: apiKey,
            v: 'weekly'
          });
        } catch {
          // Si setOptions ya fue llamado en la sesión, continúa
        }

        const [mapsLib, markerLib] = await Promise.all([
          importLibrary('maps') as Promise<google.maps.MapsLibrary>,
          importLibrary('marker') as Promise<google.maps.MarkerLibrary>
        ]);

        if (isCancelled || !mapContainerRef.current) return;

        mapsLibRef.current = mapsLib;
        markerLibRef.current = markerLib;

        // Crear mapa satelital centrado exactamente en el loteo
        const mapOptions: google.maps.MapOptions = {
          center: PUCHETA_CENTER,
          zoom: DEFAULT_ZOOM,
          mapTypeId: 'hybrid',
          tilt: 0,
          heading: 0,
          disableDefaultUI: true,
          gestureHandling: 'greedy',
          mapId: 'DEMO_MAP_ID',
          internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio']
        } as google.maps.MapOptions;

        const map = new mapsLib.Map(mapContainerRef.current, mapOptions);
        mapInstanceRef.current = map;
        setMapInstance(map);

        map.addListener('tilt_changed', () => {
          const currentTilt = map.getTilt();
          if (typeof currentTilt === 'number') {
            setViewMode(currentTilt > 25 ? 'dron' : 'cenital');
          }
        });

        map.addListener('heading_changed', () => {
          const h = map.getHeading();
          if (typeof h === 'number') {
            setHeading(h);
          }
        });

        map.addListener('zoom_changed', () => {
          const z = map.getZoom();
          if (typeof z === 'number') {
            setCurrentZoom(z);
          }
        });

        setIsMapLoading(false);
      } catch (err: unknown) {
        console.error('Error cargando Google Maps Satelital:', err);
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : 'Error al inicializar el mapa satelital.';
          setMapError(msg);
          setActiveMode('3d');
          setIsMapLoading(false);
        }
      }
    };

    initMap();

    return () => {
      isCancelled = true;
    };
  }, [activeMode, apiKey, hasValidKey]);

  // Selección de lote con efecto "Fly-to" cinemático
  const handleSelectLote = useCallback(
    (lote: LoteMapeado | Lote | null) => {
      if (!lote) {
        onSelectLote(null);
        return;
      }

      onSelectLote(lote);

      const map = mapInstance || mapInstanceRef.current;
      if (map && activeMode === 'satellite') {
        const targetLat = lote.lat;
        const targetLng = ('lng' in lote ? (lote as { lng: number }).lng : lote.lon) ?? lote.lon;

        // 1. Pan fluido al centroide exacto del lote
        map.panTo({ lat: targetLat, lng: targetLng });

        // 2. Zoom cinemático equilibrado (18.2) para mantener el contexto y evitar desarmes de tiles
        map.setZoom(18.2);

        // 3. Inclinación moderada (25°) para perspectiva clara sin romper la capa KML
        map.setTilt(25);
        setViewMode('dron');

        // 4. Orientación de cámara suave
        const targetHeading = lote.rotationY
          ? Math.round((lote.rotationY * 180) / Math.PI)
          : 0;
        map.setHeading(targetHeading);
        setHeading(targetHeading);
      }
    },
    [onSelectLote, activeMode, mapInstance]
  );

  // Volver a vista general del masterplan (reencuadre suave y cenital a nivel general)
  const handleResetOverview = useCallback(() => {
    onSelectLote(null);
    const map = mapInstance || mapInstanceRef.current;
    if (map) {
      map.panTo(PUCHETA_CENTER);
      map.setZoom(DEFAULT_ZOOM);
      map.setTilt(0);
      map.setHeading(0);
      setViewMode('cenital');
      setHeading(0);
    }
  }, [onSelectLote, mapInstance]);

  // 2. Renderizado de polígonos y AdvancedMarkerElement sobre Google Maps
  useEffect(() => {
    const map = mapInstance || mapInstanceRef.current;
    const mapsLib = mapsLibRef.current;
    const markerLib = markerLibRef.current;

    if (activeMode !== 'satellite' || !map || !mapsLib || !markerLib || kmlLotes.length === 0) return;

    polygonsMapRef.current.forEach((poly) => poly.setMap(null));
    polygonsMapRef.current.clear();
    markersMapRef.current.forEach((marker) => {
      marker.map = null;
    });
    markersMapRef.current.clear();
    badgeElementsMapRef.current.clear();

    const { AdvancedMarkerElement } = markerLib;

    kmlLotes.forEach((lote) => {
      const isSold = lote.estado === 'vendido';
      const isSelected = selectedLote?.numero === lote.numero || selectedLote?.id === lote.id;
      const isFilteredOut =
        (selectedManzanaFilter && selectedManzanaFilter !== 'all' && lote.manzana !== selectedManzanaFilter) ||
        (filteredLoteIds && !filteredLoteIds.has(lote.id));

      // Polígono con bordes blancos nítidos y rellenos translúcidos elegantes
      const polygon = new mapsLib.Polygon({
        paths: lote.poligono,
        strokeColor: isSelected ? '#FBBF24' : '#FFFFFF',
        strokeOpacity: isFilteredOut ? 0.2 : (isSelected ? 1.0 : 0.90),
        strokeWeight: isSelected ? 3.0 : 1.5,
        fillColor: isSold ? '#EF4444' : '#10B981',
        fillOpacity: isFilteredOut ? 0.04 : (isSelected ? 0.55 : (isSold ? 0.28 : 0.18)),
        map,
        zIndex: isSelected ? 40 : 10
      });

      polygon.addListener('click', () => {
        handleSelectLote(lote);
      });

      polygon.addListener('mouseover', () => {
        setHoveredLoteNum(lote.numero);
        if (!isSelected) {
          polygon.setOptions({
            strokeColor: '#FDE047',
            strokeOpacity: 1.0,
            strokeWeight: 2.2,
            fillOpacity: isSold ? 0.45 : 0.32,
            zIndex: 25
          });
        }
      });

      polygon.addListener('mouseout', () => {
        setHoveredLoteNum(null);
        if (!isSelected) {
          polygon.setOptions({
            strokeColor: '#FFFFFF',
            strokeOpacity: isFilteredOut ? 0.2 : 0.90,
            strokeWeight: 1.5,
            fillOpacity: isFilteredOut ? 0.04 : (isSold ? 0.28 : 0.18),
            zIndex: 10
          });
        }
      });

      polygonsMapRef.current.set(lote.numero, polygon);

      // Chapita circular centrada con AdvancedMarkerElement (Legibilidad mejorada)
      const badge = document.createElement('div');
      badge.id = `marker-badge-lote-${lote.numero}`;
      badge.className = `flex items-center justify-center rounded-full font-black text-white shadow-xl select-none transition-transform duration-150`;
      badge.style.width = '28px';
      badge.style.height = '28px';
      badge.style.fontSize = '12px';
      badge.style.fontWeight = '800';
      badge.style.lineHeight = '28px';
      badge.style.backgroundColor = isSold ? '#EF4444' : '#10B981';
      badge.style.border = isSelected ? '2.5px solid #FBBF24' : '2px solid #FFFFFF';
      badge.style.boxShadow = isSelected
        ? '0 0 0 5px rgba(251, 191, 36, 0.5), 0 4px 12px rgba(0,0,0,0.85)'
        : '0 2px 8px rgba(0, 0, 0, 0.75)';
      badge.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.9)';
      badge.style.cursor = 'pointer';
      badge.style.transform = isSelected ? 'scale(1.25)' : 'scale(1)';
      badge.style.opacity = isFilteredOut ? '0.25' : '1';
      badge.textContent = String(lote.numero);

      const shouldShowMarker = currentZoom >= SEMANTIC_ZOOM_THRESHOLD || isSelected;

      const marker = new AdvancedMarkerElement({
        map: shouldShowMarker ? map : null,
        position: { lat: lote.centroide.lat, lng: lote.centroide.lng },
        content: badge,
        title: `Lote ${lote.numero} - Manzana ${lote.manzana} (${isSold ? 'Vendido' : 'Disponible'})`,
        gmpClickable: true
      });

      marker.addListener('click', () => {
        handleSelectLote(lote);
      });

      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        handleSelectLote(lote);
      });

      markersMapRef.current.set(lote.numero, marker);
      badgeElementsMapRef.current.set(lote.numero, badge);
    });

    return () => {
      polygonsMapRef.current.forEach((poly) => poly.setMap(null));
      markersMapRef.current.forEach((marker) => {
        marker.map = null;
      });
    };
  }, [activeMode, mapInstance, kmlLotes, handleSelectLote]);

  // Actualización reactiva de estilos al cambiar lote seleccionado, filtros o zoom semántico
  useEffect(() => {
    if (activeMode !== 'satellite' || kmlLotes.length === 0) return;
    const map = mapInstance || mapInstanceRef.current;
    if (!map) return;

    kmlLotes.forEach((lote) => {
      const polygon = polygonsMapRef.current.get(lote.numero);
      const marker = markersMapRef.current.get(lote.numero);
      const badge = badgeElementsMapRef.current.get(lote.numero);
      if (!polygon || !badge) return;

      const isSold = lote.estado === 'vendido';
      const isSelected = selectedLote?.numero === lote.numero || selectedLote?.id === lote.id;
      const isHovered = hoveredLoteNum === lote.numero;
      const isFilteredOut =
        (selectedManzanaFilter && selectedManzanaFilter !== 'all' && lote.manzana !== selectedManzanaFilter) ||
        (filteredLoteIds && !filteredLoteIds.has(lote.id));

      const strokeColor = isSelected ? '#FBBF24' : (isHovered ? '#FDE047' : '#FFFFFF');
      const strokeOpacity = isFilteredOut ? 0.2 : (isSelected || isHovered ? 1.0 : 0.90);
      const strokeWeight = isSelected ? 3.0 : (isHovered ? 2.2 : 1.5);
      const fillOpacity = isFilteredOut
        ? 0.04
        : isSelected
        ? (isSold ? 0.60 : 0.40)
        : isHovered
        ? (isSold ? 0.45 : 0.32)
        : (isSold ? 0.28 : 0.18);
      const zIndex = isSelected ? 40 : (isHovered ? 25 : 10);

      polygon.setOptions({
        strokeColor,
        strokeOpacity,
        strokeWeight,
        fillColor: isSold ? '#EF4444' : '#10B981',
        fillOpacity,
        zIndex
      });

      // Zoom Semántico: Ocultar pines cuando zoom < 17.5, mostrar cuando zoom >= 17.5 (o lote seleccionado)
      if (marker && map) {
        const shouldShowMarker = currentZoom >= SEMANTIC_ZOOM_THRESHOLD || isSelected;
        marker.map = shouldShowMarker ? map : null;
      }

      badge.style.backgroundColor = isSold ? '#EF4444' : '#10B981';
      badge.style.border = isSelected ? '2.5px solid #FBBF24' : '2px solid #FFFFFF';
      badge.style.boxShadow = isSelected
        ? '0 0 0 5px rgba(251, 191, 36, 0.5), 0 4px 12px rgba(0,0,0,0.85)'
        : '0 2px 8px rgba(0, 0, 0, 0.75)';
      badge.style.transform = isSelected ? 'scale(1.25)' : 'scale(1)';
      badge.style.opacity = isFilteredOut ? '0.25' : '1';
      badge.style.zIndex = isSelected ? '99' : '1';
    });
  }, [activeMode, mapInstance, selectedLote, selectedManzanaFilter, filteredLoteIds, kmlLotes, currentZoom, hoveredLoteNum]);

  // Alternar inclinación dron / cenital en satelital
  const toggleViewMode = useCallback(() => {
    const map = mapInstance || mapInstanceRef.current;
    if (!map) return;

    if (viewMode === 'dron') {
      map.setTilt(0);
      setViewMode('cenital');
    } else {
      map.setTilt(50);
      setViewMode('dron');
    }
  }, [mapInstance, viewMode]);

  const handleZoomIn = () => {
    const map = mapInstance || mapInstanceRef.current;
    if (map) {
      map.setZoom((map.getZoom() || DEFAULT_ZOOM) + 1);
    }
  };

  const handleZoomOut = () => {
    const map = mapInstance || mapInstanceRef.current;
    if (map) {
      map.setZoom((map.getZoom() || DEFAULT_ZOOM) - 1);
    }
  };

  const handleRecenter = () => {
    const map = mapInstance || mapInstanceRef.current;
    if (map) {
      map.panTo(PUCHETA_CENTER);
      map.setZoom(DEFAULT_ZOOM);
    }
  };

  const handleResetNorth = () => {
    const map = mapInstance || mapInstanceRef.current;
    if (map) {
      map.setHeading(0);
      setHeading(0);
    }
  };

  // Guardar clave personalizada en localStorage
  const handleSaveCustomKey = () => {
    const trimmed = inputKey.trim();
    if (trimmed) {
      localStorage.setItem('gmaps_custom_api_key', trimmed);
      (window as unknown as { __GMAPS_AUTH_FAILED__?: boolean }).__GMAPS_AUTH_FAILED__ = false;
      setApiKey(trimmed);
      setKeySavedToast(true);
      setMapError(null);
      setTimeout(() => {
        setKeySavedToast(false);
        setIsKeyModalOpen(false);
        setActiveMode('satellite');
      }, 1000);
    }
  };

  return (
    <div
      id="masterplan-viewer-container"
      className={`w-full h-full relative overflow-hidden bg-zinc-950 select-none ${className}`}
    >
      {/* ========================================================================= */}
      {/* VISTA 1: PLANO 3D ARQUITECTÓNICO (THREE.JS)                               */}
      {/* ========================================================================= */}
      <div className={`w-full h-full ${activeMode === '3d' ? 'block' : 'hidden'}`}>
        <ErrorBoundary
          name="Canvas3D"
          fallback={({ error, resetError }) => (
            <Canvas3DErrorFallback
              error={error}
              resetError={resetError}
              onSwitchToSatellite={() => {
                if (hasValidKey) {
                  setActiveMode('satellite');
                } else {
                  setIsKeyModalOpen(true);
                }
              }}
            />
          )}
        >
          <Canvas3D
            lotes={lotesProp}
            selectedLote={selectedLote}
            onSelectLote={onSelectLote}
            colorMode={colorMode}
            onChangeColorMode={onChangeColorMode}
            selectedManzanaFilter={selectedManzanaFilter}
            filteredLoteIds={filteredLoteIds}
            isActive={activeMode === '3d'}
          />
        </ErrorBoundary>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 2: VISUALIZADOR SATELITAL GOOGLE MAPS                               */}
      {/* ========================================================================= */}
      <div className={`w-full h-full relative ${activeMode === 'satellite' ? 'block' : 'hidden'}`}>
        <div ref={mapContainerRef} className="w-full h-full" id="google-masterplan-map-canvas" />

        {isMapLoading && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-xs text-white">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
            <p className="text-sm font-semibold tracking-wide">Cargando Masterplan Satelital...</p>
            <span className="text-xs text-zinc-400 mt-1">Sincronizando parcelamiento catastral oficial</span>
          </div>
        )}

        {/* HUD PARTE DEL PLANO: DOCK VERTICAL DE NAVEGACIÓN (DERECHA) */}
        <div
          id="hud-vertical-dock"
          className="absolute top-16 right-3 sm:right-4 z-30 flex flex-col items-center bg-zinc-900/80 hover:bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-1 gap-1 text-zinc-200 transition-all"
        >
          {/* Alternar ángulo Dron 50° vs Cenital 0° */}
          <button
            id="btn-toggle-drone-mode"
            onClick={toggleViewMode}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              viewMode === 'dron'
                ? 'bg-emerald-500/20 text-emerald-400 font-extrabold text-xs border border-emerald-500/40'
                : 'text-zinc-300 hover:text-white hover:bg-white/10 font-bold text-xs'
            }`}
            title={viewMode === 'dron' ? 'Cambiar a vista Cenital 2D (0°)' : 'Cambiar a vista 3D Perspectiva (50°)'}
          >
            {viewMode === 'dron' ? '3D' : '2D'}
          </button>

          {/* Brújula interactiva: rota con el heading */}
          <button
            id="btn-recenter-north"
            onClick={handleResetNorth}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Alinear cámara al Norte real"
          >
            <Compass
              className="w-4 h-4 text-rose-400 transition-transform duration-300"
              style={{ transform: `rotate(${-heading}deg)` }}
            />
          </button>

          <div className="w-5 h-px bg-white/10 my-0.5" />

          {/* Zoom In */}
          <button
            id="btn-zoom-in"
            onClick={handleZoomIn}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Acercar mapa"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Zoom Out */}
          <button
            id="btn-zoom-out"
            onClick={handleZoomOut}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Alejar mapa"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <div className="w-5 h-px bg-white/10 my-0.5" />

          {/* Recentrar Terreno */}
          <button
            id="btn-recenter"
            onClick={handleRecenter}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Encuadrar todo el desarrollo inmobiliario"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* CARD FLOTANTE DE LOTE (DARK MODE INMERSIVA / ESTUDIO FBX)                 */}
        {/* ========================================================================= */}
        {selectedLote && (
          <div
            id={`floating-lote-card-${selectedLote.numero ?? selectedLote.id}`}
            className="hidden sm:flex absolute bottom-4 left-3 sm:left-6 z-40 w-[calc(100%-1.5rem)] sm:w-[410px] max-w-md bg-zinc-950/90 text-white backdrop-blur-xl border border-zinc-800 shadow-2xl rounded-2xl p-5 animate-fade-in pointer-events-auto max-h-[85vh] overflow-y-auto flex-col"
          >
            {/* Header: Lote Grande, Manzana, Badge de Estado y Botón Cerrar */}
            <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 pb-3 mb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                    Lote {selectedLote.numero ?? selectedLote.id}
                  </h3>
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 bg-zinc-900 border border-zinc-700/80 px-2 py-0.5 rounded-md">
                    Mz. {selectedLote.manzana}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-emerald-400" />
                  <span>Riveras de Pucheta · La Caldera, Salta</span>
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Badge de estado con punto de color */}
                {selectedLote.estado === 'vendido' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    <span className="w-2 h-2 rounded-full bg-rose-500 ring-4 ring-rose-500/20" />
                    Vendido
                  </span>
                ) : selectedLote.estado === 'reservado' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <span className="w-2 h-2 rounded-full bg-amber-400 ring-4 ring-amber-400/20" />
                    Reservado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20 animate-pulse" />
                    Disponible
                  </span>
                )}

                {/* Botón cerrar */}
                <button
                  id="btn-close-floating-card"
                  onClick={() => onSelectLote(null)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-xl transition-colors cursor-pointer"
                  title="Cerrar tarjeta"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* PESTAÑAS INTERNAS DE LA TARJETA FLOTANTE */}
            <div className="flex items-center p-1 bg-zinc-900/90 rounded-xl border border-zinc-800/90 mb-3 text-xs font-semibold shrink-0">
              <button
                id="tab-btn-ficha-comercial"
                onClick={() => setCardActiveTab('comercial')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  cardActiveTab === 'comercial'
                    ? 'bg-zinc-800 text-white shadow-sm font-extrabold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ficha</span>
              </button>

              <button
                id="tab-btn-mensura-rumbos"
                onClick={() => setCardActiveTab('mensura')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  cardActiveTab === 'mensura'
                    ? 'bg-zinc-800 text-white shadow-sm font-extrabold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Mensura</span>
              </button>

              <button
                id="tab-btn-simulador-cuotas"
                onClick={() => setCardActiveTab('cuotas')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  cardActiveTab === 'cuotas'
                    ? 'bg-zinc-800 text-white shadow-sm font-extrabold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Cuotas</span>
              </button>
            </div>

            {/* CONTENIDO DE LAS PESTAÑAS */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
              {/* PESTAÑA 1: FICHA COMERCIAL */}
              {cardActiveTab === 'comercial' && (
                <div className="space-y-3 animate-fade-in">
                  {/* Métricas: Superficie exactas, Frente x Fondo, Orientación */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-xl p-2.5">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 block mb-0.5">
                        Superficie Total
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-white">
                          {selectedLote.area_m2 ? selectedLote.area_m2.toFixed(1) : '300.0'}
                        </span>
                        <span className="text-xs font-bold text-zinc-400">m²</span>
                      </div>
                    </div>

                    <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-xl p-2.5">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 block mb-0.5">
                        Frente × Fondo
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-white">
                          {selectedLote.frente_m ? selectedLote.frente_m.toFixed(1) : '10'}m
                        </span>
                        <span className="text-xs font-medium text-zinc-400">×</span>
                        <span className="text-xl font-black text-white">
                          {selectedLote.fondo_m ? selectedLote.fondo_m.toFixed(1) : '30'}m
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Orientación y Altitud */}
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-2 flex items-center justify-between">
                      <span className="text-zinc-400 text-[11px]">Orientación</span>
                      <span className="font-bold text-zinc-200">
                        {selectedLote.orientacion || 'Norte-Sur'}
                      </span>
                    </div>
                    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-2 flex items-center justify-between">
                      <span className="text-zinc-400 text-[11px]">Altitud</span>
                      <span className="font-bold text-emerald-400">~1,420 msnm</span>
                    </div>
                  </div>

                  {/* Precio sugerido en USD y estimación por m² */}
                  <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-3">
                    {selectedLote.estado === 'vendido' ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 block">
                            Estado Comercial
                          </span>
                          <span className="text-sm sm:text-base font-bold text-zinc-300">
                            Unidad Adjudicada
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-500">
                          No disponible para venta
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400/90 block">
                            Precio Total Contado
                          </span>
                          <span className="text-2xl font-black text-white tracking-tight">
                            USD ${lotePrecioUsd.toLocaleString('en-US')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 block">
                            Estimado / m²
                          </span>
                          <span className="text-xs font-bold text-emerald-400">
                            USD ${Math.round(lotePrecioUsd / (selectedLote.area_m2 || 300))} / m²
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botones de acción rápida: Copiar Ficha y Reenfocar 3D */}
                  <div className="flex items-center gap-2">
                    <button
                      id="btn-copy-ficha-comercial"
                      onClick={handleCopyFicha}
                      className="flex-1 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedFicha ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Copiar Ficha</span>
                        </>
                      )}
                    </button>

                    <button
                      id="btn-recenter-camera-flyto"
                      onClick={() => handleSelectLote(selectedLote)}
                      className="py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Reenfocar cámara 3D"
                    >
                      <Navigation className="w-3.5 h-3.5 text-amber-400" />
                      <span>Reenfocar 3D</span>
                    </button>
                  </div>
                </div>
              )}

              {/* PESTAÑA 2: MENSURA & RUMBOS */}
              {cardActiveTab === 'mensura' && (
                <div className="space-y-3 animate-fade-in text-xs">
                  {/* Resumen de mensura */}
                  <div className="grid grid-cols-2 gap-2 bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-2.5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-500 block">Vértices KML</span>
                      <span className="text-sm font-extrabold text-white">
                        {technicalPolygonData?.verticeCount ?? 4} Mojones
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-500 block">Perímetro Total</span>
                      <span className="text-sm font-extrabold text-white">
                        {technicalPolygonData?.perimetroTotal ?? 80.0} m
                      </span>
                    </div>
                  </div>

                  {/* Expediente y Catastro */}
                  <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">Jurisdicción:</span>
                      <span className="font-semibold text-zinc-200">Depto. La Caldera, Salta</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">Catastro Oficial:</span>
                      <span className="font-mono font-bold text-emerald-400">Matrícula 04-2024</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">Centroide Geodésico:</span>
                      <span className="font-mono text-zinc-300">
                        {selectedLote.lat.toFixed(6)}, {selectedLote.lon.toFixed(6)}
                      </span>
                    </div>
                  </div>

                  {/* Tabla de Rumbos y Distancias entre Vértices */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5">
                      Rumbos y Distancias (Lados de Mensura)
                    </span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {technicalPolygonData?.lados.map((lado, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/90 border border-zinc-800 text-[11px]"
                        >
                          <span className="font-bold text-amber-300">
                            {lado.desde} → {lado.hasta}
                          </span>
                          <span className="font-mono text-white font-semibold">
                            {lado.distanciaM.toFixed(1)} m
                          </span>
                          <span className="font-mono text-emerald-400 font-bold">
                            {lado.rumbo}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coordenadas WGS84 de los Vértices */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5">
                      Coordenadas de Mojones (WGS84)
                    </span>
                    <div className="grid grid-cols-1 gap-1 max-h-28 overflow-y-auto">
                      {technicalPolygonData?.vertices.map((vert) => (
                        <div
                          key={vert.id}
                          className="flex items-center justify-between px-2 py-1 rounded bg-zinc-900/60 border border-zinc-800/60 text-[10px] font-mono text-zinc-300"
                        >
                          <span className="text-amber-400 font-bold">{vert.id}</span>
                          <span>Lat: {vert.lat.toFixed(6)}</span>
                          <span>Lng: {vert.lng.toFixed(6)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* PESTAÑA 3: PLAN DE FINANCIACIÓN OFICIAL ARGENSALTA */}
              {cardActiveTab === 'cuotas' && (
                <div className="space-y-3 animate-fade-in text-xs">
                  {/* Tarjeta Plan Oficial */}
                  <div className="bg-gradient-to-br from-zinc-900 to-emerald-950/40 border-2 border-emerald-500/50 rounded-xl p-3 space-y-2.5 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider">
                        Plan Oficial ArgenSALTA
                      </span>
                      <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                        Financiación Propia
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-zinc-950/80 rounded-lg p-2.5 border border-zinc-800">
                        <span className="text-[10px] text-zinc-400 font-medium block">Entrega Inicial</span>
                        <span className="text-base font-black text-white">USD ${PROMO_CONFIG.financiacion.entregaUSD.toLocaleString()}</span>
                        <span className="text-[9px] text-zinc-500 block">Posesión inmediata</span>
                      </div>

                      <div className="bg-zinc-950/80 rounded-lg p-2.5 border border-emerald-500/30">
                        <span className="text-[10px] text-emerald-400 font-medium block">15 Cuotas Fijas</span>
                        <span className="text-base font-black text-emerald-400">USD ${PROMO_CONFIG.financiacion.cuotaMontoUSD} / mes</span>
                        <span className="text-[9px] text-zinc-400 block">Sin interés ni bancos</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-800/80 text-zinc-300">
                      <span>Total Plan: <strong>USD ${(PROMO_CONFIG.financiacion.entregaUSD + (PROMO_CONFIG.financiacion.cuotasCantidad * PROMO_CONFIG.financiacion.cuotaMontoUSD)).toLocaleString()}</strong></span>
                      <span className="text-amber-400 text-[10px] font-bold">15 meses de plazo</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-zinc-400 text-center">
                    Plan directo con el desarrollador · Aprobación con DNI · Sin recibo de sueldo bancario
                  </div>

                  {/* Botón Solicitar este plan por WhatsApp */}
                  <a
                    id="btn-solicitar-plan-cuotas"
                    href={whatsappCuotasUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                  >
                    <MessageSquare className="w-3.5 h-3.5 fill-zinc-950" />
                    <span>Solicitar Plan Entrega USD 3.500 + 15x200 por WhatsApp</span>
                  </a>
                </div>
              )}
            </div>

            {/* FOOTER DE LA CARD: WHATSAPP GENERAL Y VOLVER */}
            <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-2 shrink-0">
              {cardActiveTab !== 'cuotas' && (
                <a
                  id="btn-whatsapp-lote-fbx"
                  href={whatsappComercialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                >
                  <MessageSquare className="w-4 h-4 fill-zinc-950" />
                  <span>Consultar / Señar por WhatsApp</span>
                </a>
              )}

              <button
                id="btn-reset-overview-masterplan"
                onClick={handleResetOverview}
                className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                <span>Volver a vista general del Masterplan</span>
              </button>
            </div>
          </div>
        )}

        {/* Hover Micro-Badge cuando no hay lote seleccionado */}
        {!selectedLote && hoveredLoteNum && (
          <div className="absolute bottom-5 left-3 sm:left-6 z-30 pointer-events-none animate-fade-in">
            <div className="bg-zinc-950/90 text-white backdrop-blur-md border border-zinc-800 px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold">Lote {hoveredLoteNum}</span>
              <span className="text-zinc-400 text-[11px]">· Clic para zoom cinemático 3D</span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ESCUDO OFICIAL CONCRETAR DESARROLLOS (+15 AÑOS DE TRAYECTORIA)             */}
      {/* ========================================================================= */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
        <EscudoConcretar />
      </div>

      {/* ========================================================================= */}
      {/* HUD SUPERIOR INTEGRADO AL PLANO: PILL DE DISPONIBILIDAD Y SELECTOR         */}
      {/* ========================================================================= */}
      {/* Izquierda: Pill de disponibilidad discreto */}
      <div className="absolute top-3 left-3 sm:left-4 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-950/85 backdrop-blur-xl border border-zinc-800 text-xs text-zinc-200 shadow-xl">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30" />
          <span>{counts.disponibles} Disp.</span>
        </span>
        <span className="text-zinc-600">·</span>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-500/30" />
          <span>{counts.vendidos} Vend.</span>
        </span>
      </div>

      {/* Derecha: Segmented pill selector [Satelital | 3D] integrado */}
      <div className="absolute top-3 right-3 sm:right-4 z-30 flex items-center p-1 bg-zinc-950/85 backdrop-blur-xl border border-zinc-800 rounded-full shadow-2xl">
        <button
          id="btn-switch-mode-satellite"
          onClick={() => {
            setActiveMode('satellite');
          }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
            activeMode === 'satellite'
              ? 'bg-emerald-500 text-zinc-950 shadow-sm font-extrabold'
              : 'text-zinc-300 hover:text-white'
          }`}
          title="Vista satelital ortofoto con parcelamiento oficial KML"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Satelital</span>
        </button>

        <button
          id="btn-switch-mode-3d"
          onClick={() => setActiveMode('3d')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
            activeMode === '3d'
              ? 'bg-zinc-100 text-zinc-950 shadow-sm font-extrabold'
              : 'text-zinc-300 hover:text-white'
          }`}
          title="Plano 3D arquitectónico interactivo"
        >
          <Box className="w-3.5 h-3.5 text-zinc-800" />
          <span>3D Studio</span>
        </button>
      </div>

      {/* Notificación suave si Google Maps requiere activación o clave */}
      {mapError && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 max-w-md w-[92%] bg-zinc-900/95 border border-amber-500/80 text-amber-200 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-xs animate-fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white text-[11px]">Sincronización Satelital</p>
              <p className="text-zinc-300 text-[11px] leading-relaxed mt-0.5">{mapError}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                (window as unknown as { __GMAPS_AUTH_FAILED__?: boolean }).__GMAPS_AUTH_FAILED__ = false;
                setMapError(null);
                setIsMapLoading(true);
                setActiveMode('satellite');
              }}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-[11px] transition-colors shadow-sm"
              title="Volver a intentar conectar con Google Maps Satelital"
            >
              Reintentar
            </button>
            <button
              onClick={() => setMapError(null)}
              className="text-zinc-400 hover:text-white p-1 rounded-lg"
              title="Cerrar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL PARA CONFIGURAR API KEY DE GOOGLE MAPS                             */}
      {/* ========================================================================= */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Vista Satelital Google Maps</h3>
              </div>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Para desplegar la ortofoto satelital oficial y la perspectiva dron en tiempo real, tu proyecto en Google Cloud debe tener activada la biblioteca <strong className="text-white">Maps JavaScript API</strong>. Puedes configurar tu <code className="text-emerald-400 font-mono bg-zinc-800 px-1 py-0.5 rounded">VITE_GOOGLE_MAPS_API_KEY</code> o ingresar una credencial para esta sesión:
            </p>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Google Maps API Key:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="AIzaSy..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-mono text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleSaveCustomKey}
                  disabled={!inputKey.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                >
                  {keySavedToast ? <Check className="w-4 h-4" /> : <Key className="w-4 h-4" />}
                  <span>{keySavedToast ? '¡Guardada!' : 'Activar'}</span>
                </button>
              </div>
            </div>

            <div className="bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/60 text-[11px] text-zinc-400 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>¿Error ApiNotActivatedMapError?</span>
              </div>
              <p>
                Si tu API Key es válida pero ves el error de activación, habilita la biblioteca en tu consola:{' '}
                <a
                  href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                >
                  Habilitar Maps JavaScript API
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </p>
              <p className="text-zinc-500">
                El <strong>Plano 3D Arquitectónico nativo</strong> permanece 100% interactivo en todo momento sin requerir servicios externos.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
