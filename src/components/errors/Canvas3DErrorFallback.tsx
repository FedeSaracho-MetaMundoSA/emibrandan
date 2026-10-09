import React, { useState } from 'react';
import { Box, RotateCcw, AlertTriangle, Globe, ChevronDown, ChevronUp, Cpu } from 'lucide-react';

export interface Canvas3DErrorFallbackProps {
  error?: Error | null;
  resetError?: () => void;
  onSwitchToSatellite?: () => void;
}

export const Canvas3DErrorFallback: React.FC<Canvas3DErrorFallbackProps> = ({
  error,
  resetError,
  onSwitchToSatellite
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const isWebGLError =
    error?.message?.toLowerCase().includes('webgl') ||
    error?.message?.toLowerCase().includes('context') ||
    error?.message?.toLowerCase().includes('gpu') ||
    error?.message?.toLowerCase().includes('shader');

  const handleReload = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  return (
    <div
      id="canvas-3d-error-fallback"
      className="w-full h-full min-h-[400px] flex flex-col items-center justify-center p-6 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white relative overflow-hidden select-none"
    >
      {/* Fondo sutil con grid de referencia */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

      {/* Tarjeta de Recuperación 3D */}
      <div className="relative z-10 max-w-lg w-full bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5 text-center">
        {/* Ícono de estado */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
          <Box className="w-7 h-7 animate-pulse" />
        </div>

        {/* Títulos y descripción */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {isWebGLError ? 'Aceleración Gráfica 3D Interrumpida' : 'Error en el Renderizador 3D'}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
            {isWebGLError
              ? 'El motor WebGL perdió el contexto gráfico o la GPU del dispositivo no responde. Puedes reiniciar el visualizador o cambiar a la vista satelital.'
              : 'Ocurrió una interrupción al renderizar los modelos 3D y topografía del masterplan.'}
          </p>
        </div>

        {/* Botones de acción principales */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {resetError && (
            <button
              id="btn-retry-3d-canvas"
              onClick={handleReload}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reintentar Motor 3D</span>
            </button>
          )}

          {onSwitchToSatellite && (
            <button
              id="btn-switch-to-satellite-fallback"
              onClick={onSwitchToSatellite}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Ver en Mapa Satelital</span>
            </button>
          )}
        </div>

        {/* Desplegable de Detalles de Diagnóstico */}
        <div className="pt-2 border-t border-zinc-800/80">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-[11px] text-zinc-400 hover:text-zinc-300 font-medium flex items-center justify-center gap-1 mx-auto py-1"
          >
            <Cpu className="w-3.5 h-3.5 text-zinc-500" />
            <span>{showDetails ? 'Ocultar diagnóstico técnico' : 'Ver diagnóstico técnico'}</span>
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showDetails && (
            <div className="mt-3 p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-left text-[11px] font-mono text-zinc-300 max-h-40 overflow-y-auto space-y-1">
              <div className="text-amber-400 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{error?.name || 'Error'}: {error?.message || 'Fallo desconocido'}</span>
              </div>
              {error?.stack && (
                <pre className="text-[10px] text-zinc-500 whitespace-pre-wrap leading-tight mt-1 overflow-x-auto">
                  {error.stack}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
