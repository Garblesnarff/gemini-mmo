
import * as THREE from 'three';

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  private angle: number = Math.PI;
  private zoom: number = 18;
  private pitch: number = 0.5;

  // Shake State
  private shakeTimeRemaining: number = 0;
  private shakeIntensity: number = 0;
  private initialShakeIntensity: number = 0;
  private shakeTotalDuration: number = 0;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  }

  public resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public applyMouseDelta(deltaX: number, deltaY: number) {
      if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
          this.angle -= deltaX * 0.005;
          this.pitch += deltaY * 0.005;
          this.pitch = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));
      }
  }

  public shakeCamera(intensity: number, duration: number) {
      this.initialShakeIntensity = intensity;
      this.shakeIntensity = intensity;
      this.shakeTimeRemaining = duration;
      this.shakeTotalDuration = duration;
  }

  public update(targetPosition: THREE.Vector3, getTerrainHeight: (x: number, z: number) => number, dt: number) {
      const target = targetPosition.clone();
      target.y += 2.5;
      
      const camX = target.x + this.zoom * Math.sin(this.angle) * Math.cos(this.pitch);
      const camZ = target.z + this.zoom * Math.cos(this.angle) * Math.cos(this.pitch);
      let camY = target.y + this.zoom * Math.sin(this.pitch);
      
      const terrainH = getTerrainHeight(camX, camZ);
      if (camY < terrainH + 1) camY = terrainH + 1; 
      
      const finalPos = new THREE.Vector3(camX, camY, camZ);

      // Apply Shake
      let offsetX = 0;
      let offsetY = 0;
      
      if (this.shakeTimeRemaining > 0) {
          this.shakeTimeRemaining -= dt * 1000;
          if (this.shakeTimeRemaining < 0) this.shakeTimeRemaining = 0;

         const ratio = this.shakeTimeRemaining / (this.shakeTotalDuration || 1);
         const currentIntensity = this.initialShakeIntensity * ratio;

         offsetX = (Math.random() - 0.5) * 2 * currentIntensity;
         offsetY = (Math.random() - 0.5) * 2 * currentIntensity;
      }
      
      // Interpolate base camera position first
      const basePos = new THREE.Vector3().copy(this.camera.position).lerp(finalPos, 0.2);
      
      this.camera.position.set(
          basePos.x + offsetX,
          basePos.y + offsetY,
          basePos.z + offsetX
      );

      this.camera.lookAt(target);
  }
}
        