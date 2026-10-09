import React, { useState } from 'react';
import { Lote, ManzanaConfig } from '../types';
import { PROMO_CONFIG, getOficialWhatsAppUrl } from '../data/promoConfig';
import { 
  Compass, 
  Ruler, 
  MapPin, 
  DollarSign, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Sparkles, 
  Share2, 
  Calculator,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Award
} from 'lucide-react';

interface LoteCardProps {
  lote: Lote;
  manzanaConfig: ManzanaConfig;
  onClose?: () => void;
  onStatusChange?: (loteId: string, newStatus: 'disponible' | 'reservado' | 'vendido') => void;
  onFocusLote?: (lote: Lote) => void;
}

/**
 * Ficha comercial y técnica del lote seleccionado
 * Muestra el desglose de cuotas de financiación oficial, estado y botón de contacto
 *
 * @component
 * @param {LoteCardProps} props
 * @returns {React.ReactElement}
 */
const LoteCardComponent: React.FC<LoteCardProps> = ({
  lote,
  manzanaConfig,
  onClose,
  onStatusChange,
  onFocusLote
}) => {
  const [copied, setCopied] = useState(false);

  const isVendido = lote.estado === 'vendido';
  const precioTotal = isVendido ? 0 : PROMO_CONFIG.precioActualUSD;

  const whatsappUrl = getOficialWhatsAppUrl(lote, false);

  const handleShare = () => {
    const priceText = isVendido 
      ? 'VENDIDO' 
      : `USD ${PROMO_CONFIG.precioActualUSD.toLocaleString()} Contado (Oficial) | Financiado: Entrega USD 5.000 + 15 cuotas de USD 200`;
    navigator.clipboard.writeText(
      `Riveras de Pucheta (Promueve ArgenSALTA) - Lote ${lote.id} (${lote.area_m2.toFixed(1)}m² - Mz. ${lote.manzana}) - ${priceText} - Tel Oficial: ${PROMO_CONFIG.telefonoOficialFormatted}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusConfig = {
    disponible: {
      label: 'Disponible',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      icon: CheckCircle2
    },
    reservado: {
      label: 'Reservado',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      icon: Clock
    },
    vendido: {
      label: 'Vendido',
      bg: 'bg-zinc-100 text-zinc-600 border-zinc-200',
      dot: 'bg-zinc-400',
      icon: XCircle
    }
  };

  const statusInfo = statusConfig[lote.estado];
  const StatusIcon = statusInfo.icon;

  return (
    <div id={`lote-card-${lote.id}`} className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden transition-all duration-200">
      {/* Header Banner */}
      <div 
        className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between"
        style={{ borderTop: `4px solid ${manzanaConfig.color}` }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded-full shrink-0" 
              style={{ backgroundColor: manzanaConfig.color }}
              title={`Color Manzana ${lote.manzana}`}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {manzanaConfig.nombre}
            </span>
            <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
              ArgenSALTA
            </span>
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 tracking-tight mt-0.5">
            Lote {lote.id}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.bg}`}>
            <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
            {statusInfo.label}
          </span>
          {onClose && (
            <button
              id="btn-close-lote-card"
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors ml-1 cursor-pointer"
              title="Cerrar detalle"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Details Body */}
      <div className="p-5 space-y-4">
        {/* Metric cards */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-zinc-50 rounded-lg p-2.5 border border-zinc-100">
            <span className="text-[11px] text-zinc-500 font-medium block mb-0.5">Superficie</span>
            <span className="text-lg font-bold text-zinc-900">{lote.area_m2.toFixed(1)}</span>
            <span className="text-[10px] text-zinc-400 block">m² totales</span>
          </div>

          <div className="bg-zinc-50 rounded-lg p-2.5 border border-zinc-100">
            <span className="text-[11px] text-zinc-500 font-medium block mb-0.5">Frente</span>
            <span className="text-lg font-bold text-zinc-900">{lote.frente_m.toFixed(1)}</span>
            <span className="text-[10px] text-zinc-400 block">metros</span>
          </div>

          <div className="bg-zinc-50 rounded-lg p-2.5 border border-zinc-100">
            <span className="text-[11px] text-zinc-500 font-medium block mb-0.5">Fondo</span>
            <span className="text-lg font-bold text-zinc-900">{lote.fondo_m.toFixed(1)}</span>
            <span className="text-[10px] text-zinc-400 block">metros</span>
          </div>
        </div>

        {/* Feature List */}
        <div className="space-y-2 text-xs text-zinc-600 bg-zinc-50/70 p-3.5 rounded-lg border border-zinc-100">
          <div className="flex items-center justify-between py-1 border-b border-zinc-200/60">
            <span className="flex items-center gap-1.5 text-zinc-500 font-medium">
              <Compass className="w-3.5 h-3.5 text-zinc-400" /> Orientación
            </span>
            <span className="font-semibold text-zinc-800">{lote.orientacion}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-zinc-200/60">
            <span className="flex items-center gap-1.5 text-zinc-500 font-medium">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" /> Coordenadas
            </span>
            <span className="font-mono text-zinc-700">
              {lote.lat.toFixed(4)}, {lote.lon.toFixed(4)}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="flex items-center gap-1.5 text-zinc-500 font-medium">
              <Award className="w-3.5 h-3.5 text-amber-500" /> Promotor Oficial
            </span>
            <span className="font-bold text-zinc-900">ArgenSALTA</span>
          </div>
        </div>

        {/* Price & Commercial Offer */}
        <div className="bg-zinc-950 text-white rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-zinc-400 font-medium">
              {isVendido ? 'Estado' : 'Precio Oficial Contado'}
            </span>
            {!isVendido && (
              <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                (No es promocional)
              </span>
            )}
          </div>

          <div>
            {isVendido ? (
              <span className="text-2xl font-black text-zinc-400">UNIDAD VENDIDA</span>
            ) : (
              <div>
                <div className="text-3xl font-black tracking-tight text-white">
                  USD ${PROMO_CONFIG.precioActualUSD.toLocaleString()}
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  Valor único de contado directo
                </div>
              </div>
            )}
          </div>

          {/* Financing Highlight */}
          {!isVendido && (
            <div className="bg-zinc-900/90 rounded-lg p-3 border border-emerald-500/30 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px] mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Financiación Propia ArgenSALTA</span>
              </div>
              <div className="text-zinc-200">
                <strong>Entrega USD {PROMO_CONFIG.financiacion.entregaUSD.toLocaleString()}</strong> y <strong>{PROMO_CONFIG.financiacion.cuotasCantidad} cuotas fijas de USD {PROMO_CONFIG.financiacion.cuotaMontoUSD}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <a
            id="btn-whatsapp-inquire"
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 px-4 rounded-xl shadow-xs transition-colors text-xs"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Consultar por WhatsApp Oficial ({PROMO_CONFIG.telefonoOficialFormatted})</span>
          </a>

          <div className="grid grid-cols-2 gap-2">
            {onFocusLote && (
              <button
                id="btn-focus-in-3d"
                onClick={() => onFocusLote(lote)}
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-zinc-500" />
                Enfocar en 3D
              </button>
            )}

            <button
              id="btn-share-lot"
              onClick={handleShare}
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-zinc-500" />
              {copied ? '¡Copiado!' : 'Compartir Ficha'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LoteCard = React.memo(LoteCardComponent);
