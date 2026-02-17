import * as THREE from 'three';
import { COLORS } from '../../shared/constants';
import { DataLoader } from '../../core/DataLoader';

export const MeshFactory = {
  createTaurenMesh(color: number, isLocal: boolean, animatedMeshes: THREE.Group[]): THREE.Group {
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

      animatedMeshes.push(group);
      group.userData = { isMoving: false };

      return group;
  },

  createEnemyMesh(type: string, isBoss: boolean, animatedMeshes: THREE.Group[]): THREE.Group {
      const def = DataLoader.getEnemyDef(type, isBoss);
      const modelType = def ? def.modelType : 'boar';

      if (modelType === 'wolf') return this.createWolfMesh(animatedMeshes);
      if (modelType === 'kodo') return this.createKodoMesh(animatedMeshes);
      return this.createBoarMesh(animatedMeshes);
  },

  createBoarMesh(animatedMeshes: THREE.Group[]): THREE.Group {
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

      animatedMeshes.push(group);
      group.userData = { isMoving: true };
      
      return group;
  },

  createWolfMesh(animatedMeshes: THREE.Group[]): THREE.Group {
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

      animatedMeshes.push(group);
      group.userData = { isMoving: true };

      return group;
  },

  createKodoMesh(animatedMeshes: THREE.Group[]): THREE.Group {
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

      animatedMeshes.push(group);
      group.userData = { isMoving: true };

      return group;
  },

  createCollectibleMesh(): THREE.Group {
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
};