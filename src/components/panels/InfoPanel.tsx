import React, { useState, useMemo } from 'react';
import { ManzanaKey } from '../../types';
import { MANZANAS_CONFIG } from '../../data/loteoData';
import { useLotes } from '../../context/LotesContext';
import { InfoPanelProps } from './types';
import { ProjectHeaderPanel } from './ProjectHeaderPanel';
import { ProjectStatsPanel } from './ProjectStatsPanel';
import { LotesListPanel } from './LotesListPanel';
import { LoteDetailPanel } from './LoteDetailPanel';
import { AsesorFormalCard } from './AsesorFormalCard';
import { BookmarkCheck } from 'lucide-react';

export const InfoPanel: React.FC<InfoPanelProps> = ({
  onOpenGuiaTech,
  onOpenTabletMapDrawer,
  onOpenIntroModal,
  isTablet,
  onSwitchTo3D
}) => {
  const {
    allLotes,
    selectedLote,
    setSelectedLote,
    manzanaFilter,
    setManzanaFilter,
    estadoFilter,
    setEstadoFilter,
    searchQuery,
    setSearchQuery,
    updateLoteStatus,
    stats
  } = useLotes();

  const [reservationNotice, setReservationNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setReservationNotice(msg);
    setTimeout(() => setReservationNotice(null), 3000);
  };

  // Manzana activa para la lista (si hay lote seleccionado muestra su manzana; si no, la del filtro o 'A')
  const activeManzanaKey: ManzanaKey = useMemo(() => {
    if (selectedLote) return selectedLote.manzana;
    if (manzanaFilter !== 'all' && manzanaFilter in MANZANAS_CONFIG) {
      return manzanaFilter as ManzanaKey;
    }
    return 'A';
  }, [selectedLote, manzanaFilter]);

  // Lista de lotes de la manzana activa, filtrados y ordenados
  const lotesDeManzana = useMemo(() => {
    return allLotes
      .filter((l) => l.manzana === activeManzanaKey)
      .filter((l) => {
        if (estadoFilter !== 'all' && l.estado !== estadoFilter) return false;
        if (searchQuery.trim()) {
          const query = searchQuery.trim().toLowerCase();
          return l.id.toLowerCase().includes(query) || l.numero.toString().includes(query);
        }
        return true;
      })
      .sort((a, b) => a.numero - b.numero);
  }, [allLotes, activeManzanaKey, estadoFilter, searchQuery]);

  return (
    <aside
      id="info-panel-sidebar"
      className="w-full h-full flex flex-col bg-zinc-950 border-l border-zinc-800 overflow-hidden select-none text-zinc-100"
    >
      {/* Toast de notificación rápida */}
      {reservationNotice && (
        <div className="bg-amber-500 text-zinc-950 font-bold px-4 py-2 text-xs text-center shadow-md animate-fade-in flex items-center justify-center gap-2 shrink-0">
          <BookmarkCheck className="w-4 h-4" />
          <span>{reservationNotice}</span>
        </div>
      )}

      {/* Badge flotante de doble click / zoom */}
      <div
        id="zoom-notice-badge"
        className="opacity-0 transition-opacity duration-300 pointer-events-none fixed top-16 right-6 z-50 bg-zinc-900/90 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl border border-zinc-800"
      >
        🔍 Zoom 3D aplicado al lote
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        {/* Marca de agua ambiental suave de ArgenSALTA en el fondo del sidebar */}
        <div className="absolute bottom-4 right-2 pointer-events-none overflow-hidden select-none opacity-[0.05] z-0">
          <img
            src="/logo.jpeg"
            alt=""
            className="w-48 object-contain filter contrast-150"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="relative z-10 space-y-4">
          {selectedLote ? (
            <>
              <LoteDetailPanel
                selectedLote={selectedLote}
                allLotes={allLotes}
                lotesDeManzana={lotesDeManzana}
                onSelectLote={setSelectedLote}
                onUpdateLoteStatus={updateLoteStatus}
                onSwitchTo3D={onSwitchTo3D}
                onShowNotice={showNotice}
              />
              <AsesorFormalCard onOpenIntroModal={onOpenIntroModal} compact />
            </>
          ) : (
            <>
              <ProjectHeaderPanel 
                onOpenGuiaTech={onOpenGuiaTech} 
                onOpenIntroModal={onOpenIntroModal} 
              />
              <ProjectStatsPanel stats={stats} />
              <LotesListPanel
                activeManzanaKey={activeManzanaKey}
                lotesDeManzana={lotesDeManzana}
                selectedLote={selectedLote}
                manzanaFilter={manzanaFilter}
                setManzanaFilter={setManzanaFilter}
                estadoFilter={estadoFilter}
                setEstadoFilter={setEstadoFilter}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSelectLote={setSelectedLote}
                onSwitchTo3D={onSwitchTo3D}
                isTablet={isTablet}
                onOpenTabletMapDrawer={onOpenTabletMapDrawer}
              />
              <AsesorFormalCard onOpenIntroModal={onOpenIntroModal} />
            </>
          )}
        </div>
      </div>
    </aside>
  );
};
