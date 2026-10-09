import React, { useMemo } from 'react';
import { useLotes } from '../../context/LotesContext';
import { TrendingUp, Home, PieChart, MapPin } from 'lucide-react';

interface ProjectStatsPanelProps {
  stats?: {
    totalLotes: number;
    disponibles: number;
    reservados: number;
    vendidos: number;
    areaTotalM2?: number;
    areaPromedioM2?: number;
    porcentajeVendido?: number;
    precioPromedioUSD?: number;
  };
}

export function ProjectStatsPanel(props?: ProjectStatsPanelProps) {
  const { stats: contextStats } = useLotes();
  const stats = props?.stats ? { ...contextStats, ...props.stats } : contextStats;

  const statsCards = useMemo(() => [
    {
      label: 'Lotes Totales',
      value: stats.totalLotes,
      icon: Home,
      color: 'bg-blue-100 text-blue-900',
      change: `${stats.disponibles} disponibles`
    },
    {
      label: 'Área Total',
      value: `${Math.round(stats.areaTotalM2 || 112200)} m²`,
      icon: MapPin,
      color: 'bg-green-100 text-green-900',
      change: `${Math.round(stats.areaPromedioM2 || 300)} m² promedio`
    },
    {
      label: 'Ocupación',
      value: `${stats.porcentajeVendido}%`,
      icon: PieChart,
      color: 'bg-amber-100 text-amber-900',
      change: `${stats.vendidos} vendidos`
    },
    {
      label: 'Precio Promedio',
      value: `$${Math.round(stats.precioPromedioUSD || 15000).toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-purple-100 text-purple-900',
      change: 'USD'
    }
  ], [stats]);

  return (
    <div id="project-stats-panel" className="space-y-3">
      <h2 className="text-lg font-bold text-zinc-100">Estadísticas del Proyecto</h2>
      
      <div className="grid grid-cols-2 gap-2">
        {statsCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`${card.color} rounded-lg p-3 border border-current border-opacity-10 shadow-xs`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium opacity-75">{card.label}</p>
                  <p className="text-lg font-bold mt-1">{card.value}</p>
                  <p className="text-xs opacity-60 mt-0.5">{card.change}</p>
                </div>
                <Icon size={20} className="opacity-60 shrink-0" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
