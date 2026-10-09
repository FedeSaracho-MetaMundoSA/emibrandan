import { useRef, useEffect, useState, useCallback, RefObject } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CameraPreset, Lote, Amenidad3D } from '../../../types';

interface UseOrbitControlsProps {
  cameraRef: RefObject<THREE.PerspectiveCamera | null>;
  rendererRef: RefObject<THREE.WebGLRenderer | null>;
  initialPreset?: CameraPreset;
  selectedLote?: Lote | null;
}

export function useOrbitControls({
  cameraRef,
  rendererRef,
  initialPreset = 'topDown',
  selectedLote
}: UseOrbitControlsProps) {
  const controlsRef = useRef<OrbitControls | null>(null);

  // Camera lerp animation targets
  const targetCamPos = useRef<THREE.Vector3 | null>(null);
  const targetLookAt = useRef<THREE.Vector3 | null>(null);
  const isAnimatingCamera = useRef(false);

  // States
  const [activePreset, setActivePreset] = useState<CameraPreset>(initialPreset);
  const [isAutoOrbit, setIsAutoOrbit] = useState(false);
  const [isStreetView, setIsStreetView] = useState(false);
  const [isDroneTour, setIsDroneTour] = useState(false);
  const droneTourTimer = useRef<number | null>(null);

  // Initialize OrbitControls once camera & renderer are available with full mobile touch support
  useEffect(() => {
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!camera || !renderer) return;

    const domElement = renderer.domElement;
    const controls = new OrbitControls(camera, domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08; // Smooth momentum panning and rotating
    controls.screenSpacePanning = true;
    controls.minDistance = 15;
    controls.maxDistance = 1100;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.target.set(-15, 0, 5);

    // Standard touch configuration: 1-finger rotate, 2-finger pinch-zoom + pan
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };

    controlsRef.current = controls;

    // --- Enhanced Mobile Touch Gestures ---
    let lastTouchAngle: number | null = null;
    let lastTapTime = 0;
    let lastTapPos = { x: 0, y: 0 };

    const getTouchDistance = (t1: Touch, t2: Touch) => {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getTouchAngle = (t1: Touch, t2: Touch) => {
      return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        lastTouchAngle = getTouchAngle(e.touches[0], e.touches[1]);
      } else if (e.touches.length === 1) {
        lastTouchAngle = null;
        const now = Date.now();
        const touch = e.touches[0];
        const distFromLastTap = Math.hypot(touch.clientX - lastTapPos.x, touch.clientY - lastTapPos.y);

        // Double-Tap to Focus
        if (now - lastTapTime < 320 && distFromLastTap < 30) {
          e.preventDefault();
          const rect = domElement.getBoundingClientRect();
          const mouse = new THREE.Vector2(
            ((touch.clientX - rect.left) / rect.width) * 2 - 1,
            -((touch.clientY - rect.top) / rect.height) * 2 + 1
          );

          const raycaster = new THREE.Raycaster();
          raycaster.setFromCamera(mouse, camera);

          // Find intersection plane at y=0 (ground)
          const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
          const hitPoint = new THREE.Vector3();
          const hasHit = raycaster.ray.intersectPlane(groundPlane, hitPoint);

          isAnimatingCamera.current = true;
          if (hasHit) {
            // Smooth zoom-in focus onto tapped ground location
            targetLookAt.current = hitPoint.clone();
            targetCamPos.current = new THREE.Vector3(
              hitPoint.x + (camera.position.x - controls.target.x) * 0.45,
              Math.max(35, camera.position.y * 0.5),
              hitPoint.z + (camera.position.z - controls.target.z) * 0.45
            );
          } else {
            // Fallback focus: zoom 40% closer towards center
            targetLookAt.current = controls.target.clone();
            targetCamPos.current = camera.position.clone().lerp(controls.target, 0.4);
          }

          lastTapTime = 0;
          return;
        }

        lastTapTime = now;
        lastTapPos = { x: touch.clientX, y: touch.clientY };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // 2-Finger Twist Rotate
      if (e.touches.length === 2 && lastTouchAngle !== null) {
        const currentAngle = getTouchAngle(e.touches[0], e.touches[1]);
        const angleDelta = currentAngle - lastTouchAngle;

        if (Math.abs(angleDelta) > 0.015 && Math.abs(angleDelta) < 1.0) {
          // Rotate camera around controls.target by angleDelta
          const offset = camera.position.clone().sub(controls.target);
          offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -angleDelta * 0.9);
          camera.position.copy(controls.target).add(offset);
          camera.lookAt(controls.target);
          lastTouchAngle = currentAngle;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        lastTouchAngle = null;
      }
    };

    domElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    domElement.addEventListener('touchmove', handleTouchMove, { passive: true });
    domElement.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      domElement.removeEventListener('touchstart', handleTouchStart);
      domElement.removeEventListener('touchmove', handleTouchMove);
      domElement.removeEventListener('touchend', handleTouchEnd);
      controls.dispose();
      controlsRef.current = null;
    };
  }, [cameraRef, rendererRef]);

  // Set camera view preset
  const setCameraView = useCallback((preset: CameraPreset) => {
    setActivePreset(preset);
    if (!cameraRef.current || !controlsRef.current) return;

    isAnimatingCamera.current = true;

    switch (preset) {
      case 'isometric':
        targetCamPos.current = new THREE.Vector3(-127, 246, 136);
        targetLookAt.current = new THREE.Vector3(-15, 0, 5);
        break;
      case 'topDown':
        targetCamPos.current = new THREE.Vector3(0, 320, 0.1);
        targetLookAt.current = new THREE.Vector3(-15, 0, 5);
        break;
      case 'river':
        targetCamPos.current = new THREE.Vector3(260, 65, -30);
        targetLookAt.current = new THREE.Vector3(40, 0, 0);
        break;
      case 'entrance':
        targetCamPos.current = new THREE.Vector3(-260, 60, 20);
        targetLookAt.current = new THREE.Vector3(-40, 0, 0);
        break;
      case 'panorama':
        targetCamPos.current = new THREE.Vector3(-420, 320, 460);
        targetLookAt.current = new THREE.Vector3(0, 0, 0);
        break;
    }
  }, [cameraRef]);

  // Fly to specific coordinates
  const flyToCoords = useCallback((pos: THREE.Vector3, lookAt: THREE.Vector3) => {
    isAnimatingCamera.current = true;
    targetCamPos.current = pos;
    targetLookAt.current = lookAt;
  }, []);

  // Fly to amenity
  const flyToAmenity = useCallback((amenidad: Amenidad3D) => {
    isAnimatingCamera.current = true;
    const [ax, ay, az] = amenidad.posicion3D;
    const offsetVector = new THREE.Vector3(ax, ay, az).normalize().multiplyScalar(90);
    targetCamPos.current = new THREE.Vector3(ax - offsetVector.x * 0.6, 60, az + 80);
    targetLookAt.current = new THREE.Vector3(ax, 10, az);
  }, []);

  // Fly to lot
  const flyToLot = useCallback((lote: Lote) => {
    isAnimatingCamera.current = true;
    targetCamPos.current = new THREE.Vector3(lote.posX - 35, 45, lote.posZ + 55);
    targetLookAt.current = new THREE.Vector3(lote.posX, 0, lote.posZ);
  }, []);

  // Toggle Auto-Orbit (360° rotation)
  const toggleAutoOrbit = useCallback(() => {
    setIsAutoOrbit((prev) => {
      const next = !prev;
      if (controlsRef.current) {
        controlsRef.current.autoRotate = next;
        controlsRef.current.autoRotateSpeed = 1.0;
      }
      return next;
    });
  }, []);

  // Toggle Street View
  const toggleStreetView = useCallback(() => {
    if (isStreetView) {
      setIsStreetView(false);
      setCameraView('isometric');
      if (controlsRef.current) {
        controlsRef.current.minDistance = 15;
        controlsRef.current.maxPolarAngle = Math.PI / 2.05;
      }
    } else {
      setIsStreetView(true);
      isAnimatingCamera.current = true;
      if (selectedLote) {
        targetCamPos.current = new THREE.Vector3(selectedLote.posX - 10, 1.8, selectedLote.posZ + 6);
        targetLookAt.current = new THREE.Vector3(selectedLote.posX, 1.3, selectedLote.posZ);
      } else {
        targetCamPos.current = new THREE.Vector3(-42, 1.8, 12);
        targetLookAt.current = new THREE.Vector3(38, 1.5, 6);
      }
      if (controlsRef.current) {
        controlsRef.current.minDistance = 0.5;
        controlsRef.current.maxPolarAngle = Math.PI / 2 + 0.1;
      }
    }
  }, [isStreetView, selectedLote, setCameraView]);

  // Drone Tour
  const startDroneTour = useCallback(() => {
    setIsDroneTour(true);
    setIsAutoOrbit(false);
    if (controlsRef.current) controlsRef.current.autoRotate = false;

    const tourWaypoints = [
      { pos: new THREE.Vector3(-240, 40, 20), look: new THREE.Vector3(-100, 5, 0) },
      { pos: new THREE.Vector3(-70, 55, 95), look: new THREE.Vector3(20, 0, 10) },
      { pos: new THREE.Vector3(230, 45, -35), look: new THREE.Vector3(50, 0, 0) },
      { pos: new THREE.Vector3(-140, 180, 220), look: new THREE.Vector3(0, 0, 0) }
    ];

    let step = 0;
    const runStep = () => {
      if (step >= tourWaypoints.length) {
        setIsDroneTour(false);
        setCameraView('isometric');
        return;
      }
      const pt = tourWaypoints[step];
      isAnimatingCamera.current = true;
      targetCamPos.current = pt.pos;
      targetLookAt.current = pt.look;
      step++;
      droneTourTimer.current = window.setTimeout(runStep, 6500);
    };
    runStep();
  }, [setCameraView]);

  const stopDroneTour = useCallback(() => {
    setIsDroneTour(false);
    if (droneTourTimer.current) clearTimeout(droneTourTimer.current);
  }, []);

  // Reorient to True North
  const alignToNorth = useCallback(() => {
    isAnimatingCamera.current = true;
    targetCamPos.current = new THREE.Vector3(0, 246, 172);
    targetLookAt.current = new THREE.Vector3(0, 0, 0);
  }, []);

  return {
    controlsRef,
    activePreset,
    isAutoOrbit,
    isStreetView,
    isDroneTour,
    targetCamPos,
    targetLookAt,
    isAnimatingCamera,
    setCameraView,
    flyToCoords,
    flyToAmenity,
    flyToLot,
    toggleAutoOrbit,
    toggleStreetView,
    startDroneTour,
    stopDroneTour,
    alignToNorth
  };
}
