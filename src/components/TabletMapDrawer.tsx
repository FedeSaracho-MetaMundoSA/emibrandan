import React, { Suspense } from 'react';
import { X, MapPin } from 'lucide-react';
import { Lote } from '../types';
import { MapViewer, LoadingSpinner } from '../utils/lazyLoader';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface TabletMapDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLote: Lote | null;
}

export const TabletMapDrawer: React.FC<TabletMapDrawerProps> = ({
  isOpen,
  onClose,
  selectedLote
}) => {
  const dialogRef = useFocusTrap<HTMLDivElement>({
    isOpen,
    onClose
  });

  if (!isOpen) return null;

  return (
    <div 
      id="tablet-map-drawer-root"
      className="fixed inset-0 z-50 overflow-hidden select-none animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div 
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tablet-map-title"
          tabIndex={-1}
          className="w-screen max-w-xl bg-white shadow-2xl flex flex-col animate-slide-left focus:outline-none"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 id="tablet-map-title" className="text-base font-bold text-zinc-900 leading-tight">
                  Ubicación & Amenidades Cercanas
                </h2>
                <p className="text-xs text-zinc-500">
                  {selectedLote 
                    ? `Lote ${selectedLote.id} • Lat: ${selectedLote.lat} Lon: ${selectedLote.lon}`
                    : 'Riveras de Pucheta • Salta, Argentina'}
                </p>
              </div>
            </div>

            <button
              id="btn-close-tablet-map-drawer"
              onClick={onClose}
              className="min-h-[48px] min-w-[48px] rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 active:bg-zinc-200 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
              aria-label="Cerrar mapa deslizable"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Map Viewer Container */}
          <div className="flex-1 p-4 overflow-y-auto">
            <Suspense fallback={<LoadingSpinner message="Cargando mapa satelital..." size="lg" />}>
              <MapViewer 
                selectedLote={selectedLote}
                height="100%"
                className="h-full min-h-[480px] rounded-2xl overflow-hidden border border-zinc-200"
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};
