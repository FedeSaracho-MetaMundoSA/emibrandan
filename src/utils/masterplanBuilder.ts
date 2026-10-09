import * as THREE from 'three';
import { KML_PERIMETER, KML_GREEN_SPACES } from '../data/masterplanKmlElements';

export interface MasterplanBuildResult {
  group: THREE.Group;
  calloutSprites: THREE.Sprite[];
  updateCalloutsVisibility: (visible: boolean) => void;
}

// Safe rounded rect helper for older mobile browsers where ctx.roundRect is unsupported
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

/**
 * Creates the Google Earth style 3D Masterplan elements:
 * - Glowing Barda Perimetral (Perimeter Security Wall & Boundary Line from doc.kml)
 * - Modern Security Entrance Portal & Guardhouse (Caseta 24hs)
 * - 3D Floating Masterplan Callouts / HUD Labels
 * - Dense Perimeter Forest Belt (inspired by aerial visualization style)
 */
export function buildMasterplanElements(): MasterplanBuildResult {
  const group = new THREE.Group();
  group.name = 'masterplan-hud-and-perimeter';

  const surveyorAngle = -0.364;
  const calloutSprites: THREE.Sprite[] = [];

  // 1. BARDA PERIMETRAL OFICIAL (Polilínea [1C8F]:0 de doc.kml)
  // Utiliza los vértices exactos de agrimensura en coordenadas Three.js locales (x, z)
  const rawPerimeterPoints = (KML_PERIMETER as any).ring_local || (KML_PERIMETER as any).ringLocal || [];
  const perimeterPointsWorld: THREE.Vector3[] = rawPerimeterPoints.map(([x, z]: [number, number]) => {
    return new THREE.Vector3(x, 0, z);
  });

  // Si no tiene puntos suficientes, fallback seguro
  if (perimeterPointsWorld.length < 3) {
    perimeterPointsWorld.push(
      new THREE.Vector3(-180, 0, -210),
      new THREE.Vector3(240, 0, -210),
      new THREE.Vector3(240, 0, 210),
      new THREE.Vector3(-180, 0, 210),
      new THREE.Vector3(-180, 0, -210)
    );
  }

  // Línea luminosa perimetral tipo Google Earth / Neón de mensura
  const lineGeo = new THREE.BufferGeometry().setFromPoints(perimeterPointsWorld);
  const lineMat = new THREE.LineBasicMaterial({
    color: '#06B6D4', // Cyan neón agrimensura
    linewidth: 3,
    transparent: true,
    opacity: 0.95
  });
  const perimeterLine = new THREE.Line(lineGeo, lineMat);
  perimeterLine.position.y = 0.45;
  group.add(perimeterLine);

  // Muro perimetral de mampostería y cerco de agrimensura oficial
  const wallMat = new THREE.MeshStandardMaterial({
    color: '#475569',
    roughness: 0.85
  });

  for (let i = 0; i < perimeterPointsWorld.length - 1; i++) {
    const p1 = perimeterPointsWorld[i];
    const p2 = perimeterPointsWorld[i + 1];

    const dist = p1.distanceTo(p2);
    if (dist < 0.1) continue;
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

    const wallGeo = new THREE.BoxGeometry(0.35, 2.2, dist);
    const wallMesh = new THREE.Mesh(wallGeo, wallMat);
    wallMesh.position.copy(mid);
    wallMesh.position.y = 1.1;
    wallMesh.lookAt(p2.x, wallMesh.position.y, p2.z);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    group.add(wallMesh);
  }

  // 2. MODERN ENTRANCE PORTAL & GUARDHOUSE (PÓRTICO DE ACCESO Y SEGURIDAD 24HS)
  const portalGroup = new THREE.Group();
  // Situated on the West Access boundary from doc.kml (-113, 224)
  portalGroup.position.set(-113, 0, 224);
  portalGroup.rotation.y = -0.364;

  // Guardhouse Building (Caseta de Seguridad)
  const casetaMat = new THREE.MeshStandardMaterial({ color: '#F8FAFC', roughness: 0.4 });
  const stoneCladMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.9 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: '#38BDF8',
    roughness: 0.1,
    metalness: 0.9,
    transparent: true,
    opacity: 0.7
  });

  const casetaBase = new THREE.Mesh(new THREE.BoxGeometry(6, 3.4, 5), casetaMat);
  casetaBase.position.set(0, 1.7, 0);
  casetaBase.castShadow = true;
  portalGroup.add(casetaBase);

  // Stone accent wall
  const stoneWall = new THREE.Mesh(new THREE.BoxGeometry(6.4, 4.2, 1.2), stoneCladMat);
  stoneWall.position.set(0, 2.1, 2.6);
  stoneWall.castShadow = true;
  portalGroup.add(stoneWall);

  // Large glass window
  const glassWindow = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.8, 0.2), glassMat);
  glassWindow.position.set(0, 1.8, -2.52);
  portalGroup.add(glassWindow);

  // Modern Cantilevered Roof Canopy over the access lanes
  const canopyGeo = new THREE.BoxGeometry(18, 0.4, 8);
  const canopyMat = new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.3, metalness: 0.7 });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(5.5, 4.6, 0);
  canopy.castShadow = true;
  portalGroup.add(canopy);

  // Boom barriers (Barreras automáticas de acceso)
  const barrierPole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.2, 8), stoneCladMat);
  barrierPole.position.set(5.5, 0.6, -3);
  portalGroup.add(barrierPole);

  const barrierArm = new THREE.Mesh(new THREE.BoxGeometry(5, 0.12, 0.12), new THREE.MeshBasicMaterial({ color: '#EF4444' }));
  barrierArm.position.set(8, 1.1, -3);
  portalGroup.add(barrierArm);

  group.add(portalGroup);

  // 3. 3D FLOATING MASTERPLAN HUD CALLOUTS
  const addCallout = (text: string, subtext: string, localPos: THREE.Vector3, iconColor: string = '#06B6D4') => {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    drawRoundedRect(ctx, 8, 8, 368, 112, 20);
    ctx.fill();

    ctx.strokeStyle = iconColor;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = iconColor;
    drawRoundedRect(ctx, 24, 28, 8, 72, 4);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
    ctx.fillText(text, 44, 58);

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    ctx.fillText(subtext, 44, 88);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });

    const sprite = new THREE.Sprite(spriteMat);
    const worldPos = localPos.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), surveyorAngle);
    sprite.position.copy(worldPos);
    sprite.scale.set(22, 7.3, 1);
    group.add(sprite);

    // Anchor pole down to terrain
    const poleGeo = new THREE.CylinderGeometry(0.15, 0.15, localPos.y, 6);
    const anchorPole = new THREE.Mesh(poleGeo, new THREE.MeshBasicMaterial({ color: iconColor, transparent: true, opacity: 0.4 }));
    anchorPole.position.set(worldPos.x, localPos.y / 2, worldPos.z);
    group.add(anchorPole);

    calloutSprites.push(sprite);
  };

  // Strategic Callout Locations (Elevated to avoid cluttering lots)
  addCallout('BARDA PERIMETRAL', 'Cerco Perimetral 1.589 m', new THREE.Vector3(-10, 48, -215), '#06B6D4');
  addCallout('CASETA DE SEGURIDAD', 'Vigilancia y Acceso 24hs', new THREE.Vector3(-188, 46, 5), '#38BDF8');
  addCallout('AVENIDAS PRINCIPALES', 'Calles Pavimentadas KMZ', new THREE.Vector3(-40, 42, 5), '#FBBF24');
  addCallout('RÍO LA CALDERA', 'Avenida Costanera Ribereña', new THREE.Vector3(240, 48, -50), '#0284C7');
  addCallout('CLUB HOUSE & DEPORTES', 'Área Recreación Activa', new THREE.Vector3(120, 44, -140), '#10B981');

  // Block Identification Tags [MZA A], [MZA B] ... elevated and compact
  const manzanaBlocks = [
    { key: 'A', localX: -140, localZ: 85 },
    { key: 'B', localX: -70, localZ: -85 },
    { key: 'C', localX: -56, localZ: 85 },
    { key: 'E', localX: -1, localZ: 85 },
    { key: 'G', localX: 68, localZ: 85 },
    { key: 'I', localX: 135, localZ: 85 },
    { key: 'K', localX: 192, localZ: 55 },
    { key: 'L', localX: 201, localZ: -95 }
  ];

  manzanaBlocks.forEach((m) => {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    drawRoundedRect(ctx, 8, 8, 144, 80, 14);
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`[ ${m.key} ]`, 80, 48);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });

    const sprite = new THREE.Sprite(spriteMat);
    const worldPos = new THREE.Vector3(m.localX, 38, m.localZ).applyAxisAngle(new THREE.Vector3(0, 1, 0), surveyorAngle);
    sprite.position.copy(worldPos);
    sprite.scale.set(7, 4.2, 1);
    group.add(sprite);
    calloutSprites.push(sprite);
  });

  // 4. DENSE PERIMETER FOREST BELT (High-Performance Instanced Geometry)
  // Replaces 1,000+ individual meshes with 5 InstancedMeshes for 60fps on weak mobile devices
  const foliageColors = [
    new THREE.Color('#1E3A1A'), // Deep dark green
    new THREE.Color('#2D5016'), // Natural forest green
    new THREE.Color('#3F6E20'), // Lush green
    new THREE.Color('#4D7C0F')  // Vibrant canopy
  ];
  const foliageMat = new THREE.MeshStandardMaterial({
    roughness: 0.8,
    metalness: 0.05
  });
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#5C3A21', roughness: 0.95 });

  const treeCone1 = new THREE.ConeGeometry(4.5, 7, 6);
  const treeCone2 = new THREE.ConeGeometry(3.5, 6, 6);
  const treeCone3 = new THREE.ConeGeometry(2.4, 5, 6);
  const treeSphere = new THREE.SphereGeometry(3.6, 6, 6);
  const treeTrunk = new THREE.CylinderGeometry(0.6, 0.9, 4, 5);

  interface TreeInstanceData {
    x: number;
    z: number;
    scale: number;
    isPine: boolean;
    color: THREE.Color;
  }

  const treeDataList: TreeInstanceData[] = [];

  const addTreeCluster = (baseX: number, baseZ: number, count: number, radius: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      const x = baseX + Math.cos(angle) * r;
      const z = baseZ + Math.sin(angle) * r;
      const scale = 0.8 + Math.random() * 0.7;
      const isPine = Math.random() > 0.4;
      const color = foliageColors[Math.floor(Math.random() * foliageColors.length)];
      treeDataList.push({ x, z, scale, isPine, color });
    }
  };

  // Surrounding forest bands around the 4 borders
  // North dense forest
  addTreeCluster(-100, -290, 45, 60);
  addTreeCluster(100, -290, 45, 60);
  // South dense forest
  addTreeCluster(-100, 290, 45, 60);
  addTreeCluster(100, 290, 45, 60);
  // West forest along access avenue
  addTreeCluster(-260, 0, 50, 70);
  // East riparian gallery forest along Río La Caldera
  addTreeCluster(280, -120, 40, 50);
  addTreeCluster(290, 100, 40, 50);

  const totalTrees = treeDataList.length;
  const pineCount = treeDataList.filter((t) => t.isPine).length;
  const broadleafCount = totalTrees - pineCount;

  const instancedTrunks = new THREE.InstancedMesh(treeTrunk, trunkMat, totalTrees);
  const instancedPines1 = new THREE.InstancedMesh(treeCone1, foliageMat, pineCount);
  const instancedPines2 = new THREE.InstancedMesh(treeCone2, foliageMat, pineCount);
  const instancedPines3 = new THREE.InstancedMesh(treeCone3, foliageMat, pineCount);
  const instancedBroadleaf = new THREE.InstancedMesh(treeSphere, foliageMat, broadleafCount);

  instancedTrunks.castShadow = true;
  instancedTrunks.receiveShadow = true;
  instancedPines1.castShadow = true;
  instancedPines2.castShadow = true;
  instancedPines3.castShadow = true;
  instancedBroadleaf.castShadow = true;

  instancedTrunks.frustumCulled = true;
  instancedPines1.frustumCulled = true;
  instancedPines2.frustumCulled = true;
  instancedPines3.frustumCulled = true;
  instancedBroadleaf.frustumCulled = true;

  const dummy = new THREE.Object3D();
  let pineIdx = 0;
  let broadleafIdx = 0;

  for (let i = 0; i < totalTrees; i++) {
    const t = treeDataList[i];
    // Trunk
    dummy.position.set(t.x, 2 * t.scale, t.z);
    dummy.scale.set(t.scale, t.scale, t.scale);
    dummy.rotation.set(0, (i * 17) % Math.PI, 0);
    dummy.updateMatrix();
    instancedTrunks.setMatrixAt(i, dummy.matrix);

    if (t.isPine) {
      // Pine Cone 1
      dummy.position.set(t.x, 5.5 * t.scale, t.z);
      dummy.scale.set(t.scale, t.scale, t.scale);
      dummy.updateMatrix();
      instancedPines1.setMatrixAt(pineIdx, dummy.matrix);
      instancedPines1.setColorAt(pineIdx, t.color);

      // Pine Cone 2
      dummy.position.set(t.x, 8.5 * t.scale, t.z);
      dummy.scale.set(t.scale * 0.8, t.scale * 0.8, t.scale * 0.8);
      dummy.updateMatrix();
      instancedPines2.setMatrixAt(pineIdx, dummy.matrix);
      instancedPines2.setColorAt(pineIdx, t.color);

      // Pine Cone 3
      dummy.position.set(t.x, 11.2 * t.scale, t.z);
      dummy.scale.set(t.scale * 0.6, t.scale * 0.6, t.scale * 0.6);
      dummy.updateMatrix();
      instancedPines3.setMatrixAt(pineIdx, dummy.matrix);
      instancedPines3.setColorAt(pineIdx, t.color);

      pineIdx++;
    } else {
      // Broadleaf
      dummy.position.set(t.x, 6.2 * t.scale, t.z);
      dummy.scale.set(t.scale * 1.1, t.scale * 1.3, t.scale * 1.1);
      dummy.updateMatrix();
      instancedBroadleaf.setMatrixAt(broadleafIdx, dummy.matrix);
      instancedBroadleaf.setColorAt(broadleafIdx, t.color);

      broadleafIdx++;
    }
  }

  instancedTrunks.instanceMatrix.needsUpdate = true;
  instancedPines1.instanceMatrix.needsUpdate = true;
  if (instancedPines1.instanceColor) instancedPines1.instanceColor.needsUpdate = true;
  instancedPines2.instanceMatrix.needsUpdate = true;
  if (instancedPines2.instanceColor) instancedPines2.instanceColor.needsUpdate = true;
  instancedPines3.instanceMatrix.needsUpdate = true;
  if (instancedPines3.instanceColor) instancedPines3.instanceColor.needsUpdate = true;
  instancedBroadleaf.instanceMatrix.needsUpdate = true;
  if (instancedBroadleaf.instanceColor) instancedBroadleaf.instanceColor.needsUpdate = true;

  instancedTrunks.computeBoundingSphere();
  instancedPines1.computeBoundingSphere();
  instancedPines2.computeBoundingSphere();
  instancedPines3.computeBoundingSphere();
  instancedBroadleaf.computeBoundingSphere();

  const forestGroup = new THREE.Group();
  forestGroup.name = 'instanced-forest';
  forestGroup.add(instancedTrunks);
  forestGroup.add(instancedPines1);
  forestGroup.add(instancedPines2);
  forestGroup.add(instancedPines3);
  forestGroup.add(instancedBroadleaf);

  group.add(forestGroup);

  // 5. RÍO LA CALDERA (Natural Riverbed & Water Ribbon along East Boundary)
  const riverGroup = new THREE.Group();
  riverGroup.name = 'rio-la-caldera';

  // Riverbed pebble ground
  const riverbedGeo = new THREE.PlaneGeometry(60, 540);
  const riverbedMat = new THREE.MeshStandardMaterial({
    color: '#57534E', // River stone gravel
    roughness: 0.95,
    metalness: 0.05
  });
  const riverbed = new THREE.Mesh(riverbedGeo, riverbedMat);
  riverbed.rotation.x = -Math.PI / 2;
  riverbed.position.set(295, -0.12, 0);
  riverbed.receiveShadow = true;
  riverGroup.add(riverbed);

  // River water surface
  const waterGeo = new THREE.PlaneGeometry(36, 540, 12, 64);
  const waterMat = new THREE.MeshStandardMaterial({
    color: '#0284C7',
    roughness: 0.12,
    metalness: 0.35,
    transparent: true,
    opacity: 0.82
  });
  const riverWater = new THREE.Mesh(waterGeo, waterMat);
  riverWater.rotation.x = -Math.PI / 2;
  riverWater.position.set(296, -0.04, 0);
  riverWater.receiveShadow = true;
  riverGroup.add(riverWater);

  riverGroup.rotation.y = surveyorAngle;
  group.add(riverGroup);

  // 6. PRECORDILLERA MOUNTAINS SILHOUETTE (Distant Salta Valley Mountain Range)
  const mountainGroup = new THREE.Group();
  mountainGroup.name = 'salta-precordillera-mountains';

  const mountainMats = [
    new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.95 }), // Slate dark mountain
    new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.92 }), // Cool ridge
    new THREE.MeshStandardMaterial({ color: '#3F3F46', roughness: 0.96 })  // Earthen mountain rock
  ];

  const mountainPositions = [
    // North ridges
    { x: -380, z: -580, w: 280, h: 95, d: 180, rot: 0.2 },
    { x: -100, z: -640, w: 320, h: 120, d: 200, rot: -0.1 },
    { x: 180, z: -610, w: 310, h: 105, d: 190, rot: 0.3 },
    { x: 420, z: -570, w: 260, h: 90, d: 170, rot: -0.2 },
    // East ridges (behind Río La Caldera)
    { x: 590, z: -320, w: 260, h: 110, d: 240, rot: 0.8 },
    { x: 620, z: 0, w: 280, h: 135, d: 260, rot: 0.4 },
    { x: 590, z: 320, w: 250, h: 115, d: 240, rot: -0.5 },
    // South ridges
    { x: 260, z: 610, w: 320, h: 100, d: 200, rot: 0.1 },
    { x: -80, z: 630, w: 350, h: 125, d: 220, rot: -0.2 },
    { x: -390, z: 580, w: 270, h: 85, d: 180, rot: 0.4 },
    // West ridges
    { x: -620, z: 0, w: 280, h: 105, d: 280, rot: 0.1 }
  ];

  mountainPositions.forEach((m, idx) => {
    const geo = new THREE.ConeGeometry(m.w / 2, m.h, 6);
    const mesh = new THREE.Mesh(geo, mountainMats[idx % mountainMats.length]);
    mesh.position.set(m.x, m.h / 2 - 2, m.z);
    mesh.rotation.y = m.rot;
    mesh.scale.set(1, 1, m.d / m.w);
    mountainGroup.add(mesh);
  });

  group.add(mountainGroup);

  // 7. ARGENSALTA OFFICIAL BILLBOARD AT MAIN ENTRANCE
  const billboardGroup = new THREE.Group();
  billboardGroup.name = 'argensalta-entrance-billboard';
  const bbLocalPos = new THREE.Vector3(-188, 0, -18);
  bbLocalPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), surveyorAngle);
  billboardGroup.position.copy(bbLocalPos);
  billboardGroup.rotation.y = surveyorAngle;

  // Posts
  const bbPostMat = new THREE.MeshStandardMaterial({ color: '#18181B', roughness: 0.5 });
  const bbPostLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 7, 0.3), bbPostMat);
  bbPostLeft.position.set(-3.6, 3.5, 0);
  billboardGroup.add(bbPostLeft);

  const bbPostRight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 7, 0.3), bbPostMat);
  bbPostRight.position.set(3.6, 3.5, 0);
  billboardGroup.add(bbPostRight);

  // Sign canvas
  const bbCanvas = document.createElement('canvas');
  bbCanvas.width = 512;
  bbCanvas.height = 256;
  const bbCtx = bbCanvas.getContext('2d');
  if (bbCtx) {
    bbCtx.fillStyle = '#09090B';
    bbCtx.fillRect(0, 0, 512, 256);

    // Amber border
    bbCtx.strokeStyle = '#F59E0B';
    bbCtx.lineWidth = 10;
    bbCtx.strokeRect(6, 6, 500, 244);

    // Title
    bbCtx.fillStyle = '#FFFFFF';
    bbCtx.font = '900 36px system-ui, sans-serif';
    bbCtx.textAlign = 'center';
    bbCtx.fillText('RIVERAS DE PUCHETA', 256, 62);

    // Badge
    bbCtx.fillStyle = '#F59E0B';
    bbCtx.font = 'bold 22px system-ui, sans-serif';
    bbCtx.fillText('PROMUEVE: ArgenSALTA', 256, 108);

    // Offer
    bbCtx.fillStyle = '#34D399';
    bbCtx.font = 'bold 26px system-ui, sans-serif';
    bbCtx.fillText('USD 7.000 CONTADO · OBRAS EN MARCHA', 256, 154);

    // Financing
    bbCtx.fillStyle = '#E4E4E7';
    bbCtx.font = '19px system-ui, sans-serif';
    bbCtx.fillText('Máquinas en terreno · Obras viales activas', 256, 192);

    // Tel
    bbCtx.fillStyle = '#FCD34D';
    bbCtx.font = 'bold 18px system-ui, sans-serif';
    bbCtx.fillText('Ventas Oficiales: 3875557009', 256, 226);
  }

  const bbTexture = new THREE.CanvasTexture(bbCanvas);
  bbTexture.needsUpdate = true;
  const bbBoardMat = new THREE.MeshStandardMaterial({ map: bbTexture, roughness: 0.3 });
  const bbBoard = new THREE.Mesh(new THREE.BoxGeometry(7.8, 3.9, 0.2), bbBoardMat);
  bbBoard.position.set(0, 5.2, 0);
  bbBoard.castShadow = true;
  billboardGroup.add(bbBoard);

  group.add(billboardGroup);

  const updateCalloutsVisibility = (visible: boolean) => {
    calloutSprites.forEach((sprite) => {
      sprite.visible = visible;
    });
    perimeterLine.visible = visible;
  };

  return {
    group,
    calloutSprites,
    updateCalloutsVisibility
  };
}
