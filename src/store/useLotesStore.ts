import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  Lote,
  LoteEstado,
  DataSourceMode,
  AreaRange,
  RealTimeStats,
  ProyectoDataJSON,
  ManzanaKey
} from '../types';
import { LOTES_DATA, DATA_SOURCE_CONFIG, generateAllLotes } from '../data/loteoData';
import { buildProyectoDataJSON } from '../data/proyectoJSON';

export const DEFAULT_AREA_RANGE: AreaRange = { min: 0, max: 1200 };

function computeFilteredLotes(
  lotes: Lote[],
  manzanaFilter: string,
  estadoFilter: string,
  areaRange: AreaRange,
  searchQuery: string
): Lote[] {
  const query = searchQuery.trim().toLowerCase();

  return lotes.filter((l) => {
    if (manzanaFilter !== 'all' && l.manzana !== manzanaFilter) {
      return false;
    }

    const currentEstado = l.estado || l.status;
    if (estadoFilter !== 'all' && currentEstado !== estadoFilter) {
      return false;
    }

    const area = l.area_m2 || 300;
    if (area < areaRange.min || area > areaRange.max) {
      return false;
    }

    if (query) {
      const matchesId = l.id.toLowerCase().includes(query);
      const matchesNum = l.numero.toString().includes(query);
      const matchesMza =
        `manzana ${l.manzana}`.toLowerCase().includes(query) ||
        l.manzana.toLowerCase() === query;
      if (!matchesId && !matchesNum && !matchesMza) {
        return false;
      }
    }

    return true;
  });
}

function computeStats(lotes: Lote[], filteredLotes: Lote[]): RealTimeStats {
  const total = lotes.length;
  let disp = 0;
  let res = 0;
  let vend = 0;
  let sumArea = 0;
  let sumPrice = 0;

  const mzaStats: Record<
    string,
    { total: number; disponibles: number; reservados: number; vendidos: number; areaTotal: number }
  > = {};
  const manzanasKeys: ManzanaKey[] = ['A', 'B', 'C', 'E', 'G', 'I', 'K', 'L'];

  manzanasKeys.forEach((key) => {
    mzaStats[key] = { total: 0, disponibles: 0, reservados: 0, vendidos: 0, areaTotal: 0 };
  });

  lotes.forEach((l) => {
    const st = l.estado || l.status;
    const area = l.area_m2 || 300;
    sumArea += area;
    sumPrice += l.precio_usd || 0;

    if (st === 'disponible') disp++;
    else if (st === 'reservado') res++;
    else if (st === 'vendido') vend++;

    if (mzaStats[l.manzana]) {
      mzaStats[l.manzana].total++;
      mzaStats[l.manzana].areaTotal += area;
      if (st === 'disponible') mzaStats[l.manzana].disponibles++;
      else if (st === 'reservado') mzaStats[l.manzana].reservados++;
      else if (st === 'vendido') mzaStats[l.manzana].vendidos++;
    }
  });

  const filteredArea = filteredLotes.reduce((acc, curr) => acc + (curr.area_m2 || 300), 0);

  return {
    totalLotes: total,
    disponibles: disp,
    reservados: res,
    vendidos: vend,
    porcentajeDisponible: total > 0 ? Math.round((disp / total) * 1000) / 10 : 0,
    porcentajeReservado: total > 0 ? Math.round((res / total) * 1000) / 10 : 0,
    porcentajeVendido: total > 0 ? Math.round((vend / total) * 1000) / 10 : 0,
    areaTotalM2: Math.round(sumArea),
    areaPromedioM2: total > 0 ? Math.round(sumArea / total) : 300,
    precioPromedioUSD: total > 0 ? Math.round(sumPrice / total) : 15000,
    filteredCount: filteredLotes.length,
    filteredAreaM2: Math.round(filteredArea),
    estadisticasPorManzana: mzaStats
  };
}

export interface LotesState {
  allLotes: Lote[];
  filteredLotes: Lote[];
  selectedLote: Lote | null;
  dataSourceMode: DataSourceMode;
  manzanaFilter: string;
  estadoFilter: string;
  areaRange: AreaRange;
  searchQuery: string;
  stats: RealTimeStats;
  proyectoData: ProyectoDataJSON;
  customStatuses: Record<string, LoteEstado>;

  // Actions
  setAllLotes: (lotes: Lote[]) => void;
  setSelectedLote: (lote: Lote | null) => void;
  setDataSourceMode: (mode: DataSourceMode) => void;
  setManzanaFilter: (manzana: string) => void;
  setEstadoFilter: (estado: string) => void;
  setAreaRange: (range: AreaRange | ((prev: AreaRange) => AreaRange)) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
  updateLoteStatus: (loteId: string, newStatus: LoteEstado) => void;
  getLoteById: (id: string) => Lote | undefined;
}

const initialLotes = LOTES_DATA;
const initialFiltered = computeFilteredLotes(initialLotes, 'all', 'all', DEFAULT_AREA_RANGE, '');
const initialStats = computeStats(initialLotes, initialFiltered);
const initialProyecto = buildProyectoDataJSON(initialLotes);

export const useLotesStore = create<LotesState>()(
  devtools(
    persist(
      (set, get) => ({
        allLotes: initialLotes,
        filteredLotes: initialFiltered,
        selectedLote: null,
        dataSourceMode: DATA_SOURCE_CONFIG.defaultMode,
        manzanaFilter: 'all',
        estadoFilter: 'all',
        areaRange: DEFAULT_AREA_RANGE,
        searchQuery: '',
        stats: initialStats,
        proyectoData: initialProyecto,
        customStatuses: {},

        setAllLotes: (lotes) => {
          const { manzanaFilter, estadoFilter, areaRange, searchQuery, customStatuses, selectedLote } = get();
          
          // Aplicar estados personalizados guardados
          const appliedLotes = lotes.map((l) => {
            if (customStatuses[l.id]) {
              return { ...l, estado: customStatuses[l.id], status: customStatuses[l.id] };
            }
            return l;
          });

          const filtered = computeFilteredLotes(appliedLotes, manzanaFilter, estadoFilter, areaRange, searchQuery);
          const stats = computeStats(appliedLotes, filtered);
          const proyecto = buildProyectoDataJSON(appliedLotes);

          let updatedSelected = selectedLote;
          if (selectedLote) {
            updatedSelected = appliedLotes.find((l) => l.id === selectedLote.id) || null;
          }

          set(
            {
              allLotes: appliedLotes,
              filteredLotes: filtered,
              stats,
              proyectoData: proyecto,
              selectedLote: updatedSelected
            },
            false,
            'setAllLotes'
          );
        },

        setSelectedLote: (lote) =>
          set({ selectedLote: lote }, false, 'setSelectedLote'),

        setDataSourceMode: (mode) => {
          const newLotes = generateAllLotes(mode);
          const { manzanaFilter, estadoFilter, areaRange, searchQuery, selectedLote } = get();
          const filtered = computeFilteredLotes(newLotes, manzanaFilter, estadoFilter, areaRange, searchQuery);
          const stats = computeStats(newLotes, filtered);
          const proyecto = buildProyectoDataJSON(newLotes);

          let updatedSelected: Lote | null = null;
          if (selectedLote) {
            updatedSelected = newLotes.find((l) => l.id === selectedLote.id) || null;
          }

          set(
            {
              dataSourceMode: mode,
              allLotes: newLotes,
              filteredLotes: filtered,
              stats,
              proyectoData: proyecto,
              selectedLote: updatedSelected
            },
            false,
            'setDataSourceMode'
          );
        },

        setManzanaFilter: (manzana) => {
          const { allLotes, estadoFilter, areaRange, searchQuery } = get();
          const filtered = computeFilteredLotes(allLotes, manzana, estadoFilter, areaRange, searchQuery);
          const stats = computeStats(allLotes, filtered);
          set({ manzanaFilter: manzana, filteredLotes: filtered, stats }, false, 'setManzanaFilter');
        },

        setEstadoFilter: (estado) => {
          const { allLotes, manzanaFilter, areaRange, searchQuery } = get();
          const filtered = computeFilteredLotes(allLotes, manzanaFilter, estado, areaRange, searchQuery);
          const stats = computeStats(allLotes, filtered);
          set({ estadoFilter: estado, filteredLotes: filtered, stats }, false, 'setEstadoFilter');
        },

        setAreaRange: (rangeInput) => {
          const { allLotes, manzanaFilter, estadoFilter, areaRange: currentRange, searchQuery } = get();
          const nextRange = typeof rangeInput === 'function' ? rangeInput(currentRange) : rangeInput;
          const filtered = computeFilteredLotes(allLotes, manzanaFilter, estadoFilter, nextRange, searchQuery);
          const stats = computeStats(allLotes, filtered);
          set({ areaRange: nextRange, filteredLotes: filtered, stats }, false, 'setAreaRange');
        },

        setSearchQuery: (query) => {
          const { allLotes, manzanaFilter, estadoFilter, areaRange } = get();
          const filtered = computeFilteredLotes(allLotes, manzanaFilter, estadoFilter, areaRange, query);
          const stats = computeStats(allLotes, filtered);
          set({ searchQuery: query, filteredLotes: filtered, stats }, false, 'setSearchQuery');
        },

        resetFilters: () => {
          const { allLotes } = get();
          const filtered = computeFilteredLotes(allLotes, 'all', 'all', DEFAULT_AREA_RANGE, '');
          const stats = computeStats(allLotes, filtered);
          set(
            {
              manzanaFilter: 'all',
              estadoFilter: 'all',
              areaRange: DEFAULT_AREA_RANGE,
              searchQuery: '',
              filteredLotes: filtered,
              stats
            },
            false,
            'resetFilters'
          );
        },

        updateLoteStatus: (loteId, newStatus) => {
          const { allLotes, manzanaFilter, estadoFilter, areaRange, searchQuery, selectedLote, customStatuses } = get();

          const updatedLotes = allLotes.map((l) =>
            l.id === loteId
              ? { ...l, estado: newStatus, status: newStatus }
              : l
          );

          const filtered = computeFilteredLotes(updatedLotes, manzanaFilter, estadoFilter, areaRange, searchQuery);
          const stats = computeStats(updatedLotes, filtered);
          const proyecto = buildProyectoDataJSON(updatedLotes);

          let updatedSelected = selectedLote;
          if (selectedLote && selectedLote.id === loteId) {
            updatedSelected = { ...selectedLote, estado: newStatus, status: newStatus };
          }

          set(
            {
              allLotes: updatedLotes,
              filteredLotes: filtered,
              stats,
              proyectoData: proyecto,
              selectedLote: updatedSelected,
              customStatuses: {
                ...customStatuses,
                [loteId]: newStatus
              }
            },
            false,
            'updateLoteStatus'
          );
        },

        getLoteById: (id) => {
          return get().allLotes.find((l) => l.id === id);
        }
      }),
      {
        name: 'riveras-lotes-store',
        version: 1,
        // Persistir solo filtros y modificaciones personalizadas de estado para no inflar localStorage
        partialize: (state) => ({
          manzanaFilter: state.manzanaFilter,
          estadoFilter: state.estadoFilter,
          areaRange: state.areaRange,
          searchQuery: state.searchQuery,
          dataSourceMode: state.dataSourceMode,
          customStatuses: state.customStatuses
        })
      }
    ),
    { name: 'LotesStore' }
  )
);
