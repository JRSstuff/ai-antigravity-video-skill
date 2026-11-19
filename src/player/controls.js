// Lightweight Camera Orbit & Inspection Controller
// Allows mouse-drag inspection around character while respecting eye-level and chest-framing rules.
import * as THREE from 'three';

export class SimpleOrbitController {
  constructor(camera, domElement, defaultTarget = new THREE.Vector3(0, 1.38, 0)) {
    this.camera = camera;
    this.domElement = domElement;
    this.target = defaultTarget.clone();

    this.enabled = false;
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };

    this.spherical = new THREE.Spherical();
    this.sphericalDelta = new THREE.Spherical();

    this.initEvents();
  }

  initEvents() {
    this.domElement.addEventListener('pointerdown', (e) => {
      if (!this.enabled) return;
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.enabled || !this.isDragging) return;
      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      const rotSpeed = 0.005;
      this.sphericalDelta.theta -= deltaX * rotSpeed;
      this.sphericalDelta.phi -= deltaY * rotSpeed;
      // Clamp phi so camera never flips below ground or straight above head
      this.sphericalDelta.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, this.sphericalDelta.phi));

      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
    });

    this.domElement.addEventListener('wheel', (e) => {
      if (!this.enabled) return;
      const zoomSpeed = 0.0015;
      const offset = this.camera.position.clone().sub(this.target);
      let dist = offset.length() + e.deltaY * zoomSpeed;
      dist = Math.max(1.2, Math.min(6.0, dist));
      offset.setLength(dist);
      this.camera.position.copy(this.target).add(offset);
    });
  }

  update() {
    if (!this.enabled) return;
    const offset = this.camera.position.clone().sub(this.target);
    this.spherical.setFromVector3(offset);

    this.spherical.theta += this.sphericalDelta.theta;
    this.spherical.phi += this.sphericalDelta.phi;
    this.spherical.phi = Math.max(0.2, Math.min(Math.PI / 2 - 0.05, this.spherical.phi));

    offset.setFromSpherical(this.spherical);
    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);

    this.sphericalDelta.set(0, 0, 0);
  }
}
