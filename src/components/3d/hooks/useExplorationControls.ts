import { useRef, useEffect, useState, useCallback, RefObject } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Lote, CameraPreset } from '../../../types';
import { CharacterAvatar } from '../CharacterAvatar';

export type ExplorationMode = 'orbit' | 'drone' | 'first_person' | 'third_person' | 'pegman';

export interface UseExplorationControlsProps {
  cameraRef: RefObject<THREE.PerspectiveCamera | null>;
  rendererRef: RefObject<THREE.WebGLRenderer | null>;
  sceneRef: RefObject<THREE.Scene | null>;
  containerRef?: RefObject<HTMLDivElement | null>;
  lotes: Lote[];
  selectedLote?: Lote | null;
  initialMode?: ExplorationMode;
  isActive?: boolean;
  autoRotate?: boolean;
}

export function useExplorationControls({
  cameraRef,
  rendererRef,
  sceneRef,
  containerRef,
  lotes,
  selectedLote,
  initialMode = 'orbit',
  isActive = true,
  autoRotate = false
}: UseExplorationControlsProps) {
  const [explorationMode, setExplorationMode] = useState<ExplorationMode>(initialMode);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentExploredLote, setCurrentExploredLote] = useState<Lote | null>(null);

  // Player position & orientation
  // Default entrance coordinates for Riveras de Pucheta
  const playerPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const playerYaw = useRef<number>(0); // Angle around Y axis
  const cameraPitch = useRef<number>(-0.3); // Look up/down angle

  // Drone position & velocity
  const dronePos = useRef<THREE.Vector3>(new THREE.Vector3(0, 35, 80));

  // Avatar instance for 3rd Person & Pegman
  const avatarRef = useRef<CharacterAvatar | null>(null);

  // OrbitControls reference for 'orbit' mode
  const orbitControlsRef = useRef<OrbitControls | null>(null);

  // Camera lerp animation state for cinematic zoom
  const animTarget = useRef<{
    active: boolean;
    startTime: number;
    duration: number;
    startCamPos: THREE.Vector3;
    endCamPos: THREE.Vector3;
    startTargetPos: THREE.Vector3;
    endTargetPos: THREE.Vector3;
  }>({
    active: false,
    startTime: 0,
    duration: 1200,
    startCamPos: new THREE.Vector3(),
    endCamPos: new THREE.Vector3(),
    startTargetPos: new THREE.Vector3(),
    endTargetPos: new THREE.Vector3()
  });

  // Input state
  const keysState = useRef<{
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    turnLeft: boolean;
    turnRight: boolean;
    sprint: boolean;
  }>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    turnLeft: false,
    turnRight: false,
    sprint: false
  });

  // Touch & Pointer drag looking
  const isPointerDown = useRef<boolean>(false);
  const lastPointerPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 1. Initialize Avatar into Scene
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const avatar = new CharacterAvatar();
    avatar.group.position.copy(playerPos.current);
    avatar.group.visible = explorationMode === 'third_person';
    scene.add(avatar.group);
    avatarRef.current = avatar;

    return () => {
      scene.remove(avatar.group);
      avatar.dispose();
      avatarRef.current = null;
    };
  }, [sceneRef]);

  // Synchronize avatar visibility based on mode
  useEffect(() => {
    if (avatarRef.current) {
      avatarRef.current.group.visible = explorationMode === 'third_person' || explorationMode === 'pegman';
    }
  }, [explorationMode]);

  // Ensure OrbitControls is instantiated as soon as camera & renderer are set
  const ensureOrbitControls = useCallback(() => {
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!camera || !renderer) return null;

    const domElem = renderer.domElement;

    if (!orbitControlsRef.current || orbitControlsRef.current.domElement !== domElem) {
      if (orbitControlsRef.current) {
        orbitControlsRef.current.dispose();
      }
      const controls = new OrbitControls(camera, domElem);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.enableRotate = true;
      controls.enablePan = true;
      controls.enableZoom = true;
      controls.screenSpacePanning = true;
      controls.minDistance = 5;
      controls.maxDistance = 480;
      controls.minPolarAngle = 0.01;
      controls.maxPolarAngle = Math.PI / 2 - 0.01;
      controls.zoomSpeed = 1.4;
      controls.rotateSpeed = 1.6;
      controls.panSpeed = 1.4;
      controls.target.set(0, 0, 0);

      controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      };

      controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
      };

      // Cancel camera animations immediately when user interacts manually
      controls.addEventListener('start', () => {
        animTarget.current.active = false;
      });

      orbitControlsRef.current = controls;
    }

    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = explorationMode === 'orbit';
      orbitControlsRef.current.autoRotate = false;
    }
    return orbitControlsRef.current;
  }, [cameraRef, rendererRef, explorationMode]);

  // 2. Initialize / Configure OrbitControls effect
  useEffect(() => {
    ensureOrbitControls();
  }, [ensureOrbitControls]);

  // 3. Teleportation utility
  const teleportToLote = useCallback((lote: Lote) => {
    const targetX = lote.posX ?? 0;
    const targetZ = lote.posZ ?? 0;

    playerPos.current.set(targetX, 0, targetZ);

    if (avatarRef.current) {
      avatarRef.current.group.position.set(targetX, 0, targetZ);
    }

    setCurrentExploredLote(lote);

    const camera = cameraRef.current;
    const controls = orbitControlsRef.current;

    if (explorationMode === 'orbit' && camera && controls) {
      controls.target.set(targetX, 0, targetZ);
      camera.position.set(targetX + 50, 45, targetZ + 50);
      controls.update();
    }
  }, [explorationMode, cameraRef]);

  // 3b. Drop Pegman (3D Doll) on a specific lot or KMZ coordinate
  const dropPegmanOnLote = useCallback((lote: Lote) => {
    const targetX = lote.posX ?? 0;
    const targetZ = lote.posZ ?? 0;

    playerPos.current.set(targetX, 0, targetZ);
    playerYaw.current = lote.rotationY ?? 0;

    if (avatarRef.current) {
      avatarRef.current.group.position.set(targetX, 0, targetZ);
      avatarRef.current.group.rotation.y = playerYaw.current;
      avatarRef.current.group.visible = true;
    }

    setCurrentExploredLote(lote);
    setExplorationMode('third_person');

    const camera = cameraRef.current;
    if (camera) {
      camera.position.set(targetX + 6, 3.2, targetZ + 6);
      camera.lookAt(targetX, 1.4, targetZ);
    }
  }, [cameraRef]);

  // 3c. Spectacular Cinematic Zoom to Lote
  const zoomToLoteCinematic = useCallback((lote: Lote) => {
    const camera = cameraRef.current;
    const controls = orbitControlsRef.current;
    if (!camera) return;

    const targetX = lote.posX ?? 0;
    const targetZ = lote.posZ ?? 0;

    const startCamPos = camera.position.clone();
    const endCamPos = new THREE.Vector3(targetX + 32, 28, targetZ + 32);

    const startTargetPos = controls ? controls.target.clone() : new THREE.Vector3();
    const endTargetPos = new THREE.Vector3(targetX, 0, targetZ);

    animTarget.current = {
      active: true,
      startTime: performance.now(),
      duration: 1200,
      startCamPos,
      endCamPos,
      startTargetPos,
      endTargetPos
    };
  }, [cameraRef]);

  // 4. Keyboard Event Listeners (WASD, Flechas, Shift)
  useEffect(() => {
    if (!isActive || explorationMode === 'orbit') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keysState.current.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keysState.current.backward = true;
          break;
        case 'KeyA':
          keysState.current.left = true;
          break;
        case 'KeyD':
          keysState.current.right = true;
          break;
        case 'ArrowLeft':
          keysState.current.turnLeft = true;
          break;
        case 'ArrowRight':
          keysState.current.turnRight = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keysState.current.sprint = true;
          setIsRunning(true);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keysState.current.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keysState.current.backward = false;
          break;
        case 'KeyA':
          keysState.current.left = false;
          break;
        case 'KeyD':
          keysState.current.right = false;
          break;
        case 'ArrowLeft':
          keysState.current.turnLeft = false;
          break;
        case 'ArrowRight':
          keysState.current.turnRight = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keysState.current.sprint = false;
          setIsRunning(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isActive, explorationMode]);

  // 5. Pointer / Touch Look Dragging for 1st & 3rd Person
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || !isActive || explorationMode === 'orbit') return;

    const domElement = renderer.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      isPointerDown.current = true;
      lastPointerPos.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isPointerDown.current) return;

      const deltaX = e.clientX - lastPointerPos.current.x;
      const deltaY = e.clientY - lastPointerPos.current.y;
      lastPointerPos.current = { x: e.clientX, y: e.clientY };

      const sensitivity = 0.0035;
      playerYaw.current -= deltaX * sensitivity;

      // Limit pitch to prevent neck snapping
      cameraPitch.current = Math.max(-1.1, Math.min(1.1, cameraPitch.current - deltaY * sensitivity));
    };

    const handlePointerUp = () => {
      isPointerDown.current = false;
    };

    domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [rendererRef, isActive, explorationMode]);

  // 6. Virtual Direction Controls for Touch / UI buttons
  const setVirtualMovement = useCallback((
    direction: 'forward' | 'backward' | 'left' | 'right' | 'turnLeft' | 'turnRight' | 'stop',
    active: boolean
  ) => {
    if (direction === 'stop') {
      keysState.current.forward = false;
      keysState.current.backward = false;
      keysState.current.left = false;
      keysState.current.right = false;
      keysState.current.turnLeft = false;
      keysState.current.turnRight = false;
      return;
    }
    keysState.current[direction] = active;
  }, []);

  // 7. Update Loop Step (Called on every frame inside the main render loop)
  const updateExploration = useCallback((deltaTime: number) => {
    const camera = cameraRef.current;
    if (!camera) return;

    // Handle smooth cinematic zoom interpolation
    if (animTarget.current.active) {
      const now = performance.now();
      const elapsed = now - animTarget.current.startTime;
      const progress = Math.min(1, elapsed / animTarget.current.duration);
      // Ease out cubic function for smooth feel
      const ease = 1 - Math.pow(1 - progress, 3);

      camera.position.lerpVectors(animTarget.current.startCamPos, animTarget.current.endCamPos, ease);

      const controls = orbitControlsRef.current;
      if (controls) {
        controls.target.lerpVectors(animTarget.current.startTargetPos, animTarget.current.endTargetPos, ease);
        controls.update();
      }

      if (progress >= 1) {
        animTarget.current.active = false;
      }
    }

    if (explorationMode === 'orbit') {
      const controls = ensureOrbitControls();
      if (controls) {
        controls.enabled = true;
        controls.update();
      }
      return;
    }

    // Determine speed
    const sprintFactor = keysState.current.sprint || isRunning ? 2.2 : 1.0;
    const baseSpeed = 5.0; // meters per second
    const moveDist = baseSpeed * sprintFactor * deltaTime;
    const turnSpeed = 2.4 * deltaTime;

    // Continuous keyboard turning (Arrow Left / Right)
    if (keysState.current.turnLeft) {
      playerYaw.current += turnSpeed;
    }
    if (keysState.current.turnRight) {
      playerYaw.current -= turnSpeed;
    }

    // Compute forward & strafe vectors based on current Yaw
    const forwardX = -Math.sin(playerYaw.current);
    const forwardZ = -Math.cos(playerYaw.current);

    const strafeX = Math.cos(playerYaw.current);
    const strafeZ = -Math.sin(playerYaw.current);

    let moveX = 0;
    let moveZ = 0;

    if (keysState.current.forward) {
      moveX += forwardX;
      moveZ += forwardZ;
    }
    if (keysState.current.backward) {
      moveX -= forwardX;
      moveZ -= forwardZ;
    }
    if (keysState.current.left) {
      moveX -= strafeX;
      moveZ -= strafeZ;
    }
    if (keysState.current.right) {
      moveX += strafeX;
      moveZ += strafeZ;
    }

    const isMoving = moveX !== 0 || moveZ !== 0;

    if (isMoving) {
      // Normalize movement direction
      const len = Math.hypot(moveX, moveZ);
      const normX = (moveX / len) * moveDist;
      const normZ = (moveZ / len) * moveDist;

      // Restrict within subdivision boundaries (-280 to 280)
      playerPos.current.x = Math.max(-280, Math.min(280, playerPos.current.x + normX));
      playerPos.current.z = Math.max(-280, Math.min(280, playerPos.current.z + normZ));

      // Calculate nearest lote under feet
      let closestLote: Lote | null = null;
      let minDistanceSq = 25 * 25; // 25 meters threshold

      for (let i = 0; i < lotes.length; i++) {
        const l = lotes[i];
        const distSq = (playerPos.current.x - (l.posX || 0)) ** 2 + (playerPos.current.z - (l.posZ || 0)) ** 2;
        if (distSq < minDistanceSq) {
          minDistanceSq = distSq;
          closestLote = l;
        }
      }

      if (closestLote !== currentExploredLote) {
        setCurrentExploredLote(closestLote);
      }
    }

    // Update Avatar model
    const avatar = avatarRef.current;
    if (avatar) {
      avatar.group.position.set(playerPos.current.x, 0, playerPos.current.z);
      avatar.group.rotation.y = playerYaw.current;
      avatar.update(deltaTime, isMoving, keysState.current.sprint || isRunning, moveDist);
    }

    // Apply Camera Transforms
    if (explorationMode === 'first_person') {
      // Human eye level (1.70m)
      const headHeight = 1.70;
      camera.position.set(playerPos.current.x, headHeight, playerPos.current.z);

      // Look direction
      const cosPitch = Math.cos(cameraPitch.current);
      const sinPitch = Math.sin(cameraPitch.current);

      const lookTarget = new THREE.Vector3(
        playerPos.current.x - Math.sin(playerYaw.current) * cosPitch * 10,
        headHeight + sinPitch * 10,
        playerPos.current.z - Math.cos(playerYaw.current) * cosPitch * 10
      );
      camera.lookAt(lookTarget);
    } else if (explorationMode === 'third_person' || explorationMode === 'pegman') {
      // Third person follow camera
      const followDistance = 4.8;
      const heightOffset = 2.4;

      const cosPitch = Math.cos(cameraPitch.current);
      const sinPitch = Math.sin(cameraPitch.current);

      const camX = playerPos.current.x + Math.sin(playerYaw.current) * cosPitch * followDistance;
      const camY = Math.max(0.6, heightOffset - sinPitch * followDistance);
      const camZ = playerPos.current.z + Math.cos(playerYaw.current) * cosPitch * followDistance;

      // Smooth camera lerp for cinematic feel
      camera.position.set(camX, camY, camZ);

      // Look at avatar upper body (chest/head)
      camera.lookAt(playerPos.current.x, 1.35, playerPos.current.z);
    }
  }, [explorationMode, isRunning, lotes, currentExploredLote, cameraRef]);

  // Switch exploration mode
  const switchExplorationMode = useCallback((newMode: ExplorationMode) => {
    setExplorationMode(newMode);

    const camera = cameraRef.current;
    const controls = orbitControlsRef.current;

    if (newMode === 'orbit') {
      if (controls && camera) {
        controls.enabled = true;
        camera.position.set(playerPos.current.x + 80, 70, playerPos.current.z + 80);
        controls.target.set(playerPos.current.x, 0, playerPos.current.z);
        controls.update();
      }
    } else {
      if (controls) controls.enabled = false;
      cameraPitch.current = -0.15;
    }
  }, [cameraRef]);

  // Zoom In helper
  const handleZoomIn = useCallback(() => {
    const camera = cameraRef.current;
    const controls = orbitControlsRef.current;
    if (!camera) return;

    if (controls) {
      camera.position.sub(controls.target).multiplyScalar(0.8).add(controls.target);
      controls.update();
    } else {
      camera.position.multiplyScalar(0.8);
    }
  }, [cameraRef]);

  // Zoom Out helper
  const handleZoomOut = useCallback(() => {
    const camera = cameraRef.current;
    const controls = orbitControlsRef.current;
    if (!camera) return;

    if (controls) {
      camera.position.sub(controls.target).multiplyScalar(1.25).add(controls.target);
      controls.update();
    } else {
      camera.position.multiplyScalar(1.25);
    }
  }, [cameraRef]);

  // Recenter helper to frame the whole masterplan
  const handleRecenter = useCallback(() => {
    const camera = cameraRef.current;
    const controls = orbitControlsRef.current;
    if (!camera) return;

    camera.position.set(110, 85, 110);
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    } else {
      camera.lookAt(0, 0, 0);
    }
  }, [cameraRef]);

  return {
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
    orbitControls: orbitControlsRef.current,
    playerPos: playerPos.current
  };
}
