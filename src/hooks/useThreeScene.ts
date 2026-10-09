import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Lote, ColorMode } from '../types';
import { buildLoteThreeGeometry } from '../utils/loteGeometryBuilder';
import { MANZANAS_CONFIG } from '../data/loteoData';

export interface SceneSetupOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  lotes: Lote[];
  colorMode: ColorMode;
  onSceneReady?: (scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) => void;
}

/**
 * Genera el mesh de Three.js para un lote respetando el modo cromático y la geometría cadastral
 */
function buildLoteMesh(lote: Lote, colorMode: ColorMode): THREE.Mesh | null {
  try {
    const geoResult = buildLoteThreeGeometry(lote);
    if (!geoResult || !geoResult.meshGeometry) return null;

    let hexColor = '#10B981';
    if (colorMode === 'estado') {
      const status = lote.estado || lote.status || 'disponible';
      hexColor = status === 'vendido' ? '#EF4444' : status === 'reservado' ? '#F59E0B' : '#10B981';
    } else if (colorMode === 'natural') {
      hexColor = '#7CB342';
    } else {
      hexColor = MANZANAS_CONFIG[lote.manzana]?.color || '#CBD5E1';
    }

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hexColor),
      roughness: 0.5,
      metalness: 0.1
    });

    const mesh = new THREE.Mesh(geoResult.meshGeometry, material);
    mesh.position.set(geoResult.center.x, geoResult.center.y, geoResult.center.z);
    if (geoResult.rotationY) {
      mesh.rotation.y = geoResult.rotationY;
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { loteId: lote.id, lote };
    return mesh;
  } catch (err) {
    console.error(`Error building mesh for lot ${lote.id}:`, err);
    return null;
  }
}

export function useThreeScene(options: SceneSetupOptions) {
  const { containerRef, lotes, colorMode, onSceneReady } = options;
  
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const lotMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());

  // Crear escena, cámara, renderer una sola vez
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 500, 1000);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      2.0,
      1000
    );
    camera.position.set(100, 80, 100);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Fast, lightweight Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
      alpha: false
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(200, 200, 200);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -300;
    directionalLight.shadow.camera.right = 300;
    directionalLight.shadow.camera.top = 300;
    directionalLight.shadow.camera.bottom = -300;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(600, 400);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x90EE90, roughness: 0.8 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid helper (opcional, en producción desactivar)
    const gridHelper = new THREE.GridHelper(400, 20, 0xcccccc, 0xeeeeee);
    scene.add(gridHelper);

    onSceneReady?.(scene, camera, renderer);

    // Animation / Render loop
    let animFrameId: number;
    function renderLoop() {
      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(renderLoop);
    }
    animFrameId = requestAnimationFrame(renderLoop);

    // Cleanup
    return () => {
      cancelAnimationFrame(animFrameId);
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [containerRef, onSceneReady]);

  // Update lotes cuando cambian
  useEffect(() => {
    if (!sceneRef.current) return;

    // Limpiar meshes viejos
    lotMeshesRef.current.forEach(mesh => {
      sceneRef.current?.remove(mesh);
      if ('geometry' in mesh) mesh.geometry.dispose();
      if ('material' in mesh) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
    lotMeshesRef.current.clear();

    // Crear nuevos meshes para lotes
    lotes.forEach(lote => {
      const mesh = buildLoteMesh(lote, colorMode);
      if (mesh) {
        sceneRef.current?.add(mesh);
        lotMeshesRef.current.set(lote.id, mesh);
      }
    });
  }, [lotes, colorMode]);

  // Handle window resize
  useEffect(() => {
    function handleResize() {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [containerRef]);

  return {
    scene: sceneRef.current,
    camera: cameraRef.current,
    renderer: rendererRef.current,
    lotMeshes: lotMeshesRef.current
  };
}
