import { Lote, ColorMode, CameraPreset, Amenidad3D } from '../../types';
import * as THREE from 'three';

export interface Canvas3DProps {
  lotes: Lote[];
  selectedLote: Lote | null;
  onSelectLote: (lote: Lote | null) => void;
  colorMode: ColorMode;
  onChangeColorMode?: (mode: ColorMode) => void;
  filteredLoteIds?: Set<string>;
  // Opciones avanzadas y configuración
  cameraPreset?: CameraPreset;
  onChangePreset?: (preset: CameraPreset) => void;
  showAmenities?: boolean;
  showGrid?: boolean;
  animationSpeed?: number;
  // Compatibilidad con MasterplanViewer
  selectedManzanaFilter?: string;
  isActive?: boolean;
}

export interface LotMeshEntry {
  mesh: THREE.Mesh;
  edges: THREE.LineSegments;
  lote: Lote;
  targetHeight: number;
  currentHeight: number;
  baseColor: THREE.Color;
  topMaterial: THREE.MeshStandardMaterial;
  sideMaterial: THREE.MeshStandardMaterial;
  edgeMaterial: THREE.LineBasicMaterial;
  isHovered: boolean;
  isSelected: boolean;
  isFilteredOut: boolean;
}

export type SolarTime = 'morning' | 'noon' | 'afternoon' | 'sunset';
