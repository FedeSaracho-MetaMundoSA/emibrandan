import React, { useState } from 'react';
import { AlertOctagon, RotateCcw, Trash2, ChevronDown, ChevronUp, Home } from 'lucide-react';

export interface AppErrorFallbackProps {
  error?: Error | null;
  resetError?: () => void;
}

export const AppErrorFallback: React.FC<AppErrorFallbackProps> = ({ error, resetError }) => {
  const [showDetails, setShowDetails] = useState(false);

  const handleReload = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  const handleClearCacheAndReset = () => {
    try {
      localStorage.removeItem('riveras-view-store');
      localStorage.removeItem('riveras-lotes-store');
      localStorage.removeItem('riveras-ui-store');
    } catch {
      // Ignorar error de acceso a storage
    }
    window.location.reload();
  };

  return (
    <div
      id="app-error-fallback"
      className="min-h-screen w-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 select-none relative overflow-hidden"
    >
      {/* Fondo de ambientación */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#10b98115,transparent_50%),radial-gradient(circle_at_bottom_left,#064e3b15,transparent_50%)] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl rounded-2xl p-7 shadow-2xl space-y-6 text-center">
        {/* Ícono de Alerta */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
          <AlertOctagon className="w-7 h-7" />
        </div>

        {/* Marca y Mensaje */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700/60 text-[11px] font-bold text-zinc-300 mb-1">
            <Home className="w-3.5 h-3.5 text-emerald-400" />
            <span>Riveras de Pucheta · ArgenSALTA</span>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">
            Interrupción Inesperada
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Se ha producido un error imprevisto en la interfaz. Puedes reiniciar la aplicación o restaurar las preferencias predeterminadas.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-2.5 pt-1">
          <button
            id="btn-app-error-reload"
            onClick={handleReload}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Recargar Aplicación</span>
          </button>

          <button
            id="btn-app-error-reset-cache"
            onClick={handleClearCacheAndReset}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Restablecer Preferencias y Recargar</span>
          </button>
        </div>

        {/* Diagnóstico técnico */}
        <div className="pt-2 border-t border-zinc-800/80">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-[11px] text-zinc-500 hover:text-zinc-400 font-medium flex items-center justify-center gap-1 mx-auto py-1"
          >
            <span>{showDetails ? 'Ocultar detalles técnicos' : 'Ver detalles técnicos'}</span>
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showDetails && (
            <div className="mt-3 p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-left text-[11px] font-mono text-zinc-300 max-h-36 overflow-y-auto space-y-1">
              <div className="text-rose-400 font-semibold">
                {error?.name || 'Error'}: {error?.message || 'Error desconocido'}
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
