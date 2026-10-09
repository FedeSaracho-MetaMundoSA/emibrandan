import React, { useState } from 'react';
import { X, Copy, Check, Download, Code2, Database, Layers, Compass } from 'lucide-react';
import { useProyectoData } from '../hooks/useProyectoData';
import realSurveyJSON from '../data/riveras_pucheta_reales_con_geometria.json';

interface ProyectoJSONModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProyectoJSONModal: React.FC<ProyectoJSONModalProps> = ({ isOpen, onClose }) => {
  const { rawJSON } = useProyectoData();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'reales' | 'full' | 'proyecto' | 'manzanas' | 'amenidades'>('reales');

  if (!isOpen) return null;

  const getDisplayedData = () => {
    switch (activeTab) {
      case 'reales':
        return realSurveyJSON;
      case 'proyecto':
        return rawJSON.proyecto;
      case 'manzanas':
        return rawJSON.manzanas;
      case 'amenidades':
        return rawJSON.amenidades;
      default:
        return rawJSON;
    }
  };

  const jsonString = JSON.stringify(getDisplayedData(), null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = activeTab === 'reales' 
      ? 'riveras_pucheta_reales_con_geometria.json' 
      : `riveras_de_pucheta_${activeTab}.json`;
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <span>Base de Datos JSON - Riveras de Pucheta</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-300">
                  Datos Georreferenciados Oficiales
                </span>
              </h3>
              <p className="text-xs text-zinc-500">
                374 lotes con coordenadas geográficas reales, manzanas A, B, C, E, G, I, K, L y sincronización activa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
              title="Copiar JSON al portapapeles"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white transition-colors"
              title="Descargar archivo JSON"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar JSON
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="px-6 py-2 bg-zinc-100/70 border-b border-zinc-200 flex items-center gap-2 shrink-0 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('reales')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'reales' ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            JSON Real con Geometrías (374 Lotes)
          </button>
          <button
            onClick={() => setActiveTab('full')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'full' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Objeto Completo App (Root JSON)
          </button>
          <button
            onClick={() => setActiveTab('proyecto')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'proyecto' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            .proyecto ({rawJSON.proyecto.estadisticas.total_lotes} lotes)
          </button>
          <button
            onClick={() => setActiveTab('manzanas')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'manzanas' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            .manzanas (8 Manzanas Reales)
          </button>
          <button
            onClick={() => setActiveTab('amenidades')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'amenidades' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            .amenidades
          </button>
        </div>

        {/* JSON Code Viewer */}
        <div className="flex-1 p-4 bg-zinc-950 overflow-auto font-mono text-xs text-zinc-300 select-text">
          <pre className="leading-relaxed">
            <code>{jsonString}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sincronizado en tiempo real con hook <code className="text-amber-400">useProyectoData()</code> y <code className="text-amber-400">LotesProvider</code></span>
          </div>
          <span className="font-mono text-[11px] text-zinc-500">
            {Object.keys(rawJSON.manzanas).length} Manzanas • {rawJSON.proyecto.estadisticas.total_lotes} Lotes
          </span>
        </div>
      </div>
    </div>
  );
};
