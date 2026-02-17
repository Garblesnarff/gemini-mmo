import * as THREE from 'three';

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  private angle: number = Math.PI;
  private zoom: number = 18;
  private pitch: number = 0.5;

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

  public update(targetPosition: THREE.Vector3, getTerrainHeight: (x: number, z: number) => number) {
      const target = targetPosition.clone();
      target.y += 2.5;
      
      const camX = target.x + this.zoom * Math.sin(this.angle) * Math.cos(this.pitch);
      const camZ = target.z + this.zoom * Math.cos(this.angle) * Math.cos(this.pitch);
      let camY = target.y + this.zoom * Math.sin(this.pitch);
      
      const terrainH = getTerrainHeight(camX, camZ);
      if (camY < terrainH + 1) camY = terrainH + 1; 
      
      this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.2);
      this.camera.lookAt(target);
  }
}