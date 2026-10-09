import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Lote, ColorMode, CameraPreset } from '../../types';
import { MANZANAS_CONFIG } from '../../data/loteoData';
import { buildLoteThreeGeometry, createLotBadgeTexture } from '../../utils/loteGeometryBuilder';
import { buildRiverasRoadNetwork } from '../../utils/roadsBuilder';
import { buildMasterplanElements } from '../../utils/masterplanBuilder';
import { createProceduralGrassTexture, createProceduralAsphaltTexture } from '../../utils/proceduralTextures';
import { Canvas3DControls } from './Canvas3DControls';
import { useExplorationControls, ExplorationMode } from './hooks/useExplorationControls';

export interface Canvas3DProps {
  lotes: Lote[];
  selectedLote: Lote | null;
  onSelectLote: (lote: Lote | null) => void;
  colorMode: ColorMode;
  onChangeColorMode?: (mode: ColorMode) => void;
  filteredLoteIds?: Set<string>;
  cameraPreset?: CameraPreset;
  onChangePreset?: (preset: CameraPreset) => void;
  selectedManzanaFilter?: string;
  showAmenities?: boolean;
  showGrid?: boolean;
  animationSpeed?: number;
  isActive?: boolean;
}

// Preset camera positions for Orbit mode
const CAMERA_PRESETS: Record<CameraPreset, { pos: [number, number, number]; target: [number, number, number] }> = {
  isometric: { pos: [110, 85, 110], target: [0, 0, 0] },
  topDown: { pos: [0, 240, 0.1], target: [0, 0, 0] },
  river: { pos: [220, 45, 0], target: [0, 0, 0] },
  entrance: { pos: [-180, 35, 0], target: [-40, 0, 0] },
  panorama: { pos: [200, 90, 200], target: [0, 0, 0] },
  custom: { pos: [110, 85, 110], target: [0, 0, 0] }
};

export function Canvas3D({
  lotes,
  selectedLote,
  onSelectLote,
  colorMode,
  onChangeColorMode,
  filteredLoteIds,
  cameraPreset = 'isometric',
  onChangePreset,
  selectedManzanaFilter = 'all',
  showGrid: initialShowGrid = false,
  isActive = true
}: Canvas3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const lotsGroupRef = useRef<THREE.Group | null>(null);
  const pinMarkerRef = useRef<THREE.Group | null>(null);

  // Map of lot meshes for fast raycasting & interaction
  const lotMeshesMapRef = useRef<Map<string, { mesh: THREE.Mesh; lote: Lote }>>(new Map());

  // UI state
  const [showGrid, setShowGrid] = useState<boolean>(initialShowGrid);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<CameraPreset>(cameraPreset);
  const [hoveredLoteId, setHoveredLoteId] = useState<string | null>(null);

  // Cached procedural textures
  const grassTexture = useMemo(() => createProceduralGrassTexture(), []);
  const asphaltTexture = useMemo(() => createProceduralAsphaltTexture(), []);

  // Shared Material Cache (Drastically reduces draw calls & shader state switching)
  const materialsCache = useMemo(() => {
    return {
      disponible: new THREE.MeshStandardMaterial({
        color: '#10B981', // Verde esmeralda disponible mate
        roughness: 1.0,
        metalness: 0.0
      }),
      reservado: new THREE.MeshStandardMaterial({
        color: '#F59E0B', // Ámbar reservado mate
        roughness: 1.0,
        metalness: 0.0
      }),
      vendido: new THREE.MeshStandardMaterial({
        color: '#EF4444', // Rojo adjudicado nítido mate
        roughness: 1.0,
        metalness: 0.0
      }),
      natural: new THREE.MeshStandardMaterial({
        color: '#22C55E', // Verde césped natural suave mate
        roughness: 1.0,
        metalness: 0.0
      }),
      selected: new THREE.MeshStandardMaterial({
        color: '#38BDF8', // Celeste neón brillante al seleccionar
        emissive: '#0284C7',
        emissiveIntensity: 0.4,
        roughness: 0.8,
        metalness: 0.0
      }),
      edgeLine: new THREE.LineBasicMaterial({
        color: 0xFFFFFF, // Bright crisp white lot borders
        linewidth: 1.0,
        transparent: true,
        opacity: 0.4
      })
    };
  }, []);

  // 1. Exploration Controls Hook (1st Person, 3rd Person Avatar & Orbit)
  const {
    explorationMode,
    switchExplorationMode,
    isRunning,
    setIsRunning,
    currentExploredLote,
    teleportToLote,
    dropPegmanOnLote,
    zoomToLoteCinematic,
    setVirtualMovement,
    updateExploration,
    handleZoomIn,
    handleZoomOut,
    handleRecenter,
    orbitControls
  } = useExplorationControls({
    cameraRef,
    rendererRef,
    sceneRef,
    containerRef,
    lotes,
    selectedLote,
    initialMode: 'orbit',
    isActive,
    autoRotate
  });

  // Trigger cinematic camera zoom whenever a lot is selected, or reset focus when deselected
  useEffect(() => {
    if (selectedLote && (explorationMode === 'orbit' || explorationMode === 'drone')) {
      zoomToLoteCinematic(selectedLote);
    } else if (!selectedLote && orbitControls) {
      orbitControls.target.set(0, 0, 0);
      orbitControls.update();
    }
  }, [selectedLote, explorationMode, zoomToLoteCinematic, orbitControls]);

  // 2. Initialize Three.js Scene, Camera, Lights and Static Masterplan
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 1000;
    const height = container.clientHeight || 650;

    // Scene with clear blue sky and distant soft fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#38BDF8'); // Sky blue Salta
    scene.fog = new THREE.Fog('#38BDF8', 800, 2400);
    sceneRef.current = scene;

    // Camera (45° FOV) - full wide perspective range
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 3500);
    const initialPos = CAMERA_PRESETS.isometric.pos;
    camera.position.set(initialPos[0], initialPos[1], initialPos[2]);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Fast, ultra-smooth WebGL Renderer
    const isMobileDevice = typeof navigator !== 'undefined' && (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth < 768
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobileDevice ? 1.25 : 1.5));
    renderer.shadowMap.enabled = !isMobileDevice;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.style.outline = 'none';
    renderer.domElement.style.userSelect = 'none';
    (renderer.domElement.style as any).webkitUserSelect = 'none';
    (renderer.domElement.style as any).webkitTouchCallout = 'none';

    container.style.touchAction = 'none';
    container.style.userSelect = 'none';
    (container.style as any).webkitUserSelect = 'none';
    (container.style as any).webkitTouchCallout = 'none';

    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // Lights: Bright sunlit day
    const ambientLight = new THREE.AmbientLight(0xfff7ed, isMobileDevice ? 1.2 : 0.95);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, isMobileDevice ? 1.1 : 1.4);
    dirLight.position.set(180, 250, 120);
    dirLight.castShadow = !isMobileDevice;
    if (!isMobileDevice) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 10;
      dirLight.shadow.camera.far = 800;
      dirLight.shadow.camera.left = -300;
      dirLight.shadow.camera.right = 300;
      dirLight.shadow.camera.top = 300;
      dirLight.shadow.camera.bottom = -300;
      dirLight.shadow.bias = -0.0003;
    }
    scene.add(dirLight);

    // Regional Ground (5000x5000m) - Continuous Infinite Emerald Turf
    const groundGeo = new THREE.PlaneGeometry(5000, 5000, 16, 16);
    grassTexture.repeat.set(80, 80);
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;

    const groundMat = new THREE.MeshStandardMaterial({
      color: '#15803D', // Lush emerald green grass
      roughness: 0.8,
      map: grassTexture
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // River Water Strip (250x5000m) - Placed at Y = -0.1m
    const riverGeo = new THREE.PlaneGeometry(250, 5000);
    const riverMat = new THREE.MeshStandardMaterial({
      color: '#0284C7',
      roughness: 0.2,
      metalness: 0.3,
      transparent: true,
      opacity: 0.88
    });
    const river = new THREE.Mesh(riverGeo, riverMat);
    river.rotation.x = -Math.PI / 2;
    river.position.set(310, -0.1, 0);
    scene.add(river);

    // Add Riveras Road Network - Placed at Y = 0.05m
    try {
      const roadResult = buildRiverasRoadNetwork(asphaltTexture);
      roadResult.roadsGroup.position.y = 0.05;
      scene.add(roadResult.roadsGroup);
    } catch (err) {
      console.warn('Road network load skipped:', err);
    }

    // Add Masterplan Perimeter & Guardhouse
    try {
      const masterplanResult = buildMasterplanElements();
      scene.add(masterplanResult.group);
    } catch (err) {
      console.warn('Masterplan elements load skipped:', err);
    }

    // Grid Helper - placed below terrain
    const gridHelper = new THREE.GridHelper(500, 25, 0x94a3b8, 0xcfd8dc);
    gridHelper.position.y = -0.48;
    gridHelper.visible = false;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // Lots Group
    const lotsGroup = new THREE.Group();
    lotsGroup.name = 'all-lots-group';
    scene.add(lotsGroup);
    lotsGroupRef.current = lotsGroup;

    // Selected Lot 3D Pin Indicator
    const pinGroup = new THREE.Group();
    pinGroup.name = 'selected-lote-pin';
    const pinHeadGeo = new THREE.ConeGeometry(2.0, 5.0, 16);
    pinHeadGeo.rotateX(Math.PI);
    const pinHeadMat = new THREE.MeshStandardMaterial({
      color: '#06B6D4',
      emissive: '#0891B2',
      emissiveIntensity: 0.6,
      roughness: 0.2
    });
    const pinHead = new THREE.Mesh(pinHeadGeo, pinHeadMat);
    pinHead.position.y = 7;
    pinGroup.add(pinHead);

    const pinRingGeo = new THREE.RingGeometry(1.5, 2.5, 32);
    const pinRingMat = new THREE.MeshBasicMaterial({ color: '#06B6D4', side: THREE.DoubleSide });
    const pinRing = new THREE.Mesh(pinRingGeo, pinRingMat);
    pinRing.rotation.x = -Math.PI / 2;
    pinRing.position.y = 0.2;
    pinGroup.add(pinRing);

    pinGroup.visible = false;
    scene.add(pinGroup);
    pinMarkerRef.current = pinGroup;

    // Handle Resize
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      groundGeo.dispose();
      groundMat.dispose();
      riverGeo.dispose();
      riverMat.dispose();
    };
  }, [grassTexture, asphaltTexture]);

  // Synchronize Grid Visibility
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
    }
  }, [showGrid]);

  // 3. Build & Cache Lot Meshes (Optimized with shared materials and GPU disposal)
  useEffect(() => {
    const lotsGroup = lotsGroupRef.current;
    if (!lotsGroup) return;

    // Properly dispose previous lot geometries, textures and materials from GPU memory
    lotsGroup.children.forEach((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
        if (child.geometry) child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            if (mat && 'map' in mat && mat.map) mat.map.dispose();
            if (mat) mat.dispose();
          });
        } else if (child.material) {
          if ('map' in child.material && child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      }
    });

    // Clear previous lot meshes
    lotsGroup.clear();
    lotMeshesMapRef.current.clear();

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const edgeBaseGeo = new THREE.EdgesGeometry(boxGeo);

    lotes.forEach((lote) => {
      const isFilteredOut =
        (selectedManzanaFilter !== 'all' && lote.manzana !== selectedManzanaFilter) ||
        (filteredLoteIds && !filteredLoteIds.has(lote.id));

      const st = (lote.estado || lote.status || 'disponible') as 'disponible' | 'vendido' | 'reservado';

      // Create top badge texture displaying lot number and status/m2
      const topBadgeTex = createLotBadgeTexture(lote.numero ?? Number(lote.id), st, lote.area_m2 || 300);
      const topMaterial = new THREE.MeshStandardMaterial({
        map: topBadgeTex,
        roughness: 1.0,
        metalness: 0.0
      });

      let sideMaterial: THREE.Material;
      if (colorMode === 'estado' || !colorMode) {
        sideMaterial =
          st === 'vendido'
            ? materialsCache.vendido
            : st === 'reservado'
            ? materialsCache.reservado
            : materialsCache.disponible;
      } else if (colorMode === 'natural') {
        sideMaterial = materialsCache.natural;
      } else {
        const mzColor = MANZANAS_CONFIG[lote.manzana]?.color || '#94A3B8';
        sideMaterial = new THREE.MeshStandardMaterial({
          color: mzColor,
          roughness: 1.0,
          metalness: 0.0
        });
      }

      const lotHeight = 1.2;
      const geoResult = buildLoteThreeGeometry(lote, { defaultHeight: lotHeight });

      let mesh: THREE.Mesh;
      let edges: THREE.LineSegments;

      if (geoResult.isParametricFallback) {
        mesh = new THREE.Mesh(boxGeo, [sideMaterial, sideMaterial, topMaterial, sideMaterial, sideMaterial, sideMaterial]);
        mesh.scale.set(geoResult.boundingBox.width, lotHeight, geoResult.boundingBox.depth);
        mesh.position.set(geoResult.center.x, geoResult.center.y, geoResult.center.z);
        mesh.rotation.y = geoResult.rotationY;

        edges = new THREE.LineSegments(edgeBaseGeo, materialsCache.edgeLine);
        edges.scale.copy(mesh.scale);
        edges.position.copy(mesh.position);
        edges.rotation.copy(mesh.rotation);
      } else {
        mesh = new THREE.Mesh(geoResult.meshGeometry, [sideMaterial, topMaterial]);
        mesh.position.set(0, 0, 0);
        mesh.rotation.y = 0;

        edges = new THREE.LineSegments(geoResult.outlineGeometry, materialsCache.edgeLine);
        edges.position.set(0, 0, 0);
        edges.rotation.y = 0;
      }

      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = true;
      mesh.userData = { loteId: lote.id, isLote: true, lote };

      if (isFilteredOut) {
        mesh.visible = false;
        edges.visible = false;
      }

      lotsGroup.add(mesh);
      lotsGroup.add(edges);

      lotMeshesMapRef.current.set(lote.id, { mesh, lote });
    });

    return () => {
      boxGeo.dispose();
      edgeBaseGeo.dispose();
    };
  }, [lotes, colorMode, selectedManzanaFilter, filteredLoteIds, materialsCache]);

  // 4. Update Selected Lot Marker Position
  useEffect(() => {
    const pin = pinMarkerRef.current;
    if (!pin) return;

    if (selectedLote) {
      pin.position.set(selectedLote.posX, 0, selectedLote.posZ);
      pin.visible = true;
    } else {
      pin.visible = false;
    }
  }, [selectedLote]);

  // 5. Preset Switching in Orbit Mode
  const handlePresetChange = useCallback((newPreset: CameraPreset) => {
    setActivePreset(newPreset);
    onChangePreset?.(newPreset);

    const camera = cameraRef.current;
    const controls = orbitControls;
    if (!camera || !controls || explorationMode !== 'orbit') return;

    const config = CAMERA_PRESETS[newPreset];
    camera.position.set(...config.pos);
    controls.target.set(...config.target);
    controls.update();
  }, [orbitControls, explorationMode, onChangePreset]);

  // 6. Raycasting for Lot Selection on Click
  useEffect(() => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!renderer || !camera || !isActive) return;

    const domElement = renderer.domElement;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let startPointerPos = { x: 0, y: 0 };

    const handlePointerDown = (e: PointerEvent) => {
      startPointerPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: PointerEvent) => {
      // Ignore dragging movements (>10px slop)
      const dist = Math.hypot(e.clientX - startPointerPos.x, e.clientY - startPointerPos.y);
      if (dist > 10) return;

      const rect = domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const meshes: THREE.Mesh[] = [];
      lotMeshesMapRef.current.forEach((val) => {
        if (val.mesh.visible) meshes.push(val.mesh);
      });

      const intersects = raycaster.intersectObjects(meshes, false);
      if (intersects.length > 0) {
        const hitLote = intersects[0].object.userData.lote as Lote | undefined;
        if (hitLote) {
          onSelectLote(hitLote);
          if (explorationMode === 'pegman') {
            dropPegmanOnLote(hitLote);
          }
        }
      } else {
        // Tapping empty space unselects current lot and frees OrbitControls
        onSelectLote(null);
      }
    };

    domElement.addEventListener('pointerdown', handlePointerDown);
    domElement.addEventListener('pointerup', handlePointerUp);
    return () => {
      domElement.removeEventListener('pointerdown', handlePointerDown);
      domElement.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isActive, onSelectLote, explorationMode, dropPegmanOnLote]);

  // 7. HIGH-PERFORMANCE UNIFIED RENDER LOOP (Paused when !isActive)
  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!scene || !camera || !renderer) return;

    if (!isActive) {
      // If modal or tab is not active, suspend WebGL rendering to save CPU/GPU
      return;
    }

    let animId: number;
    const clock = new THREE.Clock();

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);

      const delta = Math.min(clock.getDelta(), 0.1); // clamp delta to prevent giant leaps
      const elapsed = clock.getElapsedTime();

      // Update Exploration Controls & Avatar
      updateExploration(delta);

      // Animate Pin marker
      if (pinMarkerRef.current && pinMarkerRef.current.visible) {
        pinMarkerRef.current.position.y = Math.sin(elapsed * 4) * 0.8;
      }

      // Auto rotate or update damping in orbit controls
      if (orbitControls) {
        if (autoRotate && explorationMode === 'orbit') {
          orbitControls.autoRotate = true;
          orbitControls.autoRotateSpeed = 2.0;
        } else {
          orbitControls.autoRotate = false;
        }
        if (orbitControls.enabled) {
          orbitControls.update();
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isActive, autoRotate, explorationMode, orbitControls, updateExploration]);

  return (
    <div id="canvas-3d-wrapper" className="relative w-full h-full bg-sky-300 overflow-hidden select-none">
      <div ref={containerRef} id="canvas-3d-mount" className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Exploration & 3D HUD Controls */}
      <Canvas3DControls
        currentColorMode={colorMode}
        onChangeColorMode={onChangeColorMode}
        currentPreset={activePreset}
        onChangePreset={handlePresetChange}
        showGrid={showGrid}
        onToggleGrid={setShowGrid}
        autoRotate={autoRotate}
        onToggleAutoRotate={setAutoRotate}
        selectedLote={selectedLote}
        hoveredLoteId={hoveredLoteId}
        explorationMode={explorationMode}
        onSwitchExplorationMode={switchExplorationMode}
        isRunning={isRunning}
        onToggleRunning={setIsRunning}
        currentExploredLote={currentExploredLote}
        onTeleportToLote={teleportToLote}
        onDropPegmanOnLote={dropPegmanOnLote}
        onVirtualMove={setVirtualMovement}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onRecenter={handleRecenter}
      />
    </div>
  );
}
