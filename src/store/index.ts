/**
 * Zustand Store Central Index & Helpers
 * Riveras de Pucheta Masterplan 3D
 */

import { create, StateCreator } from 'zustand';
import { devtools, persist, PersistOptions } from 'zustand/middleware';

/**
 * Helper para crear stores con tipado estricto, persistencia automática en localStorage
 * y soporte para time-travel debugging con Redux DevTools.
 *
 * @param name Nombre identificador en DevTools y clave de almacenamiento en localStorage
 * @param creator Función StateCreator de Zustand
 * @param persistOptions Opciones opcionales de persistencia (e.g. partialize, version)
 */
export function createPersistedStore<T extends object>(
  name: string,
  creator: StateCreator<T, [['zustand/devtools', never], ['zustand/persist', unknown]], []>,
  persistOptions?: Omit<PersistOptions<T>, 'name'>
) {
  return create<T>()(
    devtools(
      persist(creator, {
        name,
        ...persistOptions
      }),
      { name }
    )
  );
}

export * from './useViewStore';
export * from './useLotesStore';
export * from './useUIStore';
