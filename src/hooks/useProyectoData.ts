import { useContext, useMemo } from 'react';
import { ProyectoDataJSON, ManzanaDataJSON, Lote } from '../types';
import { INITIAL_PROYECTO_DATA_JSON } from '../data/proyectoJSON';
import { LotesContext } from '../context/LotesContext';

export interface UseProyectoDataReturn extends ProyectoDataJSON {
  // Helper accessors
  getManzana: (key: string) => ManzanaDataJSON | undefined;
  getLoteById: (id: string) => Lote | undefined;
  getAllLotesList: () => Lote[];
  getAmenidadesList: () => {
    hoteles: ProyectoDataJSON['amenidades']['hoteles'];
    plazas: ProyectoDataJSON['amenidades']['plazas'];
  };
  rawJSON: ProyectoDataJSON;
}

/**
 * Custom Hook: useProyectoData()
 * Retorna la estructura de datos JSON del proyecto:
 * {
 *   proyecto: { nombre, ubicacion, estadisticas },
 *   manzanas: { A: { nombre, cantidad_lotes, color, lotes: [...] }, ... },
 *   amenidades: { hoteles: [...], plazas: [...] }
 * }
 */
export function useProyectoData(): UseProyectoDataReturn {
  const context = useContext(LotesContext);
  const activeData: ProyectoDataJSON = context ? context.proyectoData : INITIAL_PROYECTO_DATA_JSON;

  const getManzana = (key: string) => {
    return activeData.manzanas[key.toUpperCase()];
  };

  const getLoteById = (id: string) => {
    for (const mzaKey of Object.keys(activeData.manzanas)) {
      const found = activeData.manzanas[mzaKey]?.lotes.find(
        (l) => l.id.toLowerCase() === id.toLowerCase()
      );
      if (found) return found;
    }
    return undefined;
  };

  const getAllLotesList = () => {
    const all: Lote[] = [];
    Object.values(activeData.manzanas).forEach((m) => {
      all.push(...m.lotes);
    });
    return all;
  };

  const getAmenidadesList = () => activeData.amenidades;

  return {
    proyecto: activeData.proyecto,
    manzanas: activeData.manzanas,
    amenidades: activeData.amenidades,
    rawJSON: activeData,
    getManzana,
    getLoteById,
    getAllLotesList,
    getAmenidadesList
  };
}
