// Skeletal Animation Mixer, Semantic Crossfader, and Secondary Motion Controller
// Handles glTF animations, smooth crossfading, morph blendshapes, and alive secondary motion.
import * as THREE from 'three';

export class CharacterAnimator {
  constructor(character, animations = []) {
    this.character = character;
    this.mixer = new THREE.AnimationMixer(character);
    this.actions = new Map();
    this.currentAction = null;
    this.currentClipName = '';

    // Dialogue and secondary motion state
    this.isDialogueActive = false;
    this.dialogueIntensity = 1.0;
    this.lastBlinkTime = 0;
    this.blinkDuration = 0.14;
    this.nextBlinkInterval = 2.5 + Math.random() * 2.0;

    // Detect bones for procedural alive motion
    this.spineBone = null;
    this.headBone = null;
    this.morphMeshes = [];
    this.faceEyesMesh = null;
    this.faceMouthMesh = null;

    this.initSkeletonAndFaces();
    this.registerAnimations(animations);
    this.startDefaultPose();
  }

  /**
   * Find skeletal bones and facial mesh/morph targets.
   */
  initSkeletonAndFaces() {
    this.character.traverse((child) => {
      const name = (child.name || '').toLowerCase();

      // Bones
      if (child.isBone) {
        if (!this.headBone && (name.includes('head') || name.includes('neck'))) {
          this.headBone = child;
        } else if (!this.spineBone && (name.includes('spine') || name.includes('chest') || name.includes('torso'))) {
          this.spineBone = child;
        }
      }

      // Blendshapes / Morph targets
      if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
        this.morphMeshes.push(child);
      }

      // Quaternius segmented face mesh fallback
      if (child.isMesh) {
        if (name.includes('face_eyes')) this.faceEyesMesh = child;
        if (name.includes('face_mouth')) this.faceMouthMesh = child;
      }
    });
  }

  /**
   * Register glTF clips into AnimationMixer with semantic aliases (Idle, Talk, Gesture).
   */
  registerAnimations(animations) {
    if (!animations || animations.length === 0) return;

    for (const clip of animations) {
      const action = this.mixer.clipAction(clip);
      this.actions.set(clip.name, action);
      this.actions.set(clip.name.toLowerCase(), action);
    }

    // Map semantic standard names if not explicitly defined
    const clipNames = animations.map((a) => a.name);

    // 1. Idle mapping
    const idleMatch = clipNames.find((n) => /idle/i.test(n)) || clipNames[0];
    if (idleMatch) {
      this.actions.set('Idle', this.actions.get(idleMatch));
      this.actions.set('idle', this.actions.get(idleMatch));
    }

    // 2. Talk / Talking mapping
    const talkMatch =
      clipNames.find((n) => /talk|interact|dialogue/i.test(n)) ||
      clipNames.find((n) => /idle_b|gesture/i.test(n)) ||
      idleMatch;
    if (talkMatch) {
      this.actions.set('Talk', this.actions.get(talkMatch));
      this.actions.set('talk', this.actions.get(talkMatch));
    }

    // 3. Gesture / Action mapping
    const gestureMatch =
      clipNames.find((n) => /item|use|throw|pickup|wave|cheer|dance/i.test(n)) ||
      talkMatch;
    if (gestureMatch) {
      this.actions.set('Gesture', this.actions.get(gestureMatch));
      this.actions.set('gesture', this.actions.get(gestureMatch));
    }

    // 4. Walk mapping
    const walkMatch = clipNames.find((n) => /walk/i.test(n));
    if (walkMatch) {
      this.actions.set('Walk', this.actions.get(walkMatch));
      this.actions.set('walk', this.actions.get(walkMatch));
    }
  }

  /**
   * Immediately start Idle pose to ensure ZERO T-POSES on startup.
   */
  startDefaultPose() {
    const defaultAction = this.actions.get('Idle') || this.actions.values().next().value;
    if (defaultAction) {
      this.currentAction = defaultAction;
      this.currentClipName = 'Idle';
      this.currentAction.reset().play();
      this.mixer.update(0.001); // Flush initial pose immediately to skeleton
    }
  }

  /**
   * Smoothly crossfade to target animation clip over crossfadeDuration (default 0.3s).
   * @param {string} clipName - 'Idle' | 'Talk' | 'Gesture' | 'Walk' or raw gltf clip name
   * @param {number} crossfadeDuration - Seconds
   */
  crossfadeTo(clipName, crossfadeDuration = 0.3) {
    if (!clipName) return;
    const nextAction = this.actions.get(clipName) || this.actions.get(clipName.toLowerCase());

    if (!nextAction) {
      console.warn(`[Animator] Animation clip '${clipName}' not found.`);
      return;
    }

    // Set dialogue state based on animation intent
    this.isDialogueActive = /talk/i.test(clipName);

    if (this.currentAction === nextAction) {
      return;
    }

    nextAction.reset();
    nextAction.setEffectiveTimeScale(1);
    nextAction.setEffectiveWeight(1);

    if (this.currentAction) {
      this.currentAction.crossFadeTo(nextAction, crossfadeDuration, true);
    } else {
      nextAction.fadeIn(crossfadeDuration);
    }

    nextAction.play();
    this.currentAction = nextAction;
    this.currentClipName = clipName;
  }

  /**
   * Set dialogue active state explicitly (controls mouth blendshape speech sync).
   */
  setDialogueActive(active, intensity = 1.0) {
    this.isDialogueActive = active;
    this.dialogueIntensity = intensity;
  }

  /**
   * Update mixer, facial blendshapes, and secondary organic bone motion.
   * @param {number} delta - Seconds since last frame
   * @param {number} time - Elapsed time in seconds
   */
  update(delta, time) {
    // 1. Advance skeletal animation mixer
    this.mixer.update(delta);

    // 2. Compute Natural Eye Blink (every 2.5 - 4.5 seconds)
    let blinkValue = 0;
    const timeSinceBlink = time - this.lastBlinkTime;
    if (timeSinceBlink > this.nextBlinkInterval) {
      const blinkProgress = (timeSinceBlink - this.nextBlinkInterval) / this.blinkDuration;
      if (blinkProgress <= 1.0) {
        // Fast close, smooth reopen
        blinkValue = Math.sin(blinkProgress * Math.PI);
      } else {
        this.lastBlinkTime = time;
        this.nextBlinkInterval = 2.5 + Math.random() * 2.0;
      }
    }

    // 3. Compute Mouth Dialogue Movement
    let mouthOpenValue = 0;
    if (this.isDialogueActive) {
      // Multi-frequency speech oscillation with organic jitter
      const speechOsc =
        Math.sin(time * 16.0) * 0.5 +
        Math.sin(time * 24.0) * 0.3 +
        Math.sin(time * 9.0) * 0.2;
      mouthOpenValue = Math.max(0, speechOsc) * this.dialogueIntensity;
    }

    // 4. Apply to Morph Target Blendshapes if available
    for (const mesh of this.morphMeshes) {
      const dict = mesh.morphTargetDictionary;
      const influences = mesh.morphTargetInfluences;

      const setMorph = (name, val) => {
        if (dict[name] !== undefined) influences[dict[name]] = val;
      };

      // Blinks
      setMorph('eyeBlinkLeft', blinkValue);
      setMorph('eyeBlinkRight', blinkValue);
      setMorph('blink', blinkValue);
      setMorph('eyesClosed', blinkValue);

      // Mouth
      setMorph('mouthOpen', mouthOpenValue);
      setMorph('jawOpen', mouthOpenValue);
      setMorph('viseme_aa', mouthOpenValue * 0.85);
      setMorph('viseme_O', mouthOpenValue * 0.5);
    }

    // 5. Segmented Face Mesh Fallback (Quaternius facial rig)
    if (this.faceEyesMesh) {
      // Compress vertical eye scale on blink
      this.faceEyesMesh.scale.y = THREE.MathUtils.lerp(1.0, 0.08, blinkValue);
    }
    if (this.faceMouthMesh) {
      if (this.isDialogueActive) {
        this.faceMouthMesh.scale.y = THREE.MathUtils.lerp(1.0, 1.8, mouthOpenValue);
        this.faceMouthMesh.position.y = -mouthOpenValue * 0.012;
      } else {
        this.faceMouthMesh.scale.y = 1.0;
        this.faceMouthMesh.position.y = 0;
      }
    }

    // 6. Secondary Organic Motion on Bones (Breathing & Head Drift)
    // Spine breathing cycle
    if (this.spineBone) {
      const breathCycle = Math.sin(time * 2.2) * 0.015;
      this.spineBone.rotation.x += breathCycle;
    }

    // Head micro-drift and conversational nodding
    if (this.headBone) {
      const headYaw = Math.sin(time * 0.85) * 0.018;
      const headPitch = Math.sin(time * 1.6) * 0.012;
      this.headBone.rotation.y += headYaw;
      this.headBone.rotation.x += headPitch;

      // Conversational micro-nodding when talking
      if (this.isDialogueActive) {
        const talkNod = Math.sin(time * 6.5) * 0.025;
        this.headBone.rotation.x += talkNod;
      }
    }
  }
}
