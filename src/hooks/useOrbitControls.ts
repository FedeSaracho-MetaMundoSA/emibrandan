import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CameraPreset } from '../types';

export interface OrbitControlsOptions {
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;
  preset?: CameraPreset;
  enableDamping?: boolean;
  autoRotate?: boolean;
}

export const CAMERA_PRESETS: Record<CameraPreset, { pos: [number, number, number]; target: [number, number, number] }> = {
  isometric: { pos: [100, 80, 100], target: [0, 0, 0] },
  topDown: { pos: [0, 250, 0], target: [0, 0, 0] },
  river: { pos: [-200, 30, 0], target: [0, 0, 0] },
  entrance: { pos: [150, 40, -150], target: [0, 0, 50] },
  panorama: { pos: [250, 100, 250], target: [0, 0, 0] },
  custom: { pos: [100, 80, 100], target: [0, 0, 0] }
};

export function useOrbitControls(options: OrbitControlsOptions) {
  const { camera, renderer, preset = 'isometric', enableDamping = true, autoRotate = false } = options;
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    if (!camera || !renderer) return;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = enableDamping;
    controls.dampingFactor = 0.08;
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.screenSpacePanning = true;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 2;
    controls.minDistance = 1;
    controls.maxDistance = 2500;
    controls.minPolarAngle = 0.01;
    controls.maxPolarAngle = Math.PI / 2 - 0.001;
    controls.zoomSpeed = 1.4;
    controls.rotateSpeed = 1.3;
    controls.panSpeed = 1.3;

    controlsRef.current = controls;

    // Apply preset
    const presetConfig = CAMERA_PRESETS[preset];
    camera.position.set(...presetConfig.pos);
    controls.target.set(...presetConfig.target);
    controls.update();

    let animId: number;
    function animateControls() {
      controls.update();
      animId = requestAnimationFrame(animateControls);
    }
    animId = requestAnimationFrame(animateControls);

    return () => {
      cancelAnimationFrame(animId);
      controls.dispose();
    };
  }, [camera, renderer, preset, enableDamping, autoRotate]);

  const switchPreset = (newPreset: CameraPreset) => {
    if (!camera || !controlsRef.current) return;

    const config = CAMERA_PRESETS[newPreset];
    const startPos = camera.position.clone();
    const endPos = new THREE.Vector3(...config.pos);
    const startTarget = controlsRef.current.target.clone();
    const endTarget = new THREE.Vector3(...config.target);

    // Smooth animation (0.8s)
    let progress = 0;
    const duration = 0.8;
    const startTime = performance.now();

    function animate(currentTime: number) {
      progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      const easeProgress = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress; // easeInOutQuad

      camera.position.lerpVectors(startPos, endPos, easeProgress);
      controlsRef.current?.target.lerpVectors(startTarget, endTarget, easeProgress);
      controlsRef.current?.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  };

  return {
    controls: controlsRef.current,
    switchPreset
  };
}
