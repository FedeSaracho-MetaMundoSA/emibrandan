/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { LotesProvider, useLotes } from './context/LotesContext';
import { useUIStore } from './store';
import { Header } from './components/Header';
import { MasterplanViewer } from './components/MasterplanViewer';
import { InfoPanel } from './components/InfoPanel';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileBottomSheet } from './components/MobileBottomSheet';
import { TabletMapDrawer } from './components/TabletMapDrawer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { MobileTab, Lote } from './types';
import { ErrorBoundary, ModalErrorFallback } from './components/errors';
import { PanelRightOpen } from 'lucide-react';
import {
  MapViewer,
  IntroWebModal,
  GuiaTechModal,
  Plano2DModal,
  LoadingSpinner
} from './utils/lazyLoader';

function MainApp() {
  const {
    allLotes,
    filteredLotes,
    selectedLote,
    setSelectedLote,
    colorMode,
    setColorMode,
    manzanaFilter
  } = useLotes();

  // UI states managed by Zustand store (supports persistence & DevTools)
  const {
    mobileTab,
    setMobileTab,
    isIntroModalOpen,
    setIntroModalOpen,
    isGuiaTechOpen,
    setGuiaTechOpen,
    isPlanoModalOpen,
    setPlanoModalOpen,
    isTabletMapDrawerOpen,
    setTabletMapDrawerOpen
  } = useUIStore();

  // Estado para colapsar/esconder el panel lateral en Desktop/Tablet (false = oculto por defecto para maximizar el visor 3D)
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Responsive device classification
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  // Set of active filtered lot IDs for efficient O(1) checking in 3D canvas
  const filteredLoteIds = useMemo(() => {
    return new Set(filteredLotes.map((l) => l.id));
  }, [filteredLotes]);

  // Handle lot selection
  const handleSelectLote = (lote: Lote | null) => {
    setSelectedLote(lote);
    // If user tapped a lot from the 'lotes' tab on mobile, automatically switch to 3D to see it highlighted
    if (lote && isMobile && mobileTab === 'lotes') {
      setMobileTab('3d');
    }
  };

  const handleOpenGoogleMapsUrl = (lote: Lote) => {
    const url = `https://www.google.com/maps?q=${lote.lat},${lote.lon}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div id="app-root" className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 font-sans text-zinc-100 relative">
      {/* Header con ArgenSALTA, contacto oficial y toggle de panel */}
      <Header
        onOpenIntroModal={() => setIntroModalOpen(true)}
        onOpenGuiaTech={() => setGuiaTechOpen(true)}
        onOpenPlanoModal={() => setPlanoModalOpen(true)}
        totalLotes={allLotes.length}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content Area */}
      {isMobile ? (
        /* ========================================================================= */
        /* MOBILE (<768px): Layout vertical stacked con Tabs y Drawer                */
        /* ========================================================================= */
        <main id="mobile-main-layout" className="flex-1 relative overflow-hidden pb-16">
          {/* Tab 1: 3D Plano / Satelital Masterplan (100% ancho, altura principal) */}
          <div className={`w-full h-full relative ${mobileTab === '3d' ? 'block' : 'hidden'}`}>
            <MasterplanViewer
              lotes={allLotes}
              selectedLote={selectedLote}
              onSelectLote={handleSelectLote}
              colorMode={colorMode}
              onChangeColorMode={setColorMode}
              selectedManzanaFilter={manzanaFilter}
              filteredLoteIds={filteredLoteIds}
            />

            {/* Mobile Bottom Sheet cuando hay un lote seleccionado en la vista 3D */}
            {selectedLote && (
              <MobileBottomSheet
                lote={selectedLote}
                onDeselect={() => setSelectedLote(null)}
                onOpenFullInfo={() => setMobileTab('info')}
                onOpenMaps={handleOpenGoogleMapsUrl}
              />
            )}
          </div>

          {/* Tab 2: Información completa del lote o proyecto */}
          {mobileTab === 'info' && (
            <div className="w-full h-full overflow-y-auto bg-zinc-950 animate-fade-in">
              <InfoPanel
                isMobile={true}
                forcedView="info"
                onSwitchTo3D={() => setMobileTab('3d')}
                onOpenGuiaTech={() => setGuiaTechOpen(true)}
              />
            </div>
          )}

          {/* Tab 3: Mapa satelital interactivo y amenidades (Lazy Loaded) */}
          {mobileTab === 'mapa' && (
            <div className="w-full h-full overflow-y-auto bg-zinc-950 p-3 space-y-3 animate-fade-in">
              <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 shadow-xs flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-white tracking-tight">
                    Ubicación Satelital & Puntos de Interés
                  </h2>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {selectedLote
                      ? `Lote ${selectedLote.id} • Lat: ${selectedLote.lat}, Lon: ${selectedLote.lon}`
                      : 'Salta • Río La Caldera • Rutas y Servicios'}
                  </p>
                </div>
                {selectedLote && (
                  <span className="text-[11px] font-bold px-2 py-1 bg-amber-500/20 text-amber-300 rounded-lg shrink-0 border border-amber-500/30">
                    Lote {selectedLote.id}
                  </span>
                )}
              </div>
              <div className="h-[calc(100vh-210px)] min-h-[420px] rounded-2xl overflow-hidden border border-zinc-800">
                <Suspense fallback={<LoadingSpinner message="Cargando mapa satelital..." size="lg" />}>
                  <MapViewer selectedLote={selectedLote} height="100%" />
                </Suspense>
              </div>
            </div>
          )}

          {/* Tab 4: Explorador de Lotes por Manzana */}
          {mobileTab === 'lotes' && (
            <div className="w-full h-full overflow-y-auto bg-zinc-950 animate-fade-in">
              <InfoPanel
                isMobile={true}
                forcedView="lotes"
                onSwitchTo3D={() => setMobileTab('3d')}
              />
            </div>
          )}

          {/* Barra de Navegación Inferior Móvil */}
          <MobileBottomNav
            activeTab={mobileTab}
            onSelectTab={setMobileTab}
            selectedLote={selectedLote}
          />
        </main>
      ) : (
        /* ========================================================================= */
        /* DESKTOP (>1024px) & TABLET (768px-1024px): Layout 2 Columnas con Toggle    */
        /* ========================================================================= */
        <main id="main-content-layout" className="flex-1 flex flex-row overflow-hidden relative">
          {/* Visualizador Masterplan Satelital y 3D */}
          <section
            id="section-visualizador-masterplan"
            className={`h-full relative flex-1 transition-all duration-300 ${
              !isSidebarOpen
                ? 'w-full'
                : isTablet
                ? 'w-[62%]'
                : 'w-[70%]'
            }`}
          >
            <MasterplanViewer
              lotes={allLotes}
              selectedLote={selectedLote}
              onSelectLote={handleSelectLote}
              colorMode={colorMode}
              onChangeColorMode={setColorMode}
              selectedManzanaFilter={manzanaFilter}
              filteredLoteIds={filteredLoteIds}
            />

            {/* Botón flotante para reabrir el panel si está colapsado */}
            {!isSidebarOpen && (
              <button
                id="btn-open-sidebar-floating"
                onClick={() => setSidebarOpen(true)}
                className="absolute top-16 right-4 z-40 bg-zinc-950/90 text-amber-300 font-extrabold text-xs px-3.5 py-2 rounded-xl border border-amber-500/50 shadow-2xl flex items-center gap-2 hover:bg-zinc-900 transition-all cursor-pointer animate-fade-in"
                title="Mostrar panel de información de lotes"
              >
                <PanelRightOpen className="w-4 h-4 text-amber-400" />
                <span>Mostrar Panel de Lotes</span>
              </button>
            )}
          </section>

          {/* Panel de información lateral (Colapsable) */}
          {isSidebarOpen && (
            <section
              id="section-panel-info"
              className={`
                h-full shrink-0 z-10 transition-all duration-300
                ${isTablet ? 'w-[38%] min-w-[320px]' : 'w-[30%] min-w-[340px] max-w-[450px]'}
              `}
            >
              <InfoPanel
                isTablet={isTablet}
                onOpenTabletMapDrawer={() => setTabletMapDrawerOpen(true)}
                onOpenGuiaTech={() => setGuiaTechOpen(true)}
                onOpenIntroModal={() => setIntroModalOpen(true)}
              />
            </section>
          )}

          {/* Drawer Deslizable de Google Maps para Tablet */}
          <TabletMapDrawer
            isOpen={isTabletMapDrawerOpen}
            onClose={() => setTabletMapDrawerOpen(false)}
            selectedLote={selectedLote}
          />
        </main>
      )}

      {/* Botón Flotante Persistente Discreto de WhatsApp */}
      <FloatingWhatsApp selectedLote={selectedLote} />

      {/* Intro Web Modal con Oferta Oficial y Datos de Proyecto (Lazy Loaded) */}
      {isIntroModalOpen && (
        <ErrorBoundary
          name="IntroWebModal"
          fallback={({ error, resetError }) => (
            <ModalErrorFallback
              error={error}
              resetError={resetError}
              onClose={() => setIntroModalOpen(false)}
              modalTitle="Presentación del Proyecto"
            />
          )}
        >
          <Suspense fallback={<LoadingSpinner fullScreen message="Cargando presentación..." />}>
            <IntroWebModal
              isOpen={isIntroModalOpen}
              onClose={() => setIntroModalOpen(false)}
              onOpenGuiaTech={() => setGuiaTechOpen(true)}
              onExplore3D={() => {
                if (isMobile) setMobileTab('3d');
              }}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* Modal Guía de Uso Técnica Paso a Paso para el Cliente (Lazy Loaded) */}
      {isGuiaTechOpen && (
        <ErrorBoundary
          name="GuiaTechModal"
          fallback={({ error, resetError }) => (
            <ModalErrorFallback
              error={error}
              resetError={resetError}
              onClose={() => setGuiaTechOpen(false)}
              modalTitle="Guía de Navegación 3D"
            />
          )}
        >
          <Suspense fallback={<LoadingSpinner fullScreen message="Cargando guía 3D..." />}>
            <GuiaTechModal
              isOpen={isGuiaTechOpen}
              onClose={() => setGuiaTechOpen(false)}
              onExplore3D={() => {
                if (isMobile) setMobileTab('3d');
              }}
              onFilterAvailable={() => {
                setColorMode('estado');
                if (isMobile) setMobileTab('3d');
              }}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* Modal Plano Catastral 2D (Lazy Loaded) */}
      {isPlanoModalOpen && (
        <ErrorBoundary
          name="Plano2DModal"
          fallback={({ error, resetError }) => (
            <ModalErrorFallback
              error={error}
              resetError={resetError}
              onClose={() => setPlanoModalOpen(false)}
              modalTitle="Plano Catastral 2D"
            />
          )}
        >
          <Suspense fallback={<LoadingSpinner fullScreen message="Cargando plano catastral 2D..." />}>
            <Plano2DModal
              isOpen={isPlanoModalOpen}
              onClose={() => setPlanoModalOpen(false)}
              lotes={allLotes}
              selectedLote={selectedLote}
              onSelectLote={handleSelectLote}
            />
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
}

export default function App() {
  return (
    <LotesProvider>
      <MainApp />
    </LotesProvider>
  );
}
