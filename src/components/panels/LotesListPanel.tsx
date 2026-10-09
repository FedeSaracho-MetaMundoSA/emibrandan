import React, { useState, useMemo, useCallback, Suspense } from 'react';
import { Lote, ManzanaKey } from '../../types';
import { MANZANAS_CONFIG } from '../../data/loteoData';
import { MapViewer, LoadingSpinner } from '../../utils/lazyLoader';
import { FilterBar } from './components/FilterBar';
import { LoteCardCompact } from './components/LoteCardCompact';
import { Building2, Map as MapIcon, ExternalLink } from 'lucide-react';

const ITEM_HEIGHT = 52;
const CONTAINER_HEIGHT = 320;
const OVERSCAN = 4;

interface LotesListPanelProps {
  activeManzanaKey: ManzanaKey | 'all';
  lotesDeManzana: Lote[];
  selectedLote: Lote | null;
  manzanaFilter: string;
  setManzanaFilter: (mza: string) => void;
  estadoFilter: string;
  setEstadoFilter: (estado: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectLote: (lote: Lote) => void;
  onSwitchTo3D?: () => void;
  isTablet?: boolean;
  onOpenTabletMapDrawer?: () => void;
}

export const LotesListPanel: React.FC<LotesListPanelProps> = React.memo(({
  activeManzanaKey,
  lotesDeManzana,
  selectedLote,
  manzanaFilter,
  setManzanaFilter,
  estadoFilter,
  setEstadoFilter,
  searchQuery,
  setSearchQuery,
  onSelectLote,
  onSwitchTo3D,
  isTablet,
  onOpenTabletMapDrawer
}) => {
  const [projectSubTab, setProjectSubTab] = useState<'lotes' | 'mapa'>('lotes');
  const [scrollTop, setScrollTop] = useState(0);

  const handleDoubleClickLote = useCallback((lote: Lote) => {
    onSelectLote(lote);
    const badge = document.getElementById('zoom-notice-badge');
    if (badge) {
      badge.classList.remove('opacity-0');
      badge.classList.add('opacity-100');
      setTimeout(() => {
        badge.classList.remove('opacity-100');
        badge.classList.add('opacity-0');
      }, 1500);
    }
  }, [onSelectLote]);

  const totalItems = lotesDeManzana.length;
  const totalHeight = totalItems * ITEM_HEIGHT;

  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    totalItems,
    Math.ceil((scrollTop + CONTAINER_HEIGHT) / ITEM_HEIGHT) + OVERSCAN
  );

  const visibleLotes = useMemo(() => {
    return lotesDeManzana.slice(startIndex, endIndex).map((lote, index) => ({
      lote,
      index: startIndex + index,
      top: (startIndex + index) * ITEM_HEIGHT
    }));
  }, [lotesDeManzana, startIndex, endIndex]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const manzanaColor =
    activeManzanaKey !== 'all'
      ? MANZANAS_CONFIG[activeManzanaKey]?.color || '#94A3B8'
      : '#10B981';

  return (
    <div className="space-y-4">
      {/* Navegación entre Vista de Lotes y Mapa Embebido */}
      <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl gap-1">
        <button
          id="subtab-lotes-list"
          onClick={() => setProjectSubTab('lotes')}
          className={`flex-1 min-h-[40px] py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            projectSubTab === 'lotes'
              ? 'bg-zinc-800 text-white shadow-xs border border-zinc-700'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Explorar Lotes</span>
        </button>

        <button
          id="subtab-google-map"
          onClick={() => {
            if (isTablet && onOpenTabletMapDrawer) {
              onOpenTabletMapDrawer();
            } else {
              setProjectSubTab('mapa');
            }
          }}
          className={`flex-1 min-h-[40px] py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            projectSubTab === 'mapa'
              ? 'bg-zinc-800 text-white shadow-xs border border-zinc-700'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isTablet ? 'Mapa (Drawer)' : 'Mapa & Amenidades'}</span>
        </button>
      </div>

      {projectSubTab === 'mapa' ? (
        <div className="space-y-3">
          {isTablet && onOpenTabletMapDrawer && (
            <button
              id="btn-open-drawer-from-map"
              onClick={onOpenTabletMapDrawer}
              className="w-full min-h-[44px] py-2 px-3 bg-zinc-900 border border-zinc-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 hover:bg-zinc-850 transition-colors shadow-xs cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-emerald-400" />
              <span>Expandir en Drawer Deslizable</span>
            </button>
          )}
          <Suspense fallback={<LoadingSpinner message="Cargando mapa..." size="sm" />}>
            <MapViewer selectedLote={null} />
          </Suspense>
        </div>
      ) : (
        <>
          {/* Barra consolidada de filtros */}
          <FilterBar
            activeManzanaKey={activeManzanaKey}
            manzanaFilter={manzanaFilter}
            setManzanaFilter={setManzanaFilter}
            estadoFilter={estadoFilter}
            setEstadoFilter={setEstadoFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          {/* LISTA DE LOTES EN MANZANA CON FONDO TRASLÚCIDO ARGENSALTA */}
          <div className="relative bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800 shadow-xl space-y-2.5 overflow-hidden">
            {/* Marca de agua institucional de fondo ArgenSALTA */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
              <img
                src="/logo.jpeg"
                alt=""
                className="w-3/4 max-w-[240px] object-contain opacity-[0.08] filter contrast-175 transform -rotate-6 scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-transparent to-zinc-900/70 pointer-events-none" />
            </div>

            <div className="relative z-10 flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: manzanaColor }}
                />
                Lotes en Manzana {activeManzanaKey !== 'all' ? activeManzanaKey : 'Todas'}
                <span className="text-zinc-500 font-normal">({lotesDeManzana.length})</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-medium bg-zinc-800/80 px-2 py-0.5 rounded-md">
                Click = 3D • 2x = Zoom
              </span>
            </div>

            {/* Virtualized Scrollable List for 60fps on weak mobile devices */}
            <div
              onScroll={handleScroll}
              className="relative z-10 max-h-[320px] overflow-y-auto pr-1 select-none"
              style={{ height: lotesDeManzana.length > 0 ? Math.min(320, totalHeight) : 'auto' }}
            >
              {lotesDeManzana.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-500">
                  No se encontraron lotes con los filtros aplicados
                </div>
              ) : (
                <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
                  {visibleLotes.map(({ lote, top }) => (
                    <div
                      key={lote.id}
                      style={{
                        position: 'absolute',
                        top: `${top}px`,
                        left: 0,
                        right: 0,
                        height: '46px'
                      }}
                    >
                      <LoteCardCompact
                        lote={lote}
                        isCurrent={selectedLote?.id === lote.id}
                        onClick={(l) => {
                          onSelectLote(l);
                          onSwitchTo3D?.();
                        }}
                        onDoubleClick={handleDoubleClickLote}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
});

LotesListPanel.displayName = 'LotesListPanel';
