import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, Eye } from 'lucide-react';
import { Lote, ManzanaKey } from '../types';
import { MANZANAS_CONFIG } from '../data/loteoData';
import { KML_PERIMETER, KML_BLOCKS, KML_GREEN_SPACES } from '../data/masterplanKmlElements';
import { gpsToLocal } from '../utils/geoProjection';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface Plano2DModalProps {
  isOpen: boolean;
  onClose: () => void;
  lotes: Lote[];
  selectedLote: Lote | null;
  onSelectLote: (lote: Lote) => void;
}

export const Plano2DModal: React.FC<Plano2DModalProps> = ({
  isOpen,
  onClose,
  lotes,
  selectedLote,
  onSelectLote
}) => {
  const [zoom, setZoom] = useState(1);
  const [selectedMza, setSelectedMza] = useState<string>('all');
  const [colorFilter, setColorFilter] = useState<'manzanas' | 'estado'>('manzanas');
  const [hoveredLote, setHoveredLote] = useState<Lote | null>(null);

  const dialogRef = useFocusTrap<HTMLDivElement>({
    isOpen,
    onClose
  });

  if (!isOpen) return null;

  const handleDownloadSimulation = () => {
    const blob = new Blob([
      `RIVERAS DE PUCHETA - PLANO OFICIAL DE MENSURA Y SUBDIVISIÓN (KMZ / CAD)
Ubicación: La Caldera, Salta, Argentina (-24.5875° S, -65.3775° O)
Río: Río La Caldera (Límite Este)
Total de Parcelas: 378 Lotes
Manzanas: A (72), B (49), C (23), E (72), G (72), I (63), K (7), L (20)
Superficie Total Urbanizada: 171.538,7 m² (17,15 ha)
Áreas Verdes: Recreación Activa (0,95 ha), Recreación Pasiva Ribereña (0,71 ha)
Red Vial: Avda. 20,00m, Calles Primarias 8,00m, Calles Secundarias 10,00m
Fuente Catastral: doc.kml oficial georreferenciado WGS84`
    ], { type: 'text/plain;charset=utf-8' });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Riveras_de_Pucheta_Plano_Mensura_KMZ.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Stats calculation
  const totalCount = lotes.length;
  const disponiblesCount = lotes.filter((l) => (l.estado || l.status) === 'disponible').length;
  const reservadosCount = lotes.filter((l) => (l.estado || l.status) === 'reservado').length;
  const vendidosCount = lotes.filter((l) => (l.estado || l.status) === 'vendido').length;

  const perimeterPoints = (KML_PERIMETER as any).ring_local || (KML_PERIMETER as any).ringLocal || [];
  const perimeterPointsStr = perimeterPoints.map(([x, z]: [number, number]) => `${x.toFixed(1)},${z.toFixed(1)}`).join(' ');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-950/80 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="plano-modal-title"
        tabIndex={-1}
        className="bg-white rounded-2xl w-full max-w-6xl max-h-[96vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden focus:outline-none"
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3 bg-zinc-50 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="plano-modal-title" className="text-lg font-bold text-zinc-900 tracking-tight">
                Plano Oficial de Mensura y Subdivisión KMZ
              </h2>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-300">
                {totalCount} Terrenos
              </span>
              <span className="text-xs bg-blue-100 text-blue-800 font-medium px-2 py-0.5 rounded border border-blue-200 hidden sm:inline">
                doc.kml Oficial
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              378 parcelas catastrales reales con geometría de mensura • Río La Caldera, Salta
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Color Filter Selector */}
            <div className="flex bg-zinc-200/80 p-0.5 rounded-lg text-xs font-semibold text-zinc-700">
              <button
                onClick={() => setColorFilter('manzanas')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  colorFilter === 'manzanas' ? 'bg-white text-zinc-900 shadow-xs' : 'hover:text-zinc-900'
                }`}
              >
                Manzanas
              </button>
              <button
                onClick={() => setColorFilter('estado')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  colorFilter === 'estado' ? 'bg-white text-zinc-900 shadow-xs' : 'hover:text-zinc-900'
                }`}
              >
                Disponibilidad
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center bg-zinc-200/80 p-0.5 rounded-lg">
              <button
                onClick={() => setZoom((prev) => Math.min(prev + 0.25, 2.5))}
                aria-label="Acercar plano"
                className="p-1 hover:bg-white rounded text-zinc-700 transition-colors"
                title="Acercar"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono font-semibold px-1 text-zinc-700">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((prev) => Math.max(prev - 0.25, 0.6))}
                aria-label="Alejar plano"
                className="p-1 hover:bg-white rounded text-zinc-700 transition-colors"
                title="Alejar"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom(1)}
                aria-label="Restablecer zoom al 100 por ciento"
                className="p-1 hover:bg-white rounded text-zinc-700 transition-colors"
                title="Restablecer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleDownloadSimulation}
              aria-label="Descargar especificaciones técnicas del plano de mensura CAD"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar CAD</span>
            </button>

            <button
              onClick={onClose}
              aria-label="Cerrar plano catastral 2D"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Manzanas Filter Bar */}
        <div className="px-5 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 overflow-x-auto text-xs shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium text-[11px] mr-1">Filtrar Manzana:</span>
            <button
              onClick={() => setSelectedMza('all')}
              className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-colors ${
                selectedMza === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Todas ({totalCount})
            </button>
            {(['A', 'B', 'C', 'E', 'G', 'I', 'K', 'L'] as ManzanaKey[]).map((mKey) => {
              const cfg = MANZANAS_CONFIG[mKey];
              const isSelected = selectedMza === mKey;
              return (
                <button
                  key={mKey}
                  onClick={() => setSelectedMza(mKey)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
                    isSelected ? 'ring-2 ring-white text-white' : 'opacity-80 hover:opacity-100 text-white'
                  }`}
                  style={{ backgroundColor: cfg?.color || '#3B82F6' }}
                >
                  <span>Mza {mKey}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              {disponiblesCount} Disp.
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              {reservadosCount} Res.
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />
              {vendidosCount} Vend.
            </span>
          </div>
        </div>

        {/* CAD Blueprint Viewer Container */}
        <div className="flex-1 overflow-auto bg-slate-950 p-2 sm:p-6 flex items-center justify-center relative select-none">
          <div
            className="transition-transform duration-200 origin-center bg-slate-900 border border-slate-700/80 rounded-xl p-2 sm:p-6 shadow-2xl relative w-full sm:min-w-[920px]"
            style={{ transform: `scale(${zoom})` }}
          >
            {/* Architectural Border & Title Block */}
            <div className="border border-slate-700/60 p-3 rounded-lg">
              {/* Header Title Block */}
              <div className="flex justify-between items-start border-b border-slate-700/80 pb-2.5 mb-3 text-slate-300">
                <div>
                  <span className="text-[10px] text-amber-400 font-mono tracking-widest uppercase block">
                    PLANO DE SUBDIVISIÓN PARCELARIA REAL • RIVERAS DE PUCHETA
                  </span>
                  <span className="text-lg font-bold text-white tracking-wider">
                    {totalCount} PARCELAS CATASTRALES DE MENSURA KMZ
                  </span>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Coordenadas WGS84 oficiales • Límite Este Río La Caldera • La Caldera, Salta, Argentina
                  </div>
                </div>

                <div className="text-right font-mono text-[11px] text-slate-400 space-y-0.5">
                  <div className="text-white font-bold">ESCALA CATASTRAL 1 : 2000</div>
                  <div>SUPERFICIE TOTAL: 171.538 m²</div>
                  <div>FUENTE: doc.kml de Agrimensura</div>
                </div>
              </div>

              {/* Main Interactive CAD SVG Drawing */}
              <div className="relative">
                <svg
                  viewBox="-260 -330 580 620"
                  className="w-full h-[620px] bg-slate-950 rounded-md border border-slate-800"
                >
                  {/* Background Grid Lines (25m interval marks) */}
                  <defs>
                    <pattern id="cadGrid" width="25" height="25" patternUnits="userSpaceOnUse">
                      <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#1E293B" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect x="-260" y="-330" width="580" height="620" fill="url(#cadGrid)" />

                  {/* 1. Río La Caldera Ribbon along East (x > 250) */}
                  <path
                    d="M 260,-330 C 285,-180 270,40 310,290 L 330,290 L 330,-330 Z"
                    fill="#0284C7"
                    fillOpacity="0.32"
                    stroke="#38BDF8"
                    strokeWidth="1.2"
                  />
                  <text
                    x="295"
                    y="0"
                    fill="#38BDF8"
                    fontSize="11"
                    fontWeight="bold"
                    letterSpacing="3"
                    transform="rotate(82, 295, 0)"
                    textAnchor="middle"
                  >
                    RÍO LA CALDERA ~ LÍNEA DE RIBERA
                  </text>

                  {/* 2. Macro Perimeter of Riveras de Pucheta (Polilínea [1C8F]:0) */}
                  {perimeterPointsStr && (
                    <polygon
                      points={perimeterPointsStr}
                      fill="#0B132B"
                      fillOpacity="0.75"
                      stroke="#06B6D4"
                      strokeWidth="2.2"
                    />
                  )}

                  {/* 3. Manzana Blocks base */}
                  {KML_BLOCKS.map((blk, idx) => {
                    const r = (blk as any).ring_local || (blk as any).ringLocal || [];
                    const pStr = r.map(([x, z]: [number, number]) => `${x.toFixed(1)},${z.toFixed(1)}`).join(' ');
                    return (
                      <polygon
                        key={`blk-${idx}`}
                        points={pStr}
                        fill="#1E293B"
                        fillOpacity="0.6"
                        stroke="#475569"
                        strokeWidth="1.2"
                        strokeDasharray="4 2"
                      />
                    );
                  })}

                  {/* 4. Green Spaces (Espacios Verdes) */}
                  {KML_GREEN_SPACES.map((grn, idx) => {
                    const r = (grn as any).ring_local || (grn as any).ringLocal || [];
                    const pStr = r.map(([x, z]: [number, number]) => `${x.toFixed(1)},${z.toFixed(1)}`).join(' ');
                    return (
                      <polygon
                        key={`grn-${idx}`}
                        points={pStr}
                        fill="#059669"
                        fillOpacity="0.40"
                        stroke="#10B981"
                        strokeWidth="1.5"
                      />
                    );
                  })}

                  {/* Green Spaces labels */}
                  <text x="175" y="-210" fill="#6EE7B7" fontSize="8" fontWeight="bold" textAnchor="middle">
                    Recreación Pasiva (0.51 ha)
                  </text>
                  <text x="175" y="-198" fill="#A7F3D0" fontSize="7" textAnchor="middle">
                    Paseo Ribereño
                  </text>

                  <text x="-165" y="70" fill="#6EE7B7" fontSize="8" fontWeight="bold" textAnchor="middle">
                    Recreación Activa (0.37 ha)
                  </text>
                  <text x="-165" y="82" fill="#A7F3D0" fontSize="7" textAnchor="middle">
                    Club House
                  </text>

                  {/* 5. Street Labels from doc.kml */}
                  <g pointerEvents="none">
                    <text x="-16" y="8" fill="#F8FAFC" fontSize="8.5" fontWeight="bold" letterSpacing="1" textAnchor="middle">
                      AVDA. 20,00 METROS (EJE CENTRAL)
                    </text>
                    <text x="-10" y="215" fill="#E2E8F0" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                      CALLES PRIMARIAS 8,00 METROS (SUR)
                    </text>
                    <text x="-88" y="-170" fill="#E2E8F0" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                      CALLES PRIMARIAS 8,00 METROS (NORTE)
                    </text>
                    <text x="-185" y="-25" fill="#CBD5E1" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                      CALLES SECUNDARIAS 10,00 M
                    </text>
                    <text x="-140" y="80" fill="#CBD5E1" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                      CALLES SECUNDARIAS 10,00 M
                    </text>
                  </g>

                  {/* 6. REAL 378 INDIVIDUAL LOT POLYGONS */}
                  {lotes.map((lote) => {
                    const isSelected = selectedLote?.id === lote.id || selectedLote?.numero === lote.numero;
                    const isHovered = hoveredLote?.id === lote.id || hoveredLote?.numero === lote.numero;
                    const isFilteredOut = selectedMza !== 'all' && lote.manzana !== selectedMza;

                    // Color calculation based on active modal mode
                    let fillColor = '#3B82F6';
                    if (colorFilter === 'manzanas') {
                      fillColor = MANZANAS_CONFIG[lote.manzana]?.color || '#3B82F6';
                    } else {
                      const status = lote.estado || lote.status || 'disponible';
                      if (status === 'disponible') fillColor = '#10B981';
                      else if (status === 'reservado') fillColor = '#F59E0B';
                      else fillColor = '#EF4444';
                    }

                    // Extract local polygon points
                    let pointsStr = '';
                    if ((lote as any).geometria_local && Array.isArray((lote as any).geometria_local)) {
                      pointsStr = (lote as any).geometria_local.map(([x, z]: [number, number]) => `${x.toFixed(1)},${z.toFixed(1)}`).join(' ');
                    } else if (lote.geometriaReal && Array.isArray(lote.geometriaReal)) {
                      pointsStr = lote.geometriaReal.map(([lon, lat]: [number, number]) => {
                        const { x, z } = gpsToLocal(lon, lat);
                        return `${x.toFixed(1)},${z.toFixed(1)}`;
                      }).join(' ');
                    } else if (lote.geometria && Array.isArray(lote.geometria.coordenadas)) {
                      pointsStr = (lote.geometria.coordenadas as [number, number][]).map(([lon, lat]) => {
                        const { x, z } = gpsToLocal(lon, lat);
                        return `${x.toFixed(1)},${z.toFixed(1)}`;
                      }).join(' ');
                    }

                    return (
                      <g
                        key={lote.id || `lote-${lote.numero}`}
                        role="button"
                        tabIndex={0}
                        aria-label={`Lote ${lote.numero} de Manzana ${lote.manzana}, superficie ${lote.area_m2 || 300} metros cuadrados, estado ${lote.estado || lote.status || 'disponible'}`}
                        className="cursor-pointer transition-all focus:outline-none"
                        onClick={() => onSelectLote(lote)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelectLote(lote);
                          }
                        }}
                        onMouseEnter={() => setHoveredLote(lote)}
                        onMouseLeave={() => setHoveredLote(null)}
                      >
                        {/* Real Catastral Polygon */}
                        {pointsStr ? (
                          <polygon
                            points={pointsStr}
                            fill={fillColor}
                            fillOpacity={isFilteredOut ? 0.12 : isSelected ? 0.95 : isHovered ? 0.85 : 0.65}
                            stroke={isSelected ? '#FBBF24' : isHovered ? '#38BDF8' : 'rgba(255,255,255,0.75)'}
                            strokeWidth={isSelected ? 2.5 : isHovered ? 1.8 : 0.65}
                          />
                        ) : (
                          <circle
                            cx={lote.posX}
                            cy={lote.posZ}
                            r={5}
                            fill={fillColor}
                            stroke="#FFFFFF"
                            strokeWidth={1}
                          />
                        )}

                        {/* Centered Lot Number */}
                        {!isFilteredOut && (
                          <text
                            x={lote.posX}
                            y={lote.posZ + 2.5}
                            fill={isSelected || isHovered ? '#FFFFFF' : 'rgba(255,255,255,0.92)'}
                            fontSize={isSelected || isHovered ? '8' : '6.5'}
                            fontWeight="bold"
                            textAnchor="middle"
                            pointerEvents="none"
                          >
                            {lote.numero}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Manzana Header Labels positioned on actual centroids */}
                  {[
                    { key: 'A', x: -55, y: 155 },
                    { key: 'B', x: -5, y: 135 },
                    { key: 'C', x: 50, y: 115 },
                    { key: 'E', x: -130, y: -40 },
                    { key: 'G', x: -75, y: -65 },
                    { key: 'I', x: -20, y: -85 },
                    { key: 'K', x: 135, y: 15 },
                    { key: 'L', x: 210, y: -100 }
                  ].map((m) => {
                    const cfg = MANZANAS_CONFIG[m.key as ManzanaKey];
                    return (
                      <g key={m.key} pointerEvents="none">
                        <rect
                          x={m.x - 22}
                          y={m.y - 8}
                          width="44"
                          height="16"
                          rx="4"
                          fill="#0F172A"
                          fillOpacity="0.9"
                          stroke={cfg?.color || '#FFFFFF'}
                          strokeWidth="1.5"
                        />
                        <text
                          x={m.x}
                          y={m.y + 3.5}
                          fill="#FFFFFF"
                          fontSize="8"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          MZA {m.key}
                        </text>
                      </g>
                    );
                  })}

                  {/* Compass Arrow North (Real geographic North is top) */}
                  <g transform="translate(290, -290)">
                    <circle cx="0" cy="0" r="18" fill="#0F172A" stroke="#475569" strokeWidth="1.5" />
                    <polygon points="0,-14 4,-2 0,0 -4,-2" fill="#EF4444" />
                    <polygon points="0,14 4,2 0,0 -4,2" fill="#94A3B8" />
                    <text x="0" y="-18" fill="#EF4444" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                      N
                    </text>
                  </g>
                </svg>

                {/* Floating Tooltip in 2D Plan */}
                {hoveredLote && (
                  <div className="absolute top-3 left-3 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 text-white rounded-lg px-3 py-2 text-xs shadow-2xl pointer-events-none z-10 flex items-center gap-3 animate-fade-in">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: MANZANAS_CONFIG[hoveredLote.manzana]?.color || '#3B82F6' }}
                    />
                    <div>
                      <div className="font-bold text-sm">
                        Lote {hoveredLote.numero} • Manzana {hoveredLote.manzana}
                      </div>
                      <div className="text-zinc-300 text-[11px]">
                        Superficie: {hoveredLote.area_m2} m² • Frente {hoveredLote.frente_m || 10}m × Fondo {hoveredLote.fondo_m || 30}m •{' '}
                        <span className="capitalize text-amber-400 font-semibold">
                          {hoveredLote.estado || hoveredLote.status}
                        </span>{' '}
                        {hoveredLote.precio_usd ? `• $${hoveredLote.precio_usd.toLocaleString()} USD` : ''}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Details & Selected Lote Action */}
              <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
                {selectedLote ? (
                  <div className="flex items-center gap-3 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-amber-400/40">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-white font-bold">
                      Seleccionado: Lote {selectedLote.numero} (Mza {selectedLote.manzana})
                    </span>
                    <span className="text-slate-300">
                      {selectedLote.area_m2} m² {selectedLote.precio_usd ? `• $${selectedLote.precio_usd.toLocaleString()} USD` : ''}
                    </span>
                    <button
                      onClick={onClose}
                      className="ml-2 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded text-xs transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver en 3D</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                      Disponible
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                      Reservado
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                      Vendido
                    </span>
                  </div>
                )}

                <div className="text-[11px] text-slate-500 font-mono">
                  Identidad Catastral KMZ Oficial • Salta, Argentina
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
