import React from 'react';
import { MessageCircle, PhoneCall, ShieldCheck, CheckCircle2, Globe, ExternalLink } from 'lucide-react';
import { PROMO_CONFIG, getOficialWhatsAppUrl } from '../../data/promoConfig';

interface AsesorFormalCardProps {
  onOpenIntroModal?: () => void;
  compact?: boolean;
}

export const AsesorFormalCard: React.FC<AsesorFormalCardProps> = React.memo(({
  onOpenIntroModal,
  compact = false
}) => {
  const whatsappUrl = getOficialWhatsAppUrl(null, false);
  const dueno = PROMO_CONFIG.dueno;

  return (
    <div 
      id="card-asesor-formal"
      className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black shadow-2xl p-4 sm:p-5 text-white group"
    >
      {/* Background Subtle Watermark of ArgenSALTA */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 overflow-hidden pointer-events-none opacity-[0.08] select-none flex items-center justify-end pr-2">
        <img
          src={PROMO_CONFIG.comercializadora.logo}
          alt=""
          className="h-full object-contain filter contrast-150"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Top Header: Badge Dueño & Comercializadora Oficial */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 relative z-10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
            Dueño & Comercializador Oficial
          </span>
        </div>

        <a
          href={dueno.sitioWeb}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full hover:bg-amber-500/25 transition-colors flex items-center gap-1"
          title="Ver web oficial de ArgenSALTA Propiedades"
        >
          <span>ArgenSALTA</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>

      {/* Profile: José Luis - ArgenSALTA Founder & Owner */}
      <div className="flex items-center gap-3.5 my-3 relative z-10">
        {/* Logo/Avatar de ArgenSALTA con Marco Dorado */}
        <div className="relative shrink-0">
          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden ring-2 ring-amber-400 shadow-xl bg-white p-1 flex items-center justify-center">
            <img
              src={PROMO_CONFIG.comercializadora.logo}
              alt="José Luis - Dueño de ArgenSALTA Propiedades"
              className="w-full h-full object-contain filter brightness-105 group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          </div>
          {/* Sello de Verificación Directa del Propietario */}
          <div 
            className="absolute -bottom-1 -right-1 bg-amber-500 text-zinc-950 p-1 rounded-full shadow-md"
            title="Sello Oficial ArgenSALTA"
          >
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        </div>

        {/* Info Dueño */}
        <div className="min-w-0">
          <h4 className="text-sm sm:text-base font-black text-white tracking-tight leading-tight truncate">
            {dueno.nombre}
          </h4>
          <p className="text-xs text-amber-300 font-semibold mt-0.5 truncate">
            {dueno.cargo}
          </p>
          <a
            href={dueno.sitioWeb}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-emerald-400 mt-1 transition-colors underline decoration-zinc-700"
          >
            <Globe className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">argensaltapropiedades.com.ar</span>
          </a>
        </div>
      </div>

      {/* Pitch / Propuesta de Valor */}
      {!compact && (
        <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/80 mb-3 relative z-10">
          Atención personalizada directa de José Luis y el equipo oficial de <strong>ArgenSALTA Propiedades</strong>. Consultá la agrimensura, visitá el predio en La Caldera o reservá tu lote a USD 7.000 de contado con obras viales en marcha.
        </p>
      )}

      {/* Botones de Acción Directa */}
      <div className="grid grid-cols-2 gap-2 relative z-10">
        <a
          id="btn-asesor-whatsapp"
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 font-black text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 fill-zinc-950 stroke-zinc-950" />
          <span>WhatsApp José Luis</span>
        </a>

        <a
          id="btn-asesor-llamar"
          href={`tel:${dueno.telefonoDirecto}`}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-zinc-800 hover:bg-zinc-750 active:scale-95 text-zinc-200 hover:text-white font-bold text-xs rounded-xl transition-all border border-zinc-700 cursor-pointer"
          title={`Llamar directamente a José Luis (${dueno.telefonoDirectoFormatted})`}
        >
          <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
          <span>Llamar Directo</span>
        </a>
      </div>
    </div>
  );
});

AsesorFormalCard.displayName = 'AsesorFormalCard';
