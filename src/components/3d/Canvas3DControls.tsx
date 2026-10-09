import React, { useState } from 'react';
import { ColorMode, CameraPreset, Lote } from '../../types';
import { ExplorationMode } from './hooks/useExplorationControls';
import {
  Building2,
  Grid3X3,
  Sun,
  RotateCw,
  Eye,
  Compass,
  Navigation,
  Footprints,
  User,
  Zap,
  Info,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  MapPin,
  HelpCircle,
  X
} from 'lucide-react';

export interface Canvas3DControlsProps {
  currentColorMode: ColorMode;
  onChangeColorMode?: (mode: ColorMode) => void;
  currentPreset: CameraPreset;
  onChangePreset: (preset: CameraPreset) => void;
  showGrid: boolean;
  onToggleGrid: (show: boolean) => void;
  autoRotate: boolean;
  onToggleAutoRotate: (enabled: boolean) => void;
  selectedLote?: Lote | null;
  hoveredLoteId?: string | null;
  // Exploration props
  explorationMode: ExplorationMode;
  onSwitchExplorationMode: (mode: ExplorationMode) => void;
  isRunning: boolean;
  onToggleRunning: (running: boolean) => void;
  currentExploredLote: Lote | null;
  onTeleportToLote?: (lote: Lote) => void;
  onDropPegmanOnLote?: (lote: Lote) => void;
  onVirtualMove?: (dir: 'forward' | 'backward' | 'left' | 'right' | 'turnLeft' | 'turnRight' | 'stop', active: boolean) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onRecenter?: () => void;
}

export function Canvas3DControls({
  currentColorMode,
  onChangeColorMode,
  currentPreset,
  onChangePreset,
  showGrid,
  onToggleGrid,
  autoRotate,
  onToggleAutoRotate,
  selectedLote,
  hoveredLoteId,
  explorationMode,
  onSwitchExplorationMode,
  isRunning,
  onToggleRunning,
  currentExploredLote,
  onTeleportToLote,
  onDropPegmanOnLote,
  onVirtualMove,
  onZoomIn,
  onZoomOut,
  onRecenter
}: Canvas3DControlsProps) {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showTouchPad, setShowTouchPad] = useState(false);
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);

  const isWalkingMode = explorationMode === 'first_person' || explorationMode === 'third_person' || explorationMode === 'pegman';

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {/* ========================================================================= */}
      {/* BARRA SUPERIOR CENTRAL PRINCIPAL: ESTILO VISOR ARQUITECTÓNICO 4D           */}
      {/* ========================================================================= */}
      <div
        id="exploration-mode-bar"
        className="pointer-events-auto absolute top-14 left-3 sm:top-3 sm:left-1/2 sm:-translate-x-1/2 z-20 flex items-center gap-1 p-1 bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl max-w-[calc(100%-24px)] sm:max-w-none overflow-x-auto"
      >
        {/* 1. Vista 3D Libre */}
        <button
          id="btn-mode-orbit"
          onClick={() => onSwitchExplorationMode('orbit')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer min-h-[38px] ${
            explorationMode === 'orbit'
              ? 'bg-blue-600 text-white font-extrabold shadow-md'
              : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60 font-semibold'
          }`}
          title="Vista 3D Libre con Rotación, Paneo y Zoom Táctil"
        >
          <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>Vista 3D</span>
        </button>

        {/* 2. Nivel Peatón */}
        <button
          id="btn-mode-pegman"
          onClick={() => {
            if (selectedLote && onDropPegmanOnLote) {
              onDropPegmanOnLote(selectedLote);
            } else {
              onSwitchExplorationMode('pegman');
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer min-h-[38px] ${
            explorationMode === 'pegman' || explorationMode === 'third_person'
              ? 'bg-amber-500 text-zinc-950 font-extrabold shadow-md'
              : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60 font-semibold'
          }`}
          title="Ubicación a Nivel Peatón en el Terreno"
        >
          <User className="w-3.5 h-3.5 text-amber-950 fill-amber-950 shrink-0" />
          <span>Nivel Peatón</span>
        </button>

        {/* 3. Recorrido Virtual */}
        <button
          id="btn-mode-first-person"
          onClick={() => onSwitchExplorationMode('first_person')}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer min-h-[38px] ${
            explorationMode === 'first_person'
              ? 'bg-purple-600 text-white font-extrabold shadow-md'
              : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60 font-semibold'
          }`}
          title="Recorrido Virtual a Escala Humana 1:1"
        >
          <Footprints className="w-3.5 h-3.5 text-purple-300 shrink-0" />
          <span>Recorrido Virtual</span>
        </button>

        {/* 6. Guía de ayuda */}
        <button
          id="btn-exploration-help"
          onClick={() => setShowHelpModal(true)}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
          title="Guía de Navegación 3D"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* BANNER INDICATIVO PARA SELECCIONAR TERRENO A NIVEL PEATÓN */}
      {explorationMode === 'pegman' && (
        <div
          id="pegman-drop-banner"
          className="absolute top-28 sm:top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 bg-amber-500 text-zinc-950 rounded-full shadow-2xl text-xs font-bold animate-fade-in max-w-[90vw] text-center"
        >
          <User className="w-4 h-4 fill-zinc-950 shrink-0 hidden sm:inline" />
          <span>Toque cualquier terreno en el plano para situar la vista allí</span>
          {selectedLote && onDropPegmanOnLote && (
            <button
              onClick={() => onDropPegmanOnLote(selectedLote)}
              className="px-3 py-1 bg-zinc-950 text-amber-300 font-extrabold text-[11px] rounded-full hover:bg-zinc-900 transition-colors cursor-pointer shrink-0"
            >
              Ubicarse en Lote {selectedLote.numero ?? selectedLote.id}
            </button>
          )}
        </div>
      )}

      {/* Realtime location badge when walking or flying */}
      {explorationMode !== 'orbit' && explorationMode !== 'pegman' && (
        <div
          id="hud-realtime-location-badge"
          className="absolute top-28 sm:top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-full shadow-lg text-xs text-white animate-fade-in max-w-[90vw] overflow-x-auto"
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
          {currentExploredLote ? (
            <span>
              Lote <strong className="text-emerald-300">{currentExploredLote.numero ?? currentExploredLote.id}</strong> (Mz {currentExploredLote.manzana}) •{' '}
              <span className="capitalize text-zinc-300 font-medium">{currentExploredLote.estado}</span>
            </span>
          ) : (
            <span className="text-zinc-300">
              {explorationMode === 'drone' ? 'Vuelo Dron sobre Riveras de Pucheta' : 'Explorando terreno'}
            </span>
          )}

          {selectedLote && selectedLote.id !== currentExploredLote?.id && onTeleportToLote && (
            <button
              onClick={() => onTeleportToLote(selectedLote)}
              className="ml-2 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-[11px] font-bold text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Navigation className="w-3 h-3" />
              <span>Ir a Lote {selectedLote.numero ?? selectedLote.id}</span>
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DOCK VERTICAL DE NAVEGACIÓN RÁPIDA 3D (ZOOM, RECENTRAR Y ÁNGULOS DE CÁMARA) */}
      {/* ========================================================================= */}
      <div
        id="hud-3d-navigation-dock"
        className="pointer-events-auto absolute top-28 sm:top-16 right-3 sm:right-4 z-30 flex flex-col items-center bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl p-1 gap-1 text-zinc-200"
      >
        {/* Zoom In */}
        <button
          id="btn-3d-zoom-in"
          onClick={onZoomIn}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800/80 active:bg-zinc-700 transition-colors cursor-pointer"
          title="Acercar cámara (+)"
        >
          <span className="text-lg font-bold leading-none">+</span>
        </button>

        {/* Zoom Out */}
        <button
          id="btn-3d-zoom-out"
          onClick={onZoomOut}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800/80 active:bg-zinc-700 transition-colors cursor-pointer"
          title="Alejar cámara (-)"
        >
          <span className="text-lg font-bold leading-none">−</span>
        </button>

        <div className="w-6 h-px bg-zinc-800 my-0.5" />

        {/* Recentrar y Encuadrar todo el Másterplan */}
        <button
          id="btn-3d-recenter"
          onClick={onRecenter}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-emerald-400 hover:text-emerald-300 hover:bg-zinc-800/80 active:bg-zinc-700 transition-colors cursor-pointer"
          title="Vista General: Encuadrar todo el proyecto 3D"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="w-6 h-px bg-zinc-800 my-0.5" />

        {/* Cambio rápido de ángulo Isométrico vs Cenital */}
        {explorationMode === 'orbit' && (
          <button
            id="btn-3d-preset-toggle"
            onClick={() => onChangePreset(currentPreset === 'topDown' ? 'isometric' : 'topDown')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
              currentPreset === 'topDown'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
            }`}
            title={currentPreset === 'topDown' ? 'Cambiar a Vista 3D Isométrica' : 'Cambiar a Vista Cenital 2D'}
          >
            <span>{currentPreset === 'topDown' ? '3D' : '2D'}</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* BOTÓN FLOTANTE DISCRETO DE CONFIGURACIÓN Y CAPAS (ABAJO A LA DERECHA)       */}
      {/* ========================================================================= */}
      <div id="canvas-3d-settings-dock" className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-auto">
        {/* Popover desplegable si se activa */}
        {showSettingsPopover && (
          <div className="bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 rounded-2xl p-3 shadow-2xl text-xs space-y-3 w-56 animate-fade-in text-white mb-1">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-bold text-zinc-300">Ajustes de Vista 3D</span>
              <button
                onClick={() => setShowSettingsPopover(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Modo de color */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Colores del Terreno</span>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => onChangeColorMode?.('natural')}
                  className={`py-1 px-1.5 rounded-lg text-[10px] font-bold text-center transition-colors cursor-pointer ${
                    currentColorMode === 'natural' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-zinc-900 text-zinc-400'
                  }`}
                >
                  Natural
                </button>
                <button
                  onClick={() => onChangeColorMode?.('manzana')}
                  className={`py-1 px-1.5 rounded-lg text-[10px] font-bold text-center transition-colors cursor-pointer ${
                    currentColorMode === 'manzana' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'bg-zinc-900 text-zinc-400'
                  }`}
                >
                  Manzanas
                </button>
                <button
                  onClick={() => onChangeColorMode?.('estado')}
                  className={`py-1 px-1.5 rounded-lg text-[10px] font-bold text-center transition-colors cursor-pointer ${
                    currentColorMode === 'estado' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-900 text-zinc-400'
                  }`}
                >
                  Estado
                </button>
              </div>
            </div>

            {/* Presets de cámara en Órbita */}
            {explorationMode === 'orbit' && (
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-zinc-400">Ángulos de Cámara</span>
                <div className="grid grid-cols-2 gap-1">
                  {(['isometric', 'topDown', 'river', 'entrance'] as const).map((preset) => {
                    const labels: Record<string, string> = {
                      isometric: 'Isométrica',
                      topDown: 'Cenital',
                      river: 'Vista Río',
                      entrance: 'Acceso'
                    };
                    return (
                      <button
                        key={preset}
                        onClick={() => onChangePreset(preset)}
                        className={`py-1 px-2 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                          currentPreset === preset ? 'bg-blue-600 text-white font-bold' : 'bg-zinc-900 text-zinc-400'
                        }`}
                      >
                        {labels[preset]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Opciones auxiliares */}
            <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
              <button
                onClick={() => onToggleGrid(!showGrid)}
                className={`text-[11px] font-medium flex items-center gap-1.5 cursor-pointer ${
                  showGrid ? 'text-amber-300' : 'text-zinc-400'
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span>Malla Métrica</span>
              </button>

              {explorationMode === 'orbit' && (
                <button
                  onClick={() => onToggleAutoRotate(!autoRotate)}
                  className={`text-[11px] font-medium flex items-center gap-1.5 cursor-pointer ${
                    autoRotate ? 'text-blue-400 font-bold' : 'text-zinc-400'
                  }`}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Giro 360°</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Botón flotante único para abrir ajustes */}
        <button
          id="btn-open-3d-settings"
          onClick={() => setShowSettingsPopover(!showSettingsPopover)}
          className="pointer-events-auto p-2.5 rounded-2xl bg-zinc-950/85 hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 shadow-xl backdrop-blur-md transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold"
          title="Ajustes de visualización 3D"
        >
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Capas & Filtros</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* D-PAD TÁCTIL SOLO EN MODO DE CAMINATA / RECORRIDO A PIE                    */}
      {/* ========================================================================= */}
      {isWalkingMode && (
        showTouchPad ? (
          <div
            id="onscreen-touch-controller"
            className="pointer-events-auto absolute bottom-4 left-4 z-30 flex flex-col items-center bg-zinc-950/95 backdrop-blur-2xl border-2 border-emerald-500/40 p-3 rounded-2xl shadow-2xl select-none text-white max-w-[220px]"
          >
            <div className="flex items-center justify-between w-full mb-2 pb-1.5 border-b border-zinc-800">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
                  Pad de Control
                </span>
              </div>
              <button
                onClick={() => setShowTouchPad(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800/80 transition-colors cursor-pointer"
                title="Ocultar control pad"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5 w-full">
              <div />
              {/* Adelante */}
              <button
                onMouseDown={() => onVirtualMove?.('forward', true)}
                onMouseUp={() => onVirtualMove?.('forward', false)}
                onTouchStart={(e) => { e.preventDefault(); onVirtualMove?.('forward', true); }}
                onTouchEnd={(e) => { e.preventDefault(); onVirtualMove?.('forward', false); }}
                className="h-11 rounded-xl bg-zinc-800 hover:bg-emerald-600 active:bg-emerald-500 border border-zinc-700 active:border-emerald-400 text-white flex flex-col items-center justify-center transition-all shadow-md cursor-pointer group"
                title="Avanzar por el terreno"
              >
                <ChevronUp className="w-5 h-5 text-emerald-400 group-hover:text-white" />
                <span className="text-[9px] font-extrabold uppercase -mt-0.5">Avance</span>
              </button>
              <div />

              {/* Girar Izquierda */}
              <button
                onMouseDown={() => onVirtualMove?.('turnLeft', true)}
                onMouseUp={() => onVirtualMove?.('turnLeft', false)}
                onTouchStart={(e) => { e.preventDefault(); onVirtualMove?.('turnLeft', true); }}
                onTouchEnd={(e) => { e.preventDefault(); onVirtualMove?.('turnLeft', false); }}
                className="h-11 rounded-xl bg-zinc-800 hover:bg-emerald-600 active:bg-emerald-500 border border-zinc-700 active:border-emerald-400 text-white flex flex-col items-center justify-center transition-all shadow-md cursor-pointer group"
                title="Girar vista a la izquierda"
              >
                <RotateCcw className="w-4 h-4 text-sky-400 group-hover:text-white" />
                <span className="text-[9px] font-extrabold uppercase -mt-0.5">Izq</span>
              </button>

              {/* Atrás */}
              <button
                onMouseDown={() => onVirtualMove?.('backward', true)}
                onMouseUp={() => onVirtualMove?.('backward', false)}
                onTouchStart={(e) => { e.preventDefault(); onVirtualMove?.('backward', true); }}
                onTouchEnd={(e) => { e.preventDefault(); onVirtualMove?.('backward', false); }}
                className="h-11 rounded-xl bg-zinc-800 hover:bg-emerald-600 active:bg-emerald-500 border border-zinc-700 active:border-emerald-400 text-white flex flex-col items-center justify-center transition-all shadow-md cursor-pointer group"
                title="Retroceder"
              >
                <ChevronDown className="w-5 h-5 text-emerald-400 group-hover:text-white" />
                <span className="text-[9px] font-extrabold uppercase -mt-0.5">Atrás</span>
              </button>

              {/* Girar Derecha */}
              <button
                onMouseDown={() => onVirtualMove?.('turnRight', true)}
                onMouseUp={() => onVirtualMove?.('turnRight', false)}
                onTouchStart={(e) => { e.preventDefault(); onVirtualMove?.('turnRight', true); }}
                onTouchEnd={(e) => { e.preventDefault(); onVirtualMove?.('turnRight', false); }}
                className="h-11 rounded-xl bg-zinc-800 hover:bg-emerald-600 active:bg-emerald-500 border border-zinc-700 active:border-emerald-400 text-white flex flex-col items-center justify-center transition-all shadow-md cursor-pointer group"
                title="Girar vista a la derecha"
              >
                <RotateCw className="w-4 h-4 text-sky-400 group-hover:text-white" />
                <span className="text-[9px] font-extrabold uppercase -mt-0.5">Der</span>
              </button>
            </div>
          </div>
        ) : (
          <button
            id="btn-reopen-touch-pad"
            onClick={() => setShowTouchPad(true)}
            className="pointer-events-auto absolute bottom-4 left-4 z-30 px-3 py-2 rounded-xl bg-zinc-950/90 border border-emerald-500/50 text-emerald-300 hover:text-white text-xs font-bold shadow-xl flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer"
            title="Abrir Pad de Control de Navegación 3D"
          >
            <Navigation className="w-4 h-4 text-emerald-400" />
            <span>Pad Control 3D</span>
          </button>
        )
      )}

      {/* ========================================================================= */}
      {/* MODAL GUÍA DE NAVEGACIÓN 3D Y PERSPECTIVAS                                */}
      {/* ========================================================================= */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Visor Arquitectónico 4D · ArgenSALTA</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300">
              <div className="p-3 bg-zinc-800/60 rounded-xl border border-zinc-700/60 space-y-2">
                <span className="font-bold text-white block text-xs">📐 Vistas & Perspectivas:</span>
                <ul className="space-y-1.5 list-disc list-inside text-zinc-400">
                  <li><strong className="text-zinc-200">Vista 3D:</strong> Modelo tridimensional interactivo con rotación 360° y zoom.</li>
                  <li><strong className="text-zinc-200">Vista Aérea:</strong> Perspectiva elevada de la trama urbana y límites de manzana.</li>
                  <li><strong className="text-zinc-200">Nivel Peatón:</strong> Posicionamiento en terreno específico a escala real.</li>
                </ul>
              </div>

              <div className="p-3 bg-zinc-800/60 rounded-xl border border-zinc-700/60 space-y-1">
                <span className="font-bold text-white block text-xs">🖱️ Control de Navegación:</span>
                <p className="text-zinc-400 leading-relaxed">
                  Arrastre para orbitar y gire la rueda para zoom. Al hacer clic en cualquier parcela, la cámara encuadra cinemáticamente el terreno resaltando sus linderos y superficie.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cerrar Guía
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
