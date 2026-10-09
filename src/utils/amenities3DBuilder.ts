import * as THREE from 'three';
import { AMENIDADES_3D_DATA } from '../data/amenidades3DData';
import { Amenidad3D } from '../types';

export interface Amenity3DPinEntry {
  mesh: THREE.Mesh;
  group: THREE.Group;
  amenidad: Amenidad3D;
  baseScale: number;
  hoverScale: number;
  isHovered: boolean;
  pulseSpeed: number;
}

export interface Amenity3DBuildResult {
  group: THREE.Group;
  pinEntries: Map<string, Amenity3DPinEntry>;
  waterMesh: THREE.Mesh | null;
  updateAnimations: (elapsedTime: number, cameraDistance: number) => void;
}

/**
 * Builds realistic 3D architectural models, floating pins and reference lines
 * for the 5 landmark amenities positioned along the borders of the development.
 */
export function buildAmenities3DScene(): Amenity3DBuildResult {
  const mainGroup = new THREE.Group();
  mainGroup.name = 'amenities-3d-group';

  const pinEntries = new Map<string, Amenity3DPinEntry>();
  let waterMesh: THREE.Mesh | null = null;

  // Helper for creating dashed line from pin to ground/subdivision border
  const createDashedReferenceLine = (
    start: THREE.Vector3,
    end: THREE.Vector3,
    color: string
  ): THREE.Line => {
    const points = [start, end];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({
      color: color,
      dashSize: 6,
      gapSize: 4,
      linewidth: 1.5,
      transparent: true,
      opacity: 0.65
    });
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    return line;
  };

  // Helper for text sprite label
  const createAmenityLabelSprite = (text: string, color: string): THREE.Sprite => {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(8, 8, 368, 80, 20);
      ctx.fill();

      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(8, 8, 368, 80, 20);
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 192, 48);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(45, 12, 1);
    return sprite;
  };

  // 1. PLANTA DE BOMBA DE AGUA (Norte-Noroeste, ~1.5km)
  const aguaData = AMENIDADES_3D_DATA.find((a) => a.id === 'planta_agua');
  if (aguaData) {
    const [ax, ay, az] = aguaData.posicion3D;
    const aguaGroup = new THREE.Group();
    aguaGroup.position.set(ax, ay, az);

    // Base de hormigón
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(70, 1.5, 55),
      new THREE.MeshStandardMaterial({ color: '#64748B', roughness: 0.8 })
    );
    base.position.y = 0.75;
    base.receiveShadow = true;
    aguaGroup.add(base);

    // Edificio azul de control #4A90E2
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(32, 16, 22),
      new THREE.MeshStandardMaterial({ color: '#4A90E2', roughness: 0.5, metalness: 0.15 })
    );
    building.position.set(-10, 8.75, 0);
    building.castShadow = true;
    building.receiveShadow = true;
    aguaGroup.add(building);

    // Tanques cilíndricos de agua potable
    const tankGeo = new THREE.CylinderGeometry(8, 8, 22, 20);
    const tankMat = new THREE.MeshStandardMaterial({ color: '#CBD5E1', metalness: 0.45, roughness: 0.35 });

    const tank1 = new THREE.Mesh(tankGeo, tankMat);
    tank1.position.set(16, 11, -8);
    tank1.castShadow = true;
    aguaGroup.add(tank1);

    const tank2 = new THREE.Mesh(tankGeo, tankMat);
    tank2.position.set(16, 11, 10);
    tank2.castShadow = true;
    aguaGroup.add(tank2);

    // Tuberías de conexión
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 20, 10),
      new THREE.MeshStandardMaterial({ color: '#38BDF8', metalness: 0.6 })
    );
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(5, 14, -8);
    aguaGroup.add(pipe);

    mainGroup.add(aguaGroup);

    // Pin flotante azul
    const pinGroup = new THREE.Group();
    pinGroup.position.set(ax, 55, az);

    const pinMat = new THREE.MeshStandardMaterial({
      color: '#3B82F6',
      emissive: new THREE.Color('#2563EB'),
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.4
    });
    const pinSphere = new THREE.Mesh(new THREE.IcosahedronGeometry(9, 2), pinMat);
    pinSphere.castShadow = false;
    pinSphere.userData = { amenidadId: 'planta_agua', isAmenidadPin: true };
    pinGroup.add(pinSphere);

    // Anillo orbital decorativo
    const ringGeo = new THREE.TorusGeometry(12, 0.7, 8, 30);
    const ringMat = new THREE.MeshBasicMaterial({ color: '#60A5FA', wireframe: false });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 3;
    pinGroup.add(ring);

    // Label Sprite
    const labelSprite = createAmenityLabelSprite('Planta de Agua Potable', '#3B82F6');
    labelSprite.position.set(0, 15, 0);
    pinGroup.add(labelSprite);

    mainGroup.add(pinGroup);

    // Línea de referencia al borde del loteo
    const refLine = createDashedReferenceLine(
      new THREE.Vector3(ax, 55, az),
      new THREE.Vector3(-60, 1, -120),
      '#3B82F6'
    );
    mainGroup.add(refLine);

    pinEntries.set('planta_agua', {
      mesh: pinSphere,
      group: pinGroup,
      amenidad: aguaData,
      baseScale: 1.0,
      hoverScale: 1.35,
      isHovered: false,
      pulseSpeed: 1.8
    });
  }

  // 2. HOTELES (Este, ~2km)
  const hotelData = AMENIDADES_3D_DATA.find((a) => a.id === 'hoteles');
  if (hotelData) {
    const [hx, hy, hz] = hotelData.posicion3D;
    const hotelGroup = new THREE.Group();
    hotelGroup.position.set(hx, hy, hz);

    // Edificios estilo posada/resort (#D4A574)
    const hotelMat = new THREE.MeshStandardMaterial({ color: '#D4A574', roughness: 0.65 });
    const roofMat = new THREE.MeshStandardMaterial({ color: '#991B1B', roughness: 0.6 });

    // Edificio Central de 5 pisos
    const h1 = new THREE.Mesh(new THREE.BoxGeometry(38, 22, 24), hotelMat);
    h1.position.set(0, 11, 0);
    h1.castShadow = true;
    h1.receiveShadow = true;
    hotelGroup.add(h1);

    const roof1 = new THREE.Mesh(new THREE.ConeGeometry(26, 8, 4), roofMat);
    roof1.position.set(0, 26, 0);
    roof1.rotation.y = Math.PI / 4;
    hotelGroup.add(roof1);

    // Ala Lateral Norte
    const h2 = new THREE.Mesh(new THREE.BoxGeometry(26, 16, 20), hotelMat);
    h2.position.set(22, 8, -22);
    h2.castShadow = true;
    hotelGroup.add(h2);

    // Piscina del Hotel
    const pool = new THREE.Mesh(
      new THREE.BoxGeometry(22, 0.4, 14),
      new THREE.MeshStandardMaterial({ color: '#38BDF8', roughness: 0.1, metalness: 0.4 })
    );
    pool.position.set(-25, 0.2, 10);
    hotelGroup.add(pool);

    mainGroup.add(hotelGroup);

    // Pin flotante dorado
    const pinGroup = new THREE.Group();
    pinGroup.position.set(hx, 55, hz);

    const pinMat = new THREE.MeshStandardMaterial({
      color: '#F59E0B',
      emissive: new THREE.Color('#D97706'),
      emissiveIntensity: 0.6,
      roughness: 0.2
    });
    const pinSphere = new THREE.Mesh(new THREE.IcosahedronGeometry(9, 2), pinMat);
    pinSphere.userData = { amenidadId: 'hoteles', isAmenidadPin: true };
    pinGroup.add(pinSphere);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(12, 0.7, 8, 30),
      new THREE.MeshBasicMaterial({ color: '#FCD34D' })
    );
    ring.rotation.x = -Math.PI / 4;
    pinGroup.add(ring);

    const labelSprite = createAmenityLabelSprite('Hoteles La Caldera', '#F59E0B');
    labelSprite.position.set(0, 15, 0);
    pinGroup.add(labelSprite);

    mainGroup.add(pinGroup);

    const refLine = createDashedReferenceLine(
      new THREE.Vector3(hx, 55, hz),
      new THREE.Vector3(180, 1, -40),
      '#F59E0B'
    );
    mainGroup.add(refLine);

    pinEntries.set('hoteles', {
      mesh: pinSphere,
      group: pinGroup,
      amenidad: hotelData,
      baseScale: 1.0,
      hoverScale: 1.35,
      isHovered: false,
      pulseSpeed: 1.6
    });
  }

  // 3. CALDERA (Infraestructura / Central, Sur-Suroeste, ~1.8km)
  const calderaData = AMENIDADES_3D_DATA.find((a) => a.id === 'caldera_central');
  if (calderaData) {
    const [cx, cy, cz] = calderaData.posicion3D;
    const calderaGroup = new THREE.Group();
    calderaGroup.position.set(cx, cy, cz);

    // Edificio industrial rojo #C0392B
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(45, 18, 32),
      new THREE.MeshStandardMaterial({ color: '#C0392B', roughness: 0.7 })
    );
    building.position.set(0, 9, 0);
    building.castShadow = true;
    building.receiveShadow = true;
    calderaGroup.add(building);

    // Chimenea alta (32m)
    const chimney = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 4.5, 34, 14),
      new THREE.MeshStandardMaterial({ color: '#7F1D1D', roughness: 0.85 })
    );
    chimney.position.set(16, 17, 10);
    chimney.castShadow = true;
    calderaGroup.add(chimney);

    // Aro superior en chimenea
    const chimneyRim = new THREE.Mesh(
      new THREE.TorusGeometry(3.5, 0.6, 8, 16),
      new THREE.MeshStandardMaterial({ color: '#FFFFFF' })
    );
    chimneyRim.position.set(16, 33.5, 10);
    chimneyRim.rotation.x = Math.PI / 2;
    calderaGroup.add(chimneyRim);

    mainGroup.add(calderaGroup);

    // Pin flotante rojo
    const pinGroup = new THREE.Group();
    pinGroup.position.set(cx, 60, cz);

    const pinMat = new THREE.MeshStandardMaterial({
      color: '#EF4444',
      emissive: new THREE.Color('#DC2626'),
      emissiveIntensity: 0.65,
      roughness: 0.2
    });
    const pinSphere = new THREE.Mesh(new THREE.IcosahedronGeometry(9, 2), pinMat);
    pinSphere.userData = { amenidadId: 'caldera_central', isAmenidadPin: true };
    pinGroup.add(pinSphere);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(12, 0.7, 8, 30),
      new THREE.MeshBasicMaterial({ color: '#FCA5A5' })
    );
    ring.rotation.y = Math.PI / 3;
    pinGroup.add(ring);

    const labelSprite = createAmenityLabelSprite('Caldera Central', '#EF4444');
    labelSprite.position.set(0, 15, 0);
    pinGroup.add(labelSprite);

    mainGroup.add(pinGroup);

    const refLine = createDashedReferenceLine(
      new THREE.Vector3(cx, 60, cz),
      new THREE.Vector3(-90, 1, 140),
      '#EF4444'
    );
    mainGroup.add(refLine);

    pinEntries.set('caldera_central', {
      mesh: pinSphere,
      group: pinGroup,
      amenidad: calderaData,
      baseScale: 1.0,
      hoverScale: 1.35,
      isHovered: false,
      pulseSpeed: 2.2
    });
  }

  // 4. PLAZA PRINCIPAL (Oeste, ~3km)
  const plazaData = AMENIDADES_3D_DATA.find((a) => a.id === 'plaza_principal');
  if (plazaData) {
    const [px, py, pz] = plazaData.posicion3D;
    const plazaGroup = new THREE.Group();
    plazaGroup.position.set(px, py, pz);

    // Superficie rectangular grande (200x250m) de pavimento gris claro #E0E0E0
    const pavBase = new THREE.Mesh(
      new THREE.BoxGeometry(160, 0.2, 180),
      new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.85 })
    );
    pavBase.position.y = 0.1;
    pavBase.receiveShadow = true;
    plazaGroup.add(pavBase);

    // Canteros de césped verde oscuro #2D5016
    const grassMat = new THREE.MeshStandardMaterial({ color: '#2D5016', roughness: 0.8 });
    const cantero1 = new THREE.Mesh(new THREE.BoxGeometry(60, 0.35, 60), grassMat);
    cantero1.position.set(-40, 0.2, -40);
    plazaGroup.add(cantero1);

    const cantero2 = new THREE.Mesh(new THREE.BoxGeometry(60, 0.35, 60), grassMat);
    cantero2.position.set(40, 0.2, 40);
    plazaGroup.add(cantero2);

    // Fuente central de agua circular azul
    const fontRim = new THREE.Mesh(
      new THREE.TorusGeometry(12, 1.2, 8, 24),
      new THREE.MeshStandardMaterial({ color: '#94A3B8' })
    );
    fontRim.rotation.x = Math.PI / 2;
    fontRim.position.y = 0.8;
    plazaGroup.add(fontRim);

    const fontWater = new THREE.Mesh(
      new THREE.CylinderGeometry(11, 11, 0.6, 24),
      new THREE.MeshStandardMaterial({ color: '#0EA5E9', roughness: 0.1, metalness: 0.3 })
    );
    fontWater.position.y = 0.7;
    plazaGroup.add(fontWater);

    // 10 Árboles grandes en la plaza
    const treePositions = [
      [-40, -40], [-25, -55], [-55, -25], [40, 40], [25, 55], [55, 25],
      [-50, 45], [50, -45], [0, 60], [0, -60]
    ];
    treePositions.forEach(([tx, tz]) => {
      const tree = new THREE.Group();
      tree.position.set(tx, 0.2, tz);

      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.9, 4, 6),
        new THREE.MeshStandardMaterial({ color: '#8B4513' })
      );
      trunk.position.y = 2;
      trunk.castShadow = true;
      tree.add(trunk);

      const foliage = new THREE.Mesh(
        new THREE.ConeGeometry(4.5, 7, 7),
        new THREE.MeshStandardMaterial({ color: '#2D5016', roughness: 0.75 })
      );
      foliage.position.y = 6.5;
      foliage.castShadow = true;
      tree.add(foliage);

      plazaGroup.add(tree);
    });

    mainGroup.add(plazaGroup);

    // Pin principal verde oscuro
    const pinGroup = new THREE.Group();
    pinGroup.position.set(px, 60, pz);

    const pinMat = new THREE.MeshStandardMaterial({
      color: '#10B981',
      emissive: new THREE.Color('#059669'),
      emissiveIntensity: 0.6,
      roughness: 0.2
    });
    const pinSphere = new THREE.Mesh(new THREE.IcosahedronGeometry(9, 2), pinMat);
    pinSphere.userData = { amenidadId: 'plaza_principal', isAmenidadPin: true };
    pinGroup.add(pinSphere);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(12, 0.7, 8, 30),
      new THREE.MeshBasicMaterial({ color: '#6EE7B7' })
    );
    ring.rotation.x = Math.PI / 5;
    pinGroup.add(ring);

    const labelSprite = createAmenityLabelSprite('Plaza Principal La Caldera', '#10B981');
    labelSprite.position.set(0, 15, 0);
    pinGroup.add(labelSprite);

    mainGroup.add(pinGroup);

    const refLine = createDashedReferenceLine(
      new THREE.Vector3(px, 60, pz),
      new THREE.Vector3(-210, 1, 0),
      '#10B981'
    );
    mainGroup.add(refLine);

    pinEntries.set('plaza_principal', {
      mesh: pinSphere,
      group: pinGroup,
      amenidad: plazaData,
      baseScale: 1.0,
      hoverScale: 1.35,
      isHovered: false,
      pulseSpeed: 1.5
    });
  }

  // 5. RÍO LA CALDERA (Borde Este, banda azul con ondas)
  const rioData = AMENIDADES_3D_DATA.find((a) => a.id === 'rio_la_caldera');
  if (rioData) {
    const [rx, ry, rz] = rioData.posicion3D;
    
    // Malla del río: 65m ancho x 700m largo, azul brillante con ondas
    const riverGeo = new THREE.PlaneGeometry(65, 700, 32, 64);
    const riverMat = new THREE.MeshStandardMaterial({
      color: '#1E90FF',
      roughness: 0.15,
      metalness: 0.35,
      transparent: true,
      opacity: 0.92
    });
    const rMesh = new THREE.Mesh(riverGeo, riverMat);
    rMesh.rotation.x = -Math.PI / 2;
    rMesh.rotation.z = -0.32; // Alineado con el cauce del río y la costanera
    rMesh.position.set(rx, 0.08, rz);
    rMesh.receiveShadow = true;
    mainGroup.add(rMesh);
    waterMesh = rMesh;

    // Pin flotante azul oscuro
    const pinGroup = new THREE.Group();
    pinGroup.position.set(rx + 25, 45, rz - 60);

    const pinMat = new THREE.MeshStandardMaterial({
      color: '#0284C7',
      emissive: new THREE.Color('#0369A1'),
      emissiveIntensity: 0.5,
      roughness: 0.2
    });
    const pinSphere = new THREE.Mesh(new THREE.IcosahedronGeometry(8, 2), pinMat);
    pinSphere.userData = { amenidadId: 'rio_la_caldera', isAmenidadPin: true };
    pinGroup.add(pinSphere);

    const labelSprite = createAmenityLabelSprite('Río La Caldera', '#0284C7');
    labelSprite.position.set(0, 13, 0);
    pinGroup.add(labelSprite);

    mainGroup.add(pinGroup);

    pinEntries.set('rio_la_caldera', {
      mesh: pinSphere,
      group: pinGroup,
      amenidad: rioData,
      baseScale: 0.95,
      hoverScale: 1.3,
      isHovered: false,
      pulseSpeed: 1.4
    });
  }

  // Animation update routine
  const updateAnimations = (elapsedTime: number, cameraDistance: number) => {
    // 1. Water animation
    if (waterMesh) {
      waterMesh.position.y = 0.08 + Math.sin(elapsedTime * 2.2) * 0.04;
    }

    // 2. Pins rotation, pulse and auto-scaling
    pinEntries.forEach((entry) => {
      const { group, baseScale, hoverScale, isHovered, pulseSpeed } = entry;
      
      // Continuous rotation at 0.5 rad/s
      group.rotation.y = elapsedTime * 0.5;

      // Soft vertical oscillation
      group.position.y += Math.sin(elapsedTime * pulseSpeed) * 0.02;

      // Distance auto-scaling: when camera zooms out (>350m), pins scale up to remain legible
      const distanceFactor = Math.min(2.5, Math.max(0.8, cameraDistance / 280));
      const targetScale = (isHovered ? hoverScale : baseScale) * distanceFactor;

      group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
    });
  };

  return {
    group: mainGroup,
    pinEntries,
    waterMesh,
    updateAnimations
  };
}
