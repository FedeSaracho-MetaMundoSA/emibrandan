import React, { useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Lote, ColorMode } from '../../types';
import { MANZANAS_CONFIG } from '../../data/loteoData';
import { buildLoteThreeGeometry } from '../../utils/loteGeometryBuilder';
import { Amenity3DBuildResult } from '../../utils/amenities3DBuilder';
import { LotMeshEntry } from './types';

interface Canvas3DRendererProps {
  sceneRef: React.RefObject<THREE.Scene | null>;
  cameraRef: React.RefObject<THREE.PerspectiveCamera | null>;
  rendererRef: React.RefObject<THREE.WebGLRenderer | null>;
  controlsRef: React.RefObject<OrbitControls | null>;
  lotsGroupRef: React.RefObject<THREE.Group | null>;
  pinMarkerRef: React.RefObject<THREE.Group | null>;
  amenitiesBuildResultRef: React.RefObject<Amenity3DBuildResult | null>;
  lotMeshesMapRef: React.RefObject<Map<string, LotMeshEntry>>;
  lotes: Lote[];
  selectedLote: Lote | null;
  colorMode: ColorMode;
  selectedManzanaFilter?: string;
  filteredLoteIds?: Set<string>;
  showGrid?: boolean;
  gridHelperRef: React.RefObject<THREE.GridHelper | null>;
  // Camera lerp refs
  targetCamPos: React.RefObject<THREE.Vector3 | null>;
  targetLookAt: React.RefObject<THREE.Vector3 | null>;
  isAnimatingCamera: React.RefObject<boolean>;
  onUpdateAzimuth?: (angleRad: number) => void;
  onLoadingComplete?: () => void;
  updateLotVisualState: (entry: LotMeshEntry, isHovered: boolean, isSelected: boolean) => void;
}

// Surveyor Wooden Stake with "VENDIDO" Sign Generator (Shared Texture Cache)
let cachedSoldSignTexture: THREE.CanvasTexture | null = null;
function getSharedSoldSignTexture(): THREE.CanvasTexture {
  if (cachedSoldSignTexture) return cachedSoldSignTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, 244, 116);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 42px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VENDIDO', 128, 54);

    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillStyle = '#FEE2E2';
    ctx.fillText('ARGENSALTA OFICIAL', 128, 96);
  }

  cachedSoldSignTexture = new THREE.CanvasTexture(canvas);
  cachedSoldSignTexture.generateMipmaps = false;
  cachedSoldSignTexture.minFilter = THREE.LinearFilter;
  cachedSoldSignTexture.magFilter = THREE.LinearFilter;
  return cachedSoldSignTexture;
}

export const Canvas3DRenderer: React.FC<Canvas3DRendererProps> = ({
  sceneRef,
  cameraRef,
  rendererRef,
  controlsRef,
  lotsGroupRef,
  pinMarkerRef,
  amenitiesBuildResultRef,
  lotMeshesMapRef,
  lotes,
  selectedLote,
  colorMode,
  selectedManzanaFilter = 'all',
  filteredLoteIds,
  showGrid = false,
  gridHelperRef,
  targetCamPos,
  targetLookAt,
  isAnimatingCamera,
  onUpdateAzimuth,
  onLoadingComplete,
  updateLotVisualState
}) => {
  const soldStakesGroupRef = React.useRef<THREE.Group | null>(null);

  // Compute color for lot based on mode
  const getLotBaseColor = useCallback((lote: Lote, mode: ColorMode): THREE.Color => {
    if (mode === 'natural') {
      const base = new THREE.Color('#7CB342');
      const seed = ((lote.numero * 17) % 20) - 10;
      const variation = seed * 0.005;
      base.r = Math.min(1, Math.max(0, base.r + variation * 0.8));
      base.g = Math.min(1, Math.max(0, base.g + variation));
      base.b = Math.min(1, Math.max(0, base.b + variation * 0.5));
      return base;
    }

    if (mode === 'estado') {
      const status = lote.estado || lote.status || 'disponible';
      if (status === 'disponible') return new THREE.Color('#10B981');
      if (status === 'reservado') return new THREE.Color('#F59E0B');
      return new THREE.Color('#EF4444');
    }

    const conf = MANZANAS_CONFIG[lote.manzana];
    return new THREE.Color(conf?.color || '#CBD5E1');
  }, []);

  // Synchronize Grid Visibility
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = Boolean(showGrid);
    }
  }, [showGrid, gridHelperRef]);

  // Build & Update Lot Meshes
  useEffect(() => {
    const lotsGroup = lotsGroupRef.current;
    const lotMeshesMap = lotMeshesMapRef.current;
    if (!lotsGroup || !lotMeshesMap) return;

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const edgeBaseGeo = new THREE.EdgesGeometry(boxGeo);

    // Clear previous lots
    lotsGroup.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
        if (child.geometry && child.geometry !== boxGeo && child.geometry !== edgeBaseGeo) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => {
              if ((m as any).map) (m as any).map.dispose();
              m.dispose();
            });
          } else {
            if ((child.material as any).map) (child.material as any).map.dispose();
            child.material.dispose();
          }
        }
      }
    });
    lotsGroup.clear();
    lotMeshesMap.clear();

    const soldStakesData: { x: number; y: number; z: number; rotationY: number }[] = [];

    lotes.forEach((lote) => {
      const isFilteredOut =
        (selectedManzanaFilter !== 'all' && lote.manzana !== selectedManzanaFilter) ||
        (filteredLoteIds && !filteredLoteIds.has(lote.id));

      const baseColor = getLotBaseColor(lote, colorMode);
      const isSold = lote.estado === 'vendido' || lote.status === 'vendido';
      const isReserved = lote.estado === 'reservado' || lote.status === 'reservado';

      const topMaterial = new THREE.MeshStandardMaterial({
        color: isSold ? '#EF4444' : isReserved ? '#F59E0B' : '#10B981',
        roughness: 0.3,
        metalness: 0.05,
        transparent: isFilteredOut,
        opacity: isFilteredOut ? 0.22 : 1.0
      });

      const sideMaterial = new THREE.MeshStandardMaterial({
        color: isSold ? '#B91C1C' : isReserved ? '#B45309' : '#047857',
        roughness: 0.8,
        transparent: isFilteredOut,
        opacity: isFilteredOut ? 0.22 : 1.0
      });

      const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        linewidth: 2,
        transparent: true,
        opacity: isFilteredOut ? 0.2 : 0.95
      });

      const lotHeight = 0.35;
      const geoResult = buildLoteThreeGeometry(lote, { defaultHeight: lotHeight });

      let mesh: THREE.Mesh;
      let edges: THREE.LineSegments;

      if (geoResult.isParametricFallback) {
        const boxMaterials = [
          sideMaterial,
          sideMaterial,
          topMaterial,
          sideMaterial,
          sideMaterial,
          sideMaterial
        ];
        mesh = new THREE.Mesh(boxGeo, boxMaterials);
        mesh.scale.set(geoResult.boundingBox.width, lotHeight, geoResult.boundingBox.depth);
        mesh.position.set(geoResult.center.x, geoResult.center.y, geoResult.center.z);
        mesh.rotation.y = geoResult.rotationY;

        edges = new THREE.LineSegments(edgeBaseGeo, edgeMaterial);
        edges.scale.copy(mesh.scale);
        edges.position.copy(mesh.position);
        edges.rotation.copy(mesh.rotation);
      } else {
        mesh = new THREE.Mesh(geoResult.meshGeometry, [sideMaterial, topMaterial]);
        mesh.position.set(0, 0, 0);
        mesh.rotation.y = 0;

        edges = new THREE.LineSegments(geoResult.outlineGeometry, edgeMaterial);
        edges.position.set(0, 0, 0);
        edges.rotation.y = 0;
      }

      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = true;
      mesh.geometry.computeBoundingSphere();
      edges.frustumCulled = true;
      edges.geometry.computeBoundingSphere();
      mesh.userData = { loteId: lote.id, isLot: true };

      lotsGroup.add(mesh);
      lotsGroup.add(edges);

      // Collect sold surveyor stakes for high-performance instancing
      if (isSold && !isFilteredOut) {
        soldStakesData.push({
          x: geoResult.center.x,
          y: lotHeight,
          z: geoResult.center.z,
          rotationY: geoResult.rotationY
        });
      }

      lotMeshesMap.set(lote.id, {
        mesh,
        edges,
        lote,
        targetHeight: lotHeight,
        currentHeight: lotHeight,
        baseColor,
        topMaterial,
        sideMaterial,
        edgeMaterial,
        isHovered: false,
        isSelected: false,
        isFilteredOut: Boolean(isFilteredOut)
      });
    });

    // High-performance InstancedMesh for all Sold Stakes (cuts 360+ draw calls to 2)
    if (soldStakesData.length > 0) {
      const postGeo = new THREE.CylinderGeometry(0.12, 0.14, 2.4, 5);
      const postMat = new THREE.MeshStandardMaterial({ color: '#78350F', roughness: 0.9 });
      const boardGeo = new THREE.BoxGeometry(3.6, 1.8, 0.12);
      const boardMat = new THREE.MeshStandardMaterial({
        map: getSharedSoldSignTexture(),
        roughness: 0.4
      });

      const instancedPosts = new THREE.InstancedMesh(postGeo, postMat, soldStakesData.length);
      const instancedBoards = new THREE.InstancedMesh(boardGeo, boardMat, soldStakesData.length);

      instancedPosts.castShadow = true;
      instancedBoards.castShadow = true;
      instancedPosts.frustumCulled = true;
      instancedBoards.frustumCulled = true;

      const dummyPost = new THREE.Object3D();
      const dummyBoard = new THREE.Object3D();

      soldStakesData.forEach((stake, i) => {
        dummyPost.position.set(stake.x, stake.y + 1.2, stake.z);
        dummyPost.rotation.set(0, stake.rotationY, 0);
        dummyPost.updateMatrix();
        instancedPosts.setMatrixAt(i, dummyPost.matrix);

        dummyBoard.position.set(stake.x, stake.y + 2.2, stake.z);
        dummyBoard.rotation.set(0, stake.rotationY, 0);
        dummyBoard.updateMatrix();
        instancedBoards.setMatrixAt(i, dummyBoard.matrix);
      });

      instancedPosts.instanceMatrix.needsUpdate = true;
      instancedBoards.instanceMatrix.needsUpdate = true;
      instancedPosts.computeBoundingSphere();
      instancedBoards.computeBoundingSphere();

      const stakesGroup = new THREE.Group();
      stakesGroup.name = 'instanced-sold-stakes-group';
      stakesGroup.add(instancedPosts);
      stakesGroup.add(instancedBoards);
      lotsGroup.add(stakesGroup);
      soldStakesGroupRef.current = stakesGroup;
    }

    if (onLoadingComplete) {
      onLoadingComplete();
    }

    return () => {
      boxGeo.dispose();
      edgeBaseGeo.dispose();
    };
  }, [
    lotes,
    colorMode,
    selectedManzanaFilter,
    filteredLoteIds,
    getLotBaseColor,
    lotsGroupRef,
    lotMeshesMapRef,
    onLoadingComplete
  ]);

  // Synchronize Selected Lot highlight & Pin
  useEffect(() => {
    if (!pinMarkerRef.current || !lotMeshesMapRef.current) return;

    if (selectedLote) {
      pinMarkerRef.current.position.set(selectedLote.posX, 0, selectedLote.posZ);
      pinMarkerRef.current.visible = true;
    } else {
      pinMarkerRef.current.visible = false;
    }

    lotMeshesMapRef.current.forEach((entry, id) => {
      const isSel = selectedLote?.id === id;
      entry.isSelected = isSel;
      updateLotVisualState(entry, entry.isHovered, isSel);
    });
  }, [selectedLote, pinMarkerRef, lotMeshesMapRef, updateLotVisualState]);

  // Render & Animation Loop
  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const controls = controlsRef.current;
    if (!scene || !camera || !renderer || !controls) return;

    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Camera lerp animation
      if (targetCamPos.current && targetLookAt.current && isAnimatingCamera.current) {
        camera.position.lerp(targetCamPos.current, 0.05);
        controls.target.lerp(targetLookAt.current, 0.05);

        if (
          camera.position.distanceTo(targetCamPos.current) < 0.6 &&
          controls.target.distanceTo(targetLookAt.current) < 0.6
        ) {
          camera.position.copy(targetCamPos.current);
          controls.target.copy(targetLookAt.current);
          isAnimatingCamera.current = false;
        }
      }

      controls.update();

      const cameraDistance = camera.position.distanceTo(controls.target);

      // Level of Detail (LOD): Distance culling for fine stake signage
      if (soldStakesGroupRef.current) {
        soldStakesGroupRef.current.visible = cameraDistance < 420;
      }

      // Animate amenities
      if (amenitiesBuildResultRef.current) {
        amenitiesBuildResultRef.current.updateAnimations(elapsedTime, cameraDistance);
      }

      // Selected lot pin animation
      if (pinMarkerRef.current && pinMarkerRef.current.visible) {
        const pinChildren = pinMarkerRef.current.children;
        if (pinChildren[0]) pinChildren[0].position.y = 12 + Math.sin(elapsedTime * 4) * 1.2;
        if (pinChildren[1]) pinChildren[1].position.y = 6.5 + Math.sin(elapsedTime * 4) * 0.8;
        if (pinChildren[2]) pinChildren[2].scale.setScalar(1 + Math.sin(elapsedTime * 4) * 0.15);
      }

      // Smooth height interpolation on hover / selection
      if (lotMeshesMapRef.current) {
        lotMeshesMapRef.current.forEach((entry) => {
          if (Math.abs(entry.currentHeight - entry.targetHeight) > 0.002) {
            entry.currentHeight += (entry.targetHeight - entry.currentHeight) * 0.18;
            entry.mesh.position.y = entry.currentHeight - 0.35;
            entry.edges.position.y = entry.currentHeight - 0.35;
          }
        });
      }

      // Azimuth angle callback
      if (onUpdateAzimuth && controls) {
        onUpdateAzimuth(controls.getAzimuthalAngle());
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [
    sceneRef,
    cameraRef,
    rendererRef,
    controlsRef,
    targetCamPos,
    targetLookAt,
    isAnimatingCamera,
    amenitiesBuildResultRef,
    pinMarkerRef,
    lotMeshesMapRef,
    onUpdateAzimuth
  ]);

  return null;
};
