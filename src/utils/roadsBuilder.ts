import * as THREE from 'three';

export interface RoadsBuildResult {
  roadsGroup: THREE.Group;
  streetPoints: { name: string; position: THREE.Vector3 }[];
}

/**
 * Builds a realistic surveyor-aligned road network for Riveras de Pucheta.
 * Aligned to the cadastral axis (-0.364 radians = -20.9 degrees).
 * Includes:
 * - High-grade asphalt roadways with road demarcations
 * - Concrete curbs (cordón cuneta) and veredas
 * - White road edge lines and dashed centerline markings
 * - Pedestrian crosswalks (sendas peatonales)
 * - Modern LED street lighting poles
 * - Street intersection name plaques
 */
export function buildRiverasRoadNetwork(asphaltTexture: THREE.Texture): RoadsBuildResult {
  const roadsGroup = new THREE.Group();
  roadsGroup.name = 'riveras-road-network';
  roadsGroup.rotation.y = -0.364; // Surveyor alignment

  const streetPoints: { name: string; position: THREE.Vector3 }[] = [];

  // Materials with polygonOffset to prevent z-fighting against terrain
  const asphaltMat = new THREE.MeshStandardMaterial({
    color: '#3F3F46', // Zinc-700 dark asphalt
    roughness: 0.88,
    metalness: 0.04,
    map: asphaltTexture,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });

  const curbMat = new THREE.MeshStandardMaterial({
    color: '#D4D4D8', // Zinc-300 concrete curb
    roughness: 0.75,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });

  const sidewalkMat = new THREE.MeshStandardMaterial({
    color: '#E4E4E7', // Zinc-200 pavers / sidewalk
    roughness: 0.85,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });

  const whiteLineMat = new THREE.MeshBasicMaterial({
    color: '#FFFFFF',
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2
  });

  const yellowLineMat = new THREE.MeshBasicMaterial({
    color: '#FBBF24',
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2
  });

  const poleMat = new THREE.MeshStandardMaterial({
    color: '#475569',
    metalness: 0.6,
    roughness: 0.3
  });

  const lampBulbMat = new THREE.MeshBasicMaterial({
    color: '#FEF08A'
  });

  // Reusable geometries
  const curbGeo = new THREE.BoxGeometry(0.3, 0.22, 1);
  const sidewalkGeo = new THREE.BoxGeometry(0.8, 0.18, 1);

  // Helper to create a street segment along local Y (North-South in subdivision)
  const addLongitudinalStreet = (
    name: string,
    x: number,
    yStart: number,
    yEnd: number,
    width: number,
    isMajor: boolean = false
  ) => {
    const length = Math.abs(yEnd - yStart);
    const midY = (yStart + yEnd) / 2;

    const streetGroup = new THREE.Group();
    streetGroup.position.set(x, 0, midY);

    // 1. Asphalt Road Surface
    const roadGeo = new THREE.PlaneGeometry(width, length);
    const roadMesh = new THREE.Mesh(roadGeo, asphaltMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.y = 0.05;
    roadMesh.receiveShadow = true;
    streetGroup.add(roadMesh);

    // 2. Road Markings
    // Side white boundary lines
    const sideLineGeo = new THREE.PlaneGeometry(0.25, length);
    const leftLine = new THREE.Mesh(sideLineGeo, whiteLineMat);
    leftLine.rotation.x = -Math.PI / 2;
    leftLine.position.set(-width / 2 + 0.35, 0.052, 0);
    streetGroup.add(leftLine);

    const rightLine = new THREE.Mesh(sideLineGeo, whiteLineMat);
    rightLine.rotation.x = -Math.PI / 2;
    rightLine.position.set(width / 2 - 0.35, 0.052, 0);
    streetGroup.add(rightLine);

    // Center divider line (yellow for major avenue, dashed white for streets)
    if (isMajor) {
      const centerLineGeo = new THREE.PlaneGeometry(0.2, length);
      const centerLine = new THREE.Mesh(centerLineGeo, yellowLineMat);
      centerLine.rotation.x = -Math.PI / 2;
      centerLine.position.set(0, 0.052, 0);
      streetGroup.add(centerLine);
    } else {
      // Dashed lines
      const dashCount = Math.floor(length / 8);
      const dashGeo = new THREE.PlaneGeometry(0.18, 3.5);
      for (let i = 0; i < dashCount; i++) {
        const dashY = -length / 2 + 4 + i * 8;
        const dash = new THREE.Mesh(dashGeo, whiteLineMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(0, 0.052, dashY);
        streetGroup.add(dash);
      }
    }

    // 3. Concrete Curbs (Cordón Cuneta)
    const curbLeft = new THREE.Mesh(curbGeo, curbMat);
    curbLeft.scale.set(1, 1, length);
    curbLeft.position.set(-width / 2 - 0.15, 0.11, 0);
    curbLeft.receiveShadow = true;
    curbLeft.castShadow = true;
    streetGroup.add(curbLeft);

    const curbRight = new THREE.Mesh(curbGeo, curbMat);
    curbRight.scale.set(1, 1, length);
    curbRight.position.set(width / 2 + 0.15, 0.11, 0);
    curbRight.receiveShadow = true;
    curbRight.castShadow = true;
    streetGroup.add(curbRight);

    // 4. Sidewalks (Veredas peatonales)
    const swLeft = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    swLeft.scale.set(1, 1, length);
    swLeft.position.set(-width / 2 - 0.7, 0.09, 0);
    swLeft.receiveShadow = true;
    streetGroup.add(swLeft);

    const swRight = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    swRight.scale.set(1, 1, length);
    swRight.position.set(width / 2 + 0.7, 0.09, 0);
    swRight.receiveShadow = true;
    streetGroup.add(swRight);

    // 5. Street Light Poles (every 45m along right sidewalk)
    const poleCount = Math.floor(length / 45);
    for (let p = 0; p < poleCount; p++) {
      const pZ = -length / 2 + 15 + p * 45;
      const pole = createStreetLamp(poleMat, lampBulbMat);
      pole.position.set(width / 2 + 1.2, 0, pZ);
      pole.rotation.y = -Math.PI / 2;
      streetGroup.add(pole);
    }

    roadsGroup.add(streetGroup);

    // World position of street center for 360 street view
    const worldPos = new THREE.Vector3(x, 1.8, midY).applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.364);
    streetPoints.push({ name, position: worldPos });
  };

  // Helper to create a transversal street segment along local X
  const addTransversalStreet = (
    name: string,
    y: number,
    xStart: number,
    xEnd: number,
    width: number,
    isBoulevard: boolean = false
  ) => {
    const length = Math.abs(xEnd - xStart);
    const midX = (xStart + xEnd) / 2;

    const streetGroup = new THREE.Group();
    streetGroup.position.set(midX, 0, y);

    // Road surface
    const roadGeo = new THREE.PlaneGeometry(length, width);
    const roadMesh = new THREE.Mesh(roadGeo, asphaltMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.y = 0.051; // slightly above to avoid z-fighting at intersections
    roadMesh.receiveShadow = true;
    streetGroup.add(roadMesh);

    // Center markings
    if (isBoulevard) {
      const centerLineGeo = new THREE.PlaneGeometry(length, 0.25);
      const centerLine = new THREE.Mesh(centerLineGeo, yellowLineMat);
      centerLine.rotation.x = -Math.PI / 2;
      centerLine.position.set(0, 0.053, 0);
      streetGroup.add(centerLine);
    }

    // Concrete Curbs
    const curbTop = new THREE.Mesh(curbGeo, curbMat);
    curbTop.rotation.y = Math.PI / 2;
    curbTop.scale.set(1, 1, length);
    curbTop.position.set(0, 0.11, -width / 2 - 0.15);
    curbTop.receiveShadow = true;
    streetGroup.add(curbTop);

    const curbBottom = new THREE.Mesh(curbGeo, curbMat);
    curbBottom.rotation.y = Math.PI / 2;
    curbBottom.scale.set(1, 1, length);
    curbBottom.position.set(0, 0.11, width / 2 + 0.15);
    curbBottom.receiveShadow = true;
    streetGroup.add(curbBottom);

    roadsGroup.add(streetGroup);

    const worldPos = new THREE.Vector3(midX, 1.8, y).applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.364);
    streetPoints.push({ name, position: worldPos });
  };

  // 1. Unified Masterplan Asphalt Ground Plane (Underneath all lot polygons)
  // Gaps between KMZ lot polygons form the exact, official survey street corridors
  const baseAsphaltGeo = new THREE.PlaneGeometry(520, 460);
  const baseAsphaltMesh = new THREE.Mesh(baseAsphaltGeo, asphaltMat);
  baseAsphaltMesh.rotation.x = -Math.PI / 2;
  baseAsphaltMesh.position.set(20, 0.02, 0);
  baseAsphaltMesh.receiveShadow = true;
  roadsGroup.add(baseAsphaltMesh);

  // 2. Outer Access Avenue (West perimeter)
  addLongitudinalStreet('Avenida de Acceso (Oeste)', -195, -210, 210, 16, true);

  // 3. Avenida Costanera (East perimeter along Río La Caldera)
  addLongitudinalStreet('Avenida Costanera (Río La Caldera)', 245, -210, 210, 16, true);

  return {
    roadsGroup,
    streetPoints
  };
}

/**
 * Creates an elegant modern LED street light pole
 */
function createStreetLamp(poleMat: THREE.Material, bulbMat: THREE.Material): THREE.Group {
  const lampGroup = new THREE.Group();

  // Vertical pole
  const mastGeo = new THREE.CylinderGeometry(0.12, 0.16, 7.5, 8);
  const mast = new THREE.Mesh(mastGeo, poleMat);
  mast.position.y = 3.75;
  mast.castShadow = true;
  lampGroup.add(mast);

  // Curved horizontal arm
  const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8);
  const arm = new THREE.Mesh(armGeo, poleMat);
  arm.rotation.z = Math.PI / 2.3;
  arm.position.set(0.9, 7.6, 0);
  arm.castShadow = true;
  lampGroup.add(arm);

  // Light fixture head
  const headGeo = new THREE.BoxGeometry(0.8, 0.15, 0.4);
  const head = new THREE.Mesh(headGeo, poleMat);
  head.position.set(1.8, 7.8, 0);
  lampGroup.add(head);

  // Glowing LED bulb panel facing downward
  const bulbGeo = new THREE.PlaneGeometry(0.6, 0.3);
  const bulb = new THREE.Mesh(bulbGeo, bulbMat);
  bulb.rotation.x = Math.PI / 2;
  bulb.position.set(1.8, 7.71, 0);
  lampGroup.add(bulb);

  return lampGroup;
}
