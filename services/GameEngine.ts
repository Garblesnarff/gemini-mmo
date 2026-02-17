import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { COLORS, WORLD_SIZE, CAMP_CONFIG, RUINS_CONFIG } from '../constants';
import { MockSocket } from './MockSocket';

export class GameEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public physicsWorld: CANNON.World;
  
  private socket: MockSocket;
  private localPlayerBody: CANNON.Body | null = null;
  private localPlayerMesh: THREE.Group | null = null;
  
  // Navigation
  private navArrow: THREE.Group | null = null;
  private navTarget: THREE.Vector3 | null = null;

  // Entity management
  private playerMeshes: Record<string, THREE.Group> = {};
  private enemyMeshes: Record<string, THREE.Group> = {};
  private npcMeshes: Record<string, THREE.Group> = {};
  private collectibleMeshes: Record<string, THREE.Group> = {};
  
  // State callbacks
  public onStateUpdate: (data: any) => void = () => {};
  
  // Inputs
  private input = { w: false, a: false, s: false, d: false, space: false };
  private mouse = { x: 0, y: 0, down: false };
  
  // Camera controls
  private cameraAngle = Math.PI;
  private cameraZoom = 18;
  private cameraPitch = 0.5; 

  private clock = new THREE.Clock();
  private particleSystem: THREE.Points;
  private fireParticles: THREE.Points | null = null;

  // Animation State
  private animatedMeshes: THREE.Group[] = [];

  constructor(container: HTMLElement, socket: MockSocket) {
    this.socket = socket;

    // 1. Setup Three.js
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.SKY);
    this.scene.fog = new THREE.FogExp2(COLORS.SKY, 0.015);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    
    container.appendChild(this.renderer.domElement);

    // 2. Setup Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemiLight.position.set(0, 200, 0);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff0dd, 1.2);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    const d = 100;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0001;
    this.scene.add(dirLight);

    const sunGeo = new THREE.SphereGeometry(15, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, fog: false });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.position.copy(dirLight.position).normalize().multiplyScalar(400); 
    this.scene.add(sun);

    // 3. Setup Physics
    this.physicsWorld = new CANNON.World();
    this.physicsWorld.gravity.set(0, -20, 0); 
    
    const groundMat = new CANNON.Material();
    const playerMat = new CANNON.Material();
    const contactMat = new CANNON.ContactMaterial(groundMat, playerMat, { friction: 0.0, restitution: 0.0 });
    this.physicsWorld.addContactMaterial(contactMat);

    // 4. Create World
    this.createTerrain(groundMat);
    this.createCamp();
    this.createRuins(); // New Area
    this.createEnvironment();
    this.createParticles();
    this.createNavigationArrow();

    // 5. Init Local Player
    this.createLocalPlayer(playerMat);

    // 6. Listeners
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    
    this.renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());

    // 7. Start Loop
    this.animate();
  }

  // --- Navigation Arrow ---
  private createNavigationArrow() {
      const group = new THREE.Group();
      
      // Arrow Body - Floating pointer
      const cone = new THREE.Mesh(
          new THREE.ConeGeometry(0.4, 1.2, 8),
          new THREE.MeshBasicMaterial({ color: 0xFFD700, transparent: true, opacity: 0.8, depthTest: false })
      );
      cone.rotation.x = Math.PI / 2; // Point forward (Z)
      cone.position.z = 2.5; // Offset in front of player
      cone.renderOrder = 999; // Draw on top
      group.add(cone);

      this.scene.add(group);
      this.navArrow = group;
      this.navArrow.visible = false;
  }

  public setNavigationTarget(target: {x:number, z:number} | null) {
      if (!target) {
          this.navTarget = null;
          if (this.navArrow) this.navArrow.visible = false;
          return;
      }
      // y is ignored for direction usually, but let's set it to player height
      this.navTarget = new THREE.Vector3(target.x, 0, target.z);
      if (this.navArrow) this.navArrow.visible = true;
  }

  // --- Terrain ---
  
  private getTerrainHeight(x: number, z: number): number {
      const cx = CAMP_CONFIG.position.x;
      const cz = CAMP_CONFIG.position.z;
      const dist = Math.sqrt((x - cx) ** 2 + (z - cz) ** 2);

      const scale1 = 0.02;
      const scale2 = 0.05;
      const h1 = Math.sin(x * scale1) * Math.cos(z * scale1) * 8;
      const h2 = Math.sin(x * scale2 + z * scale1) * 2;
      let height = Math.max(0, h1 + h2);

      if (dist < CAMP_CONFIG.radius) {
          const factor = Math.min(1, dist / CAMP_CONFIG.radius);
          const blend = factor * factor * factor;
          height = height * blend + (CAMP_CONFIG.position.y * (1 - blend));
      }
      return height;
  }

  private createTerrain(material: CANNON.Material) {
    const size = WORLD_SIZE;
    const segments = 128;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    const posAttribute = geometry.attributes.position;
    const count = posAttribute.count;
    
    const colors = [];
    const colorBase = new THREE.Color(COLORS.GRASS);
    const colorDark = new THREE.Color(0x2d4c0e);
    const colorDirt = new THREE.Color(COLORS.DIRT);

    for (let i = 0; i < count; i++) {
        const x = posAttribute.getX(i);
        const z = posAttribute.getZ(i);
        const y = this.getTerrainHeight(x, z);
        posAttribute.setY(i, y);

        let mixColor = colorBase.clone();
        if (y < 2) {
             mixColor.lerp(colorDirt, 0.3);
        } else if (y > 8) {
            mixColor.offsetHSL(0, 0, 0.05);
        }
        mixColor.offsetHSL(0, 0, (Math.random() - 0.5) * 0.05);
        colors.push(mixColor.r, mixColor.g, mixColor.b);
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const meshMat = new THREE.MeshStandardMaterial({ 
        vertexColors: true, 
        roughness: 0.8,
        metalness: 0.0,
    });
    
    const mesh = new THREE.Mesh(geometry, meshMat);
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    const vertices = [];
    const indices = [];
    const physSegments = 64;
    const step = size / physSegments;
    
    for (let i = 0; i <= physSegments; i++) {
        for (let j = 0; j <= physSegments; j++) {
            const x = (i * step) - (size / 2);
            const z = (j * step) - (size / 2);
            const y = this.getTerrainHeight(x, z);
            vertices.push(x, y, z);
        }
    }
    
    for (let i = 0; i < physSegments; i++) {
        for (let j = 0; j < physSegments; j++) {
            const row1 = i * (physSegments + 1);
            const row2 = (i + 1) * (physSegments + 1);
            indices.push(row1 + j, row1 + j + 1, row2 + j);
            indices.push(row1 + j + 1, row2 + j + 1, row2 + j);
        }
    }

    const trimeshShape = new CANNON.Trimesh(vertices, indices);
    const groundBody = new CANNON.Body({ mass: 0, material: material });
    groundBody.addShape(trimeshShape);
    this.physicsWorld.addBody(groundBody);
  }

  private createEnvironment() {
    const grassCount = 10000;
    const grassGeo = new THREE.PlaneGeometry(0.4, 0.8);
    grassGeo.translate(0, 0.4, 0);
    const grassMat = new THREE.MeshStandardMaterial({ 
        color: 0xffffff, 
        side: THREE.DoubleSide, 
        vertexColors: false 
    });
    
    const grassMesh = new THREE.InstancedMesh(grassGeo, grassMat, grassCount);
    
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const grassBaseColor = new THREE.Color(COLORS.GRASS_BLADE);

    for(let i=0; i<grassCount; i++) {
        const x = (Math.random() - 0.5) * WORLD_SIZE * 0.9;
        const z = (Math.random() - 0.5) * WORLD_SIZE * 0.9;
        
        const dist = Math.sqrt((x-CAMP_CONFIG.position.x)**2 + (z-CAMP_CONFIG.position.z)**2);
        if (dist < 4) continue;

        const y = this.getTerrainHeight(x, z);
        
        dummy.position.set(x, y, z);
        dummy.scale.setScalar(0.8 + Math.random() * 0.6);
        dummy.rotation.y = Math.random() * Math.PI;
        dummy.rotation.x = (Math.random() - 0.5) * 0.3;
        dummy.rotation.z = (Math.random() - 0.5) * 0.3;
        
        dummy.updateMatrix();
        grassMesh.setMatrixAt(i, dummy.matrix);
        
        color.copy(grassBaseColor);
        color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);
        grassMesh.setColorAt(i, color);
    }
    grassMesh.receiveShadow = true;
    this.scene.add(grassMesh);

    const treeCount = 80;
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 1.5, 7);
    const trunkMat = new THREE.MeshStandardMaterial({ color: COLORS.DIRT, roughness: 1 });
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x224411, roughness: 0.8 });

    for (let i = 0; i < treeCount; i++) {
        const x = (Math.random() - 0.5) * WORLD_SIZE;
        const z = (Math.random() - 0.5) * WORLD_SIZE;
        
        const dist = Math.sqrt((x-CAMP_CONFIG.position.x)**2 + (z-CAMP_CONFIG.position.z)**2);
        if (dist < CAMP_CONFIG.radius + 2) continue;

        const y = this.getTerrainHeight(x, z);

        const group = new THREE.Group();
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 0.75;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        group.add(trunk);
        
        const levels = 3;
        for(let j=0; j<levels; j++) {
            const s = 1.0 - (j * 0.2);
            const cone = new THREE.Mesh(new THREE.ConeGeometry(2.5 * s, 3, 7), leavesMat);
            cone.position.y = 2 + (j * 1.5);
            cone.castShadow = true;
            cone.receiveShadow = true;
            group.add(cone);
        }
        
        group.position.set(x, y, z);
        group.scale.setScalar(0.7 + Math.random() * 0.6);
        this.scene.add(group);
        
        const shape = new CANNON.Cylinder(0.5, 0.5, 10, 8);
        const body = new CANNON.Body({ mass: 0 });
        body.addShape(shape);
        body.position.set(x, y, z);
        this.physicsWorld.addBody(body);
    }
  }

  private createCamp() {
      const campX = CAMP_CONFIG.position.x;
      const campZ = CAMP_CONFIG.position.z;
      const campY = this.getTerrainHeight(campX, campZ);

      const logGeo = new THREE.CylinderGeometry(0.2, 0.2, 2, 6);
      const logMat = new THREE.MeshStandardMaterial({ color: 0x3E2723 });
      const fireGroup = new THREE.Group();
      
      for(let i=0; i<3; i++) {
          const log = new THREE.Mesh(logGeo, logMat);
          log.rotation.z = Math.PI / 2;
          log.rotation.y = (Math.PI / 3) * i;
          log.position.y = 0.2;
          fireGroup.add(log);
      }
      const fireLight = new THREE.PointLight(0xFF5722, 2, 20);
      fireLight.position.y = 2;
      fireLight.castShadow = true;
      fireGroup.add(fireLight);

      fireGroup.position.set(campX, campY, campZ);
      this.scene.add(fireGroup);
      this.createFireParticles(new THREE.Vector3(campX, campY + 0.5, campZ));

      const tentGeo = new THREE.ConeGeometry(5, 7, 6, 1, true);
      const tentMat = new THREE.MeshStandardMaterial({ color: 0xD7CCC8, side: THREE.DoubleSide, roughness: 0.9 });
      
      const tentPositions = [
          { x: 10, z: 0, r: -Math.PI/2 },
          { x: -8, z: 8, r: Math.PI/4 },
          { x: -8, z: -8, r: -Math.PI/4 },
      ];

      tentPositions.forEach(pos => {
          const tX = campX + pos.x;
          const tZ = campZ + pos.z;
          const tY = this.getTerrainHeight(tX, tZ);
          
          const tent = new THREE.Mesh(tentGeo, tentMat);
          tent.position.set(tX, tY + 3.5, tZ);
          tent.rotation.y = pos.r;
          tent.castShadow = true;
          tent.receiveShadow = true;
          this.scene.add(tent);

          const shape = new CANNON.Cylinder(4, 4, 7, 8);
          const body = new CANNON.Body({ mass: 0 });
          body.addShape(shape);
          body.position.set(tX, tY + 3.5, tZ);
          this.physicsWorld.addBody(body);
      });
  }

  private createRuins() {
    const rX = RUINS_CONFIG.position.x;
    const rZ = RUINS_CONFIG.position.z;
    const rY = this.getTerrainHeight(rX, rZ);

    const group = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ color: COLORS.RUINS_STONE, roughness: 0.9 });

    // Large Broken Pillar
    const pillarGeo = new THREE.CylinderGeometry(1.5, 1.5, 8, 8);
    const pillar1 = new THREE.Mesh(pillarGeo, stoneMat);
    pillar1.position.set(0, 4, 0);
    pillar1.castShadow = true;
    group.add(pillar1);

    // Fallen Pillar
    const pillar2 = new THREE.Mesh(pillarGeo, stoneMat);
    pillar2.rotation.z = Math.PI / 1.8;
    pillar2.position.set(6, 1.5, 2);
    pillar2.castShadow = true;
    group.add(pillar2);

    // Small Stones
    for(let i=0; i<5; i++) {
        const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8), stoneMat);
        const angle = Math.random() * Math.PI * 2;
        const dist = 4 + Math.random() * 6;
        s.position.set(Math.cos(angle)*dist, 0.5, Math.sin(angle)*dist);
        group.add(s);
    }

    group.position.set(rX, rY, rZ);
    this.scene.add(group);

    // Physics
    const body = new CANNON.Body({ mass: 0 });
    body.addShape(new CANNON.Cylinder(1.5, 1.5, 8, 8), new CANNON.Vec3(rX, rY+4, rZ));
    this.physicsWorld.addBody(body);
  }

  private createParticles() {
      const particleCount = 400;
      const geom = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      for(let i=0; i<particleCount * 3; i++) {
          positions[i] = (Math.random() - 0.5) * 150;
      }
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
          size: 0.15,
          color: 0xffffee,
          transparent: true,
          opacity: 0.4,
          sizeAttenuation: true
      });
      this.particleSystem = new THREE.Points(geom, mat);
      this.scene.add(this.particleSystem);
  }

  private createFireParticles(pos: THREE.Vector3) {
      const count = 50;
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const speeds = new Float32Array(count);
      const offsets = new Float32Array(count * 2);

      for(let i=0; i<count; i++) {
          positions[i*3] = pos.x;
          positions[i*3+1] = pos.y + Math.random();
          positions[i*3+2] = pos.z;
          speeds[i] = 0.5 + Math.random() * 1.5;
          offsets[i*2] = (Math.random() - 0.5) * 1.5;
          offsets[i*2+1] = (Math.random() - 0.5) * 1.5;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
      geo.setAttribute('offset', new THREE.BufferAttribute(offsets, 2));
      const mat = new THREE.PointsMaterial({
          color: 0xFF5722,
          size: 0.4,
          transparent: true,
          opacity: 0.8,
          sizeAttenuation: true,
          blending: THREE.AdditiveBlending
      });
      this.fireParticles = new THREE.Points(geo, mat);
      this.fireParticles.userData = { startPos: pos.clone() };
      this.scene.add(this.fireParticles);
  }

  private createLocalPlayer(material: CANNON.Material) {
    const spawnX = CAMP_CONFIG.position.x + 10;
    const spawnZ = CAMP_CONFIG.position.z + 10;
    const terrainHeight = this.getTerrainHeight(spawnX, spawnZ);
    const spawnY = terrainHeight + 1; 

    const shape = new CANNON.Cylinder(1, 1, 3, 12);
    
    this.localPlayerBody = new CANNON.Body({
        mass: 80, 
        material: material,
        position: new CANNON.Vec3(spawnX, spawnY, spawnZ),
        fixedRotation: true,
        linearDamping: 0.99
    });
    this.localPlayerBody.addShape(shape, new CANNON.Vec3(0, 1.5, 0));
    this.physicsWorld.addBody(this.localPlayerBody);

    this.localPlayerMesh = this.createTaurenMesh(COLORS.PLAYER_FUR, true);
    this.scene.add(this.localPlayerMesh);
  }

  private createTaurenMesh(color: number, isLocal: boolean): THREE.Group {
      const group = new THREE.Group();
      const furMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.9 });
      const maneMat = new THREE.MeshStandardMaterial({ color: COLORS.PLAYER_MANE, roughness: 1.0 });
      const hornMat = new THREE.MeshStandardMaterial({ color: COLORS.PLAYER_HORN, roughness: 0.4 });
      const clothMat = new THREE.MeshStandardMaterial({ color: COLORS.PLAYER_CLOTH, roughness: 0.8 });

      const torsoGeo = new THREE.BoxGeometry(1.6, 1.8, 1);
      const torso = new THREE.Mesh(torsoGeo, furMat);
      torso.position.y = 1.6;
      torso.castShadow = true;
      group.add(torso);

      const headGroup = new THREE.Group();
      headGroup.position.set(0, 2.6, 0.4);
      const headGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
      const head = new THREE.Mesh(headGeo, furMat);
      head.castShadow = true;
      headGroup.add(head);

      const snoutGeo = new THREE.BoxGeometry(0.6, 0.5, 0.6);
      const snout = new THREE.Mesh(snoutGeo, furMat);
      snout.position.set(0, -0.1, 0.6);
      snout.castShadow = true;
      headGroup.add(snout);

      const maneGeo = new THREE.BoxGeometry(1.2, 1.0, 1.2);
      const mane = new THREE.Mesh(maneGeo, maneMat);
      mane.position.set(0, 0.2, -0.6);
      mane.castShadow = true;
      headGroup.add(mane);

      const hornGeo = new THREE.ConeGeometry(0.1, 0.8, 8);
      const leftHorn = new THREE.Mesh(hornGeo, hornMat);
      leftHorn.position.set(0.6, 0.2, 0);
      leftHorn.rotation.z = -Math.PI / 4;
      headGroup.add(leftHorn);

      const rightHorn = new THREE.Mesh(hornGeo, hornMat);
      rightHorn.position.set(-0.6, 0.2, 0);
      rightHorn.rotation.z = Math.PI / 4;
      headGroup.add(rightHorn);

      group.add(headGroup);

      const legGeo = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 8);
      const armGeo = new THREE.CylinderGeometry(0.35, 0.3, 1.6, 8);

      const leftLeg = new THREE.Mesh(legGeo, furMat);
      leftLeg.position.set(-0.4, 0.75, 0);
      leftLeg.castShadow = true;
      leftLeg.userData = { type: 'limb', side: 'left', part: 'leg', initialRot: 0 };
      group.add(leftLeg);

      const rightLeg = new THREE.Mesh(legGeo, furMat);
      rightLeg.position.set(0.4, 0.75, 0);
      rightLeg.castShadow = true;
      rightLeg.userData = { type: 'limb', side: 'right', part: 'leg', initialRot: 0 };
      group.add(rightLeg);

      const leftArm = new THREE.Mesh(armGeo, furMat);
      leftArm.position.set(-0.9, 1.8, 0);
      leftArm.rotation.z = 0.2;
      leftArm.castShadow = true;
      leftArm.userData = { type: 'limb', side: 'left', part: 'arm', initialRot: 0.2 };
      group.add(leftArm);

      const rightArm = new THREE.Mesh(armGeo, furMat);
      rightArm.position.set(0.9, 1.8, 0);
      rightArm.rotation.z = -0.2;
      rightArm.castShadow = true;
      rightArm.userData = { type: 'limb', side: 'right', part: 'arm', initialRot: -0.2 };
      group.add(rightArm);

      const totemGeo = new THREE.CylinderGeometry(0.2, 0.2, 2.5, 8);
      const totem = new THREE.Mesh(totemGeo, clothMat);
      totem.position.set(0, 1.5, -0.6);
      totem.rotation.z = 0.5;
      totem.castShadow = true;
      group.add(totem);

      this.animatedMeshes.push(group);
      group.userData = { isMoving: false };

      return group;
  }

  private createBoarMesh(): THREE.Group {
      const group = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: COLORS.ENEMY_BOAR });
      
      const bodyGeo = new THREE.CylinderGeometry(0.5, 0.6, 1.5, 8);
      bodyGeo.rotateX(Math.PI / 2);
      const body = new THREE.Mesh(bodyGeo, mat);
      body.position.y = 0.6;
      body.castShadow = true;
      group.add(body);

      const headGeo = new THREE.ConeGeometry(0.4, 0.8, 8);
      headGeo.rotateX(Math.PI / 2);
      const head = new THREE.Mesh(headGeo, mat);
      head.position.set(0, 0.7, 0.9);
      head.castShadow = true;
      group.add(head);

      const tuskGeo = new THREE.ConeGeometry(0.05, 0.3, 4);
      tuskGeo.rotateX(Math.PI / 4);
      const tuskMat = new THREE.MeshStandardMaterial({ color: COLORS.ENEMY_BOAR_TUSK });
      
      const tusk1 = new THREE.Mesh(tuskGeo, tuskMat);
      tusk1.position.set(0.2, 0.6, 1.1);
      group.add(tusk1);

      const tusk2 = new THREE.Mesh(tuskGeo, tuskMat);
      tusk2.position.set(-0.2, 0.6, 1.1);
      group.add(tusk2);

      const legGeo = new THREE.CylinderGeometry(0.15, 0.1, 0.6, 6);
      for(let x of [-0.3, 0.3]) {
          for(let z of [-0.4, 0.4]) {
              const leg = new THREE.Mesh(legGeo, mat);
              leg.position.set(x, 0.3, z);
              leg.userData = { type: 'limb', part: 'leg', initialRot: 0, offset: z };
              group.add(leg);
          }
      }

      this.animatedMeshes.push(group);
      group.userData = { isMoving: true };
      
      return group;
  }

  private createWolfMesh(): THREE.Group {
      const group = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: COLORS.ENEMY_WOLF });

      // Body (Lean)
      const bodyGeo = new THREE.BoxGeometry(0.8, 0.9, 1.8);
      const body = new THREE.Mesh(bodyGeo, mat);
      body.position.y = 0.9;
      body.castShadow = true;
      group.add(body);

      // Head
      const headGeo = new THREE.BoxGeometry(0.7, 0.7, 0.8);
      const head = new THREE.Mesh(headGeo, mat);
      head.position.set(0, 1.4, 1.1);
      head.castShadow = true;
      group.add(head);

      // Snout
      const snoutGeo = new THREE.BoxGeometry(0.4, 0.4, 0.6);
      const snout = new THREE.Mesh(snoutGeo, mat);
      snout.position.set(0, 1.3, 1.6);
      group.add(snout);

      // Ears
      const earGeo = new THREE.ConeGeometry(0.1, 0.4, 4);
      const leftEar = new THREE.Mesh(earGeo, mat);
      leftEar.position.set(0.25, 1.85, 1.0);
      group.add(leftEar);
      
      const rightEar = new THREE.Mesh(earGeo, mat);
      rightEar.position.set(-0.25, 1.85, 1.0);
      group.add(rightEar);

      // Tail
      const tailGeo = new THREE.CylinderGeometry(0.1, 0.15, 1.2);
      tailGeo.rotateX(-Math.PI/4);
      const tail = new THREE.Mesh(tailGeo, mat);
      tail.position.set(0, 0.8, -1.2);
      group.add(tail);

      // Legs
      const legGeo = new THREE.CylinderGeometry(0.15, 0.1, 0.9, 6);
      for(let x of [-0.3, 0.3]) {
          for(let z of [-0.7, 0.7]) {
              const leg = new THREE.Mesh(legGeo, mat);
              leg.position.set(x, 0.45, z);
              leg.userData = { type: 'limb', part: 'leg', initialRot: 0, offset: z };
              group.add(leg);
          }
      }

      this.animatedMeshes.push(group);
      group.userData = { isMoving: true };

      return group;
  }

  private createKodoMesh(): THREE.Group {
      const group = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: COLORS.ENEMY_KODO });

      const bodyGeo = new THREE.BoxGeometry(1.5, 1.8, 3.5);
      const body = new THREE.Mesh(bodyGeo, mat);
      body.position.y = 1.8;
      body.castShadow = true;
      group.add(body);

      const headGeo = new THREE.BoxGeometry(1.2, 1.2, 1.5);
      const head = new THREE.Mesh(headGeo, mat);
      head.position.set(0, 2.2, 2.2);
      head.castShadow = true;
      group.add(head);

      const hornGeo = new THREE.ConeGeometry(0.15, 0.6, 8);
      hornGeo.rotateX(Math.PI/4);
      const horn = new THREE.Mesh(hornGeo, new THREE.MeshStandardMaterial({ color: 0xFFFFFF }));
      horn.position.set(0, 2.8, 2.8);
      group.add(horn);

      const legGeo = new THREE.CylinderGeometry(0.4, 0.5, 1.5, 8);
      for(let x of [-0.8, 0.8]) {
          for(let z of [-1.2, 1.2]) {
              const leg = new THREE.Mesh(legGeo, mat);
              leg.position.set(x, 0.75, z);
              leg.userData = { type: 'limb', part: 'leg', initialRot: 0, offset: z };
              group.add(leg);
          }
      }

      this.animatedMeshes.push(group);
      group.userData = { isMoving: true };

      return group;
  }

  private createCollectibleMesh(): THREE.Group {
      const group = new THREE.Group();
      
      // Stem
      const stemGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 6);
      const stemMat = new THREE.MeshStandardMaterial({ color: COLORS.HERB_LEAF });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 0.3;
      group.add(stem);

      // Leaves
      const leafGeo = new THREE.SphereGeometry(0.15, 4, 4);
      leafGeo.scale(1, 0.2, 1);
      const leaf1 = new THREE.Mesh(leafGeo, stemMat);
      leaf1.position.set(0.1, 0.4, 0);
      group.add(leaf1);
      
      const leaf2 = new THREE.Mesh(leafGeo, stemMat);
      leaf2.position.set(-0.1, 0.2, 0.1);
      group.add(leaf2);

      // Flower
      const flowerGeo = new THREE.DodecahedronGeometry(0.15);
      const flowerMat = new THREE.MeshStandardMaterial({ color: COLORS.HERB_FLOWER, emissive: COLORS.HERB_FLOWER, emissiveIntensity: 0.5 });
      const flower = new THREE.Mesh(flowerGeo, flowerMat);
      flower.position.y = 0.6;
      group.add(flower);

      // Sparkle Effect
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.Float32BufferAttribute([0,0.8,0], 3));
      const pMat = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.5, transparent: true, opacity: 0.8 });
      const p = new THREE.Points(pGeo, pMat);
      group.add(p);
      
      // Pulse Animation handled in loop
      group.userData = { isCollectible: true };

      return group;
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    const dt = this.clock.getDelta();
    const now = this.clock.getElapsedTime();
    this.physicsWorld.step(1/60, dt, 3);

    if (this.localPlayerBody && this.localPlayerMesh) {
        this.handlePlayerMovement();
        this.localPlayerMesh.position.copy(this.localPlayerBody.position as any);
        this.localPlayerMesh.userData.isMoving = this.localPlayerBody.velocity.length() > 0.5;

        // Update Nav Arrow
        if (this.navArrow) {
            this.navArrow.position.copy(this.localPlayerMesh.position);
            this.navArrow.position.y += 0.5; // Just above feet
            if (this.navTarget) {
                // LookAt logic needs correct world orientation
                // Simple trig to rotate group around Y
                const dx = this.navTarget.x - this.navArrow.position.x;
                const dz = this.navTarget.z - this.navArrow.position.z;
                this.navArrow.rotation.y = Math.atan2(dx, dz);
            }
        }
    }

    if(this.particleSystem) {
        this.particleSystem.rotation.y = now * 0.02;
    }

    if (this.fireParticles) {
        const positions = this.fireParticles.geometry.attributes.position.array as Float32Array;
        const speeds = this.fireParticles.geometry.attributes.speed.array as Float32Array;
        const offsets = this.fireParticles.geometry.attributes.offset.array as Float32Array;
        const startPos = this.fireParticles.userData.startPos;

        for(let i=0; i<50; i++) {
            positions[i*3+1] += speeds[i] * 0.1; 
            positions[i*3] = startPos.x + offsets[i*2] + Math.sin(now * 5 + i) * 0.2;
            positions[i*3+2] = startPos.z + offsets[i*2+1] + Math.cos(now * 3 + i) * 0.2;
            if (positions[i*3+1] > startPos.y + 3) {
                positions[i*3+1] = startPos.y;
            }
        }
        this.fireParticles.geometry.attributes.position.needsUpdate = true;
    }

    Object.values(this.npcMeshes).forEach(mesh => {
        const marker = mesh.userData.questMarker;
        if (marker) {
            marker.rotation.y += 0.05;
            marker.position.y = 4.5 + Math.sin(now * 2) * 0.2;
        }
    });

    Object.values(this.collectibleMeshes).forEach(mesh => {
        mesh.rotation.y += 0.02;
        mesh.scale.setScalar(1 + Math.sin(now * 3) * 0.1);
    });

    this.animatedMeshes.forEach(group => {
        if (!group.visible) return;
        const isMoving = group.userData.isMoving;
        group.children.forEach(child => {
            if (child.userData.type === 'limb') {
                if (isMoving) {
                    const speed = 8;
                    const offset = child.userData.offset || 0;
                    const sideMultiplier = child.userData.side === 'left' ? 1 : -1;
                    const partMultiplier = child.userData.part === 'arm' ? -1 : 1;
                    const rotation = Math.sin(now * speed + offset) * 0.5 * sideMultiplier * partMultiplier;
                    if (child.userData.part === 'leg' || child.userData.part === 'arm') {
                        child.rotation.x = (child.userData.initialRot || 0) + rotation;
                    }
                } else {
                    child.rotation.x = THREE.MathUtils.lerp(child.rotation.x, child.userData.initialRot || 0, 0.1);
                }
            }
        });
    });

    this.updateCamera();
    this.renderer.render(this.scene, this.camera);
  };

  private handlePlayerMovement() {
    if (!this.localPlayerBody || !this.localPlayerMesh) return;

    const terrainH = this.getTerrainHeight(this.localPlayerBody.position.x, this.localPlayerBody.position.z);
    const bottomY = this.localPlayerBody.position.y;
    
    if (bottomY < terrainH) {
        this.localPlayerBody.position.y = terrainH;
        this.localPlayerBody.velocity.y = Math.max(0, this.localPlayerBody.velocity.y);
    }

    const speed = 15;
    const velocity = new CANNON.Vec3(0, this.localPlayerBody.velocity.y, 0);
    const cameraForward = new THREE.Vector3();
    this.camera.getWorldDirection(cameraForward);
    cameraForward.y = 0;
    cameraForward.normalize();
    const cameraRight = new THREE.Vector3();
    cameraRight.crossVectors(cameraForward, new THREE.Vector3(0, 1, 0));

    let inputVec = new THREE.Vector3();
    if (this.input.w) inputVec.add(cameraForward);
    if (this.input.s) inputVec.sub(cameraForward);
    if (this.input.a) inputVec.sub(cameraRight);
    if (this.input.d) inputVec.add(cameraRight);

    if (inputVec.lengthSq() > 0) {
        inputVec.normalize();
        velocity.x = inputVec.x * speed;
        velocity.z = inputVec.z * speed;
        const targetAngle = Math.atan2(inputVec.x, inputVec.z);
        const currentQ = new THREE.Quaternion().setFromEuler(this.localPlayerMesh.rotation);
        const targetQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, targetAngle, 0));
        this.localPlayerMesh.quaternion.slerp(targetQ, 0.15);

        if (Math.random() > 0.8) {
             this.socket.emit('player_move', {
                position: this.localPlayerBody.position,
                rotation: this.localPlayerMesh.rotation.y,
                isMoving: true
            });
        }
    } else {
         velocity.x = this.localPlayerBody.velocity.x * 0.8;
         velocity.z = this.localPlayerBody.velocity.z * 0.8;
         if (Math.abs(velocity.x) < 0.1) velocity.x = 0;
         if (Math.abs(velocity.z) < 0.1) velocity.z = 0;
         this.socket.emit('player_move', {
            position: this.localPlayerBody.position,
            rotation: this.localPlayerMesh.rotation.y,
            isMoving: false
        });
    }

    if (this.input.space) {
        if (this.localPlayerBody.position.y < terrainH + 1.0) { 
            velocity.y = 12;
        }
    }

    this.localPlayerBody.velocity.set(velocity.x, velocity.y, velocity.z);
  }

  private updateCamera() {
      if (!this.localPlayerMesh) return;
      const targetPos = this.localPlayerMesh.position.clone();
      targetPos.y += 2.5;
      const camX = targetPos.x + this.cameraZoom * Math.sin(this.cameraAngle) * Math.cos(this.cameraPitch);
      const camZ = targetPos.z + this.cameraZoom * Math.cos(this.cameraAngle) * Math.cos(this.cameraPitch);
      let camY = targetPos.y + this.cameraZoom * Math.sin(this.cameraPitch);
      const terrainH = this.getTerrainHeight(camX, camZ);
      if (camY < terrainH + 1) camY = terrainH + 1; 
      this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.2);
      this.camera.lookAt(targetPos);
  }

  public updateGameState(gameState: any) {
    const { players, enemies, npcs, collectibles, event } = gameState;

    if (event) {
        if (event.type === 'spell_cast') {
            let caster = this.playerMeshes[event.casterId];
            if (!caster && event.casterId === this.socket.id) {
                caster = this.localPlayerMesh!;
            }
            const target = event.targetId ? (this.enemyMeshes[event.targetId] || this.playerMeshes[event.targetId]) : null;
            if (caster) this.createSpellEffect(event.spellId, caster, target);
        }
        if (event.type === 'levelup') {
            let player = this.playerMeshes[event.playerId];
            if (!player && event.playerId === this.socket.id) {
                player = this.localPlayerMesh!;
            }
            if (player) this.createLevelUpEffect(player);
        }
    }

    Object.values(players).forEach((p: any) => {
        if (p.id === this.socket.id) return; 
        if (!this.playerMeshes[p.id]) {
            const mesh = this.createTaurenMesh(COLORS.PLAYER_FUR, false);
            this.scene.add(mesh);
            this.playerMeshes[p.id] = mesh;
        }
        const mesh = this.playerMeshes[p.id];
        mesh.userData.isMoving = p.isMoving; 
        mesh.position.lerp(new THREE.Vector3(p.position.x, p.position.y, p.position.z), 0.3);
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, p.rotation, 0));
        mesh.quaternion.slerp(q, 0.3);
    });

    Object.keys(this.playerMeshes).forEach(id => {
        if (!players[id]) {
            const mesh = this.playerMeshes[id];
            this.scene.remove(mesh);
            this.animatedMeshes = this.animatedMeshes.filter(m => m !== mesh);
            delete this.playerMeshes[id];
        }
    });

    // Enhanced Enemy Sync
    Object.values(enemies).forEach((e: any) => {
        // Fix for respawn type mismatch
        if (this.enemyMeshes[e.id]) {
            const existing = this.enemyMeshes[e.id];
            if (existing.userData.creatureType !== e.type) {
                this.scene.remove(existing);
                this.animatedMeshes = this.animatedMeshes.filter(m => m !== existing);
                delete this.enemyMeshes[e.id];
            }
        }

        if (!this.enemyMeshes[e.id]) {
            let mesh;
            if (e.type === 'kodo') mesh = this.createKodoMesh();
            else if (e.type === 'wolf') mesh = this.createWolfMesh();
            else mesh = this.createBoarMesh();
            
            this.scene.add(mesh);
            this.enemyMeshes[e.id] = mesh;
            mesh.userData.id = e.id; 
            mesh.userData.type = 'enemy';
            mesh.userData.creatureType = e.type; // Store specific type for comparison
        }
        
        const mesh = this.enemyMeshes[e.id];
        mesh.visible = true;

        // BOSS SCALE
        if (e.isBoss) {
            mesh.scale.setScalar(1.5);
            // Tint boss red
            mesh.traverse((c) => {
                if (c instanceof THREE.Mesh && c.material) {
                    // This is a simple tint hack for demo
                    // In a real app we'd clone material
                    if (!c.userData.isTinted) {
                        c.material = c.material.clone();
                        c.material.color.setHex(COLORS.ENEMY_BOSS);
                        c.userData.isTinted = true;
                    }
                }
            });
        }

        if (e.isDead) {
            // Corpse State
            mesh.userData.isMoving = false;
            // Lay on side
            mesh.rotation.z = Math.PI / 2; 
            mesh.rotation.y = e.rotation;
        } else {
            // Alive State
            mesh.rotation.z = 0;
            mesh.rotation.x = 0;
            
            // Interpolate position
            mesh.position.lerp(new THREE.Vector3(e.position.x, e.position.y, e.position.z), 0.1);
            
            // Update Y rotation (facing)
            if (Math.abs(e.rotation - mesh.rotation.y) > 0.1) {
                mesh.rotation.y = e.rotation;
            }
        }
    });

    if (npcs) {
        Object.values(npcs).forEach((npc: any) => {
            if (!this.npcMeshes[npc.id]) {
                const mesh = this.createTaurenMesh(COLORS.NPC_FUR, false);
                mesh.position.set(npc.position.x, npc.position.y, npc.position.z);
                mesh.rotation.y = npc.rotation;
                mesh.userData.id = npc.id;
                mesh.userData.type = 'npc';
                
                const markerGeo = new THREE.OctahedronGeometry(0.3);
                const markerMat = new THREE.MeshBasicMaterial({ color: COLORS.QUEST_MARKER });
                const marker = new THREE.Mesh(markerGeo, markerMat);
                marker.position.set(0, 4.5, 0);
                mesh.add(marker);
                mesh.userData.questMarker = marker;

                this.scene.add(mesh);
                this.npcMeshes[npc.id] = mesh;
                
                const shape = new CANNON.Cylinder(1, 1, 3, 12);
                const body = new CANNON.Body({ mass: 0 });
                body.addShape(shape, new CANNON.Vec3(0, 1.5, 0));
                body.position.copy(mesh.position as any);
                this.physicsWorld.addBody(body);
            }
        });
    }

    if (collectibles) {
        Object.values(collectibles).forEach((c: any) => {
            if (!this.collectibleMeshes[c.id]) {
                const mesh = this.createCollectibleMesh();
                mesh.position.set(c.position.x, c.position.y, c.position.z);
                mesh.userData.id = c.id;
                mesh.userData.type = 'collectible';
                this.scene.add(mesh);
                this.collectibleMeshes[c.id] = mesh;
            }
        });
        
        // Remove
        Object.keys(this.collectibleMeshes).forEach(id => {
            if (!collectibles[id]) {
                this.scene.remove(this.collectibleMeshes[id]);
                delete this.collectibleMeshes[id];
            }
        });
    }
  }

  public castSpell(abilityId: string, targetId: string | null) {
      if (!this.localPlayerMesh) return;
      this.socket.emit('cast_ability', { abilityId, targetId });
  }

  private createSpellEffect(spellId: string, casterMesh: THREE.Group, targetMesh: THREE.Object3D | null) {
      const startPos = casterMesh.position.clone().add(new THREE.Vector3(0, 2.5, 0));
      
      if (spellId === 'fireball') {
          const geometry = new THREE.SphereGeometry(0.4, 8, 8);
          const material = new THREE.MeshBasicMaterial({ color: COLORS.SPELL_FIRE });
          const sphere = new THREE.Mesh(geometry, material);
          sphere.position.copy(startPos);
          this.scene.add(sphere);
          
          let targetPos = targetMesh ? targetMesh.position.clone().add(new THREE.Vector3(0,1.5,0)) : startPos.clone().add(new THREE.Vector3(0,0,20).applyAxisAngle(new THREE.Vector3(0,1,0), casterMesh.rotation.y));
          
          const duration = startPos.distanceTo(targetPos) / 25;
          const startTime = Date.now();
          
          const animate = () => {
              const progress = (Date.now() - startTime) / (duration * 1000);
              
              if (progress >= 1) {
                  this.scene.remove(sphere);
                  this.createImpactEffect(targetPos, COLORS.SPELL_FIRE);
                  return;
              }
              
              sphere.position.lerpVectors(startPos, targetPos, progress);
              requestAnimationFrame(animate);
          };
          animate();

      } else if (spellId === 'earth_shock') {
          let targetPos = targetMesh ? targetMesh.position.clone().add(new THREE.Vector3(0,1.5,0)) : startPos.clone().add(new THREE.Vector3(0,0,10).applyAxisAngle(new THREE.Vector3(0,1,0), casterMesh.rotation.y));
          
          const points = [startPos, targetPos];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const material = new THREE.LineBasicMaterial({ color: COLORS.SPELL_SHOCK, linewidth: 5 });
          const line = new THREE.Line(geometry, material);
          this.scene.add(line);
          
          this.createImpactEffect(targetPos, COLORS.SPELL_SHOCK);
          setTimeout(() => this.scene.remove(line), 200);

      } else if (spellId === 'healing_wave') {
          const count = 30;
          const particles = new THREE.Group();
          const mat = new THREE.MeshBasicMaterial({ color: COLORS.SPELL_HEAL });
          const geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
          
          for(let i=0; i<count; i++) {
              const mesh = new THREE.Mesh(geo, mat);
              const angle = (i / count) * Math.PI * 4;
              mesh.position.set(Math.cos(angle)*1.5, (i/count)*3, Math.sin(angle)*1.5);
              particles.add(mesh);
          }
          particles.position.copy(casterMesh.position);
          this.scene.add(particles);

          const startTime = Date.now();
          const animate = () => {
              const elapsed = Date.now() - startTime;
              if (elapsed > 1000) {
                  this.scene.remove(particles);
                  return;
              }
              particles.rotation.y += 0.1;
              particles.position.y += 0.05;
              requestAnimationFrame(animate);
          }
          animate();
      }
  }

  private createImpactEffect(pos: THREE.Vector3, color: number) {
      const particleCount = 20;
      const geo = new THREE.BufferGeometry();
      const posArray = new Float32Array(particleCount * 3);
      const velArray = [];
      
      for(let i=0; i<particleCount; i++) {
          posArray[i*3] = pos.x;
          posArray[i*3+1] = pos.y;
          posArray[i*3+2] = pos.z;
          
          velArray.push({
              x: (Math.random() - 0.5) * 5,
              y: (Math.random() - 0.5) * 5,
              z: (Math.random() - 0.5) * 5
          });
      }
      geo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      const mat = new THREE.PointsMaterial({ color: color, size: 0.5, transparent: true });
      const points = new THREE.Points(geo, mat);
      this.scene.add(points);
      
      let frame = 0;
      const animate = () => {
          frame++;
          if(frame > 30) {
              this.scene.remove(points);
              return;
          }
          const positions = points.geometry.attributes.position.array as Float32Array;
          for(let i=0; i<particleCount; i++) {
              positions[i*3] += velArray[i].x * 0.1;
              positions[i*3+1] += velArray[i].y * 0.1;
              positions[i*3+2] += velArray[i].z * 0.1;
          }
          points.geometry.attributes.position.needsUpdate = true;
          mat.opacity = 1 - (frame / 30);
          requestAnimationFrame(animate);
      }
      animate();
  }

  private createLevelUpEffect(playerMesh: THREE.Group) {
      const geo = new THREE.CylinderGeometry(2, 2, 20, 16, 1, true);
      const mat = new THREE.MeshBasicMaterial({ 
          color: COLORS.LEVEL_UP, 
          transparent: true, 
          opacity: 0.5, 
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending 
      });
      const pillar = new THREE.Mesh(geo, mat);
      pillar.position.copy(playerMesh.position);
      pillar.position.y += 10;
      this.scene.add(pillar);

      const startTime = Date.now();
      const animate = () => {
          const elapsed = Date.now() - startTime;
          if (elapsed > 2000) {
              this.scene.remove(pillar);
              return;
          }
          const progress = elapsed / 2000;
          pillar.scale.setScalar(1 + progress);
          mat.opacity = 0.5 * (1 - progress);
          requestAnimationFrame(animate);
      }
      animate();
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    switch (e.key.toLowerCase()) {
        case 'w': this.input.w = true; break;
        case 'a': this.input.a = true; break;
        case 's': this.input.s = true; break;
        case 'd': this.input.d = true; break;
        case ' ': this.input.space = true; break;
    }
  }

  private onKeyUp = (e: KeyboardEvent) => {
    switch (e.key.toLowerCase()) {
        case 'w': this.input.w = false; break;
        case 'a': this.input.a = false; break;
        case 's': this.input.s = false; break;
        case 'd': this.input.d = false; break;
        case ' ': this.input.space = false; break;
    }
  }

  private onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { 
          this.mouse.down = true;
          this.mouse.x = e.clientX;
          this.mouse.y = e.clientY;
      }
      
      if (e.button === 0) {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, this.camera);
        
        const targets: THREE.Object3D[] = [];
        Object.values(this.enemyMeshes).forEach(g => {
             g.traverse(c => {
                 if(c instanceof THREE.Mesh) targets.push(c);
             });
        });
        Object.values(this.npcMeshes).forEach(g => {
             g.traverse(c => {
                 if(c instanceof THREE.Mesh) targets.push(c);
             });
        });
        Object.values(this.collectibleMeshes).forEach(g => {
             g.traverse(c => {
                 if(c instanceof THREE.Mesh) targets.push(c);
             });
        });
        
        const intersects = raycaster.intersectObjects(targets);
        
        if (intersects.length > 0) {
            let target = intersects[0].object;
            while(target.parent && !target.userData.id) {
                target = target.parent;
            }
            if (target.userData.id) {
                const type = target.userData.type;
                if (type === 'npc') {
                     if (this.onStateUpdate) this.onStateUpdate({ type: 'npc_interact', id: target.userData.id });
                } else if (type === 'collectible') {
                    // Direct interaction
                    this.socket.emit('collect_item', { itemId: target.userData.id });
                } else {
                     this.socket.emit('select_target', target.userData.id);
                     if (this.onStateUpdate) this.onStateUpdate({ type: 'target_selected', id: target.userData.id });
                }
                return;
            }
        }
        
        if (this.onStateUpdate) this.onStateUpdate({ type: 'target_selected', id: null });
      }
  }

  private onMouseMove = (e: MouseEvent) => {
      if (this.mouse.down) {
          const deltaX = e.clientX - this.mouse.x;
          const deltaY = e.clientY - this.mouse.y;
          
          if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
              this.cameraAngle -= deltaX * 0.005;
              this.cameraPitch += deltaY * 0.005;
              this.cameraPitch = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, this.cameraPitch));
          }
          
          this.mouse.x = e.clientX;
          this.mouse.y = e.clientY;
      }
  }

  private onMouseUp = () => {
      this.mouse.down = false;
  }

  public dispose() {
      window.removeEventListener('resize', this.onResize);
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
      this.renderer.dispose();
  }
}