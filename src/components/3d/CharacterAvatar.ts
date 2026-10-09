import * as THREE from 'three';

/**
 * Avatar 3D procedimental estilizado para exploración en 3ª Persona
 * Representa a un agrimensor/arquitecto con indumentaria técnica y casco de seguridad.
 * Incluye cinemática directa y animaciones procedimentales de caminata, trote y respiración.
 */
export class CharacterAvatar {
  public group: THREE.Group;
  public torsoGroup: THREE.Group;
  public headGroup: THREE.Group;
  public leftArmGroup: THREE.Group;
  public rightArmGroup: THREE.Group;
  public leftLegGroup: THREE.Group;
  public rightLegGroup: THREE.Group;
  public shadowMesh: THREE.Mesh;

  private walkCycleTime: number = 0;
  private idleCycleTime: number = 0;
  private baseTorsoY: number = 0.95;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'avatar-character-root';

    // Materiales compartidos del avatar
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xf5d0a9,
      roughness: 0.6
    });

    const shirtMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Azul zafiro técnico
      roughness: 0.7
    });

    const vestMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Chaleco refractario ámbar/naranja
      roughness: 0.5
    });

    const vestStripMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.8
    });

    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Pantalón cargo oscuro
      roughness: 0.8
    });

    const shoesMat = new THREE.MeshStandardMaterial({
      color: 0x78350f, // Botas de seguridad cuero marrón
      roughness: 0.6
    });

    const helmetMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15, // Casco de obra amarillo reflectante
      roughness: 0.3,
      metalness: 0.2
    });

    // 1. Torso Group (Pivote central de respiración y paso)
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.y = this.baseTorsoY;
    this.group.add(this.torsoGroup);

    // Torso / Cuerpo
    const torsoGeo = new THREE.BoxGeometry(0.5, 0.6, 0.28);
    const torsoMesh = new THREE.Mesh(torsoGeo, shirtMat);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    this.torsoGroup.add(torsoMesh);

    // Chaleco de seguridad sobre el torso
    const vestGeo = new THREE.BoxGeometry(0.52, 0.56, 0.3);
    const vestMesh = new THREE.Mesh(vestGeo, vestMat);
    vestMesh.castShadow = true;
    this.torsoGroup.add(vestMesh);

    // Franja reflectante horizontal en el chaleco
    const stripGeo = new THREE.BoxGeometry(0.53, 0.08, 0.31);
    const stripMesh = new THREE.Mesh(stripGeo, vestStripMat);
    stripMesh.position.y = -0.05;
    this.torsoGroup.add(stripMesh);

    // 2. Cabeza y Casco
    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 0.45;
    this.torsoGroup.add(this.headGroup);

    // Cabeza
    const headGeo = new THREE.SphereGeometry(0.16, 16, 16);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.y = 0.05;
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Casco de seguridad
    const helmetGeo = new THREE.SphereGeometry(0.18, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const helmetMesh = new THREE.Mesh(helmetGeo, helmetMat);
    helmetMesh.position.y = 0.09;
    helmetMesh.castShadow = true;
    this.headGroup.add(helmetMesh);

    // Visera del casco
    const visorGeo = new THREE.CylinderGeometry(0.2, 0.21, 0.03, 16, 1, false, -Math.PI * 0.4, Math.PI * 0.8);
    const visorMesh = new THREE.Mesh(visorGeo, helmetMat);
    visorMesh.position.set(0, 0.08, 0.02);
    this.headGroup.add(visorMesh);

    // 3. Brazos (Pivotean en los hombros)
    // Brazo izquierdo
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.32, 0.24, 0);
    this.torsoGroup.add(this.leftArmGroup);

    const armGeo = new THREE.BoxGeometry(0.12, 0.5, 0.12);
    armGeo.translate(0, -0.22, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, shirtMat);
    leftArmMesh.castShadow = true;
    this.leftArmGroup.add(leftArmMesh);

    const handGeo = new THREE.SphereGeometry(0.07, 8, 8);
    const leftHandMesh = new THREE.Mesh(handGeo, skinMat);
    leftHandMesh.position.y = -0.48;
    this.leftArmGroup.add(leftHandMesh);

    // Brazo derecho
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.32, 0.24, 0);
    this.torsoGroup.add(this.rightArmGroup);

    const rightArmMesh = new THREE.Mesh(armGeo, shirtMat);
    rightArmMesh.castShadow = true;
    this.rightArmGroup.add(rightArmMesh);

    const rightHandMesh = new THREE.Mesh(handGeo, skinMat);
    rightHandMesh.position.y = -0.48;
    this.rightArmGroup.add(rightHandMesh);

    // 4. Piernas (Pivotean en las caderas y=0.68)
    const legGeo = new THREE.BoxGeometry(0.16, 0.65, 0.16);
    legGeo.translate(0, -0.3, 0);

    const shoeGeo = new THREE.BoxGeometry(0.17, 0.12, 0.24);
    shoeGeo.translate(0, -0.6, 0.04);

    // Pierna izquierda
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.14, 0.68, 0);
    this.group.add(this.leftLegGroup);

    const leftLegMesh = new THREE.Mesh(legGeo, pantsMat);
    leftLegMesh.castShadow = true;
    this.leftLegGroup.add(leftLegMesh);

    const leftShoeMesh = new THREE.Mesh(shoeGeo, shoesMat);
    leftShoeMesh.castShadow = true;
    this.leftLegGroup.add(leftShoeMesh);

    // Pierna derecha
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.14, 0.68, 0);
    this.group.add(this.rightLegGroup);

    const rightLegMesh = new THREE.Mesh(legGeo, pantsMat);
    rightLegMesh.castShadow = true;
    this.rightLegGroup.add(rightLegMesh);

    const rightShoeMesh = new THREE.Mesh(shoeGeo, shoesMat);
    rightShoeMesh.castShadow = true;
    this.rightLegGroup.add(rightShoeMesh);

    // 5. Sombra suave de contacto sobre el piso
    const shadowGeo = new THREE.CircleGeometry(0.42, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.y = 0.03;
    this.group.add(this.shadowMesh);
  }

  /**
   * Actualiza las animaciones de cinemática procedimental
   * @param deltaTime Segundos transcurridos
   * @param isMoving Si el avatar se está desplazando
   * @param isRunning Si corre a velocidad rápida
   * @param moveSpeed Magnitud de velocidad
   */
  public update(deltaTime: number, isMoving: boolean, isRunning: boolean, moveSpeed: number) {
    if (isMoving) {
      const frequency = isRunning ? 12 : 7;
      this.walkCycleTime += deltaTime * frequency;

      // Balanceo alternado de piernas
      const legAngle = Math.sin(this.walkCycleTime) * (isRunning ? 0.85 : 0.55);
      this.leftLegGroup.rotation.x = legAngle;
      this.rightLegGroup.rotation.x = -legAngle;

      // Balanceo cruzado de brazos (contrario a las piernas)
      const armAngle = -legAngle * (isRunning ? 0.9 : 0.7);
      this.leftArmGroup.rotation.x = armAngle;
      this.rightArmGroup.rotation.x = -armAngle;

      // Rebote vertical al caminar (paso)
      const bounce = Math.abs(Math.sin(this.walkCycleTime)) * (isRunning ? 0.09 : 0.05);
      this.torsoGroup.position.y = this.baseTorsoY + bounce;

      // Ligero bamboleo lateral de hombros
      this.torsoGroup.rotation.z = Math.sin(this.walkCycleTime) * 0.04;
    } else {
      // Cinemática Idle (respiración suave)
      this.idleCycleTime += deltaTime * 2.2;
      const breath = Math.sin(this.idleCycleTime) * 0.015;
      this.torsoGroup.position.y = this.baseTorsoY + breath;
      this.torsoGroup.rotation.z = 0;

      // Retorno suave de extremidades a reposo (lerp)
      this.leftLegGroup.rotation.x *= 0.85;
      this.rightLegGroup.rotation.x *= 0.85;
      this.leftArmGroup.rotation.x *= 0.85;
      this.rightArmGroup.rotation.x *= 0.85;
    }
  }

  /**
   * Libera geometrías y materiales
   */
  public dispose() {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    });
  }
}
