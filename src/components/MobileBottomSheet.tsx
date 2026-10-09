import React, { useState } from 'react';
import { 
  X, 
  ChevronUp, 
  ChevronDown, 
  ExternalLink, 
  PhoneCall, 
  MapPin, 
  Layers, 
  DollarSign, 
  Maximize2,
  CheckCircle2,
  Clock,
  Ban
} from 'lucide-react';
import { Lote } from '../types';
import { MANZANAS_CONFIG } from '../data/loteoData';
import { PROMO_CONFIG, getOficialWhatsAppUrl } from '../data/promoConfig';

interface MobileBottomSheetProps {
  lote: Lote;
  onDeselect: () => void;
  onOpenFullInfo: () => void;
  onOpenMaps: (lote: Lote) => void;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  lote,
  onDeselect,
  onOpenFullInfo,
  onOpenMaps
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusConfig = {
    disponible: {
      label: 'Disponible',
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-400 ring-4 ring-emerald-400/20'
    },
    reservado: {
      label: 'Reservado',
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      dot: 'bg-amber-400 ring-4 ring-amber-400/20'
    },
    vendido: {
      label: 'Vendido',
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      dot: 'bg-rose-500 ring-4 ring-rose-500/20'
    }
  }[lote.estado || lote.status || 'disponible'];

  const manzanaColor = MANZANAS_CONFIG[lote.manzana]?.color || '#3B82F6';

  return (
    <div
      id="mobile-3d-bottom-sheet"
      className="md:hidden fixed bottom-16 left-3 right-3 z-40 transition-all duration-300 select-none animate-slide-up pointer-events-auto"
    >
      <div className="bg-zinc-950/95 backdrop-blur-2xl text-white rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden max-h-[70vh] flex flex-col">
        {/* Drag handle / Toggle Header */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full pt-2 pb-1.5 px-4 flex flex-col items-center justify-center cursor-pointer active:bg-zinc-900/80"
        >
          <div className="w-10 h-1 bg-zinc-700 rounded-full mb-1.5" />
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: manzanaColor }}
              />
              <span className="text-xs font-bold text-zinc-300">
                Manzana {lote.manzana}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
              <span>{isExpanded ? 'Contraer' : 'Detalles de Mensura'}</span>
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />}
            </div>
          </div>
        </div>

        {/* Peek Card Content */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-zinc-800/80 bg-zinc-950/60">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white tracking-tight leading-none">
                Lote {lote.numero ?? lote.id}
              </h3>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusConfig.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                {statusConfig.label}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
              <span className="font-bold text-zinc-200">{lote.area_m2 ? lote.area_m2.toFixed(1) : '300.0'} m²</span>
              <span>•</span>
              {lote.estado === 'vendido' ? (
                <span className="font-extrabold text-zinc-400">VENDIDO</span>
              ) : (
                <span className="font-extrabold text-emerald-400">USD ${PROMO_CONFIG.precioActualUSD.toLocaleString()}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Full info button */}
            <button
              id="mobile-sheet-btn-full-info"
              onClick={onOpenFullInfo}
              className="min-h-[38px] px-3 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-black rounded-xl flex items-center gap-1 shadow-md transition-colors cursor-pointer"
            >
              <span>Ficha</span>
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Close / Deselect */}
            <button
              id="mobile-sheet-btn-deselect"
              onClick={onDeselect}
              className="min-h-[38px] px-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-300 hover:text-white border border-zinc-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Deseleccionar lote y liberar vista 3D"
              aria-label="Cerrar selección"
            >
              <X className="w-4 h-4 text-rose-400" />
              <span>Cerrar</span>
            </button>
          </div>
        </div>

        {/* Expanded Content Drawer */}
        {isExpanded && (
          <div className="p-4 pt-2 border-t border-zinc-100 space-y-3 overflow-y-auto">
            {/* Quick Specs Grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-zinc-50 p-2 rounded-xl border border-zinc-100">
                <span className="text-[10px] text-zinc-400 block font-medium">Frente</span>
                <span className="text-xs font-bold text-zinc-800">{lote.frente_m} m</span>
              </div>
              <div className="bg-zinc-50 p-2 rounded-xl border border-zinc-100">
                <span className="text-[10px] text-zinc-400 block font-medium">Fondo</span>
                <span className="text-xs font-bold text-zinc-800">{lote.fondo_m} m</span>
              </div>
              <div className="bg-zinc-50 p-2 rounded-xl border border-zinc-100">
                <span className="text-[10px] text-zinc-400 block font-medium">Orientación</span>
                <span className="text-xs font-bold text-zinc-800 truncate block">{lote.orientacion}</span>
              </div>
            </div>

            {/* Quick Actions (WhatsApp & Maps) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                id="mobile-sheet-btn-maps"
                onClick={() => onOpenMaps(lote)}
                className="min-h-[48px] px-3 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 active:bg-zinc-100 text-zinc-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Google Maps</span>
              </button>

              <a
                id="mobile-sheet-btn-whatsapp"
                href={getOficialWhatsAppUrl(lote, false)}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[48px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <PhoneCall className="w-4 h-4 text-white" />
                <span>WhatsApp Oficial</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
