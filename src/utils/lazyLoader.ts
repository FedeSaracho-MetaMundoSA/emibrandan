import { lazy } from 'react';
export { LoadingSpinner } from '../components/LoadingSpinner';

/**
 * Lazy loaded heavy components for Code Splitting & on-demand loading.
 * Reduces initial bundle size and accelerates initial paint.
 */

export const GuiaTechModal = lazy(() =>
  import('../components/GuiaTechModal').then((m) => ({ default: m.GuiaTechModal }))
);

export const Plano2DModal = lazy(() =>
  import('../components/Plano2DModal').then((m) => ({ default: m.Plano2DModal }))
);

export const Panorama360Modal = lazy(() =>
  import('../components/Panorama360Modal').then((m) => ({ default: m.Panorama360Modal }))
);

export const TerrenoFotosModal = lazy(() =>
  import('../components/TerrenoFotosModal').then((m) => ({ default: m.TerrenoFotosModal }))
);

export const MapViewer = lazy(() =>
  import('../components/MapViewer').then((m) => ({ default: m.MapViewer }))
);

export const IntroWebModal = lazy(() =>
  import('../components/IntroWebModal').then((m) => ({ default: m.IntroWebModal }))
);

export const UbicacionModal = lazy(() =>
  import('../components/UbicacionModal').then((m) => ({ default: m.UbicacionModal }))
);

export const ProyectoJSONModal = lazy(() =>
  import('../components/ProyectoJSONModal').then((m) => ({ default: m.ProyectoJSONModal }))
);
