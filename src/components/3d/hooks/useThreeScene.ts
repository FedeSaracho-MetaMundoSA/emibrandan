import { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  createProceduralGrassTexture,
  createProceduralGrassBumpMap,
  createProceduralAsphaltTexture,
  createSkyGradientTexture
} from '../../../utils/proceduralTextures';
import { buildRiverasRoadNetwork } from '../../../utils/roadsBuilder';
import { buildMasterplanElements, MasterplanBuildResult } from '../../../utils/masterplanBuilder';
import { Amenity3DBuildResult } from '../../../utils/amenities3DBuilder';
import { SolarTime } from '../types';

export function useThreeScene(initialSolarTime: SolarTime = 'noon') {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);

  // Groups
  const lotsGroupRef = useRef<THREE.Group | null>(null);
  const roadsGroupRef = useRef<THREE.Group | null>(null);
  const treeGroupRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const pinMarkerRef = useRef<THREE.Group | null>(null);
  const amenitiesBuildResultRef = useRef<Amenity3DBuildResult | null>(null);
  const masterplanResultRef = useRef<MasterplanBuildResult | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // Cached textures
  const grassTexture = useMemo(() => createProceduralGrassTexture(), []);
  const grassBumpMap = useMemo(() => createProceduralGrassBumpMap(), []);
  const asphaltTexture = useMemo(() => createProceduralAsphaltTexture(), []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 1000;
    const height = container.clientHeight || 650;

    // 1. Scene & Atmosphere
    const scene = new THREE.Scene();
    scene.background = createSkyGradientTexture(initialSolarTime);
    scene.fog = new THREE.Fog('#F0F8FF', 350, 1600);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 3000);
    camera.position.set(0, 320, 0.1);
    cameraRef.current = camera;

    // 3. Renderer with adaptive pixel ratio for weak mobile GPUs
    const isMobileDevice = typeof navigator !== 'undefined' && (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth < 768
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: !isMobileDevice, // MSAA off on weak mobile saves 40% fillrate
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileDevice ? 1.25 : 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = isMobileDevice ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xfff7ea, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.25);
    dirLight.position.set(120, 200, 80);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = isMobileDevice ? 1024 : 2048;
    dirLight.shadow.mapSize.height = isMobileDevice ? 1024 : 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 850;
    dirLight.shadow.camera.left = -340;
    dirLight.shadow.camera.right = 340;
    dirLight.shadow.camera.top = 340;
    dirLight.shadow.camera.bottom = -340;
    dirLight.shadow.bias = -0.00035;
    dirLight.shadow.normalBias = 0.02;
    dirLight.shadow.radius = 2.0;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // 5. Base Regional Terrain (1200x1200m)
    const terrainGeo = new THREE.PlaneGeometry(1200, 1200, 32, 32);
    const terrainMat = new THREE.MeshStandardMaterial({
      color: '#689F38',
      roughness: 0.85,
      map: grassTexture,
      bumpMap: grassBumpMap,
      bumpScale: 0.08
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -0.15;
    terrain.receiveShadow = true;
    scene.add(terrain);

    // 6. Grid Helper
    const gridHelper = new THREE.GridHelper(600, 60, 0x94a3b8, 0xe2e8f0);
    gridHelper.position.y = 0.01;
    gridHelper.visible = false;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // 7. Surveyor-Aligned Roads Network
    const roadNetworkResult = buildRiverasRoadNetwork(asphaltTexture);
    scene.add(roadNetworkResult.roadsGroup);
    roadsGroupRef.current = roadNetworkResult.roadsGroup;

    // 8. Masterplan 3D Elements
    const masterplanResult = buildMasterplanElements();
    scene.add(masterplanResult.group);
    masterplanResultRef.current = masterplanResult;
    treeGroupRef.current = masterplanResult.group;

    // 9. Selected Lot Pin Marker
    const pinGroup = new THREE.Group();
    pinGroup.visible = false;

    const pinSphere = new THREE.Mesh(
      new THREE.SphereGeometry(2.4, 16, 16),
      new THREE.MeshStandardMaterial({ color: '#F59E0B', emissive: 0xd97706, emissiveIntensity: 0.6 })
    );
    pinSphere.position.y = 12;
    pinGroup.add(pinSphere);

    const pinCone = new THREE.Mesh(
      new THREE.ConeGeometry(2, 6, 16),
      new THREE.MeshStandardMaterial({ color: '#F59E0B', roughness: 0.3 })
    );
    pinCone.rotation.x = Math.PI;
    pinCone.position.y = 6.5;
    pinGroup.add(pinCone);

    const pinRing = new THREE.Mesh(
      new THREE.RingGeometry(2.5, 3.8, 24),
      new THREE.MeshBasicMaterial({ color: '#FBBF24', side: THREE.DoubleSide })
    );
    pinRing.rotation.x = -Math.PI / 2;
    pinRing.position.y = 0.2;
    pinGroup.add(pinRing);

    scene.add(pinGroup);
    pinMarkerRef.current = pinGroup;

    // 10. Lots Group Container
    const lotsGroup = new THREE.Group();
    lotsGroup.name = 'lots-group';
    scene.add(lotsGroup);
    lotsGroupRef.current = lotsGroup;

    // Resize observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      renderer.dispose();
      terrainGeo.dispose();
      terrainMat.dispose();
      container.replaceChildren();
    };
  }, [grassTexture, grassBumpMap, asphaltTexture, initialSolarTime]);

  return {
    mountRef,
    sceneRef,
    cameraRef,
    rendererRef,
    dirLightRef,
    lotsGroupRef,
    roadsGroupRef,
    treeGroupRef,
    gridHelperRef,
    pinMarkerRef,
    amenitiesBuildResultRef,
    masterplanResultRef,
    isLoading,
    setIsLoading
  };
}
