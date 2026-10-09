import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'emerald' | 'amber' | 'zinc';
}

export const StatsCard: React.FC<StatsCardProps> = React.memo(({
  label,
  value,
  sublabel,
  icon: Icon,
  variant = 'default'
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'emerald':
        return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400';
      case 'amber':
        return 'bg-amber-500/10 border-amber-500/25 text-amber-400';
      case 'zinc':
        return 'bg-zinc-800/80 border-zinc-700/80 text-zinc-300';
      default:
        return 'bg-zinc-950/70 border-zinc-800/80 text-white';
    }
  };

  return (
    <div className={`rounded-xl p-2.5 border text-center transition-all ${getVariantStyles()}`}>
      {Icon && (
        <div className="flex justify-center mb-1">
          <Icon className="w-3.5 h-3.5 opacity-80" />
        </div>
      )}
      <span className="text-[10px] text-zinc-400 font-semibold block leading-tight">
        {label}
      </span>
      <span className="text-lg font-black block mt-0.5 tracking-tight">
        {value}
      </span>
      {sublabel && (
        <span className="text-[9px] text-zinc-500 block mt-0.5">
          {sublabel}
        </span>
      )}
    </div>
  );
});

StatsCard.displayName = 'StatsCard';
