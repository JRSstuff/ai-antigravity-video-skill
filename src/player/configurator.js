// Character & Outfit Configurator
// Dynamically targets and recolors/retextures shirt, torso, and clothing parts.
import * as THREE from 'three';

export class CharacterConfigurator {
  constructor(character) {
    this.character = character;
    this.shirtMeshes = [];
    this.pantsMeshes = [];
    this.skinMeshes = [];
    this.hairMeshes = [];
    this.cachedMaterials = new Map();

    this.analyzeMeshes();
  }

  /**
   * Traverse character hierarchy to catalog customizable garment and body parts.
   */
  analyzeMeshes() {
    this.shirtMeshes = [];
    this.pantsMeshes = [];
    this.skinMeshes = [];
    this.hairMeshes = [];

    this.character.traverse((child) => {
      if (!child.isMesh) return;

      const mName = (child.name || '').toLowerCase();
      const matName = (child.material?.name || '').toLowerCase();

      // Shirt / Torso detection patterns
      if (
        mName.includes('torso') ||
        mName.includes('shirt') ||
        mName.includes('top') ||
        mName.includes('jacket') ||
        mName.includes('chest') ||
        matName.includes('shirt') ||
        matName.includes('torso')
      ) {
        this.shirtMeshes.push(child);
      }
      // Pants / Lower body detection patterns
      else if (
        mName.includes('leg') ||
        mName.includes('pants') ||
        mName.includes('trouser') ||
        mName.includes('bottom') ||
        matName.includes('pants')
      ) {
        this.pantsMeshes.push(child);
      }
      // Hair / Headgear
      else if (mName.includes('hair') || matName.includes('hair')) {
        this.hairMeshes.push(child);
      }
      // Skin / Face
      else if (
        mName.includes('head') ||
        mName.includes('arm') ||
        mName.includes('hand') ||
        matName.includes('skin')
      ) {
        this.skinMeshes.push(child);
      }
    });

    // If Kenney character where all parts share 'colormap' or lack explicit naming
    if (this.shirtMeshes.length === 0) {
      this.character.traverse((child) => {
        if (child.isMesh && child.name.toLowerCase().includes('torso')) {
          this.shirtMeshes.push(child);
        }
      });
    }
  }

  /**
   * Clone material on mesh to ensure isolated styling without mutating shared palettes.
   */
  ensureClonedMaterial(mesh) {
    if (!this.cachedMaterials.has(mesh)) {
      const originalMat = mesh.material;
      // If it's a multi-material or sharing colormap, create high-quality PBR material
      const newMat = originalMat.clone();
      mesh.material = newMat;
      this.cachedMaterials.set(mesh, newMat);
    }
    return mesh.material;
  }

  /**
   * Dynamically change shirt / upper body garment color.
   * @param {string|THREE.Color} color - Hex code or THREE.Color
   */
  setShirtColor(color) {
    const threeColor = color instanceof THREE.Color ? color : new THREE.Color(color);

    for (const mesh of this.shirtMeshes) {
      const mat = this.ensureClonedMaterial(mesh);
      mat.color.copy(threeColor);

      // If mesh was using colormap texture, decouple diffuse color so tint takes full effect
      if (mat.map && mat.name === 'colormap') {
        mat.map = null; // Clear palette map so solid PBR color displays cleanly
      }
      mat.roughness = 0.65;
      mat.metalness = 0.05;
      mat.needsUpdate = true;
    }
  }

  /**
   * Apply a dynamic procedural pattern texture to the shirt (Stripes, Plaid, Heather).
   * @param {string} patternType - 'stripes' | 'plaid' | 'gradient'
   * @param {string} baseColor - Primary color hex
   * @param {string} accentColor - Secondary pattern color hex
   */
  setShirtPattern(patternType = 'stripes', baseColor = '#2563EB', accentColor = '#FFFFFF') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 512);

    if (patternType === 'stripes') {
      ctx.fillStyle = accentColor;
      for (let x = 0; x < 512; x += 64) {
        ctx.fillRect(x, 0, 24, 512);
      }
    } else if (patternType === 'plaid') {
      ctx.fillStyle = accentColor;
      ctx.globalAlpha = 0.4;
      for (let x = 0; x < 512; x += 48) ctx.fillRect(x, 0, 20, 512);
      for (let y = 0; y < 512; y += 48) ctx.fillRect(0, y, 512, 20);
      ctx.globalAlpha = 1.0;
    } else if (patternType === 'gradient') {
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0, accentColor);
      grad.addColorStop(1, baseColor);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);

    for (const mesh of this.shirtMeshes) {
      const mat = this.ensureClonedMaterial(mesh);
      mat.color.set('#FFFFFF'); // Neutral base so texture colors show accurately
      mat.map = texture;
      mat.needsUpdate = true;
    }
  }

  /**
   * Dynamically change pants / lower body color.
   */
  setPantsColor(color) {
    const threeColor = color instanceof THREE.Color ? color : new THREE.Color(color);
    for (const mesh of this.pantsMeshes) {
      const mat = this.ensureClonedMaterial(mesh);
      mat.color.copy(threeColor);
      if (mat.map && mat.name === 'colormap') mat.map = null;
      mat.roughness = 0.75;
      mat.metalness = 0.02;
      mat.needsUpdate = true;
    }
  }
}
