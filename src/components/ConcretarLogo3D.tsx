import React from 'react';

interface ConcretarLogo3DProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const ConcretarLogo3D: React.FC<ConcretarLogo3DProps> = ({
  className = '',
  size = 'md',
  showText = true
}) => {
  const sizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-11 w-11'
  }[size];

  return (
    <div className={`inline-flex items-center gap-2 group select-none ${className}`}>
      {/* Icono 3D de Concretar - Sin encuadrar, directo y metálico */}
      <div className={`relative ${sizeClasses} flex items-center justify-center shrink-0`}>
        {/* Resplandor 3D Ambiental */}
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/50 via-emerald-500/40 to-teal-300/40 rounded-full blur-md group-hover:scale-110 transition-transform duration-300 opacity-90" />

        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative w-full h-full drop-shadow-[0_6px_14px_rgba(0,0,0,0.8)] transform group-hover:scale-105 transition-transform duration-300"
        >
          <defs>
            <linearGradient id="concretarGold3D" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>

            <linearGradient id="concretarEmerald3D" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#064E3B" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#A7F3D0" />
            </linearGradient>

            <filter id="bevel3d" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Bloques Isométricos 3D Representativos de Concretar */}
          {/* Bloque Izquierdo Dorado */}
          <path
            d="M 20 60 L 50 78 L 50 48 L 20 30 Z"
            fill="url(#concretarGold3D)"
            filter="url(#bevel3d)"
          />
          {/* Bloque Derecho Esmeralda */}
          <path
            d="M 50 78 L 80 60 L 80 30 L 50 48 Z"
            fill="url(#concretarEmerald3D)"
            filter="url(#bevel3d)"
          />
          {/* Cara Superior Brillante */}
          <path
            d="M 50 18 L 80 30 L 50 48 L 20 30 Z"
            fill="#FEF08A"
            fillOpacity="0.95"
          />

          {/* Centro 3D C */}
          <path
            d="M 38 42 L 50 49 L 62 42 L 50 35 Z"
            fill="#10B981"
          />

          {/* Brillos especulares en bordes */}
          <path
            d="M 20 30 L 50 48 L 80 30"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity="0.85"
          />
          <path
            d="M 50 48 L 50 78"
            stroke="#FDE047"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.9"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col min-w-0">
          <span className="text-xs sm:text-sm font-black tracking-tight text-white leading-none group-hover:text-amber-300 transition-colors">
            CONCRETAR
          </span>
          <span className="text-[9px] font-bold text-emerald-400 tracking-wider uppercase mt-0.5">
            Desarrollos · +15 Años
          </span>
        </div>
      )}
    </div>
  );
};
