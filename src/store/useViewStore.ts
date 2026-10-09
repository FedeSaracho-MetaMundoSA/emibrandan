import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { CameraPreset, ColorMode } from '../types';

export interface ViewState {
  cameraPreset: CameraPreset;
  colorMode: ColorMode;
  showGrid: boolean;
  animationSpeed: number;
  autoRotate: boolean;
  isDroneTourActive: boolean;

  // Actions
  setCameraPreset: (preset: CameraPreset) => void;
  setColorMode: (mode: ColorMode) => void;
  toggleGrid: () => void;
  setShowGrid: (show: boolean) => void;
  setAnimationSpeed: (speed: number) => void;
  setAutoRotate: (active: boolean) => void;
  toggleAutoRotate: () => void;
  setDroneTourActive: (active: boolean) => void;
  resetView: () => void;
}

export const useViewStore = create<ViewState>()(
  devtools(
    persist(
      (set) => ({
        cameraPreset: 'isometric',
        colorMode: 'estado',
        showGrid: true,
        animationSpeed: 1,
        autoRotate: false,
        isDroneTourActive: false,

        setCameraPreset: (preset) =>
          set({ cameraPreset: preset }, false, 'setCameraPreset'),

        setColorMode: (mode) =>
          set({ colorMode: mode }, false, 'setColorMode'),

        toggleGrid: () =>
          set((state) => ({ showGrid: !state.showGrid }), false, 'toggleGrid'),

        setShowGrid: (show) =>
          set({ showGrid: show }, false, 'setShowGrid'),

        setAnimationSpeed: (speed) =>
          set({ animationSpeed: speed }, false, 'setAnimationSpeed'),

        setAutoRotate: (active) =>
          set({ autoRotate: active }, false, 'setAutoRotate'),

        toggleAutoRotate: () =>
          set((state) => ({ autoRotate: !state.autoRotate }), false, 'toggleAutoRotate'),

        setDroneTourActive: (active) =>
          set({ isDroneTourActive: active }, false, 'setDroneTourActive'),

        resetView: () =>
          set(
            {
              cameraPreset: 'isometric',
              colorMode: 'natural',
              showGrid: true,
              autoRotate: false,
              isDroneTourActive: false
            },
            false,
            'resetView'
          )
      }),
      {
        name: 'riveras-view-store',
        version: 1,
        // Solo persistir preferencias del usuario, no tours activos
        partialize: (state) => ({
          cameraPreset: state.cameraPreset,
          colorMode: state.colorMode,
          showGrid: state.showGrid,
          animationSpeed: state.animationSpeed
        })
      }
    ),
    { name: 'ViewStore' }
  )
);
