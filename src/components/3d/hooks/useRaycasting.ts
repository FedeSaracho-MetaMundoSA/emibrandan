import { useRef, useState, useCallback, RefObject, PointerEvent } from 'react';
import * as THREE from 'three';
import { Lote, Amenidad3D } from '../../../types';
import { AMENIDADES_3D_DATA } from '../../../data/amenidades3DData';
import { Amenity3DBuildResult } from '../../../utils/amenities3DBuilder';
import { LotMeshEntry } from '../types';

interface UseRaycastingProps {
  mountRef: RefObject<HTMLDivElement | null>;
  cameraRef: RefObject<THREE.PerspectiveCamera | null>;
  lotMeshesMapRef: RefObject<Map<string, LotMeshEntry>>;
  amenitiesBuildResultRef: RefObject<Amenity3DBuildResult | null>;
  onSelectLote: (lote: Lote | null) => void;
  onSelectAmenity?: (amenidad: Amenidad3D) => void;
  updateLotVisualState: (entry: LotMeshEntry, isHovered: boolean, isSelected: boolean) => void;
}

export function useRaycasting({
  mountRef,
  cameraRef,
  lotMeshesMapRef,
  amenitiesBuildResultRef,
  onSelectLote,
  onSelectAmenity,
  updateLotVisualState
}: UseRaycastingProps) {
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const [hoveredLote, setHoveredLote] = useState<Lote | null>(null);
  const [lotTooltipPos, setLotTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredAmenidad, setHoveredAmenidad] = useState<Amenidad3D | null>(null);
  const [amenidadTooltipPos, setAmenidadTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const handlePointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const container = mountRef.current;
    const camera = cameraRef.current;
    const lotMeshesMap = lotMeshesMapRef.current;
    if (!container || !camera || !lotMeshesMap) return;

    const rect = container.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, camera);

    // 1. Check hover on Amenity Pins
    const pinMeshes: THREE.Mesh[] = [];
    if (amenitiesBuildResultRef.current) {
      amenitiesBuildResultRef.current.pinEntries.forEach((entry) => {
        pinMeshes.push(entry.mesh);
      });
    }

    const pinIntersects = raycaster.current.intersectObjects(pinMeshes, false);
    if (pinIntersects.length > 0) {
      const hitPin = pinIntersects[0].object as THREE.Mesh;
      const amenidadId = hitPin.userData.amenidadId;
      const amenidad = AMENIDADES_3D_DATA.find((a) => a.id === amenidadId);

      if (amenidad) {
        setHoveredAmenidad(amenidad);
        setAmenidadTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        setHoveredLote(null);
        container.style.cursor = 'pointer';

        if (amenitiesBuildResultRef.current) {
          amenitiesBuildResultRef.current.pinEntries.forEach((entry, id) => {
            entry.isHovered = id === amenidadId;
          });
        }
        return;
      }
    } else {
      if (amenitiesBuildResultRef.current) {
        amenitiesBuildResultRef.current.pinEntries.forEach((entry) => {
          entry.isHovered = false;
        });
      }
      setHoveredAmenidad(null);
      setAmenidadTooltipPos(null);
    }

    // 2. Check hover on Lots
    const lotMeshes: THREE.Mesh[] = [];
    lotMeshesMap.forEach((val) => lotMeshes.push(val.mesh));
    const lotIntersects = raycaster.current.intersectObjects(lotMeshes, false);

    if (lotIntersects.length > 0) {
      const hit = lotIntersects[0].object as THREE.Mesh;
      const loteId = hit.userData.loteId;
      const entry = lotMeshesMap.get(loteId);

      if (entry) {
        setHoveredLote(entry.lote);
        setLotTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        container.style.cursor = 'pointer';

        lotMeshesMap.forEach((item, id) => {
          const isHov = id === loteId;
          if (item.isHovered !== isHov) {
            item.isHovered = isHov;
            updateLotVisualState(item, isHov, item.isSelected);
          }
        });
        return;
      }
    }

    // Reset hover on all lots
    lotMeshesMap.forEach((item) => {
      if (item.isHovered) {
        item.isHovered = false;
        updateLotVisualState(item, false, item.isSelected);
      }
    });

    setHoveredLote(null);
    setLotTooltipPos(null);
    container.style.cursor = 'default';
  }, [mountRef, cameraRef, lotMeshesMapRef, amenitiesBuildResultRef, updateLotVisualState]);

  const handlePointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  }, []);

  const handlePointerUp = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current) return;
    const dx = Math.abs(e.clientX - pointerStartRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartRef.current.y);
    const dt = Date.now() - pointerStartRef.current.time;

    if (dx < 10 && dy < 10 && dt < 450) {
      handleSelectAtCoords(e.clientX, e.clientY);
    }
  }, []);

  const handleSelectAtCoords = (clientX: number, clientY: number) => {
    const container = mountRef.current;
    const camera = cameraRef.current;
    const lotMeshesMap = lotMeshesMapRef.current;
    if (!container || !camera || !lotMeshesMap) return;

    const rect = container.getBoundingClientRect();
    mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, camera);

    // 1. Check click on Amenity Pins
    const pinMeshes: THREE.Mesh[] = [];
    if (amenitiesBuildResultRef.current) {
      amenitiesBuildResultRef.current.pinEntries.forEach((entry) => {
        pinMeshes.push(entry.mesh);
      });
    }

    const pinIntersects = raycaster.current.intersectObjects(pinMeshes, false);
    if (pinIntersects.length > 0) {
      const hitPin = pinIntersects[0].object as THREE.Mesh;
      const amenidadId = hitPin.userData.amenidadId;
      const amenidad = AMENIDADES_3D_DATA.find((a) => a.id === amenidadId);
      if (amenidad && onSelectAmenity) {
        onSelectAmenity(amenidad);
        return;
      }
    }

    // 2. Check click on Lots
    const lotMeshes: THREE.Mesh[] = [];
    lotMeshesMap.forEach((val) => lotMeshes.push(val.mesh));
    const lotIntersects = raycaster.current.intersectObjects(lotMeshes, false);

    if (lotIntersects.length > 0) {
      const hit = lotIntersects[0].object as THREE.Mesh;
      const loteId = hit.userData.loteId;
      const entry = lotMeshesMap.get(loteId);
      if (entry) {
        onSelectLote(entry.lote);
      }
    }
  };

  return {
    hoveredLote,
    lotTooltipPos,
    hoveredAmenidad,
    amenidadTooltipPos,
    handlePointerMove,
    handlePointerDown,
    handlePointerUp,
    setHoveredLote,
    setHoveredAmenidad
  };
}
