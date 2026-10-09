import React from 'react';
import { AlertCircle, RotateCcw, X } from 'lucide-react';

export interface ModalErrorFallbackProps {
  error?: Error | null;
  resetError?: () => void;
  onClose?: () => void;
  modalTitle?: string;
}

export const ModalErrorFallback: React.FC<ModalErrorFallbackProps> = ({
  error,
  resetError,
  onClose,
  modalTitle = 'Ventana'
}) => {
  return (
    <div
      id="modal-error-fallback"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertCircle className="w-5 h-5" />
            <h3 className="font-bold text-sm text-white">Error al cargar {modalTitle}</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"
              title="Cerrar ventana"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed">
          Ocurrió un problema al cargar el contenido de esta sección. Puedes volver a intentarlo o continuar explorando el plano 3D y satelital.
        </p>

        {error?.message && (
          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-[11px] font-mono text-zinc-400 truncate">
            {error.message}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          )}
          {resetError && (
            <button
              onClick={resetError}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reintentar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
