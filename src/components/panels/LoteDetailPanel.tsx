import React, { useMemo } from 'react';
import { Lote, LoteEstado } from '../../types';
import { 
  Maximize2, 
  MapPin, 
  AlertCircle, 
  Check, 
  X, 
  MessageCircle, 
  ShieldCheck, 
  Calendar, 
  Droplets, 
  Zap, 
  Trees, 
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { PROMO_CONFIG, getOficialWhatsAppUrl } from '../../data/promoConfig';

export interface LoteDetailPanelProps {
  lote?: Lote;
  selectedLote?: Lote;
  onClose?: () => void;
  onSelectLote?: (lote: Lote | null) => void;
  onViewMap?: () => void;
  onSwitchTo3D?: () => void;
  allLotes?: Lote[];
  lotesDeManzana?: Lote[];
  onUpdateLoteStatus?: (loteId: string, status: LoteEstado) => void;
  onShowNotice?: (msg: string) => void;
}

export function LoteDetailPanel({
  lote,
  selectedLote,
  onClose,
  onSelectLote,
  onViewMap,
  onSwitchTo3D
}: LoteDetailPanelProps) {
  const currentLote = lote || selectedLote;

  const handleClose = onClose || (() => onSelectLote?.(null));
  const handleViewMap = onViewMap || onSwitchTo3D;

  const estado = currentLote?.estado || currentLote?.status || 'disponible';

  const estadoBadge = useMemo(() => {
    switch (estado) {
      case 'vendido':
        return {
          color: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
          label: 'VENDIDO',
          icon: <AlertCircle size={14} className="text-rose-400" />
        };
      case 'reservado':
        return {
          color: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
          label: 'RESERVADO',
          icon: <Maximize2 size={14} className="text-amber-400" />
        };
      case 'disponible':
      default:
        return {
          color: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
          label: 'DISPONIBLE',
          icon: <Check size={14} className="text-emerald-400" />
        };
    }
  }, [estado]);

  if (!currentLote) return null;

  const whatsappUrl = getOficialWhatsAppUrl(currentLote, false);
  const whatsappFinancUrl = getOficialWhatsAppUrl(currentLote, true);

  return (
    <div
      id="lote-detail-panel"
      className="bg-zinc-900/95 rounded-2xl p-4 sm:p-5 border border-zinc-800 space-y-4 text-white shadow-2xl animate-fade-in"
    >
      {/* Header with Title and Close Button */}
      <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Lote {currentLote.numero ?? currentLote.id}
            </h3>
            <span className="text-xs font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md">
              Mz. {currentLote.manzana}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-emerald-400" />
            <span>Riveras de Pucheta · La Caldera, Salta</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${estadoBadge.color}`}
          >
            {estadoBadge.icon}
            {estadoBadge.label}
          </span>
          {handleClose && (
            <button
              id="btn-close-lote-detail"
              onClick={handleClose}
              className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Cerrar detalle"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Institutional Sello */}
      <div className="flex items-center justify-between p-2.5 bg-zinc-950/70 rounded-xl border border-zinc-850 text-[11px]">
        <div className="flex items-center gap-1.5 text-zinc-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Barrio Privado Cerrado · <strong>Posesión Diciembre 2026</strong></span>
        </div>
        <span className="text-zinc-500 font-medium">Concretar (+15 años) & ArgenSALTA</span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-2.5 text-xs">
        <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-850">
          <p className="text-zinc-400 text-[11px] font-medium">Superficie Total</p>
          <p className="font-black text-lg text-white mt-0.5">{currentLote.area_m2} m²</p>
          <p className="text-[10px] text-zinc-500">Superficie reglamentaria</p>
        </div>
        <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-850">
          <p className="text-zinc-400 text-[11px] font-medium">Dimensiones</p>
          <p className="font-black text-base text-white mt-0.5">
            {currentLote.frente_m || 10}m × {currentLote.fondo_m || 30}m
          </p>
          <p className="text-[10px] text-zinc-500">Frente × Fondo</p>
        </div>
      </div>

      {/* Commercial Price Card */}
      <div className="bg-gradient-to-br from-emerald-500/10 via-zinc-950 to-zinc-950 p-4 rounded-xl border border-emerald-500/30 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Precio de Contado
          </span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
            No es promocional
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            USD ${currentLote.precio_usd?.toLocaleString() || PROMO_CONFIG.precioActualUSD.toLocaleString()}
          </span>
          <span className="text-xs text-zinc-400 font-medium">
            (Pago Único Contado)
          </span>
        </div>
        <div className="text-[11px] text-zinc-300 pt-2 border-t border-zinc-800 space-y-1">
          <p className="font-extrabold text-amber-300">
            Plan Financiado Directo (Sin Bancos):
          </p>
          <div className="flex items-center justify-between text-[11px] bg-zinc-900/80 p-2 rounded-lg border border-zinc-800">
            <span>Entrega Inicial: <strong className="text-white">USD $5.000</strong></span>
            <span>Saldo: <strong className="text-emerald-400">15 cuotas de USD $200</strong></span>
          </div>
        </div>
      </div>

      {/* Servicios Proyectados y Entorno de La Caldera */}
      <div className="space-y-1.5 text-xs text-zinc-300 bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
        <div className="flex items-center gap-2">
          <Trees className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span><strong>Entorno Natural:</strong> Microclima de La Caldera, yungas y cercanía al Río Pucheta.</span>
        </div>
        <div className="flex items-center gap-2">
          <Droplets className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span><strong>Agua Potable:</strong> Servicio Proyectado (red en obra para conexión domiciliaria).</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span><strong>Energía Eléctrica (Luz):</strong> Servicio Proyectado (red de energía y alumbrado programados).</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span><strong>Posesión y Entrega:</strong> Programada para Diciembre 2026.</span>
        </div>
      </div>

      {/* Actions: Direct WhatsApp & Navigation */}
      <div className="flex flex-col gap-2 pt-1">
        <a
          id="btn-lote-whatsapp-consult"
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 fill-zinc-950 stroke-zinc-950" />
          <span>Consultar por este Lote a ArgenSALTA</span>
        </a>

        <div className="flex gap-2">
          <a
            id="btn-lote-whatsapp-financ"
            href={whatsappFinancUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-zinc-700"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Plan 15 Cuotas</span>
          </a>

          {handleViewMap && (
            <button
              id="btn-view-map-lote"
              onClick={handleViewMap}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-zinc-700"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ver en Mapa</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
