import React from 'react';
import { ManzanaKey, LoteEstado } from '../../../types';
import { MANZANAS_CONFIG } from '../../../data/loteoData';
import { Search, Building2 } from 'lucide-react';

interface FilterBarProps {
  activeManzanaKey: ManzanaKey | 'all';
  manzanaFilter: string;
  setManzanaFilter: (mza: string) => void;
  estadoFilter: string;
  setEstadoFilter: (estado: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showManzanaSelector?: boolean;
}

const MANZANAS_LIST: ManzanaKey[] = ['A', 'B', 'C', 'E', 'G', 'I', 'K', 'L'];

export const FilterBar: React.FC<FilterBarProps> = React.memo(({
  activeManzanaKey,
  manzanaFilter,
  setManzanaFilter,
  estadoFilter,
  setEstadoFilter,
  searchQuery,
  setSearchQuery,
  showManzanaSelector = true
}) => {
  return (
    <div className="space-y-3">
      {/* Selector de Manzana (Tabs horizontales) */}
      {showManzanaSelector && (
        <div className="bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800 shadow-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
              Selector de Manzana
            </span>
            <span className="text-[11px] font-semibold text-zinc-400">
              {activeManzanaKey !== 'all' ? `Manzana ${activeManzanaKey}` : 'Todas'}
            </span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
            <button
              id="tab-mza-all"
              onClick={() => setManzanaFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                manzanaFilter === 'all'
                  ? 'bg-emerald-500 text-zinc-950 shadow-xs'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              Todas
            </button>

            {MANZANAS_LIST.map((mza) => {
              const isSelected = activeManzanaKey === mza && manzanaFilter !== 'all';
              const mzaConfig = MANZANAS_CONFIG[mza];

              return (
                <button
                  key={mza}
                  id={`tab-mza-${mza}`}
                  onClick={() => setManzanaFilter(mza)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500 text-zinc-950 shadow-xs'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: mzaConfig?.color || '#94A3B8' }}
                  />
                  <span>{mza}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtros de Búsqueda: Por número y por estado */}
      <div className="bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800 shadow-lg space-y-3">
        <span className="text-xs font-bold text-white block">
          Filtros de Búsqueda
        </span>

        {/* Input de búsqueda por número de lote */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="search-lote-number-input"
            type="text"
            placeholder="Buscar por número o ID (ej: 1, 108, A-1)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtro por estado (disponible / vendido / reservado) */}
        <div>
          <span className="text-[11px] font-semibold text-zinc-400 block mb-1.5">
            Por estado:
          </span>
          <div className="grid grid-cols-4 gap-1">
            <button
              id="filter-state-all"
              onClick={() => setEstadoFilter('all')}
              className={`py-1 text-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                estadoFilter === 'all'
                  ? 'bg-zinc-100 text-zinc-950 shadow-xs'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              Todos
            </button>

            <button
              id="filter-state-disponible"
              onClick={() => setEstadoFilter('disponible')}
              className={`py-1 text-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                estadoFilter === 'disponible'
                  ? 'bg-emerald-500 text-zinc-950 font-bold shadow-xs'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
              }`}
            >
              Disponibles
            </button>

            <button
              id="filter-state-reservado"
              onClick={() => setEstadoFilter('reservado')}
              className={`py-1 text-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                estadoFilter === 'reservado'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-xs'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
              }`}
            >
              Reservados
            </button>

            <button
              id="filter-state-vendido"
              onClick={() => setEstadoFilter('vendido')}
              className={`py-1 text-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                estadoFilter === 'vendido'
                  ? 'bg-zinc-700 text-white shadow-xs'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              Vendidos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

FilterBar.displayName = 'FilterBar';
