import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { MobileTab } from '../types';

export interface UIState {
  mobileTab: MobileTab;
  isIntroModalOpen: boolean;
  isGuiaTechOpen: boolean;
  isPlanoModalOpen: boolean;
  isFotosModalOpen: boolean;
  isPanoramaModalOpen: boolean;
  isAmenidadModalOpen: boolean;
  isUbicacionModalOpen: boolean;
  isTabletMapDrawerOpen: boolean;
  selectedAmenidadId: string | null;

  // Actions
  setMobileTab: (tab: MobileTab) => void;
  setIntroModalOpen: (open: boolean) => void;
  setGuiaTechOpen: (open: boolean) => void;
  setPlanoModalOpen: (open: boolean) => void;
  setFotosModalOpen: (open: boolean) => void;
  setPanoramaModalOpen: (open: boolean) => void;
  setAmenidadModalOpen: (open: boolean, amenidadId?: string | null) => void;
  setUbicacionModalOpen: (open: boolean) => void;
  setTabletMapDrawerOpen: (open: boolean) => void;
  closeAllModals: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        mobileTab: '3d',
        isIntroModalOpen: false,
        isGuiaTechOpen: false,
        isPlanoModalOpen: false,
        isFotosModalOpen: false,
        isPanoramaModalOpen: false,
        isAmenidadModalOpen: false,
        isUbicacionModalOpen: false,
        isTabletMapDrawerOpen: false,
        selectedAmenidadId: null,

        setMobileTab: (tab) =>
          set({ mobileTab: tab }, false, 'setMobileTab'),

        setIntroModalOpen: (open) =>
          set({ isIntroModalOpen: open }, false, 'setIntroModalOpen'),

        setGuiaTechOpen: (open) =>
          set({ isGuiaTechOpen: open }, false, 'setGuiaTechOpen'),

        setPlanoModalOpen: (open) =>
          set({ isPlanoModalOpen: open }, false, 'setPlanoModalOpen'),

        setFotosModalOpen: (open) =>
          set({ isFotosModalOpen: open }, false, 'setFotosModalOpen'),

        setPanoramaModalOpen: (open) =>
          set({ isPanoramaModalOpen: open }, false, 'setPanoramaModalOpen'),

        setAmenidadModalOpen: (open, amenidadId = null) =>
          set(
            { isAmenidadModalOpen: open, selectedAmenidadId: amenidadId },
            false,
            'setAmenidadModalOpen'
          ),

        setUbicacionModalOpen: (open) =>
          set({ isUbicacionModalOpen: open }, false, 'setUbicacionModalOpen'),

        setTabletMapDrawerOpen: (open) =>
          set({ isTabletMapDrawerOpen: open }, false, 'setTabletMapDrawerOpen'),

        closeAllModals: () =>
          set(
            {
              isIntroModalOpen: false,
              isGuiaTechOpen: false,
              isPlanoModalOpen: false,
              isFotosModalOpen: false,
              isPanoramaModalOpen: false,
              isAmenidadModalOpen: false,
              isUbicacionModalOpen: false,
              isTabletMapDrawerOpen: false,
              selectedAmenidadId: null
            },
            false,
            'closeAllModals'
          )
      }),
      {
        name: 'riveras-ui-store',
        version: 1,
        // Solo persistir la pestaña activa preferida, los modales se abren limpios
        partialize: (state) => ({
          mobileTab: state.mobileTab
        })
      }
    ),
    { name: 'UIStore' }
  )
);
