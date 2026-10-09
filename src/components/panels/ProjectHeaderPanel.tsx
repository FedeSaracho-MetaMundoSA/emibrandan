import React from 'react';
import { 
  Info, 
  Compass, 
  ChevronRight, 
  ShieldCheck, 
  Trees, 
  Droplets, 
  Zap, 
  Calendar, 
  Award,
  Sparkles
} from 'lucide-react';
import { PROMO_CONFIG } from '../../data/promoConfig';

interface ProjectHeaderPanelProps {
  onOpenGuiaTech?: () => void;
  onOpenIntroModal?: () => void;
}

export const ProjectHeaderPanel: React.FC<ProjectHeaderPanelProps> = React.memo(({
  onOpenGuiaTech,
  onOpenIntroModal
}) => {
  return (
    <div className="space-y-3.5">
      {/* Tarjeta Institucional de Alianza Oficial: Concretar Desarrollos (+15 Años) & ArgenSALTA */}
      <div 
        id="panel-institutional-card"
        onClick={onOpenIntroModal}
        className="relative overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-900/95 to-zinc-950 rounded-2xl p-4 border border-zinc-800 hover:border-amber-500/50 shadow-xl cursor-pointer transition-all group"
        title="Ver detalles institucionales de Concretar Desarrollos y ArgenSALTA"
      >
        {/* Marca de agua sutil en esquina */}
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-amber-500/5 blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
          {/* Logo ArgenSALTA: Resaltado, visible, integrado */}
          <div className="flex-1 bg-white rounded-xl py-1.5 px-2.5 ring-2 ring-amber-400/80 shadow-md flex items-center justify-center group-hover:ring-amber-400 transition-all">
            <img
              src={PROMO_CONFIG.comercializadora.logo}
              alt="ArgenSALTA Propiedades"
              className="h-7 w-auto object-contain max-h-7"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex flex-col items-center justify-center px-1">
            <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Alianza
            </span>
          </div>

          {/* Logo Concretar Desarrollos: Dueña con +15 Años */}
          <div className="flex-1 bg-zinc-950 border border-zinc-700/80 rounded-xl py-1.5 px-2.5 shadow-md flex items-center justify-center group-hover:border-emerald-500/60 transition-all">
            <img
              src={PROMO_CONFIG.desarrolladora.logo}
              alt="Concretar Desarrollos Propietaria"
              className="h-7 w-auto object-contain max-h-7 rounded"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Respaldo Institucional con tipografía clara */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium">Propietaria & Desarrolla:</span>
            <span className="font-extrabold text-emerald-400 flex items-center gap-1">
              <span>Concretar Desarrollos</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
                +15 Años
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium">Comercialización PropTech:</span>
            <span className="font-extrabold text-amber-300">
              ArgenSALTA Propiedades
            </span>
          </div>
        </div>

        {/* Badges Clave del Proyecto */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-zinc-800/70 text-[11px]">
          <div className="flex items-center gap-1.5 text-zinc-200 bg-zinc-800/80 px-2 py-1.5 rounded-xl border border-zinc-750">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate font-bold text-[10px]">Barrio Privado Cerrado</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-200 bg-zinc-800/80 px-2 py-1.5 rounded-xl border border-zinc-750">
            <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate font-bold text-[10px]">Posesión Diciembre 2026</span>
          </div>
        </div>

        {/* Obras en marcha & USD 7.000 */}
        <div 
          onClick={onOpenIntroModal}
          className="mt-3 p-2.5 bg-gradient-to-r from-amber-500/20 via-emerald-500/15 to-zinc-900 border border-amber-500/40 rounded-xl flex items-center justify-between text-[11px] cursor-pointer transition-all group shadow-sm"
          title="Ver detalles institucionales de Concretar Desarrollos y ArgenSALTA"
        >
          <div className="flex items-center gap-2">
            <span className="text-base group-hover:scale-110 transition-transform">🚜</span>
            <div>
              <span className="font-black text-amber-300 block leading-tight flex items-center gap-1">
                <span>¡Obras en Marcha!</span>
              </span>
              <span className="text-[10px] text-zinc-300">Maquinaria trabajando en terreno</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[9px] uppercase font-bold text-zinc-400 block">Contado</span>
            <span className="text-sm font-black text-emerald-300">USD 7.000</span>
          </div>
        </div>
      </div>

      {/* Naturaleza & Microclima de La Caldera */}
      <div className="bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-900 rounded-2xl p-3.5 border border-emerald-500/25 shadow-md space-y-2">
        <div className="flex items-center gap-2 text-emerald-300">
          <Trees className="w-4 h-4 text-emerald-400 shrink-0" />
          <h3 className="text-xs font-black tracking-wide uppercase">
            Naturaleza & Verde de La Caldera
          </h3>
        </div>
        <p className="text-[11px] text-zinc-300 leading-relaxed">
          Ubicado en un entorno natural privilegiado con <strong>microclima templado</strong> de montaña, aire puro de yungas, abundante vegetación autóctona y el cauce del <strong>Río Pucheta</strong>. Un refugio de serenidad a solo 25 minutos de Salta Capital.
        </p>
        
        {/* Servicios Proyectados */}
        <div className="pt-1.5 border-t border-emerald-500/20 flex flex-col gap-1 text-[11px]">
          <div className="flex items-center gap-2 text-zinc-200">
            <Droplets className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span><strong>Agua Potable:</strong> Servicio Proyectado (red de distribución en obra)</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-200">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span><strong>Energía Eléctrica (Luz):</strong> Servicio Proyectado (red y alumbrado programados)</span>
          </div>
        </div>
      </div>

      {/* Título: Selecciona un lote */}
      <div className="bg-zinc-900/90 rounded-2xl p-3.5 border border-zinc-800 shadow-md">
        <div className="flex items-center gap-2 text-white mb-1">
          <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          <h2 className="text-sm font-extrabold tracking-tight">
            Selecciona una parcela
          </h2>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Haz clic en cualquier lote del visor 3D o satelital para consultar medidas, linderos, precio promocional y reservar de forma directa.
        </p>
      </div>

      {/* Banner Guía Técnica 3D Paso a Paso */}
      {onOpenGuiaTech && (
        <button
          id="btn-info-panel-guia-tech"
          onClick={onOpenGuiaTech}
          className="w-full bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-zinc-900 border border-emerald-500/40 hover:border-emerald-400 p-3 rounded-2xl flex items-center justify-between text-left transition-all group cursor-pointer shadow-md hover:shadow-emerald-500/10"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-sm shadow-md group-hover:scale-105 transition-transform shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white">Guía de Uso Técnica 3D</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30 uppercase">
                  Paso a Paso
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                Controles, agrimensura y simulación
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0" />
        </button>
      )}
    </div>
  );
});

ProjectHeaderPanel.displayName = 'ProjectHeaderPanel';
