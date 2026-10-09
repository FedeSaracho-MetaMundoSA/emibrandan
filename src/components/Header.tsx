import React, { useState } from 'react';
import { 
  Compass, 
  MapPin, 
  Menu, 
  X, 
  MessageCircle,
  Phone,
  Layers,
  PanelRightClose,
  PanelRightOpen,
  Sparkles
} from 'lucide-react';
import { PROMO_CONFIG, getOficialWhatsAppUrl } from '../data/promoConfig';
import { ConcretarLogo3D } from './ConcretarLogo3D';

interface HeaderProps {
  onOpenIntroModal?: () => void;
  onOpenGuiaTech?: () => void;
  onOpenPlanoModal?: () => void;
  totalLotes: number;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenIntroModal,
  onOpenGuiaTech,
  onOpenPlanoModal,
  totalLotes,
  isSidebarOpen = true,
  onToggleSidebar
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dueno = PROMO_CONFIG.dueno;

  return (
    <header id="main-header" className="relative h-14 bg-zinc-950 border-b border-zinc-800/80 px-3 sm:px-5 flex items-center justify-between z-30 shrink-0 select-none text-white">
      {/* Brand & Identity - ArgenSALTA Propiedades + Riveras de Pucheta */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Logo ArgenSALTA */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={dueno.sitioWeb}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/95 hover:bg-white p-1 rounded-lg border border-amber-400/60 shadow-md transition-all hover:scale-105 shrink-0 flex items-center justify-center"
            title="ArgenSALTA Propiedades - Comercialización & PropTech 3D"
          >
            <img
              src={PROMO_CONFIG.comercializadora.logo}
              alt="ArgenSALTA Propiedades"
              className="h-6 sm:h-7 w-auto object-contain max-h-7"
              referrerPolicy="no-referrer"
            />
          </a>
        </div>

        {/* Clean H1 Title */}
        <div className="min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <h1 className="text-xs sm:text-base font-black text-white tracking-tight leading-tight truncate">
              Riveras de Pucheta
            </h1>
            <span className="hidden sm:inline-flex items-center text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
              Barrio Privado Cerrado
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-zinc-400 leading-tight truncate">
            <span className="flex items-center gap-1 shrink-0 text-emerald-400 font-medium">
              <MapPin className="w-3 h-3 text-emerald-400" />
              La Caldera, Salta
            </span>
          </div>
        </div>

        {/* Official Concretar Desarrollos Logo (+15 Años) */}
        <div className="hidden lg:flex items-center gap-2 shrink-0 ml-2 pl-2 border-l border-zinc-800">
          <div 
            onClick={onOpenIntroModal} 
            className="cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-1.5"
            title="Concretar Desarrollos (+15 años de trayectoria)"
          >
            <ConcretarLogo3D size="sm" showText={false} />
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              Desarrolla: Concretar (+15 Años)
            </span>
          </div>
        </div>
      </div>

      {/* Desktop & Mobile Actions - Clean & Minimalist */}
      <div className="flex items-center gap-2">
        {/* Guía 3D */}
        {onOpenGuiaTech && (
          <button
            id="header-btn-guia-tech"
            onClick={onOpenGuiaTech}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-zinc-900 border border-zinc-750 text-zinc-200 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
            title="Guía 3D de Navegación"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Guía 3D</span>
          </button>
        )}

        {/* Plano 2D */}
        {onOpenPlanoModal && (
          <button
            id="header-btn-plano-2d"
            onClick={onOpenPlanoModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-zinc-900 border border-zinc-750 text-zinc-200 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
            title="Plano catastral 2D"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Plano 2D</span>
          </button>
        )}

        {/* Botón Ocultar / Mostrar Panel Lateral */}
        {onToggleSidebar && (
          <button
            id="header-btn-toggle-sidebar"
            onClick={onToggleSidebar}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
              isSidebarOpen 
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20' 
                : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
            }`}
            title={isSidebarOpen ? 'Esconder panel lateral para ver mapa completo' : 'Mostrar panel de información de lotes'}
          >
            {isSidebarOpen ? (
              <>
                <PanelRightClose className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Ocultar Panel</span>
              </>
            ) : (
              <>
                <PanelRightOpen className="w-4 h-4 text-emerald-400" />
                <span>Ver Lotes y Panel</span>
              </>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
