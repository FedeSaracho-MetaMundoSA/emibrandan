import React, { useEffect, useRef, useState, useMemo } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { Lote } from '../types';
import { 
  AMENIDADES_CERCANAS, 
  COORDENADAS_PROYECTO, 
  AmenidadCercana, 
  calcularDistanciaMetros, 
  formatearDistancia 
} from '../data/amenidadesData';
import { 
  MapPin, 
  Hotel, 
  Trees, 
  Store, 
  ExternalLink, 
  AlertTriangle, 
  Check, 
  Copy, 
  ZoomIn, 
  ZoomOut, 
  Compass, 
  Key, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Navigation, 
  Layers,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface MapViewerProps {
  selectedLote?: Lote | null;
  className?: string;
  height?: string;
  onSelectLote?: (lote: Lote) => void;
}

export const MapViewer: React.FC<MapViewerProps> = ({
  selectedLote,
  className = '',
  height
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapInstance = useRef<google.maps.Map | null>(null);
  const selectedLotMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | google.maps.Marker | null>(null);
  const amenityMarkersRef = useRef<(google.maps.marker.AdvancedMarkerElement | google.maps.Marker)[]>([]);
  const projectMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // API Key state: check env, fallback provided key, or localStorage
  const envKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || 'AIzaSyAR0-2J_zEyfaiAJozCSUziZ9zTbE1daIM';
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('gmaps_custom_api_key') || envKey;
  });
  const [inputKey, setInputKey] = useState<string>('');
  const [isKeySaved, setIsKeySaved] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);

  // Status flags
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filter for amenities
  const [categoriaFiltro, setCategoriaFiltro] = useState<'all' | 'hotel' | 'plaza' | 'servicio'>('all');

  // Fallback simulator state
  const [fallbackZoom, setFallbackZoom] = useState<number>(15);
  const [fallbackCenter, setFallbackCenter] = useState<{ lat: number; lon: number }>({
    lat: COORDENADAS_PROYECTO.lat,
    lon: COORDENADAS_PROYECTO.lon
  });
  const [activePopup, setActivePopup] = useState<{
    id: string;
    nombre: string;
    subtitulo: string;
    categoria?: 'hotel' | 'plaza' | 'servicio' | 'lote' | 'proyecto';
    distancia?: string;
    lat: number;
    lon: number;
  } | null>(null);

  // Coordinates of reference point (selected lot, or project center)
  const puntoReferencia = useMemo(() => {
    if (selectedLote) {
      return { lat: selectedLote.lat, lon: selectedLote.lon, nombre: `Lote ${selectedLote.id}` };
    }
    return { lat: COORDENADAS_PROYECTO.lat, lon: COORDENADAS_PROYECTO.lon, nombre: 'Riveras de Pucheta' };
  }, [selectedLote]);

  // Amenities with dynamic distances
  const amenidadesConDistancia = useMemo(() => {
    return AMENIDADES_CERCANAS.map((amenidad) => {
      const distMetros = calcularDistanciaMetros(
        puntoReferencia.lat,
        puntoReferencia.lon,
        amenidad.lat,
        amenidad.lon
      );
      return {
        ...amenidad,
        distanciaMetros: distMetros,
        distanciaTexto: formatearDistancia(distMetros)
      };
    }).sort((a, b) => a.distanciaMetros - b.distanciaMetros);
  }, [puntoReferencia]);

  // Filtered amenities
  const amenidadesFiltradas = useMemo(() => {
    if (categoriaFiltro === 'all') return amenidadesConDistancia;
    return amenidadesConDistancia.filter((a) => a.categoria === categoriaFiltro);
  }, [amenidadesConDistancia, categoriaFiltro]);

  // Save custom API key
  const handleSaveApiKey = (keyToSave: string) => {
    const trimmed = keyToSave.trim();
    if (trimmed) {
      localStorage.setItem('gmaps_custom_api_key', trimmed);
      setApiKey(trimmed);
      setIsKeySaved(true);
      setLoadError(null);
      setTimeout(() => setIsKeySaved(false), 2500);
    } else {
      localStorage.removeItem('gmaps_custom_api_key');
      setApiKey('');
    }
  };

  // -------------------------------------------------------------
  // Hook useEffect: Cargar Google Maps JavaScript API
  // -------------------------------------------------------------
  useEffect(() => {
    // Si no hay API key válida (o es placeholder vacío), activamos fallback
    const keyValida = apiKey && apiKey !== 'MY_GOOGLE_MAPS_API_KEY' && apiKey.length > 10;
    if (!keyValida) {
      setIsMapLoaded(false);
      setLoadError('no_key');
      return;
    }

    if ((window as unknown as { __GMAPS_AUTH_FAILED__?: boolean }).__GMAPS_AUTH_FAILED__) {
      setIsMapLoaded(false);
      setLoadError('api_not_activated');
      return;
    }

    let isMounted = true;

    const handleAuthError = () => {
      if (isMounted) {
        setIsMapLoaded(false);
        setLoadError('api_not_activated');
      }
    };
    window.addEventListener('gmaps_auth_error', handleAuthError);

    try {
      setOptions({
        key: apiKey,
        v: 'weekly'
      });

      Promise.all([
        importLibrary('maps') as Promise<google.maps.MapsLibrary>,
        importLibrary('marker') as Promise<google.maps.MarkerLibrary>
      ])
        .then(([mapsLib, markerLib]) => {
          if (!isMounted || !mapRef.current) return;

          const { Map, InfoWindow } = mapsLib;
          const { AdvancedMarkerElement } = markerLib;

        infoWindowRef.current = new InfoWindow();

        // 2. Ubicar proyecto central (Salta, -24.5875, -65.3775)
        const initialCenter = selectedLote
          ? { lat: selectedLote.lat, lng: selectedLote.lon }
          : { lat: COORDENADAS_PROYECTO.lat, lng: COORDENADAS_PROYECTO.lon };

        const map = new Map(mapRef.current, {
          center: initialCenter,
          zoom: selectedLote ? 17 : 15,
          mapId: 'DEMO_MAP_ID', // Requerido para AdvancedMarkerElement
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          // Solution ID attribution override
          internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio']
        });

        googleMapInstance.current = map;
        setIsMapLoaded(true);
        setLoadError(null);

        // Marker para Proyecto Central (Salta, -24.5875, -65.3775)
        if (AdvancedMarkerElement) {
          const projectDiv = document.createElement('div');
          projectDiv.className = 'project-pin-container cursor-pointer';
          projectDiv.innerHTML = `
            <div style="background-color: #4F46E5; color: white; border-radius: 12px; padding: 6px 10px; font-weight: bold; font-size: 11px; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.4); border: 2px solid white; display: flex; align-items: center; gap: 4px;">
              <span>🏡</span>
              <span>Riveras de Pucheta</span>
            </div>
          `;
          const projectMarker = new AdvancedMarkerElement({
            map,
            position: { lat: COORDENADAS_PROYECTO.lat, lng: COORDENADAS_PROYECTO.lon },
            title: COORDENADAS_PROYECTO.nombre,
            content: projectDiv
          });
          projectMarker.addListener('click', () => {
            infoWindowRef.current?.setContent(`
              <div style="padding: 6px; font-family: sans-serif; color: #18181b;">
                <h4 style="margin: 0; font-size: 13px; font-weight: 800;">${COORDENADAS_PROYECTO.nombre}</h4>
                <p style="margin: 3px 0 0; font-size: 11px; color: #52525b;">${COORDENADAS_PROYECTO.subtitulo}</p>
                <div style="margin-top: 4px; font-size: 10px; color: #4F46E5; font-weight: bold;">Centro del Loteo (11.2 ha)</div>
              </div>
            `);
            infoWindowRef.current?.open({ anchor: projectMarker, map });
          });
          projectMarkerRef.current = projectMarker;
        }

        // 4. Mostrar amenidades cercanas (Hoteles, Plazas, Servicios)
        amenidadesConDistancia.forEach((amenidad) => {
          let markerElement: any;
          if (AdvancedMarkerElement) {
            const el = document.createElement('div');
            el.className = 'amenity-pin cursor-pointer transition-transform hover:scale-110';
            
            const bgColor = 
              amenidad.categoria === 'hotel' ? '#3B82F6' : 
              amenidad.categoria === 'plaza' ? '#10B981' : '#F59E0B';
            const iconEmoji = 
              amenidad.categoria === 'hotel' ? '🏨' : 
              amenidad.categoria === 'plaza' ? '🌳' : '🏪';

            el.innerHTML = `
              <div style="background-color: ${bgColor}; color: white; border-radius: 9999px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); border: 2px solid white;">
                ${iconEmoji}
              </div>
            `;

            markerElement = new AdvancedMarkerElement({
              map,
              position: { lat: amenidad.lat, lng: amenidad.lon },
              title: amenidad.nombre,
              content: el
            });

            // Click en pin → muestra popup con nombre y distancia
            markerElement.addListener('click', () => {
              infoWindowRef.current?.setContent(`
                <div style="padding: 6px; font-family: sans-serif; color: #18181b; min-width: 170px;">
                  <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
                    <span>${iconEmoji}</span>
                    <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${bgColor};">${amenidad.categoria}</span>
                  </div>
                  <h4 style="margin: 0; font-size: 13px; font-weight: 800;">${amenidad.nombre}</h4>
                  <p style="margin: 3px 0 0; font-size: 11px; color: #52525b;">${amenidad.subtitulo}</p>
                  <div style="margin-top: 6px; padding: 3px 6px; background-color: #f4f4f5; border-radius: 6px; font-size: 11px; font-weight: 600; color: #047857; display: inline-block;">
                    📍 Distancia: ${amenidad.distanciaTexto}
                  </div>
                </div>
              `);
              infoWindowRef.current?.open({ anchor: markerElement, map });
            });

            amenityMarkersRef.current.push(markerElement);
          }
        });
      })
      .catch((err) => {
        console.warn('Error al cargar Google Maps API:', err);
        if (isMounted) {
          setIsMapLoaded(false);
          const msg = String(err?.message || '');
          if (msg.includes('ApiNotActivated') || msg.includes('ApiProject') || msg.includes('Script error')) {
            setLoadError('api_not_activated');
          } else {
            setLoadError(err?.message || 'error_loading');
          }
        }
      });
    } catch (err: any) {
      console.warn('Error al configurar Google Maps API:', err);
      setIsMapLoaded(false);
      setLoadError(err?.message || 'error_config');
    }

    return () => {
      isMounted = false;
      window.removeEventListener('gmaps_auth_error', handleAuthError);
      // Cleanup markers
      amenityMarkersRef.current.forEach((m) => {
        if ('map' in m) m.map = null;
      });
      amenityMarkersRef.current = [];
    };
  }, [apiKey]);

  // -------------------------------------------------------------
  // Hook useEffect: Actualizar mapa y Pin Rojo cuando cambia lote
  // -------------------------------------------------------------
  useEffect(() => {
    if (!googleMapInstance.current || !isMapLoaded) return;
    const map = googleMapInstance.current;

    // Si hay lote seleccionado:
    if (selectedLote) {
      const lotePos = { lat: selectedLote.lat, lng: selectedLote.lon };

      // Zoom automático a lote cuando se selecciona
      map.panTo(lotePos);
      map.setZoom(17);

      // 3. Marcar lote seleccionado con pin rojo
      if (selectedLotMarkerRef.current) {
        if ('position' in selectedLotMarkerRef.current) {
          selectedLotMarkerRef.current.position = lotePos;
        }
      } else {
        // Crear pin rojo destacado
        const lotDiv = document.createElement('div');
        lotDiv.className = 'selected-lote-pin cursor-pointer animate-bounce';
        lotDiv.innerHTML = `
          <div style="background-color: #EF4444; color: white; border-radius: 9999px; padding: 6px 9px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.6); border: 2.5px solid white; display: flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 900;">
            <span>🔴</span>
            <span>Lote ${selectedLote.id}</span>
          </div>
        `;

        // @ts-ignore
        if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
          // @ts-ignore
          const lotMarker = new google.maps.marker.AdvancedMarkerElement({
            map,
            position: lotePos,
            title: `Lote ${selectedLote.id}`,
            content: lotDiv
          });

          lotMarker.addListener('click', () => {
            infoWindowRef.current?.setContent(`
              <div style="padding: 6px; font-family: sans-serif; color: #18181b;">
                <div style="font-size: 10px; font-weight: 700; color: #DC2626; text-transform: uppercase;">Lote Seleccionado</div>
                <h4 style="margin: 2px 0 0; font-size: 14px; font-weight: 900;">Lote ${selectedLote.id} (Manzana ${selectedLote.manzana})</h4>
                <p style="margin: 2px 0 0; font-size: 11px; color: #52525b;">${selectedLote.area_m2.toFixed(1)} m² • $USD ${selectedLote.precio_usd.toLocaleString()}</p>
              </div>
            `);
            infoWindowRef.current?.open({ anchor: lotMarker, map });
          });

          selectedLotMarkerRef.current = lotMarker;
        }
      }
    } else {
      // Si se deselecciona, volver a vista del proyecto
      map.panTo({ lat: COORDENADAS_PROYECTO.lat, lng: COORDENADAS_PROYECTO.lon });
      map.setZoom(15);

      if (selectedLotMarkerRef.current) {
        if ('map' in selectedLotMarkerRef.current) {
          selectedLotMarkerRef.current.map = null;
        }
        selectedLotMarkerRef.current = null;
      }
    }
  }, [selectedLote, isMapLoaded]);

  // Centrar en una amenidad al hacer click en la lista
  const handleFocusAmenidad = (amenidad: AmenidadCercana) => {
    if (googleMapInstance.current && isMapLoaded) {
      googleMapInstance.current.panTo({ lat: amenidad.lat, lng: amenidad.lon });
      googleMapInstance.current.setZoom(16);
    } else {
      setFallbackCenter({ lat: amenidad.lat, lon: amenidad.lon });
      setFallbackZoom(16);
      setActivePopup({
        id: amenidad.id,
        nombre: amenidad.nombre,
        subtitulo: amenidad.subtitulo,
        categoria: amenidad.categoria,
        distancia: formatearDistancia(calcularDistanciaMetros(puntoReferencia.lat, puntoReferencia.lon, amenidad.lat, amenidad.lon)),
        lat: amenidad.lat,
        lon: amenidad.lon
      });
    }
  };

  // Helper para renderizar iconos según categoría
  const renderCategoryIcon = (cat: 'hotel' | 'plaza' | 'servicio') => {
    switch (cat) {
      case 'hotel':
        return <Hotel className="w-3.5 h-3.5 text-sky-500" />;
      case 'plaza':
        return <Trees className="w-3.5 h-3.5 text-emerald-500" />;
      case 'servicio':
        return <Store className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  return (
    <div id="google-map-viewer-component" className={`flex flex-col bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header del Visor de Mapa */}
      <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              <span>Ubicación & Amenidades</span>
              {selectedLote && (
                <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 font-bold px-1.5 py-0.2 rounded-md">
                  Lote {selectedLote.id}
                </span>
              )}
            </h3>
            <span className="text-[10px] text-zinc-400 block -mt-0.5">
              Salta • -24.5875, -65.3775
            </span>
          </div>
        </div>

        {/* Botón de configuración / aviso de API Key */}
        <button
          id="btn-toggle-key-config"
          onClick={() => setShowInstructions(!showInstructions)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
            !isMapLoaded
              ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
          title="Configurar Google Maps API Key"
        >
          <Key className="w-3 h-3 text-amber-600" />
          <span>{isMapLoaded ? 'API Key Activa' : 'Configurar API Key'}</span>
          {showInstructions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* ========================================================= */}
      {/* SECCIÓN DE AVISO & INSTRUCCIONES DE GOOGLE CLOUD CONSOLE */}
      {/* ========================================================= */}
      {(!isMapLoaded || showInstructions) && (
        <div id="api-key-notice-panel" className="bg-amber-50/90 border-b border-amber-200/80 p-3.5 text-xs text-amber-950 space-y-2.5 animate-fade-in">
          {loadError === 'api_not_activated' && (
            <div className="bg-amber-100/90 border border-amber-300 text-amber-900 p-3 rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>ApiNotActivatedMapError: Maps JavaScript API no está activada</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Tu API Key está registrada, pero el servicio <strong>Maps JavaScript API</strong> aún no ha sido habilitado en tu proyecto de Google Cloud Console.
              </p>
              <a
                href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:underline"
              >
                <span>Habilitar Maps JavaScript API en Google Cloud</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              {/* Frase solicitada por el usuario */}
              <p className="font-bold text-amber-900 leading-tight">
                Necesitas tu API Key de Google Cloud Console
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Para visualizar el mapa satelital interactivo en vivo con la Google Maps JavaScript API, ingresa tu clave o utiliza la clave de prueba gratuita.
              </p>
            </div>
          </div>

          {/* Instrucciones al usuario sobre cómo obtenerla */}
          <div className="bg-white/80 rounded-xl p-3 border border-amber-200 space-y-1.5 text-[11px] text-zinc-700">
            <span className="font-bold text-zinc-900 block">
              ¿Cómo obtener tu Google Maps API Key?
            </span>
            <ol className="list-decimal list-inside space-y-1 text-zinc-600 pl-0.5">
              <li>
                Accede a la consola:{' '}
                <a
                  href="https://console.cloud.google.com/google/maps-apis/credentials?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-indigo-600 hover:underline inline-flex items-center gap-0.5"
                >
                  Google Cloud Console Credentials
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>Habilita la biblioteca <strong>Maps JavaScript API</strong>.</li>
              <li>
                Crea una credencial <strong>API Key</strong> y restríngela por HTTP Referrer.
              </li>
              <li>
                O solicita una{' '}
                <a
                  href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-emerald-700 underline"
                >
                  Maps Demo Key gratuita
                </a>{' '}
                sin tarjeta de crédito para prototipado.
              </li>
            </ol>
          </div>

          {/* Formulario para ingresar / probar API Key con placeholder */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
              Ingresar / Modificar API Key:
            </label>
            <div className="flex gap-2">
              <input
                id="input-google-maps-api-key"
                type="text"
                placeholder="AIzaSy..." // Placeholder requerido por el usuario
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                id="btn-save-api-key"
                onClick={() => handleSaveApiKey(inputKey)}
                disabled={!inputKey.trim()}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1"
              >
                {isKeySaved ? <Check className="w-3.5 h-3.5" /> : null}
                {isKeySaved ? '¡Guardada!' : 'Probar Clave'}
              </button>
            </div>
            <p className="text-[10px] text-amber-700">
              También puedes declararla en tu archivo <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">.env</code> como <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">VITE_GOOGLE_MAPS_API_KEY</code>.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CONTENEDOR DEL MAPA (GOOGLE MAPS O FALLBACK SIMULADO)     */}
      {/* ========================================================= */}
      <div className="relative w-full h-64 bg-zinc-100 overflow-hidden">
        {/* Contenedor DOM para Google Maps JavaScript API */}
        <div
          ref={mapRef}
          id="google-maps-canvas"
          className={`w-full h-full ${isMapLoaded ? 'block' : 'hidden'}`}
        />

        {/* Fallback interactivo si no hay API Key o hubo error */}
        {!isMapLoaded && (
          <div
            id="fallback-map-container"
            className="w-full h-full relative bg-radial from-emerald-50/60 via-zinc-100 to-zinc-200 select-none overflow-hidden"
          >
            {/* Mapa esquemático de Salta (Río, Montañas, Terreno) */}
            <svg
              className="absolute inset-0 w-full h-full opacity-60"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Grilla geográfica */}
              <defs>
                <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-pattern)" />

              {/* Río La Caldera (Curva fluvial) */}
              <path
                d="M 280 0 Q 240 120 270 200 T 320 300"
                fill="none"
                stroke="#60A5FA"
                strokeWidth="14"
                strokeLinecap="round"
                className="opacity-70"
              />
              <path
                d="M 280 0 Q 240 120 270 200 T 320 300"
                fill="none"
                stroke="#93C5FD"
                strokeWidth="6"
                strokeLinecap="round"
              />

              {/* Polígono del Loteo Riveras de Pucheta */}
              <polygon
                points="130,80 230,70 240,190 120,180"
                fill="#818CF8"
                fillOpacity="0.25"
                stroke="#6366F1"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
            </svg>

            {/* Etiqueta Río */}
            <div className="absolute top-12 right-6 text-[10px] font-bold text-sky-600 bg-white/80 px-2 py-0.5 rounded-md border border-sky-200 backdrop-blur-xs shadow-2xs pointer-events-none">
              🌊 Río La Caldera
            </div>

            {/* Pin 1: Proyecto Central (Salta, -24.5875, -65.3775) */}
            <button
              id="fallback-pin-project-center"
              onClick={() => setActivePopup({
                id: 'center',
                nombre: COORDENADAS_PROYECTO.nombre,
                subtitulo: COORDENADAS_PROYECTO.subtitulo,
                categoria: 'proyecto',
                lat: COORDENADAS_PROYECTO.lat,
                lon: COORDENADAS_PROYECTO.lon
              })}
              className="absolute top-[48%] left-[45%] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg border-2 border-white ring-4 ring-indigo-500/20 group-hover:scale-110 transition-transform">
                <Compass className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold bg-zinc-900 text-white px-2 py-0.5 rounded-md mt-1 shadow-md whitespace-nowrap">
                Riveras de Pucheta
              </span>
            </button>

            {/* Pin 2: Lote Seleccionado con PIN ROJO */}
            {selectedLote && (
              <button
                id="fallback-pin-selected-lote"
                onClick={() => setActivePopup({
                  id: selectedLote.id,
                  nombre: `Lote ${selectedLote.id}`,
                  subtitulo: `Manzana ${selectedLote.manzana} • ${selectedLote.area_m2}m²`,
                  categoria: 'lote',
                  lat: selectedLote.lat,
                  lon: selectedLote.lon
                })}
                className="absolute top-[38%] left-[42%] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center cursor-pointer animate-pulse"
              >
                <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl border-2 border-white ring-4 ring-red-500/30">
                  <MapPin className="w-5 h-5 fill-white text-red-600" />
                </div>
                <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full mt-1 shadow-lg whitespace-nowrap border border-white">
                  🔴 Lote {selectedLote.id}
                </span>
              </button>
            )}

            {/* Pines de Amenidades Cercanas */}
            {/* Hotel 1 */}
            <button
              id="fallback-pin-hotel-1"
              onClick={() => handleFocusAmenidad(AMENIDADES_CERCANAS[0])}
              className="absolute top-[20%] left-[62%] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center group cursor-pointer"
              title={AMENIDADES_CERCANAS[0].nombre}
            >
              <div className="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md border-2 border-white group-hover:scale-115 transition-transform">
                <Hotel className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-bold bg-white text-zinc-800 px-1.5 py-0.5 rounded-md mt-0.5 shadow-xs border border-zinc-200 whitespace-nowrap">
                Hotel San Lorenzo
              </span>
            </button>

            {/* Hotel 2 */}
            <button
              id="fallback-pin-hotel-2"
              onClick={() => handleFocusAmenidad(AMENIDADES_CERCANAS[1])}
              className="absolute top-[82%] left-[65%] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center group cursor-pointer"
              title={AMENIDADES_CERCANAS[1].nombre}
            >
              <div className="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md border-2 border-white group-hover:scale-115 transition-transform">
                <Hotel className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-bold bg-white text-zinc-800 px-1.5 py-0.5 rounded-md mt-0.5 shadow-xs border border-zinc-200 whitespace-nowrap">
                Posada Yungas
              </span>
            </button>

            {/* Plaza 1 */}
            <button
              id="fallback-pin-plaza-1"
              onClick={() => handleFocusAmenidad(AMENIDADES_CERCANAS[2])}
              className="absolute top-[36%] left-[22%] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center group cursor-pointer"
              title={AMENIDADES_CERCANAS[2].nombre}
            >
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-white group-hover:scale-115 transition-transform">
                <Trees className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-bold bg-white text-zinc-800 px-1.5 py-0.5 rounded-md mt-0.5 shadow-xs border border-zinc-200 whitespace-nowrap">
                Plaza Central
              </span>
            </button>

            {/* Plaza 2 */}
            <button
              id="fallback-pin-plaza-2"
              onClick={() => handleFocusAmenidad(AMENIDADES_CERCANAS[3])}
              className="absolute top-[72%] left-[16%] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center group cursor-pointer"
              title={AMENIDADES_CERCANAS[3].nombre}
            >
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-white group-hover:scale-115 transition-transform">
                <Trees className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-bold bg-white text-zinc-800 px-1.5 py-0.5 rounded-md mt-0.5 shadow-xs border border-zinc-200 whitespace-nowrap">
                Parque Ribera
              </span>
            </button>

            {/* Servicio 1 */}
            <button
              id="fallback-pin-servicio-1"
              onClick={() => handleFocusAmenidad(AMENIDADES_CERCANAS[4])}
              className="absolute top-[18%] left-[26%] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center group cursor-pointer"
              title={AMENIDADES_CERCANAS[4].nombre}
            >
              <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md border-2 border-white group-hover:scale-115 transition-transform">
                <Store className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-bold bg-white text-zinc-800 px-1.5 py-0.5 rounded-md mt-0.5 shadow-xs border border-zinc-200 whitespace-nowrap">
                Paseo Comercial
              </span>
            </button>

            {/* Servicio 2 */}
            <button
              id="fallback-pin-servicio-2"
              onClick={() => handleFocusAmenidad(AMENIDADES_CERCANAS[5])}
              className="absolute top-[78%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center group cursor-pointer"
              title={AMENIDADES_CERCANAS[5].nombre}
            >
              <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md border-2 border-white group-hover:scale-115 transition-transform">
                <Store className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-bold bg-white text-zinc-800 px-1.5 py-0.5 rounded-md mt-0.5 shadow-xs border border-zinc-200 whitespace-nowrap">
                Estación & Market
              </span>
            </button>

            {/* Badge de advertencia interactiva sobre el mapa */}
            <div className="absolute bottom-2 left-2 bg-zinc-900/85 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              <span>Modo Simulación Geográfica (Haz click en los pines)</span>
            </div>
          </div>
        )}

        {/* POPUP FLOTANTE (Click en Pin → Muestra popup con nombre y distancia) */}
        {activePopup && (
          <div
            id="map-floating-popup"
            className="absolute top-3 left-3 right-3 z-30 bg-white/95 backdrop-blur-xs rounded-xl p-3 shadow-xl border border-zinc-200 flex items-start justify-between animate-fade-in"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                {activePopup.categoria === 'lote' ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                ) : activePopup.categoria === 'proyecto' ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                ) : (
                  renderCategoryIcon(activePopup.categoria as any)
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  {activePopup.categoria === 'lote'
                    ? 'Lote Seleccionado'
                    : activePopup.categoria === 'proyecto'
                    ? 'Ubicación Central'
                    : `Amenidad (${activePopup.categoria})`}
                </span>
              </div>
              <h4 className="text-xs font-black text-zinc-900">
                {activePopup.nombre}
              </h4>
              <p className="text-[11px] text-zinc-500">
                {activePopup.subtitulo}
              </p>
              {activePopup.distancia && (
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    📍 Distancia: {activePopup.distancia}
                  </span>
                  <a
                    href={`https://www.google.com/maps?q=${activePopup.lat},${activePopup.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-zinc-500 hover:text-indigo-600 flex items-center gap-0.5 underline"
                  >
                    Ver en Google Maps <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              )}
            </div>

            <button
              onClick={() => setActivePopup(null)}
              className="p-1 text-zinc-400 hover:text-zinc-700 rounded-md hover:bg-zinc-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* LISTA DE AMENIDADES CERCANAS CON DISTANCIA DINÁMICA       */}
      {/* ========================================================= */}
      <div className="p-3.5 space-y-2.5 bg-white">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
            <span>Amenidades Cercanas</span>
            <span className="text-[10px] text-zinc-400 font-normal">
              (calculado desde {puntoReferencia.nombre})
            </span>
          </span>

          {/* Filtros de Categoría */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCategoriaFiltro('all')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                categoriaFiltro === 'all'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setCategoriaFiltro('hotel')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-0.5 transition-colors ${
                categoriaFiltro === 'hotel'
                  ? 'bg-sky-600 text-white'
                  : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
              }`}
            >
              <Hotel className="w-2.5 h-2.5" />
              Hoteles
            </button>
            <button
              onClick={() => setCategoriaFiltro('plaza')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-0.5 transition-colors ${
                categoriaFiltro === 'plaza'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <Trees className="w-2.5 h-2.5" />
              Plazas
            </button>
            <button
              onClick={() => setCategoriaFiltro('servicio')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-0.5 transition-colors ${
                categoriaFiltro === 'servicio'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <Store className="w-2.5 h-2.5" />
              Servicios
            </button>
          </div>
        </div>

        {/* Lista scrolleable de amenidades */}
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {amenidadesFiltradas.map((amenidad) => {
            const isHighlighted = activePopup?.id === amenidad.id;

            return (
              <div
                key={amenidad.id}
                onClick={() => handleFocusAmenidad(amenidad)}
                className={`p-2 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                  isHighlighted
                    ? 'bg-indigo-50/80 border-indigo-300 shadow-2xs'
                    : 'bg-zinc-50/70 border-zinc-200/80 hover:bg-zinc-100 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0">
                    {renderCategoryIcon(amenidad.categoria)}
                  </div>
                  <div>
                    <h5 className="font-bold text-zinc-900 leading-tight">
                      {amenidad.nombre}
                    </h5>
                    <span className="text-[10px] text-zinc-500 block">
                      {amenidad.subtitulo}
                    </span>
                  </div>
                </div>

                {/* Badge de distancia destacada */}
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block">
                    {amenidad.distanciaTexto}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
