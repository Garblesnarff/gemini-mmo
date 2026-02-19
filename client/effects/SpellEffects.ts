
import * as THREE from 'three';
import { COLORS } from '../../shared/constants';

function createImpactEffect(scene: THREE.Scene, pos: THREE.Vector3, color: number) {
    const particleCount = 20;
    const geo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    const velArray: {x: number, y: number, z: number}[] = [];
    
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
    scene.add(points);
    
    let frame = 0;
    let rafHandle: number;
    const animate = () => {
        frame++;
        if(frame > 30) {
            scene.remove(points);
            geo.dispose();
            mat.dispose();
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
        rafHandle = requestAnimationFrame(animate);
    }
    rafHandle = requestAnimationFrame(animate);
}

export const SpellEffects = {
  createSpellEffect(scene: THREE.Scene, spellId: string, casterMesh: THREE.Group, targetMesh: THREE.Object3D | null) {
      const startPos = casterMesh.position.clone().add(new THREE.Vector3(0, 2.5, 0));
      
      if (spellId === 'fireball') {
          const geometry = new THREE.SphereGeometry(0.4, 8, 8);
          const material = new THREE.MeshBasicMaterial({ color: COLORS.SPELL_FIRE });
          const sphere = new THREE.Mesh(geometry, material);
          sphere.position.copy(startPos);
          scene.add(sphere);
          
          let targetPos = targetMesh ? targetMesh.position.clone().add(new THREE.Vector3(0,1.5,0)) : startPos.clone().add(new THREE.Vector3(0,0,20).applyAxisAngle(new THREE.Vector3(0,1,0), casterMesh.rotation.y));
          
          const duration = startPos.distanceTo(targetPos) / 25;
          const startTime = Date.now();
          
          let rafHandle: number;
          const animate = () => {
              const progress = (Date.now() - startTime) / (duration * 1000);
              
              if (progress >= 1) {
                  scene.remove(sphere);
                  geometry.dispose();
                  material.dispose();
                  createImpactEffect(scene, targetPos, COLORS.SPELL_FIRE);
                  return;
              }
              
              sphere.position.lerpVectors(startPos, targetPos, progress);
              rafHandle = requestAnimationFrame(animate);
          };
          rafHandle = requestAnimationFrame(animate);

      } else if (spellId === 'earth_shock') {
          let targetPos = targetMesh ? targetMesh.position.clone().add(new THREE.Vector3(0,1.5,0)) : startPos.clone().add(new THREE.Vector3(0,0,10).applyAxisAngle(new THREE.Vector3(0,1,0), casterMesh.rotation.y));
          
          const points = [startPos, targetPos];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const material = new THREE.LineBasicMaterial({ color: COLORS.SPELL_SHOCK, linewidth: 5 });
          const line = new THREE.Line(geometry, material);
          scene.add(line);
          
          createImpactEffect(scene, targetPos, COLORS.SPELL_SHOCK);
          setTimeout(() => {
              scene.remove(line);
              geometry.dispose();
              material.dispose();
          }, 200);

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
          scene.add(particles);

          const startTime = Date.now();
          let rafHandle: number;
          const animate = () => {
              const elapsed = Date.now() - startTime;
              if (elapsed > 1000) {
                  scene.remove(particles);
                  // Dispose shared resources
                  geo.dispose();
                  mat.dispose();
                  return;
              }
              particles.rotation.y += 0.1;
              particles.position.y += 0.05;
              rafHandle = requestAnimationFrame(animate);
          }
          rafHandle = requestAnimationFrame(animate);
      
      } else if (spellId === 'chain_lightning' || spellId === 'chain_lightning_arc') {
          let targetPos = targetMesh ? targetMesh.position.clone().add(new THREE.Vector3(0,1.5,0)) : startPos.clone().add(new THREE.Vector3(0,0,10).applyAxisAngle(new THREE.Vector3(0,1,0), casterMesh.rotation.y));
          
          const isArc = spellId === 'chain_lightning_arc';
          const points = [startPos, targetPos];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const material = new THREE.LineBasicMaterial({ 
              color: COLORS.SPELL_LIGHTNING, 
              linewidth: 5,
              transparent: true,
              opacity: isArc ? 0.5 : 1.0
          });
          const line = new THREE.Line(geometry, material);
          scene.add(line);
          
          createImpactEffect(scene, targetPos, COLORS.SPELL_LIGHTNING);
          setTimeout(() => {
              scene.remove(line);
              geometry.dispose();
              material.dispose();
          }, isArc ? 150 : 200);
      }
  },

  createLevelUpEffect(scene: THREE.Scene, playerMesh: THREE.Group) {
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
      scene.add(pillar);

      const startTime = Date.now();
      let rafHandle: number;
      const animate = () => {
          const elapsed = Date.now() - startTime;
          if (elapsed > 2000) {
              scene.remove(pillar);
              geo.dispose();
              mat.dispose();
              return;
          }
          const progress = elapsed / 2000;
          pillar.scale.setScalar(1 + progress);
          mat.opacity = 0.5 * (1 - progress);
          rafHandle = requestAnimationFrame(animate);
      }
      rafHandle = requestAnimationFrame(animate);
  },

  createImpactEffect
};
