import React from 'react';
import { Lote, LoteEstado } from '../../../types';
import { MANZANAS_CONFIG } from '../../../data/loteoData';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

interface LoteCardCompactProps {
  lote: Lote;
  isCurrent?: boolean;
  onClick: (lote: Lote) => void;
  onDoubleClick?: (lote: Lote) => void;
}

export const getStatusBadgeConfig = (estado: LoteEstado) => {
  switch (estado) {
    case 'disponible':
      return {
        text: 'Disponible',
        color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
        dot: 'bg-emerald-400',
        icon: CheckCircle2
      };
    case 'reservado':
      return {
        text: 'Reservado',
        color: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
        dot: 'bg-amber-400',
        icon: Clock
      };
    case 'vendido':
      return {
        text: 'Vendido',
        color: 'text-zinc-400 bg-zinc-800/80 border-zinc-700',
        dot: 'bg-zinc-500',
        icon: XCircle
      };
  }
};

export const LoteCardCompact: React.FC<LoteCardCompactProps> = React.memo(({
  lote,
  isCurrent = false,
  onClick,
  onDoubleClick
}) => {
  const badge = getStatusBadgeConfig(lote.estado);
  const Icon = badge.icon;
  const manzanaColor = MANZANAS_CONFIG[lote.manzana]?.color || '#94A3B8';

  return (
    <div
      id={`compact-lote-${lote.id}`}
      onClick={() => onClick(lote)}
      onDoubleClick={() => onDoubleClick?.(lote)}
      className={`min-h-[44px] p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all duration-150 group ${
        isCurrent
          ? 'bg-zinc-800 text-white border-zinc-600 shadow-md font-semibold'
          : 'bg-zinc-900/80 text-zinc-300 border-zinc-800/90 hover:bg-zinc-850 hover:text-white'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: manzanaColor }}
        />
        <span className={`font-bold ${isCurrent ? 'text-white' : 'text-zinc-200 group-hover:text-emerald-400 transition-colors'}`}>
          Lote {lote.id}
        </span>
        <span className={`text-[11px] ${isCurrent ? 'text-zinc-300' : 'text-zinc-500'}`}>
          {lote.area_m2.toFixed(0)} m²
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-[11px] font-mono ${isCurrent ? 'text-emerald-400' : 'text-zinc-400 font-medium'}`}>
          {lote.precio_usd ? `$${(lote.precio_usd / 1000).toFixed(0)}k` : 'Consultar'}
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.color}`}>
          <Icon className="w-3 h-3" />
          <span className="capitalize">{lote.estado}</span>
        </span>
      </div>
    </div>
  );
});

LoteCardCompact.displayName = 'LoteCardCompact';
