// Asset Library Loader using GLTFLoader & DRACOLoader
// Loads and standardizes external .glb rooms and characters.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

export class AssetLoader {
  constructor(dracoPath = './assets/draco/') {
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath(dracoPath);

    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);

    this.cache = new Map();
  }

  /**
   * Load any raw glTF/GLB with caching.
   */
  async loadGLTF(url) {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }
    const gltf = await new Promise((resolve, reject) => {
      this.gltfLoader.load(url, resolve, undefined, reject);
    });
    this.cache.set(url, gltf);
    return gltf;
  }

  /**
   * Load Room Environment:
   * - Loads from ./assets/rooms/[ROOM_FILE.glb]
   * - Centers room at (0, 0, 0)
   * - Enforces receiveShadow = true on all meshes
   */
  async loadRoom(roomPath) {
    const gltf = await this.loadGLTF(roomPath);
    const room = gltf.scene.clone(true);
    room.name = 'RoomEnvironment';

    // Compute bounding box to center at (0, 0, 0) and ground floor to y = 0
    const box = new THREE.Box3().setFromObject(room);
    const center = box.getCenter(new THREE.Vector3());
    
    // Shift model so floor is at y = 0 and center is at x = 0, z = 0
    room.position.x = -center.x;
    room.position.z = -center.z;
    room.position.y = -box.min.y;

    room.traverse((child) => {
      if (child.isMesh) {
        child.receiveShadow = true;
        child.castShadow = false; // Rooms primarily receive shadows
        if (child.material) {
          child.material.shadowSide = THREE.FrontSide;
        }
      }
    });

    return {
      scene: room,
      bounds: box,
    };
  }

  /**
   * Load Character Model:
   * - Loads from ./assets/characters/[CHARACTER_FILE.glb]
   * - Grounds model on floor (y = 0)
   * - Enforces castShadow = true & receiveShadow = true
   * - Extracts embedded animations or loads external animation library if empty
   */
  async loadCharacter(characterPath, externalAnimPath = null) {
    const gltf = await this.loadGLTF(characterPath);
    const character = gltf.scene;
    character.name = 'Character';

    // Compute bounding box to place character feet precisely on the floor (y = 0)
    character.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(character);
    const floorY = box.min.y;
    character.position.set(0, -floorY, 0);
    character.updateMatrixWorld(true);

    // Compute grounded character metrics for cinematic auto-framing
    const groundedBox = new THREE.Box3().setFromObject(character);
    const height = groundedBox.max.y - groundedBox.min.y;
    character.userData.height = height;
    character.userData.chestY = height * 0.74; // Upper chest & shoulders
    character.userData.scaleFactor = height / 1.8; // Normalized against standard 1.8m human rig

    // Apply shadow casting to all character meshes
    character.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.frustumCulled = false; // Prevent premature culling on fast camera cuts
      }
    });

    let animations = gltf.animations || [];

    // If character model has no embedded animations, load from companion library
    if ((!animations || animations.length === 0) && externalAnimPath) {
      try {
        const animGLTF = await this.loadGLTF(externalAnimPath);
        animations = animGLTF.animations || [];
      } catch (err) {
        console.warn(`Could not load external animations from ${externalAnimPath}:`, err);
      }
    }

    return {
      character,
      animations,
      gltf,
    };
  }
}
