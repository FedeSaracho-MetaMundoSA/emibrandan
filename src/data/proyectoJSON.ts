import { ProyectoDataJSON, ManzanaDataJSON, ManzanaKey, Lote } from '../types';
import { LOTES_DATA, MANZANAS_CONFIG } from './loteoData';

// Function to construct the complete JSON project structure requested by user
export function buildProyectoDataJSON(lotesList: Lote[] = LOTES_DATA): ProyectoDataJSON {
  const manzanasKeys: ManzanaKey[] = ['A', 'B', 'C', 'E', 'G', 'I', 'K', 'L'];
  
  const manzanasRecord: Record<string, ManzanaDataJSON> = {};

  manzanasKeys.forEach((key) => {
    const config = MANZANAS_CONFIG[key];
    const mzaLotes = lotesList.filter((l) => l.manzana === key);

    manzanasRecord[key] = {
      nombre: config ? config.nombre : `Manzana ${key}`,
      cantidad_lotes: mzaLotes.length,
      color: config ? config.color : '#3B82F6',
      lotes: mzaLotes.map((l) => ({
        ...l,
        status: l.estado || l.status || 'disponible',
        estado: l.estado || l.status || 'disponible'
      }))
    };
  });

  const totalLotes = lotesList.length;
  const areaTotal = lotesList.reduce((acc, l) => acc + (l.area_m2 || 300), 0);

  return {
    proyecto: {
      nombre: 'Riveras de Pucheta',
      ubicacion: {
        ciudad: 'Salta',
        provincia: 'Salta',
        pais: 'Argentina',
        lat: -24.58749,
        lon: -65.37728
      },
      estadisticas: {
        total_lotes: totalLotes,
        area_total_m2: Math.round(areaTotal),
        manzanas: manzanasKeys
      }
    },
    manzanas: manzanasRecord,
    amenidades: {
      hoteles: [
        {
          nombre: 'Hotel Primera Clase',
          lat: -24.5885,
          lon: -65.3750,
          tipo: 'hotel'
        }
      ],
      plazas: [
        {
          nombre: 'Plaza Central',
          lat: -24.5870,
          lon: -65.3760,
          tipo: 'plaza'
        }
      ]
    }
  };
}

export const INITIAL_PROYECTO_DATA_JSON: ProyectoDataJSON = buildProyectoDataJSON();
