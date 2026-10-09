import React from 'react';
import { Lote, Amenidad3D } from '../../types';
import { MANZANAS_CONFIG } from '../../data/loteoData';
import { AmenidadDetalleModal } from '../AmenidadDetalleModal';

interface Canvas3DInteractionProps {
  hoveredLote: Lote | null;
  lotTooltipPos: { x: number; y: number } | null;
  hoveredAmenidad: Amenidad3D | null;
  amenidadTooltipPos: { x: number; y: number } | null;
  selectedAmenidad: Amenidad3D | null;
  onCloseAmenidadModal: () => void;
  onResetCameraToLoteo: () => void;
}

export const Canvas3DInteraction: React.FC<Canvas3DInteractionProps> = ({
  hoveredLote,
  lotTooltipPos,
  hoveredAmenidad,
  amenidadTooltipPos,
  selectedAmenidad,
  onCloseAmenidadModal,
  onResetCameraToLoteo
}) => {
  return (
    <>
      {/* Tooltip on Amenity Pin Hover */}
      {hoveredAmenidad && amenidadTooltipPos && (
        <div
          id="tooltip-amenidad"
          className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 bg-zinc-900/95 backdrop-blur-md text-white rounded-xl px-3 py-2 text-xs shadow-2xl border border-zinc-700 flex flex-col items-center animate-fade-in"
          style={{
            left: `${amenidadTooltipPos.x}px`,
            top: `${amenidadTooltipPos.y}px`
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: hoveredAmenidad.color }} />
            <span className="font-bold text-xs">{hoveredAmenidad.nombre}</span>
          </div>
          <span className="text-[11px] text-amber-300 mt-0.5 font-medium">
            Distancia: {hoveredAmenidad.distanciaKm} km • Click para acercar
          </span>
          <div className="w-2 h-2 bg-zinc-900 rotate-45 border-r border-b border-zinc-700 -mb-3 mt-1" />
        </div>
      )}

      {/* Tooltip on Lot Hover */}
      {hoveredLote && lotTooltipPos && (
        <div
          id="tooltip-lote"
          className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 bg-zinc-900/95 backdrop-blur-md text-white rounded-lg px-3 py-2 text-xs shadow-xl border border-zinc-700 flex flex-col items-center animate-fade-in"
          style={{
            left: `${lotTooltipPos.x}px`,
            top: `${lotTooltipPos.y}px`
          }}
        >
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: MANZANAS_CONFIG[hoveredLote.manzana]?.color || '#FFFFFF' }}
            />
            <span className="font-bold text-sm">Lote {hoveredLote.id}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-300 mt-0.5">
            <span>{hoveredLote.area_m2.toFixed(1)} m²</span>
            <span>•</span>
            <span className="capitalize font-medium text-amber-400">
              {hoveredLote.estado || hoveredLote.status}
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 mt-0.5">Click para ver ficha completa</span>
          <div className="w-2 h-2 bg-zinc-900 rotate-45 border-r border-b border-zinc-700 -mb-3 mt-1" />
        </div>
      )}

      {/* Amenidad Detalle Floating Modal */}
      <AmenidadDetalleModal
        amenidad={selectedAmenidad}
        onClose={onCloseAmenidadModal}
        onResetCameraToLoteo={onResetCameraToLoteo}
      />
    </>
  );
};
