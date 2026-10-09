import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { 
  Lote, 
  LoteEstado, 
  ColorMode, 
  ProyectoDataJSON, 
  RealTimeStats, 
  AreaRange, 
  DataSourceMode
} from '../types';
import { cargarLotesDesdeKML } from '../utils/kmlParser';
import { useLotesStore, useViewStore } from '../store';

export interface LotesContextType {
  // Canonical JSON project structure
  proyectoData: ProyectoDataJSON;
  
  // Data source mode: 'demo' vs 'real'
  dataSourceMode: DataSourceMode;
  setDataSourceMode: (mode: DataSourceMode) => void;
  
  // All lotes in the subdivision
  allLotes: Lote[];
  
  // Dynamically filtered lotes based on current filters
  filteredLotes: Lote[];
  
  // Active selection
  selectedLote: Lote | null;
  setSelectedLote: (lote: Lote | null) => void;
  
  // Visual color mode for 3D and lists
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  
  // Filters
  manzanaFilter: string;
  setManzanaFilter: (manzana: string) => void;
  estadoFilter: string;
  setEstadoFilter: (estado: string) => void;
  areaRange: AreaRange;
  setAreaRange: (range: AreaRange | ((prev: AreaRange) => AreaRange)) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
  
  // State modification
  updateLoteStatus: (loteId: string, newStatus: LoteEstado) => void;
  
  // Real-time calculated statistics
  stats: RealTimeStats;
}

export const LotesContext = createContext<LotesContextType | undefined>(undefined);

export const DEFAULT_AREA_RANGE: AreaRange = { min: 0, max: 1200 };

/**
 * LotesProvider: Adaptador de compatibilidad que conecta el árbol de componentes
 * con los Zustand stores centralizados (`useLotesStore` y `useViewStore`).
 */
export const LotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const lotesState = useLotesStore();
  const { colorMode, setColorMode } = useViewStore();

  // Cargar lotes y polígonos reales desde doc.kml de forma diferida (idle/background)
  useEffect(() => {
    let isMounted = true;
    const scheduleLoad = typeof window !== 'undefined' && 'requestIdleCallback' in window
      ? (window as any).requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 200);

    const idleId = scheduleLoad(() => {
      cargarLotesDesdeKML()
        .then((kmlLotes) => {
          if (isMounted && kmlLotes && kmlLotes.length > 0) {
            useLotesStore.getState().setAllLotes(kmlLotes);
          }
        })
        .catch((err) => {
          console.warn('Advertencia al cargar /doc.kml, usando datos base:', err);
        });
    });

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined' && 'cancelIdleCallback' in window && typeof idleId === 'number') {
        (window as any).cancelIdleCallback(idleId);
      }
    };
  }, []);

  const value = useMemo<LotesContextType>(() => ({
    proyectoData: lotesState.proyectoData,
    dataSourceMode: lotesState.dataSourceMode,
    setDataSourceMode: lotesState.setDataSourceMode,
    allLotes: lotesState.allLotes,
    filteredLotes: lotesState.filteredLotes,
    selectedLote: lotesState.selectedLote,
    setSelectedLote: lotesState.setSelectedLote,
    colorMode,
    setColorMode,
    manzanaFilter: lotesState.manzanaFilter,
    setManzanaFilter: lotesState.setManzanaFilter,
    estadoFilter: lotesState.estadoFilter,
    setEstadoFilter: lotesState.setEstadoFilter,
    areaRange: lotesState.areaRange,
    setAreaRange: lotesState.setAreaRange,
    searchQuery: lotesState.searchQuery,
    setSearchQuery: lotesState.setSearchQuery,
    resetFilters: lotesState.resetFilters,
    updateLoteStatus: lotesState.updateLoteStatus,
    stats: lotesState.stats
  }), [
    lotesState.proyectoData,
    lotesState.dataSourceMode,
    lotesState.setDataSourceMode,
    lotesState.allLotes,
    lotesState.filteredLotes,
    lotesState.selectedLote,
    lotesState.setSelectedLote,
    colorMode,
    setColorMode,
    lotesState.manzanaFilter,
    lotesState.setManzanaFilter,
    lotesState.estadoFilter,
    lotesState.setEstadoFilter,
    lotesState.areaRange,
    lotesState.setAreaRange,
    lotesState.searchQuery,
    lotesState.setSearchQuery,
    lotesState.resetFilters,
    lotesState.updateLoteStatus,
    lotesState.stats
  ]);

  return <LotesContext.Provider value={value}>{children}</LotesContext.Provider>;
};

// Hook to access the Lotes context
export function useLotes(): LotesContextType {
  const context = useContext(LotesContext);
  if (!context) {
    throw new Error('useLotes must be used within a LotesProvider');
  }
  return context;
}
