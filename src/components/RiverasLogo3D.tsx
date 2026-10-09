import React from 'react';

interface RiverasLogo3DProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const RiverasLogo3D: React.FC<RiverasLogo3DProps> = ({
  className = '',
  size = 'md',
  showText = true
}) => {
  const sizeClasses = {
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-12',
    lg: 'h-14 sm:h-16'
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 group select-none ${className}`}>
      {/* Emblem Icon: 3D Transparent Glass & Metallic Emblem */}
      <div className={`relative ${sizeClasses} aspect-square flex items-center justify-center`}>
        {/* Ambient Backlight Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/30 via-teal-400/20 to-amber-400/30 rounded-2xl blur-md group-hover:blur-lg transition-all duration-300 opacity-80 group-hover:opacity-100" />
        
        {/* Glass Container */}
        <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-zinc-900/80 via-emerald-950/40 to-black/90 backdrop-blur-md border border-emerald-400/40 shadow-[0_8px_24px_rgba(16,185,129,0.25)] flex items-center justify-center p-1.5 transition-all duration-300 group-hover:border-emerald-300 group-hover:scale-[1.03]">
          
          {/* Glass Reflection Highlight */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl pointer-events-none" />

          {/* Vector 3D Emblem SVG */}
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
          >
            <defs>
              <linearGradient id="riverGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="50%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>

              <linearGradient id="mountainMetallic" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#ECFDF5" />
                <stop offset="60%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#064E3B" />
              </linearGradient>

              <filter id="glow3d" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Mountain Peaks (Yungas / La Caldera) */}
            <path
              d="M15 68 L38 32 L58 58 L78 22 L92 68 Z"
              fill="url(#mountainMetallic)"
              fillOpacity="0.8"
              stroke="#A7F3D0"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {/* Secondary Back Mountain Layer */}
            <path
              d="M5 70 L28 42 L48 65 L68 38 L88 70 Z"
              fill="#065F46"
              fillOpacity="0.4"
            />

            {/* 3D Flowing River Curve (Río Pucheta Ribbon) */}
            <path
              d="M10 82 C30 82, 35 62, 55 68 C75 74, 78 52, 92 48"
              stroke="url(#riverGold)"
              strokeWidth="6"
              strokeLinecap="round"
              filter="url(#glow3d)"
            />

            {/* River Specular Highlight Ribbon */}
            <path
              d="M12 80 C32 80, 36 61, 56 67 C74 72, 78 51, 90 47"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeOpacity="0.8"
            />

            {/* Floating Gold Sun / Compass Star Emblem */}
            <circle cx="78" cy="22" r="5" fill="#FBBF24" className="animate-pulse" />
            <circle cx="78" cy="22" r="8" stroke="#FDE047" strokeWidth="1" strokeOpacity="0.6" />
          </svg>
        </div>
      </div>

      {/* Typography: "Riveras de Pucheta" */}
      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm sm:text-base lg:text-lg font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-emerald-200 group-hover:from-white group-hover:to-emerald-300 transition-all drop-shadow-xs truncate">
              Riveras de Pucheta
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-emerald-400 tracking-wider uppercase opacity-90 truncate mt-0.5">
            Barrio Privado Cerrado · La Caldera
          </span>
        </div>
      )}
    </div>
  );
};
