// Mood World & Set Dressing System (src/core/mood_world.js)
// Transitions lighting, sky, fog, grading, particles, camera feel, and rich multi-layer prop sets.
import * as THREE from 'three';

// Import mood presets
import MOOD_PRESETS from '../../assets/moods.json' with { type: 'json' };

const TAU = Math.PI * 2;

function smoothstep(e0, e1, x) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpColor(c1Hex, c2Hex, t) {
  const c1 = new THREE.Color(c1Hex);
  const c2 = new THREE.Color(c2Hex);
  return '#' + c1.lerp(c2, t).getHexString();
}

export class MoodTimeline {
  constructor(presets = MOOD_PRESETS) {
    this.presets = presets;
    this.cues = [];
  }

  setMood(name, { at = 0, blendTime = 0.8 } = {}) {
    const preset = this.presets[name] || this.presets.calm;
    this.cues.push({ name, at, blendTime, preset });
    this.cues.sort((a, b) => a.at - b.at);
    return this;
  }

  evaluate(t) {
    if (!this.cues.length) {
      return this.presets.calm;
    }

    let kPrev = this.cues[0];
    let kNext = this.cues[0];

    for (let i = 0; i < this.cues.length; i++) {
      if (this.cues[i].at <= t) {
        kPrev = this.cues[i];
        kNext = this.cues[Math.min(i + 1, this.cues.length - 1)];
      }
    }

    let blend = 0;
    if (kNext !== kPrev && t >= kNext.at - kNext.blendTime && t <= kNext.at) {
      blend = smoothstep(kNext.at - kNext.blendTime, kNext.at, t);
    } else if (t >= kNext.at) {
      blend = 1;
    }

    const p1 = kPrev.preset;
    const p2 = kNext.preset;

    // Interpolate light & sky
    const sky = {
      top: lerpColor(p1.sky.top, p2.sky.top, blend),
      horizon: lerpColor(p1.sky.horizon, p2.sky.horizon, blend),
      ground: lerpColor(p1.sky.ground, p2.sky.ground, blend),
    };

    const keyLight = {
      color: lerpColor(p1.keyLight.color, p2.keyLight.color, blend),
      intensity: lerp(p1.keyLight.intensity, p2.keyLight.intensity, blend),
      pos: [
        lerp(p1.keyLight.pos[0], p2.keyLight.pos[0], blend),
        lerp(p1.keyLight.pos[1], p2.keyLight.pos[1], blend),
        lerp(p1.keyLight.pos[2], p2.keyLight.pos[2], blend),
      ],
    };

    const fillLight = {
      color: lerpColor(p1.fillLight.color, p2.fillLight.color, blend),
      intensity: lerp(p1.fillLight.intensity, p2.fillLight.intensity, blend),
    };

    const ambient = {
      color: lerpColor(p1.ambient.color, p2.ambient.color, blend),
      intensity: lerp(p1.ambient.intensity, p2.ambient.intensity, blend),
    };

    const fog = {
      color: lerpColor(p1.fog.color, p2.fog.color, blend),
      near: lerp(p1.fog.near, p2.fog.near, blend),
      far: lerp(p1.fog.far, p2.fog.far, blend),
      density: lerp(p1.fog.density, p2.fog.density, blend),
    };

    const grading = {
      tint: blend < 0.5 ? p1.grading.tint : p2.grading.tint,
      saturation: lerp(p1.grading.saturation, p2.grading.saturation, blend),
      contrast: lerp(p1.grading.contrast, p2.grading.contrast, blend),
      vignette: {
        strength: lerp(p1.grading.vignette.strength, p2.grading.vignette.strength, blend),
        color: blend < 0.5 ? p1.grading.vignette.color : p2.grading.vignette.color,
      },
    };

    const activeP = blend < 0.5 ? p1.particles : p2.particles;
    const activeCam = blend < 0.5 ? p1.camera : p2.camera;

    return {
      mood: blend < 0.5 ? kPrev.name : kNext.name,
      sky,
      keyLight,
      fillLight,
      ambient,
      fog,
      grading,
      particles: activeP,
      camera: activeCam,
      sfxPalette: blend < 0.5 ? p1.sfxPalette : p2.sfxPalette,
    };
  }
}

export const GLOBAL_MOOD = new MoodTimeline();

/**
 * Apply evaluated mood to Three.js scene lights and fog
 */
export function applyMoodToScene(scene, moodState, camPos, t) {
  if (!scene) return;

  // Fog
  if (!scene.fog) {
    scene.fog = new THREE.Fog(moodState.fog.color, moodState.fog.near, moodState.fog.far);
  } else {
    scene.fog.color.set(moodState.fog.color);
    scene.fog.near = moodState.fog.near;
    scene.fog.far = moodState.fog.far;
  }

  // Find or create lights
  let sunLight = scene.getObjectByName('moodKeyLight');
  let hemiLight = scene.getObjectByName('moodHemiLight');

  if (!sunLight) {
    sunLight = new THREE.DirectionalLight(moodState.keyLight.color, moodState.keyLight.intensity);
    sunLight.name = 'moodKeyLight';
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 40;
    const d = 10;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);
  } else {
    sunLight.color.set(moodState.keyLight.color);
    sunLight.intensity = moodState.keyLight.intensity;
  }
  sunLight.position.set(...moodState.keyLight.pos);

  if (!hemiLight) {
    hemiLight = new THREE.HemisphereLight(moodState.sky.top, moodState.sky.ground, moodState.ambient.intensity);
    hemiLight.name = 'moodHemiLight';
    scene.add(hemiLight);
  } else {
    hemiLight.color.set(moodState.sky.top);
    hemiLight.groundColor.set(moodState.sky.ground);
    hemiLight.intensity = moodState.ambient.intensity;
  }
}

/**
 * Compute camera feel offset (shake, drift, bounce, creep)
 */
export function getCameraFeelOffset(moodState, t) {
  const feel = moodState.camera.feel || 'drift';
  const amp = moodState.camera.amp || 0.02;
  const freq = moodState.camera.freq || 2.0;

  if (feel === 'shake') {
    return {
      x: Math.sin(t * freq * 17) * amp,
      y: Math.cos(t * freq * 23) * amp * 0.7,
      z: Math.sin(t * freq * 13) * amp * 0.5,
    };
  } else if (feel === 'bouncy') {
    return {
      x: Math.sin(t * freq * 0.5) * amp * 0.5,
      y: Math.abs(Math.sin(t * freq * 2.0)) * amp,
      z: 0,
    };
  } else if (feel === 'creep') {
    return {
      x: Math.sin(t * freq) * amp * 0.4,
      y: 0,
      z: -(t * 0.03 % 0.15),
    };
  } else if (feel === 'drift') {
    return {
      x: Math.sin(t * freq * 0.7) * amp,
      y: Math.cos(t * freq * 0.9) * amp * 0.8,
      z: 0,
    };
  }
  return { x: 0, y: 0, z: 0 };
}

/**
 * Draw 2D canvas color grading, vignette, and deterministic atmospheric particles
 */
export function drawMoodGrading(ctx, moodState, W, H, t) {
  ctx.save();

  // 1. Color Grade Wash
  if (moodState.grading.tint) {
    ctx.fillStyle = moodState.grading.tint;
    ctx.fillRect(0, 0, W, H);
  }

  // 2. Vignette
  const vig = moodState.grading.vignette;
  if (vig && vig.strength > 0) {
    const rx = W / 2, ry = H / 2;
    const rMax = Math.hypot(rx, ry);
    const grad = ctx.createRadialGradient(rx, ry, rMax * (1 - vig.strength * 0.7), rx, ry, rMax);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, vig.color || 'rgba(0, 0, 0, 0.75)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // 3. Deterministic Particles
  const p = moodState.particles;
  if (p && p.type && p.type !== 'none') {
    const count = p.count || 40;
    const speed = p.speed || 1.0;
    const col = p.color || '#FFFFFF';
    const sz = p.size || 5;

    ctx.fillStyle = col;
    ctx.strokeStyle = col;

    for (let i = 0; i < count; i++) {
      // Deterministic PRNG seed per particle
      const seed = i * 137.5 + 42;
      const rx = (Math.sin(seed * 12.9898) * 43758.5453) % 1;
      const posX = ((rx < 0 ? rx + 1 : rx) * W);
      const phase = (i * 0.37) % 1.0;

      if (p.type === 'rain') {
        // Falling rain streaks
        const y = ((t * speed * 350 + phase * H) % (H + 120)) - 60;
        const x = (posX + y * 0.15) % W;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 12, y + 34);
        ctx.stroke();
      } else if (p.type === 'embers') {
        // Rising orange/red embers
        const y = H - (((t * speed * 120 + phase * H) % (H + 80)) - 40);
        const sway = Math.sin(t * 3.5 + i) * 22;
        const x = (posX + sway + W) % W;
        ctx.globalAlpha = 0.7 + Math.sin(t * 12 + i) * 0.3;
        ctx.beginPath();
        ctx.arc(x, y, sz * (0.6 + (i % 3) * 0.3), 0, TAU);
        ctx.fill();
      } else if (p.type === 'sparkles') {
        // Twinkling golden sparkles
        const y = ((t * speed * 45 + phase * H) % H);
        const sway = Math.sin(t * 2.0 + i * 2) * 16;
        const x = (posX + sway + W) % W;
        const twinkle = Math.max(0, Math.sin(t * 6 + i * 4));
        ctx.globalAlpha = twinkle * 0.85;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * 2 + i);
        ctx.beginPath();
        ctx.moveTo(0, -sz * 1.5);
        ctx.lineTo(sz * 0.4, 0);
        ctx.lineTo(sz * 1.5, 0);
        ctx.lineTo(sz * 0.4, sz * 0.4);
        ctx.lineTo(0, sz * 1.5);
        ctx.lineTo(-sz * 0.4, sz * 0.4);
        ctx.lineTo(-sz * 1.5, 0);
        ctx.lineTo(-sz * 0.4, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'leaves') {
        // Floating swaying leaves
        const y = ((t * speed * 55 + phase * H) % (H + 50));
        const sway = Math.sin(t * 1.8 + i) * 35;
        const x = (posX + sway + W) % W;
        ctx.globalAlpha = 0.75;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.sin(t * 2.5 + i) * 0.8);
        ctx.beginPath();
        ctx.ellipse(0, 0, sz * 1.6, sz * 0.8, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'dust') {
        // Floating dust motes
        const y = ((phase * H + Math.sin(t * 0.8 + i) * 30 + H) % H);
        const x = (posX + Math.cos(t * 0.6 + i) * 25 + W) % W;
        ctx.globalAlpha = 0.35 + Math.sin(t * 1.5 + i) * 0.2;
        ctx.beginPath();
        ctx.arc(x, y, sz * 0.7, 0, TAU);
        ctx.fill();
      } else if (p.type === 'confetti') {
        // Tumbling cartoon confetti
        const y = ((t * speed * 180 + phase * H) % (H + 60)) - 30;
        const sway = Math.sin(t * 4.0 + i) * 25;
        const x = (posX + sway + W) % W;
        ctx.globalAlpha = 0.85;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * 6 + i);
        ctx.fillRect(-sz, -sz * 0.5, sz * 2, sz);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ── Rich Multi-Layer Set Dressing System (15-25 Props per Scene) ─────────────
const matStd = (col, r = 0.8) => new THREE.MeshStandardMaterial({ color: col, roughness: r, metalness: 0.1 });
const boxMesh = (w, h, d, col, x, y, z) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matStd(col));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
};
const cylMesh = (r, h, col, x, y, z) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 16), matStd(col));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
};

/**
 * Dress Bedroom Set (22 Props across foreground, midground, background)
 */
export function dressBedroom(scene) {
  const g = new THREE.Group();
  g.name = 'bedroomDressing';

  // 1. Bed & Bedding (Midground / Left)
  g.add(boxMesh(2.2, 0.45, 2.6, '#334155', -2.4, 0.22, -2.4)); // Bed frame
  g.add(boxMesh(2.0, 0.25, 2.4, '#1E293B', -2.4, 0.55, -2.4)); // Mattress
  g.add(boxMesh(2.05, 0.28, 1.6, '#2563EB', -2.4, 0.65, -1.9)); // Blue crumpled blanket
  g.add(boxMesh(0.7, 0.15, 0.45, '#F8FAFC', -2.4, 0.72, -3.2)); // Pillow

  // 2. Bedside Table & Lamp
  g.add(boxMesh(0.65, 0.65, 0.65, '#475569', -3.2, 0.32, -3.3)); // Nightstand
  g.add(cylMesh(0.04, 0.35, '#94A3B8', -3.2, 0.82, -3.3)); // Lamp pole
  g.add(cylMesh(0.18, 0.22, '#FDE047', -3.2, 1.05, -3.3)); // Lampshade

  // 3. Desk Area Props (Foreground & Midground)
  g.add(boxMesh(0.35, 0.22, 0.05, '#020617', 0.45, 0.95, -2.2)); // Laptop screen
  g.add(boxMesh(0.35, 0.02, 0.25, '#1E293B', 0.45, 0.85, -2.1)); // Laptop keyboard
  g.add(cylMesh(0.06, 0.12, '#F1F5F9', -0.65, 0.92, -2.0)); // Coffee mug
  g.add(boxMesh(0.2, 0.08, 0.06, '#EF4444', 0.75, 0.9, -1.9)); // Digital alarm clock (2:00 AM)

  // 4. Clutter & Floor Details
  g.add(boxMesh(0.3, 0.04, 0.22, '#CBD5E1', 0.2, 0.02, -1.3)); // Scattered notebook
  g.add(cylMesh(0.18, 0.35, '#64748B', 1.6, 0.18, -1.9)); // Trash can
  g.add(boxMesh(0.12, 0.1, 0.1, '#F87171', 1.6, 0.38, -1.9)); // Crumpled paper ball
  g.add(boxMesh(1.8, 0.02, 1.4, '#1E1B4B', 0, 0.01, -1.8)); // Area rug under desk

  // 5. Bookshelf & Wall Window (Background Layer)
  g.add(boxMesh(0.9, 2.2, 0.4, '#334155', 2.6, 1.1, -3.2)); // Bookshelf
  g.add(boxMesh(0.8, 0.18, 0.3, '#E2E8F0', 2.6, 0.7, -3.2)); // Books row 1
  g.add(boxMesh(0.8, 0.18, 0.3, '#F59E0B', 2.6, 1.3, -3.2)); // Books row 2
  g.add(boxMesh(1.4, 1.6, 0.06, '#0F172A', 0, 2.5, -3.45)); // Window frame
  g.add(boxMesh(1.2, 1.4, 0.02, '#1E293B', 0, 2.5, -3.43)); // Window glass pane
  g.add(boxMesh(0.2, 1.8, 0.08, '#3B82F6', -0.75, 2.4, -3.4)); // Left Curtain
  g.add(boxMesh(0.2, 1.8, 0.08, '#3B82F6', 0.75, 2.4, -3.4)); // Right Curtain

  // 6. Wall Art / Posters
  g.add(boxMesh(0.65, 0.85, 0.02, '#E11D48', -1.5, 2.4, -3.45)); // Poster 1
  g.add(boxMesh(0.55, 0.75, 0.02, '#10B981', 1.6, 2.5, -3.45)); // Poster 2
  g.add(cylMesh(0.22, 0.04, '#F8FAFC', -2.5, 2.6, -3.45)); // Wall Clock

  scene.add(g);
  return g;
}

/**
 * Dress Cafe / Sidewalk Set (22 Props across foreground, midground, background)
 */
export function dressCafe(scene) {
  const g = new THREE.Group();
  g.name = 'cafeDressing';

  // 1. Bistro Table & Chairs (Foreground / Midground)
  g.add(cylMesh(0.55, 0.05, '#94A3B8', 0, 0.75, -3.5)); // Table top
  g.add(cylMesh(0.05, 0.75, '#475569', 0, 0.38, -3.5)); // Table leg
  g.add(cylMesh(0.35, 0.04, '#334155', 0, 0.02, -3.5)); // Table base

  // Tableware details
  g.add(cylMesh(0.06, 0.08, '#F8FAFC', -0.22, 0.82, -3.4)); // Roy's coffee cup
  g.add(cylMesh(0.06, 0.08, '#F8FAFC', 0.22, 0.82, -3.4)); // Ex's coffee cup
  g.add(cylMesh(0.05, 0.12, '#CBD5E1', 0, 0.84, -3.6)); // Sugar jar
  g.add(boxMesh(0.08, 0.1, 0.04, '#E2E8F0', 0.12, 0.83, -3.6)); // Napkin holder

  // Chairs
  g.add(boxMesh(0.45, 0.05, 0.45, '#64748B', -0.8, 0.45, -3.5)); // Chair Roy seat
  g.add(boxMesh(0.45, 0.5, 0.05, '#475569', -0.8, 0.72, -3.72)); // Chair Roy back
  g.add(boxMesh(0.45, 0.05, 0.45, '#64748B', 0.8, 0.45, -3.5)); // Chair Ex seat
  g.add(boxMesh(0.45, 0.5, 0.05, '#475569', 0.8, 0.72, -3.72)); // Chair Ex back

  // 2. Cafe Awning & Planter Box (Midground)
  g.add(boxMesh(3.8, 0.15, 1.2, '#B91C1C', 0, 3.2, -4.6)); // Red striped awning
  g.add(boxMesh(1.4, 0.45, 0.35, '#78350F', -1.8, 0.23, -4.2)); // Wooden planter box
  g.add(boxMesh(1.3, 0.2, 0.25, '#475569', -1.8, 0.45, -4.2)); // Dry/wilted plants
  g.add(boxMesh(0.6, 0.9, 0.05, '#1E293B', 1.8, 0.45, -4.0)); // Chalkboard menu A-frame

  // 3. Street Furniture (Background Layer)
  g.add(cylMesh(0.06, 3.8, '#334155', -2.8, 1.9, -4.4)); // Lamppost pole
  g.add(boxMesh(0.3, 0.4, 0.3, '#FDE047', -2.8, 3.8, -4.4)); // Lamp lantern
  g.add(cylMesh(0.14, 0.65, '#EF4444', 2.9, 0.33, -4.2)); // Fire hydrant
  g.add(boxMesh(0.05, 1.4, 0.8, '#3B82F6', -2.5, 0.7, -4.3)); // Parked bicycle frame

  // 4. Street Signs & Architecture Details
  g.add(cylMesh(0.04, 2.8, '#64748B', 2.4, 1.4, -4.8)); // Signpost pole
  g.add(boxMesh(0.7, 0.22, 0.04, '#10B981', 2.4, 2.6, -4.8)); // Street sign "CLOSURE ST"
  g.add(cylMesh(0.35, 0.02, '#475569', 0, 0.01, -2.4)); // Manhole cover in road

  scene.add(g);
  return g;
}

/**
 * Dress Meadow / Park Set (25 Props across foreground, midground, background)
 */
export function dressMeadow(scene) {
  const g = new THREE.Group();
  g.name = 'meadowDressing';

  // 1. Park Bench & Border (Midground)
  g.add(boxMesh(1.8, 0.08, 0.5, '#92400E', -2.4, 0.45, -4.2)); // Bench seat
  g.add(boxMesh(1.8, 0.45, 0.06, '#78350F', -2.4, 0.72, -4.45)); // Bench back
  g.add(boxMesh(0.1, 0.45, 0.5, '#1E293B', -3.2, 0.23, -4.2)); // Bench leg L
  g.add(boxMesh(0.1, 0.45, 0.5, '#1E293B', -1.6, 0.23, -4.2)); // Bench leg R

  // 2. Low Stone Wall & Signpost
  g.add(boxMesh(5.5, 0.4, 0.35, '#94A3B8', 0, 0.2, -6.5)); // Low stone wall
  g.add(cylMesh(0.05, 2.6, '#78350F', 2.2, 1.3, -4.5)); // Wooden signpost
  g.add(boxMesh(0.85, 0.2, 0.04, '#059669', 2.2, 2.2, -4.5)); // "SELF-RESPECT ->"
  g.add(boxMesh(0.75, 0.18, 0.04, '#3B82F6', 2.2, 1.8, -4.5)); // "<- NEW BEGINNING"

  // 3. Flower Patches & Shrubs (Foreground & Midground)
  const flowerCols = ['#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#10B981', '#FBBF24'];
  for (let i = 0; i < 12; i++) {
    const fx = -3.5 + (i * 0.65) + (i % 2 === 0 ? 0.2 : -0.2);
    const fz = -2.8 - (i % 3) * 0.7;
    const col = flowerCols[i % flowerCols.length];
    g.add(cylMesh(0.02, 0.25, '#15803D', fx, 0.12, fz)); // Stem
    g.add(cylMesh(0.08, 0.03, col, fx, 0.26, fz)); // Flower bloom
  }

  // 4. Low-Poly Lush Trees (Background Layer)
  const treePositions = [
    [-4.5, -6.0], [-2.8, -7.5], [3.2, -6.5], [4.8, -8.0], [0, -8.5]
  ];
  treePositions.forEach(([tx, tz], idx) => {
    const trunkH = 1.4 + (idx % 3) * 0.3;
    g.add(cylMesh(0.18, trunkH, '#78350F', tx, trunkH / 2, tz)); // Trunk
    // Tiered foliage cones
    g.add(new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.6, 7), matStd('#15803D', 0.9)).translateY(trunkH + 0.6).translateX(tx).translateZ(tz));
    g.add(new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.4, 7), matStd('#16A34A', 0.9)).translateY(trunkH + 1.4).translateX(tx).translateZ(tz));
  });

  // 5. Park Lamppost & Bird Bath
  g.add(cylMesh(0.05, 3.4, '#1E293B', -1.5, 1.7, -5.2)); // Park lamp pole
  g.add(boxMesh(0.28, 0.35, 0.28, '#FEF08A', -1.5, 3.4, -5.2)); // Lamp head
  g.add(cylMesh(0.35, 0.12, '#CBD5E1', 1.4, 0.65, -4.8)); // Bird bath bowl
  g.add(cylMesh(0.08, 0.65, '#94A3B8', 1.4, 0.32, -4.8)); // Bird bath pedestal

  scene.add(g);
  return g;
}
