// Emotion System: Deterministic f(t) emotion, facial expression, posture, and idle life engine.
// All animations are pure functions of time t with no deltas or state mutation.

export const EMOTION_PRESETS = {
  neutral: {
    face: { browLift: 4, browTilt: 0, eyeOpen: 1.0, pupilScale: 1.0, mouthCorner: 2, mouthWidth: 1.0, blush: 0, sweat: 0, tears: 0 },
    body: { lean: 0, headTilt: 0, shoulderLift: 0, squash: 0, armL: [8, 6], armR: [8, 6] },
    motion: { energy: 1.0, breathRate: 1.8, breathAmp: 1.0, jitter: 0 },
    defaultBeat: null,
  },
  happy: {
    face: { browLift: 10, browTilt: 2, eyeOpen: 0.88, pupilScale: 1.15, mouthCorner: 18, mouthWidth: 1.15, blush: 0.45, sweat: 0, tears: 0 },
    body: { lean: -2, headTilt: 3.5, shoulderLift: 4, squash: 0.03, armL: [18, 15], armR: [18, 15] },
    motion: { energy: 1.35, breathRate: 2.6, breathAmp: 1.2, jitter: 0 },
    defaultBeat: 'laugh_bounce',
  },
  sad: {
    face: { browLift: 12, browTilt: -18, eyeOpen: 0.72, pupilScale: 1.2, mouthCorner: -16, mouthWidth: 0.85, blush: 0, sweat: 0, tears: 0.5 },
    body: { lean: 4, headTilt: -5, shoulderLift: -8, squash: -0.04, armL: [4, 4], armR: [4, 4] },
    motion: { energy: 0.6, breathRate: 1.4, breathAmp: 1.4, jitter: 0 },
    defaultBeat: 'shoulder_drop',
  },
  angry: {
    face: { browLift: -12, browTilt: 24, eyeOpen: 1.1, pupilScale: 0.85, mouthCorner: -10, mouthWidth: 1.2, blush: 0.35, sweat: 0.25, tears: 0 },
    body: { lean: -4, headTilt: -2, shoulderLift: 10, squash: -0.02, armL: [22, 28], armR: [22, 28] },
    motion: { energy: 1.4, breathRate: 3.2, breathAmp: 1.6, jitter: 0.035 },
    defaultBeat: 'fist_clench',
  },
  shocked: {
    face: { browLift: 26, browTilt: 0, eyeOpen: 1.45, pupilScale: 0.55, mouthCorner: -6, mouthWidth: 0.9, blush: 0, sweat: 0.7, tears: 0 },
    body: { lean: 6, headTilt: 1, shoulderLift: 14, squash: 0.06, armL: [28, 30], armR: [28, 30] },
    motion: { energy: 0.4, breathRate: 4.0, breathAmp: 0.6, jitter: 0.045 },
    defaultBeat: 'flinch',
  },
  anxious: {
    face: { browLift: 14, browTilt: -16, eyeOpen: 1.22, pupilScale: 0.9, mouthCorner: -12, mouthWidth: 0.95, blush: 0, sweat: 0.85, tears: 0 },
    body: { lean: 3, headTilt: 4, shoulderLift: 12, squash: -0.03, armL: [15, 20], armR: [15, 20] },
    motion: { energy: 1.8, breathRate: 3.6, breathAmp: 1.3, jitter: 0.06 },
    defaultBeat: 'gasp',
  },
  relieved: {
    face: { browLift: 6, browTilt: -4, eyeOpen: 0.85, pupilScale: 1.05, mouthCorner: 12, mouthWidth: 1.05, blush: 0.2, sweat: 0, tears: 0 },
    body: { lean: 1, headTilt: -3, shoulderLift: -10, squash: -0.05, armL: [10, 8], armR: [10, 8] },
    motion: { energy: 0.8, breathRate: 1.6, breathAmp: 1.5, jitter: 0 },
    defaultBeat: 'sigh',
  },
  smug: {
    face: { browLift: -6, browTilt: 12, eyeOpen: 0.7, pupilScale: 1.0, mouthCorner: 14, mouthWidth: 1.1, blush: 0.1, sweat: 0, tears: 0 },
    body: { lean: -5, headTilt: 6, shoulderLift: 2, squash: 0.02, armL: [12, 10], armR: [12, 10] },
    motion: { energy: 1.05, breathRate: 2.0, breathAmp: 0.9, jitter: 0 },
    defaultBeat: null,
  },
  heartbroken: {
    face: { browLift: 18, browTilt: -26, eyeOpen: 0.68, pupilScale: 1.25, mouthCorner: -22, mouthWidth: 0.8, blush: 0.1, sweat: 0.15, tears: 0.95 },
    body: { lean: 7, headTilt: -7, shoulderLift: -14, squash: -0.07, armL: [2, 2], armR: [2, 2] },
    motion: { energy: 0.45, breathRate: 1.3, breathAmp: 1.7, jitter: 0.02 },
    defaultBeat: 'heartbreak_clench',
  },
  determined: {
    face: { browLift: -8, browTilt: 16, eyeOpen: 1.05, pupilScale: 1.0, mouthCorner: 4, mouthWidth: 1.1, blush: 0, sweat: 0, tears: 0 },
    body: { lean: -3, headTilt: 1, shoulderLift: 6, squash: 0.01, armL: [16, 12], armR: [16, 12] },
    motion: { energy: 1.2, breathRate: 2.2, breathAmp: 1.1, jitter: 0 },
    defaultBeat: 'fist_clench',
  },
};

// Seeded deterministic blinking sequence
function createBlinkSequence(duration = 120, seed = 77) {
  let s = seed;
  const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const seq = [];
  let cur = 1.8 + rand() * 1.5;
  while (cur < duration) {
    seq.push({ at: cur, dur: 0.14 + rand() * 0.05 });
    cur += 2.2 + rand() * 2.5;
  }
  return seq;
}
const DETERMINISTIC_BLINKS = createBlinkSequence(180, 42);

// Physical body beats
export const BODY_BEATS = {
  sigh: (dt, dur = 0.85) => {
    if (dt < 0 || dt > dur) return { lean: 0, bob: 0, shoulderLift: 0, squash: 0 };
    const u = dt / dur;
    if (u < 0.28) {
      const p = u / 0.28;
      return { lean: -2 * p, bob: -12 * p, shoulderLift: 10 * p, squash: 0.04 * p };
    } else {
      const p = (u - 0.28) / 0.72;
      const ease = Math.cos(p * Math.PI * 0.5);
      return { lean: 3 * (1 - ease), bob: 14 * (1 - ease), shoulderLift: -16 * (1 - ease), squash: -0.06 * (1 - ease) };
    }
  },
  flinch: (dt, dur = 0.32) => {
    if (dt < 0 || dt > dur) return { lean: 0, bob: 0, shoulderLift: 0, squash: 0 };
    const u = dt / dur;
    const env = Math.sin(u * Math.PI);
    return { lean: 6 * env, bob: -14 * env, shoulderLift: 16 * env, squash: 0.06 * env };
  },
  fist_clench: (dt, dur = 0.45) => {
    if (dt < 0 || dt > dur) return { lean: 0, bob: 0, shoulderLift: 0, squash: 0 };
    const u = dt / dur;
    const env = Math.sin(u * Math.PI);
    return { lean: -3 * env, bob: 4 * env, shoulderLift: 12 * env, squash: -0.02 * env };
  },
  shoulder_drop: (dt, dur = 0.5) => {
    if (dt < 0 || dt > dur) return { lean: 0, bob: 0, shoulderLift: 0, squash: 0 };
    const u = dt / dur;
    const env = 1 - Math.cos(u * Math.PI);
    return { lean: 4 * (u < 0.5 ? env : 1), bob: 10 * u, shoulderLift: -15 * u, squash: -0.05 * u };
  },
  gasp: (dt, dur = 0.25) => {
    if (dt < 0 || dt > dur) return { lean: 0, bob: 0, shoulderLift: 0, squash: 0 };
    const u = dt / dur;
    const env = Math.sin(u * Math.PI);
    return { lean: -4 * env, bob: -16 * env, shoulderLift: 14 * env, squash: 0.05 * env };
  },
  heartbreak_clench: (dt, dur = 0.7) => {
    if (dt < 0 || dt > dur) return { lean: 0, bob: 0, shoulderLift: 0, squash: 0 };
    const u = dt / dur;
    const env = Math.sin(u * Math.PI);
    const shudder = Math.sin(dt * 36) * 3 * env;
    return { lean: (8 * env) + shudder * 0.2, bob: 18 * env + shudder, shoulderLift: -16 * env, squash: -0.08 * env };
  },
  laugh_bounce: (dt, dur = 0.65) => {
    if (dt < 0 || dt > dur) return { lean: 0, bob: 0, shoulderLift: 0, squash: 0 };
    const u = dt / dur;
    const env = 1 - u;
    const bounce = Math.abs(Math.sin(dt * 18)) * 14 * env;
    return { lean: -2 * env, bob: -bounce, shoulderLift: bounce * 0.4, squash: bounce * 0.003 };
  },
};

/**
 * Register an emotion keyframe for a character.
 */
export function setEmotion(character, emotionName, { at = 0, blendTime = 0.4, intensity = 1.0, beat = null, mood = null } = {}) {
  if (!character) return;
  if (!character.__emotionTrack) {
    character.__emotionTrack = [];
  }
  const preset = EMOTION_PRESETS[emotionName] || EMOTION_PRESETS.neutral;
  character.__emotionTrack.push({
    name: emotionName,
    at,
    blendTime,
    intensity: Math.max(0, Math.min(1, intensity)),
    preset,
    beat: beat || preset.defaultBeat,
    mood,
  });
  // Keep keyframes sorted by time
  character.__emotionTrack.sort((a, b) => a.at - b.at);
}

function smoothstep(e0, e1, x) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Evaluate deterministic emotion parameters at time t.
 */
export function evaluateEmotion(character, t) {
  const track = character && character.__emotionTrack;
  if (!track || track.length === 0) {
    return getDefaultEmotionState(t);
  }

  // Find surrounding keyframes
  let kPrev = track[0];
  let kNext = track[0];

  for (let i = 0; i < track.length; i++) {
    if (track[i].at <= t) {
      kPrev = track[i];
      kNext = track[Math.min(i + 1, track.length - 1)];
    }
  }

  // Calculate blend factor
  let blend = 0;
  let activeKey = kPrev;
  let prevPreset = kPrev.preset;
  let nextPreset = kNext.preset;

  if (kNext !== kPrev && t >= kNext.at - kNext.blendTime && t <= kNext.at) {
    blend = smoothstep(kNext.at - kNext.blendTime, kNext.at, t);
  } else if (t >= kNext.at) {
    activeKey = kNext;
    blend = 1;
  }

  const p1 = prevPreset;
  const p2 = nextPreset;
  const kI = lerp(kPrev.intensity, kNext.intensity, blend);

  // Interpolated facial parameters
  const face = {
    browLift: lerp(p1.face.browLift, p2.face.browLift, blend) * kI,
    browTilt: lerp(p1.face.browTilt, p2.face.browTilt, blend) * kI,
    eyeOpen: lerp(p1.face.eyeOpen, p2.face.eyeOpen, blend),
    pupilScale: lerp(p1.face.pupilScale, p2.face.pupilScale, blend),
    mouthCorner: lerp(p1.face.mouthCorner, p2.face.mouthCorner, blend) * kI,
    mouthWidth: lerp(p1.face.mouthWidth, p2.face.mouthWidth, blend),
    blush: lerp(p1.face.blush, p2.face.blush, blend) * kI,
    sweat: lerp(p1.face.sweat, p2.face.sweat, blend) * kI,
    tears: lerp(p1.face.tears, p2.face.tears, blend) * kI,
  };

  // Interpolated body posture
  const body = {
    lean: lerp(p1.body.lean, p2.body.lean, blend) * kI,
    headTilt: lerp(p1.body.headTilt, p2.body.headTilt, blend) * kI,
    shoulderLift: lerp(p1.body.shoulderLift, p2.body.shoulderLift, blend) * kI,
    squash: lerp(p1.body.squash, p2.body.squash, blend) * kI,
    armL: [
      lerp(p1.body.armL[0], p2.body.armL[0], blend),
      lerp(p1.body.armL[1], p2.body.armL[1], blend),
    ],
    armR: [
      lerp(p1.body.armR[0], p2.body.armR[0], blend),
      lerp(p1.body.armR[1], p2.body.armR[1], blend),
    ],
  };

  // Motion dynamics
  const energy = lerp(p1.motion.energy, p2.motion.energy, blend);
  const breathRate = lerp(p1.motion.breathRate, p2.motion.breathRate, blend);
  const breathAmp = lerp(p1.motion.breathAmp, p2.motion.breathAmp, blend);
  const jitterAmp = lerp(p1.motion.jitter, p2.motion.jitter, blend) * kI;

  // Active body beat
  let beatOffset = { lean: 0, bob: 0, shoulderLift: 0, squash: 0 };
  const currentKey = blend >= 0.5 ? kNext : kPrev;
  if (currentKey.beat && BODY_BEATS[currentKey.beat]) {
    const dt = t - currentKey.at;
    beatOffset = BODY_BEATS[currentKey.beat](dt);
  }

  // Idle Life 1: Breathing (sine wave cycle)
  const breathCycle = Math.sin(t * breathRate * Math.PI);
  const idleBob = breathCycle * 4 * breathAmp;
  const idleSquash = breathCycle * 0.015 * breathAmp;
  const idleShoulder = breathCycle * 2.5 * breathAmp;

  // Idle Life 2: Seeded Deterministic Blinking
  let blink = 0;
  const activeEmotion = currentKey.name;
  if (activeEmotion !== 'shocked') {
    const freqMult = activeEmotion === 'anxious' ? 1.7 : 1.0;
    for (const b of DETERMINISTIC_BLINKS) {
      const at = b.at / freqMult;
      if (t >= at && t <= at + b.dur) {
        const u = (t - at) / b.dur;
        blink = Math.sin(u * Math.PI);
        break;
      }
    }
  }

  // Idle Life 3: Micro head drift and eye darts
  const headDrift = (Math.sin(t * 0.85) * 1.2 + Math.cos(t * 1.4) * 0.8) * (energy * 0.8);
  const pupilDriftX = (Math.sin(t * 1.2) * 0.12 + Math.cos(t * 2.7) * 0.08);
  const pupilDriftY = (Math.cos(t * 1.1) * 0.08);

  // Micro jitter for high anxiety or cold/anger
  const jitterX = jitterAmp > 0 ? (Math.sin(t * 42) * jitterAmp * 8) : 0;
  const jitterY = jitterAmp > 0 ? (Math.cos(t * 37) * jitterAmp * 8) : 0;

  return {
    emotion: activeKey.name,
    intensity: kI,
    browLift: face.browLift,
    browTilt: face.browTilt,
    eyeOpen: face.eyeOpen * (1 - blink * 0.9),
    pupilScale: face.pupilScale,
    pupilOffset: [pupilDriftX + jitterX * 0.1, pupilDriftY + jitterY * 0.1],
    mouthCorner: face.mouthCorner,
    mouthWidth: face.mouthWidth,
    blush: face.blush,
    sweat: face.sweat,
    tears: face.tears,
    blink,
    lean: body.lean + beatOffset.lean + jitterX * 0.2,
    headTilt: body.headTilt + headDrift + jitterX * 0.15,
    shoulderLift: body.shoulderLift + beatOffset.shoulderLift + idleShoulder,
    squash: body.squash + beatOffset.squash + idleSquash,
    bob: idleBob + beatOffset.bob + jitterY * 5,
    armL: body.armL,
    armR: body.armR,
    energy,
  };
}

function getDefaultEmotionState(t) {
  const breathCycle = Math.sin(t * 1.8 * Math.PI);
  return {
    emotion: 'neutral',
    intensity: 1,
    browLift: 4,
    browTilt: 0,
    eyeOpen: 1.0,
    pupilScale: 1.0,
    pupilOffset: [0, 0],
    mouthCorner: 2,
    mouthWidth: 1.0,
    blush: 0,
    sweat: 0,
    tears: 0,
    blink: 0,
    lean: 0,
    headTilt: Math.sin(t * 0.85) * 1.2,
    shoulderLift: breathCycle * 2,
    squash: breathCycle * 0.015,
    bob: breathCycle * 4,
    armL: [8, 6],
    armR: [8, 6],
    energy: 1.0,
  };
}

/**
 * Apply composite emotion + idle state to a character (Toon or 3D GLB).
 */
export function applyEmotion(character, t, overrides = {}) {
  if (!character) return;
  const em = evaluateEmotion(character, t);

  // Map to 2D Toon cut-out state
  if (typeof character.set === 'function') {
    const toonState = {
      mood: em.emotion,
      browLift: em.browLift,
      browTilt: em.browTilt,
      eyeOpen: em.eyeOpen,
      pupilScale: em.pupilScale,
      look: [
        (overrides.look ? overrides.look[0] : 0) + em.pupilOffset[0],
        (overrides.look ? overrides.look[1] : 0) + em.pupilOffset[1],
      ],
      mouthCorner: em.mouthCorner,
      mouthWidth: em.mouthWidth,
      talk: overrides.talk || 0,
      blink: Math.max(em.blink, overrides.blink || 0),
      blush: em.blush,
      sweat: em.sweat,
      tears: em.tears,
      lean: (overrides.lean || 0) + em.lean,
      headTilt: (overrides.headTilt || 0) + em.headTilt,
      shoulderLift: (overrides.shoulderLift || 0) + em.shoulderLift,
      squash: (overrides.squash || 0) + em.squash,
      bob: (overrides.bob || 0) + em.bob,
      armL: overrides.armL || em.armL,
      armR: overrides.armR || em.armR,
      legs: overrides.legs || 'stand',
      phase: overrides.phase !== undefined ? overrides.phase : (t * em.energy * Math.PI * 2),
      holdL: overrides.holdL || null,
      holdR: overrides.holdR || null,
      flip: overrides.flip || false,
    };
    character.set(toonState);
  }

  // If character has 3D meshes with morph targets or bones, apply them too
  if (character.traverse) {
    character.traverse((obj) => {
      if (obj.isMesh && obj.morphTargetDictionary && obj.morphTargetInfluences) {
        const dict = obj.morphTargetDictionary;
        const setMorph = (name, val) => {
          if (dict[name] !== undefined) obj.morphTargetInfluences[dict[name]] = val;
        };
        // Smile / Frown
        if (em.mouthCorner > 0) {
          setMorph('mouthSmile', Math.min(1, em.mouthCorner / 18));
          setMorph('mouthFrown', 0);
        } else {
          setMorph('mouthFrown', Math.min(1, -em.mouthCorner / 20));
          setMorph('mouthSmile', 0);
        }
        // Brows
        if (em.browTilt < 0) {
          setMorph('browInnerUp', Math.min(1, -em.browTilt / 22));
        } else {
          setMorph('browDownLeft', Math.min(1, em.browTilt / 20));
          setMorph('browDownRight', Math.min(1, em.browTilt / 20));
        }
        // Blinks & Talk
        setMorph('eyeBlinkLeft', em.blink);
        setMorph('eyeBlinkRight', em.blink);
        if (overrides.talk) {
          setMorph('jawOpen', overrides.talk);
        }
      }
      // Apply neck/head tilt bone rotation if bone exists
      if (obj.isBone && (obj.name.toLowerCase().includes('head') || obj.name.toLowerCase().includes('neck'))) {
        obj.rotation.z = (em.headTilt * Math.PI) / 180;
      }
    });
  }

  return em;
}
