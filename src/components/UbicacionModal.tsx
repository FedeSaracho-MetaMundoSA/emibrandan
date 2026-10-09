import React from 'react';
import { X, MapPin, Download, ExternalLink, Globe, Compass, Mountain, CheckCircle2, Navigation } from 'lucide-react';
import { PROYECTO_INFO } from '../data/loteoData';
import { MapViewer } from './MapViewer';

interface UbicacionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UbicacionModal: React.FC<UbicacionModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Generate and download a real KML file for Google Earth
  const handleDownloadKML = () => {
    const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Riveras de Pucheta - Salta, Argentina</name>
    <description>Loteo Residencial Privado en La Caldera, Salta. 374 lotes sobre la margen del Río La Caldera.</description>
    <Style id="loteoPoly">
      <LineStyle>
        <color>ff00aaff</color>
        <width>3</width>
      </LineStyle>
      <PolyStyle>
        <color>4000ff00</color>
      </PolyStyle>
    </Style>
    <Placemark>
      <name>Riveras de Pucheta - Acceso Principal</name>
      <description>Ingreso y pórtico de control de acceso.</description>
      <Point>
        <coordinates>-65.3775,-24.5875,1340</coordinates>
      </Point>
    </Placemark>
    <Placemark>
      <name>Polígono General Riveras de Pucheta (11.2 ha)</name>
      <styleUrl>#loteoPoly</styleUrl>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              -65.3795,-24.5885,1340
              -65.3760,-24.5895,1338
              -65.3745,-24.5865,1336
              -65.3780,-24.5855,1342
              -65.3795,-24.5885,1340
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>`;

    const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Riveras_de_Pucheta_Salta.kml';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                Georreferenciación & Ubicación Real
              </h3>
              <p className="text-xs text-zinc-500">
                La Caldera • Salta, República Argentina
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Coordinates Card */}
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
                Coordenadas Geodésicas WGS84
              </span>
              <span className="text-xl font-mono font-bold text-emerald-950 block mt-0.5">
                {PROYECTO_INFO.coordenadas.lat}°, {PROYECTO_INFO.coordenadas.lon}°
              </span>
              <span className="text-xs text-emerald-700">
                {PROYECTO_INFO.coordenadas.formatted} • Altitud ~1.340 m.s.n.m.
              </span>
            </div>

            <a
              href={`https://www.google.com/maps?q=${PROYECTO_INFO.coordenadas.lat},${PROYECTO_INFO.coordenadas.lon}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <Navigation className="w-3.5 h-3.5" />
              Abrir en Google Maps
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          </div>

          {/* Visor de Mapa Interactivo Embebido con Amenidades */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-600" />
              Mapa Satelital & Amenidades del Entorno
            </h4>
            <MapViewer />
          </div>

          {/* Location details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              Puntos de Interés & Conectividad
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-zinc-700">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80">
                <span className="font-bold text-zinc-900 block mb-0.5">Río La Caldera</span>
                <p className="text-zinc-500 text-[11px]">
                  Borde este directo con Avenida Costanera y línea de ribera protegida.
                </p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80">
                <span className="font-bold text-zinc-900 block mb-0.5">Ruta Nacional 9</span>
                <p className="text-zinc-500 text-[11px]">
                  Rápido acceso asfaltado conectado con Salta Capital y Vaqueros.
                </p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80">
                <span className="font-bold text-zinc-900 block mb-0.5">Centro de Salta</span>
                <p className="text-zinc-500 text-[11px]">
                  A solo 15-20 minutos en automóvil sin peajes interurbanos.
                </p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80">
                <span className="font-bold text-zinc-900 block mb-0.5">Dique Campo Alegre</span>
                <p className="text-zinc-500 text-[11px]">
                  Entorno turístico y deportes náuticos a 8 km hacia el norte.
                </p>
              </div>
            </div>
          </div>

          {/* KMZ / KML Download Section */}
          <div className="bg-zinc-900 text-white rounded-xl p-4 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs">Descargar Archivo KML / KMZ</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Visualice el polígono georreferenciado del loteo en 3D directamente en Google Earth Pro o móvil.
              </p>
            </div>

            <button
              id="btn-download-kml"
              onClick={handleDownloadKML}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs shadow-xs transition-colors shrink-0"
            >
              <Download className="w-4 h-4" />
              Descargar KML
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
