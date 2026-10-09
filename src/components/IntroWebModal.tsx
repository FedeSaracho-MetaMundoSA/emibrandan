import React, { useState } from 'react';
import { 
  Building2, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  PhoneCall, 
  ArrowRight, 
  X, 
  Waves, 
  Trees, 
  Zap, 
  Droplets,
  Award,
  Compass,
  MapPin
} from 'lucide-react';
import { PROMO_CONFIG, getOficialWhatsAppUrl } from '../data/promoConfig';
import { LOTES_VENDIDOS_LIST } from '../data/lotesVendidos';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { RiverasLogo3D } from './RiverasLogo3D';

interface IntroWebModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExplore3D?: () => void;
  onOpenGuiaTech?: () => void;
}

export const IntroWebModal: React.FC<IntroWebModalProps> = ({
  isOpen,
  onClose,
  onExplore3D,
  onOpenGuiaTech
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('riveras_intro_seen', 'true');
      } catch {
        // localStorage fallback
      }
    }
    onClose();
  };

  const handleExplore = () => {
    handleClose();
    onExplore3D?.();
  };

  const dialogRef = useFocusTrap<HTMLDivElement>({
    isOpen,
    onClose: handleClose
  });

  if (!isOpen) return null;

  return (
    <div 
      id="intro-web-modal-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div 
        ref={dialogRef}
        id="intro-web-modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="intro-modal-title"
        tabIndex={-1}
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-auto text-white animate-scale-up focus:outline-none"
      >
        {/* Top Gold/Emerald Accent Line */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-emerald-500 to-teal-400" />

        {/* Close Button */}
        <button
          id="btn-close-intro-modal"
          onClick={handleClose}
          aria-label="Cerrar presentación de Riveras de Pucheta"
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 rounded-full border border-zinc-750 transition-colors z-10 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
          title="Cerrar introducción"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Section with Official Logos (ArgenSALTA + Concretar Desarrollos) */}
        <div className="px-6 pt-6 pb-4 sm:px-8 sm:pt-7 bg-gradient-to-b from-zinc-900/95 to-zinc-950 border-b border-zinc-800/80">
          {/* Institutional Logos Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pr-8">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Logo ArgenSALTA Resaltado */}
              <div className="bg-white rounded-xl p-1.5 ring-2 ring-amber-400/80 shadow-md flex items-center justify-center">
                <img
                  src={PROMO_CONFIG.comercializadora.logo}
                  alt="ArgenSALTA Comercialización Oficial"
                  className="h-8 sm:h-9 w-auto object-contain max-w-[120px]"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Logo Concretar Desarrollos (+15 Años) */}
              <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-1.5 shadow-md flex items-center justify-center">
                <img
                  src={PROMO_CONFIG.desarrolladora.logo}
                  alt="Concretar Desarrollos Propietaria"
                  className="h-8 sm:h-9 w-auto object-contain max-w-[100px] rounded"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Official Phone Pill */}
            <a 
              href={`tel:${PROMO_CONFIG.telefonoOficial}`}
              aria-label={`Llamar al teléfono oficial ${PROMO_CONFIG.telefonoOficialFormatted}`}
              className="text-xs font-mono font-bold text-zinc-300 hover:text-emerald-400 flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>{PROMO_CONFIG.telefonoOficialFormatted}</span>
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
              Comercializa: ArgenSALTA (José Luis)
            </span>
            <span className="text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              Desarrolla: Concretar (+15 Años)
            </span>
          </div>

          <div className="flex items-center gap-3 my-1">
            <RiverasLogo3D size="lg" showText={false} />
            <div>
              <h2 id="intro-modal-title" className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-none">
                Riveras de Pucheta
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 flex items-center flex-wrap gap-2">
                <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Barrio Privado Cerrado de Montaña
                </span>
                <span className="text-zinc-600">•</span>
                <span>La Caldera, Salta</span>
                <span className="text-zinc-600">•</span>
                <a
                  href={PROMO_CONFIG.dueno.sitioWeb}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-300 font-bold hover:underline"
                >
                  argensaltapropiedades.com.ar
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Main Body with Commercial Offer */}
        <div className="px-6 py-5 sm:px-8 sm:py-6 space-y-4.5 max-h-[65vh] overflow-y-auto">
          {/* URGENT PROMO CARD: 7.000 USD */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/40 border-2 border-amber-500/60 p-5 shadow-xl">
            {/* Urgency Pill */}
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-zinc-950 font-black text-xs uppercase tracking-wider animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                ¡Obras en marcha · Máquinas en terreno!
              </span>
              <span className="text-xs font-bold text-amber-300">
                Valor Base de Contado
              </span>
            </div>

            {/* Price Display */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-zinc-800 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs uppercase tracking-wider text-zinc-400 font-bold block">
                    Precio de Contado
                  </span>
                  <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                    (No es promocional)
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                    USD ${PROMO_CONFIG.precioActualUSD.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs text-zinc-400 block">Lotes estándar de</span>
                <span className="text-lg font-black text-zinc-200">300 m² (10 × 30 m)</span>
              </div>
            </div>

            {/* FINANCING PLAN: ENTREGA 5000 + 15 CUOTAS DE 200 */}
            <div className="bg-zinc-950/80 rounded-xl p-4 border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Plan Financiación Propia Directa
                </span>
                <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">Sin Bancos</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div className="bg-zinc-900/90 rounded-lg p-3 border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 block font-medium">Entrega / Contado Inicial</span>
                  <div className="text-xl font-black text-white mt-0.5">
                    USD ${PROMO_CONFIG.financiacion.entregaUSD.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-zinc-500">Reserva con boleto directo</span>
                </div>

                <div className="bg-zinc-900/90 rounded-lg p-3 border border-emerald-500/30">
                  <span className="text-[11px] text-emerald-400 block font-medium">Saldo Financiado</span>
                  <div className="text-xl font-black text-emerald-400 mt-0.5">
                    {PROMO_CONFIG.financiacion.cuotasCantidad} cuotas de USD ${PROMO_CONFIG.financiacion.cuotaMontoUSD}
                  </div>
                  <span className="text-[10px] text-zinc-400">Cuotas fijas en dólares sin interés</span>
                </div>
              </div>
            </div>
          </div>

          {/* NATURALEZA Y ENTORNO VERDE DE LA CALDERA */}
          <div className="rounded-2xl bg-gradient-to-r from-emerald-950/50 via-zinc-900 to-zinc-900 border border-emerald-500/30 p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-300">
              <Trees className="w-5 h-5 text-emerald-400 shrink-0" />
              <h3 className="text-sm font-extrabold">
                El Verde de La Caldera: Microclima & Naturaleza Pura
              </h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Riveras de Pucheta está inmerso en el valle serrano de <strong>La Caldera</strong>, reconocido por su microclima fresco, aire puro de montaña de yungas, abundante vegetación y el cauce del <strong>Río Pucheta</strong>. Un entorno natural protegido que garantiza desconexión y alta calidad de vida familiar.
            </p>
          </div>

          {/* SERVICIOS E INFRAESTRUCTURA PROYECTADA + ENTREGA DICIEMBRE 2026 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800 space-y-1.5">
              <div className="flex items-center gap-2 text-sky-400">
                <Droplets className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold text-white">Agua Potable (Servicio Proyectado)</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Red interna de captación y distribución proyectada con acometida a cada lote.
              </p>
            </div>

            <div className="bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400">
                <Zap className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold text-white">Energía Eléctrica / Luz (Servicio Proyectado)</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Tendido eléctrico y alumbrado público proyectados en ejecución programada.
              </p>
            </div>

            <div className="bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400">
                <Calendar className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold text-white">Posesión Diciembre 2026</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Fecha de entrega y posesión efectiva estipulada para diciembre del año 2026.
              </p>
            </div>

            <div className="bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800 space-y-1.5">
              <div className="flex items-center gap-2 text-purple-400">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold text-white">Barrio Privado Cerrado</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Acceso controlado, calles enripiadas consolidadas y agrimensura perimetral.
              </p>
            </div>
          </div>

          {/* PROJECT STATS QUICK SUMMARY */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
            <div className="bg-zinc-900/70 p-3 rounded-xl border border-zinc-800/80">
              <div className="text-lg font-black text-amber-400">{LOTES_VENDIDOS_LIST.length}</div>
              <div className="text-[11px] text-zinc-400 font-medium">Lotes Vendidos</div>
            </div>
            <div className="bg-zinc-900/70 p-3 rounded-xl border border-zinc-800/80">
              <div className="text-lg font-black text-emerald-400">15 Cuotas</div>
              <div className="text-[11px] text-zinc-400 font-medium">Financ. Propia</div>
            </div>
            <div className="bg-zinc-900/70 p-3 rounded-xl border border-zinc-800/80">
              <div className="text-lg font-black text-sky-400">+15 Años</div>
              <div className="text-[11px] text-zinc-400 font-medium">Trayectoria Concretar</div>
            </div>
            <div className="bg-zinc-900/70 p-3 rounded-xl border border-zinc-800/80">
              <div className="text-lg font-black text-emerald-400">Dic 2026</div>
              <div className="text-[11px] text-zinc-400 font-medium">Posesión Programada</div>
            </div>
          </div>

          {/* Trust bullets */}
          <div className="space-y-2 text-xs text-zinc-300 bg-zinc-900/40 p-3.5 rounded-xl border border-zinc-800/60">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Desarrollado y garantizado por <strong>Concretar Desarrollos</strong>, con más de 15 años de sólida trayectoria.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Comercialización e innovación tecnológica PropTech a cargo de <strong>ArgenSALTA</strong>.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Plano catastral oficial de agrimensura con mojones y rumbos verificados.</span>
            </div>
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="px-6 py-4 sm:px-8 sm:py-5 bg-zinc-900/90 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
            />
            <span>No volver a mostrar automáticamente</span>
          </label>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            {/* Guía Tech Button */}
            {onOpenGuiaTech && (
              <button
                id="btn-intro-guia-tech"
                onClick={() => {
                  handleClose();
                  onOpenGuiaTech();
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                title="Ver Guía de Uso Técnica Paso a Paso"
              >
                <Compass className="w-4 h-4 text-emerald-400" />
                <span>Guía Paso a Paso</span>
              </button>
            )}

            {/* WhatsApp Direct Contact Button */}
            <a
              id="btn-intro-whatsapp"
              href={getOficialWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 fill-zinc-950" />
              <span>WhatsApp Oficial</span>
            </a>

            {/* Explore 3D Masterplan */}
            <button
              id="btn-intro-explore-3d"
              onClick={handleExplore}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-extrabold text-xs transition-all active:scale-95 cursor-pointer"
            >
              <span>Explorar Masterplan 3D</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
