import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

export interface RaycastingOptions {
  renderer: THREE.WebGLRenderer | null;
  camera: THREE.PerspectiveCamera | null;
  lotMeshes: Map<string, THREE.Mesh>;
  onHover?: (loteId: string | null) => void;
  onClick?: (loteId: string | null) => void;
}

export function useRaycasting(options: RaycastingOptions) {
  const { renderer, camera, lotMeshes, onHover, onClick } = options;
  
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const hoveredLoteIdRef = useRef<string | null>(null);

  // Mouse move - hover detection
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!renderer || !camera) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, camera);

    const meshes = Array.from(lotMeshes.values());
    const intersects = raycasterRef.current.intersectObjects(meshes);

    // Buscar qué lote está bajo el mouse
    let hoveredLoteId: string | null = null;
    if (intersects.length > 0) {
      for (const [id, mesh] of lotMeshes) {
        if (intersects.some(int => int.object === mesh)) {
          hoveredLoteId = id;
          break;
        }
      }
    }

    // Trigger callback si cambió
    if (hoveredLoteId !== hoveredLoteIdRef.current) {
      hoveredLoteIdRef.current = hoveredLoteId;
      onHover?.(hoveredLoteId);
    }
  }, [renderer, camera, lotMeshes, onHover]);

  // Click
  const handleClick = useCallback((event: MouseEvent) => {
    if (!renderer || !camera) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, camera);

    const meshes = Array.from(lotMeshes.values());
    const intersects = raycasterRef.current.intersectObjects(meshes);

    let clickedLoteId: string | null = null;
    if (intersects.length > 0) {
      for (const [id, mesh] of lotMeshes) {
        if (intersects.some(int => int.object === mesh)) {
          clickedLoteId = id;
          break;
        }
      }
    }

    onClick?.(clickedLoteId);
  }, [renderer, camera, lotMeshes, onClick]);

  // Attach listeners
  useEffect(() => {
    if (!renderer) return;

    const domElement = renderer.domElement;
    domElement.addEventListener('mousemove', handleMouseMove);
    domElement.addEventListener('click', handleClick);

    return () => {
      domElement.removeEventListener('mousemove', handleMouseMove);
      domElement.removeEventListener('click', handleClick);
    };
  }, [renderer, handleMouseMove, handleClick]);

  return {
    hoveredLoteId: hoveredLoteIdRef.current
  };
}
