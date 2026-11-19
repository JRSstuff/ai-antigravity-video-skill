// Main Application Orchestrator for 3D Scene & Animation Player
// Loads rooms, rigs, crossfades skeletal animations, drives timeline, and handles UI.
import * as THREE from 'three';
import { createScene } from './scene.js';
import { AssetLoader } from './loader.js';
import { CharacterConfigurator } from './configurator.js';
import { CharacterAnimator } from './animator.js';
import { HUDController } from './hud.js';
import { TimelineEngine } from './timeline.js';
import { SimpleOrbitController } from './controls.js';

export class App {
  constructor(canvasId = 'webgl-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas with id '${canvasId}' not found.`);
    }

    // 1. Core 3D Scene & Cinematic Camera
    const { scene, camera, renderer, defaultTarget, keyLight } = createScene(this.canvas);
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.defaultTarget = defaultTarget;
    this.keyLight = keyLight;

    // 2. Asset Loader
    this.loader = new AssetLoader('./assets/draco/');

    // 3. Subsystem References
    this.currentRoom = null;
    this.currentCharacter = null;
    this.configurator = null;
    this.animator = null;
    this.timeline = null;
    this.hud = new HUDController(document.body);
    this.orbit = new SimpleOrbitController(this.camera, this.canvas, this.defaultTarget);

    // 4. Timing
    this.clock = new THREE.Clock();

    // Available Assets
    this.rooms = {
      studio: './assets/rooms/studio_room.glb',
      bedroom: './assets/rooms/cozy_bedroom.glb',
    };

    this.characters = {
      quaternius: {
        mesh: './assets/characters/quaternius_body.glb',
        anim: './assets/animations/quaternius_general.glb',
      },
      kenney: {
        mesh: './assets/characters/kenney_character.glb',
        anim: null, // Kenney has embedded animations (idle, walk, jump)
      },
    };

    this.activeRoomKey = 'studio';
    this.activeCharacterKey = 'quaternius';

    // 5. Setup Window Events
    this.initResize();
  }

  /**
   * Initialize and load scene, room, character, and timeline.
   */
  async init(scriptDataUrl = './src/player/script.json') {
    this.hud.setBadge('LOADING 3D ASSETS...');

    // Load initial Room
    await this.setRoom(this.activeRoomKey);

    // Load initial Character
    await this.setCharacter(this.activeCharacterKey);

    // Load Timeline Script
    let script = [];
    try {
      const resp = await fetch(scriptDataUrl);
      script = await resp.json();
    } catch (err) {
      console.warn('Could not load script.json, using fallback timeline:', err);
      script = [
        {
          id: 'step_1',
          duration: 4.5,
          cameraPos: [0, 1.45, 2.7],
          cameraLookAt: [0, 1.38, 0],
          animationClip: 'Idle',
          shirtColor: '#2563EB',
          subtitleText: 'Pure Three.js <span class="hl">Modular 3D Player</span> initialized.',
        },
      ];
    }

    // Initialize Timeline Engine
    this.timeline = new TimelineEngine(
      script,
      this.camera,
      this.animator,
      this.configurator,
      this.hud
    );

    // Initial beat trigger
    this.timeline.applyStep(this.timeline.steps[0], true);
    this.hud.setBadge('READY · TIMELINE PLAYING');

    // Bind UI elements if present
    this.bindUI();

    // Start Animation Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  /**
   * Swap Room Environment dynamically.
   */
  async setRoom(roomKey) {
    const url = this.rooms[roomKey];
    if (!url) return;

    if (this.currentRoom) {
      this.scene.remove(this.currentRoom);
      this.currentRoom = null;
    }

    const { scene: roomScene } = await this.loader.loadRoom(url);
    this.currentRoom = roomScene;
    this.scene.add(this.currentRoom);
    this.activeRoomKey = roomKey;
  }

  /**
   * Swap Character Model dynamically, grounding at y = 0 and applying shadows.
   */
  async setCharacter(characterKey) {
    const charDef = this.characters[characterKey];
    if (!charDef) return;

    if (this.currentCharacter) {
      this.scene.remove(this.currentCharacter);
      this.currentCharacter = null;
    }

    const { character, animations } = await this.loader.loadCharacter(charDef.mesh, charDef.anim);
    this.currentCharacter = character;
    this.scene.add(this.currentCharacter);
    this.activeCharacterKey = characterKey;

    // 1. Initialize Configurator
    this.configurator = new CharacterConfigurator(this.currentCharacter);

    // 2. Initialize Animator with immediate T-pose avoidance
    this.animator = new CharacterAnimator(this.currentCharacter, animations);

    // Rebind to timeline if it exists
    if (this.timeline) {
      this.timeline.animator = this.animator;
      this.timeline.configurator = this.configurator;
      // Re-apply current step so new character matches active shirt color & clip
      const curStep = this.timeline.steps[this.timeline.activeStepIndex];
      if (curStep) {
        this.timeline.activeStepIndex = -1;
        this.timeline.applyStep(curStep, true);
      }
    }
  }

  /**
   * Bind DOM controls (Play, Pause, Scrubber, Dropdowns, Swatches).
   */
  bindUI() {
    const playBtn = document.getElementById('btn-play-toggle');
    const scrub = document.getElementById('timeline-scrub');
    const timeDisplay = document.getElementById('time-display');
    const roomSelect = document.getElementById('select-room');
    const charSelect = document.getElementById('select-char');
    const clipSelect = document.getElementById('select-clip');
    const orbitToggle = document.getElementById('toggle-orbit');

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        const isPlaying = this.timeline.togglePlay();
        playBtn.innerHTML = isPlaying ? '❚❚ PAUSE' : '▶ PLAY';
      });
    }

    if (scrub) {
      scrub.addEventListener('input', (e) => {
        const pct = +e.target.value / 100;
        this.timeline.seek(pct * this.timeline.totalDuration, false);
      });
    }

    if (this.timeline) {
      this.timeline.onProgress = (curr, total, stepIdx) => {
        if (scrub && total > 0) {
          scrub.value = (curr / total) * 100;
        }
        if (timeDisplay) {
          timeDisplay.textContent = `${curr.toFixed(1)}s / ${total.toFixed(1)}s`;
        }
      };
    }

    if (roomSelect) {
      roomSelect.value = this.activeRoomKey;
      roomSelect.addEventListener('change', async (e) => {
        await this.setRoom(e.target.value);
      });
    }

    if (charSelect) {
      charSelect.value = this.activeCharacterKey;
      charSelect.addEventListener('change', async (e) => {
        await this.setCharacter(e.target.value);
      });
    }

    if (clipSelect) {
      clipSelect.addEventListener('change', (e) => {
        if (this.animator) {
          this.animator.crossfadeTo(e.target.value, 0.3);
        }
      });
    }

    if (orbitToggle) {
      orbitToggle.addEventListener('change', (e) => {
        this.orbit.enabled = e.target.checked;
        if (this.orbit.enabled) {
          this.hud.setBadge('INTERACTIVE ORBIT CAMERA ACTIVE');
        } else {
          this.hud.setBadge('CINEMATIC SCRIPT CAMERA ACTIVE');
        }
      });
    }

    // Shirt Color Swatches
    const swatches = document.querySelectorAll('.color-swatch');
    swatches.forEach((swatch) => {
      swatch.addEventListener('click', () => {
        const color = swatch.getAttribute('data-color');
        if (color && this.configurator) {
          this.configurator.setShirtColor(color);
        }
      });
    });
  }

  /**
   * Handle responsive window resizing.
   */
  initResize() {
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }

  /**
   * Main Render Loop with smooth delta-time updates.
   */
  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(0.1, this.clock.getDelta());
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Advance Skeletal Animation & Secondary Motion
    if (this.animator) {
      this.animator.update(delta, elapsedTime);
    }

    // 2. Advance Timeline Engine & Camera Motion (if orbit not manually taking over)
    if (!this.orbit.enabled && this.timeline) {
      this.timeline.update(delta);
    } else if (this.orbit.enabled) {
      this.orbit.update();
      if (this.timeline) {
        // Still update subtitles & colors even if orbit overrides camera
        this.timeline.currentTime += delta * (this.timeline.isPlaying ? this.timeline.playbackRate : 0);
        if (this.timeline.currentTime >= this.timeline.totalDuration) this.timeline.currentTime = 0;
        const activeStep = this.timeline.findStepAtTime(this.timeline.currentTime);
        if (activeStep && activeStep.index !== this.timeline.activeStepIndex) {
          this.timeline.applyStep(activeStep, false);
        }
      }
    }

    // 3. Render WebGL Frame
    this.renderer.render(this.scene, this.camera);
  }
}

// Auto-boot if loaded in browser
window.addEventListener('DOMContentLoaded', () => {
  const app = new App('webgl-canvas');
  window.app = app;
  app.init().catch((err) => console.error('App init error:', err));
});
