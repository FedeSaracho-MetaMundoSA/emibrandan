import React from 'react';
import { X, MapPin, Compass, ExternalLink, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Amenidad3D } from '../types';

interface AmenidadDetalleModalProps {
  amenidad: Amenidad3D | null;
  onClose: () => void;
  onResetCameraToLoteo: () => void;
}

export const AmenidadDetalleModal: React.FC<AmenidadDetalleModalProps> = ({
  amenidad,
  onClose,
  onResetCameraToLoteo
}) => {
  if (!amenidad) return null;

  return (
    <div 
      id="amenidad-detalle-floating-card"
      className="absolute bottom-4 left-4 right-4 sm:right-auto sm:left-6 sm:w-96 z-40 bg-white/95 backdrop-blur-md rounded-2xl border border-zinc-200/80 shadow-2xl p-5 text-zinc-900 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm font-bold shrink-0"
            style={{ backgroundColor: amenidad.color }}
          >
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Punto de Interés • {amenidad.distanciaKm} km
            </span>
            <h3 className="text-base font-bold text-zinc-900 leading-tight">
              {amenidad.nombre}
            </h3>
          </div>
        </div>
        <button
          id="btn-close-amenidad-card"
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          title="Cerrar detalle"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="py-3 space-y-3 text-xs text-zinc-600">
        <p className="leading-relaxed">
          {amenidad.descripcion}
        </p>

        {/* Features checklist */}
        {amenidad.detalles && amenidad.detalles.length > 0 && (
          <div className="bg-zinc-50/80 rounded-xl p-3 border border-zinc-100 space-y-1.5">
            <span className="font-semibold text-zinc-800 text-[11px] block mb-1">
              Características & Equipamiento:
            </span>
            {amenidad.detalles.map((d, i) => (
              <div key={i} className="flex items-start gap-2 text-zinc-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{d}</span>
              </div>
            ))}
          </div>
        )}

        {/* Subpoints if plaza */}
        {amenidad.subPuntos && amenidad.subPuntos.length > 0 && (
          <div className="space-y-1.5">
            <span className="font-semibold text-zinc-800 text-[11px] block">
              Sectores Internos:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {amenidad.subPuntos.map((sp) => (
                <div 
                  key={sp.id} 
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-100 border border-zinc-200/60 text-[11px]"
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sp.color }} />
                  <span className="truncate font-medium text-zinc-700">{sp.nombre}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GPS Coordinates */}
        <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-zinc-400" />
            <span>{amenidad.posicionGPS.lat.toFixed(4)}, {amenidad.posicionGPS.lon.toFixed(4)}</span>
          </div>
          <a
            href={`https://www.google.com/maps?q=${amenidad.posicionGPS.lat},${amenidad.posicionGPS.lon}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5"
          >
            Google Maps <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
        <button
          id="btn-return-to-loteo"
          onClick={onResetCameraToLoteo}
          className="w-full py-2 px-3 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 transition-colors font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver a Vista General del Loteo
        </button>
      </div>
    </div>
  );
};
