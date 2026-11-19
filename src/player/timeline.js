// JSON-driven Scene Timeline & Script Engine
// Drives camera positioning, animation clip transitions, outfit color changes, and 2D subtitles.
import * as THREE from 'three';

export class TimelineEngine {
  constructor(steps, camera, animator, configurator, hud) {
    this.camera = camera;
    this.animator = animator;
    this.configurator = configurator;
    this.hud = hud;

    this.steps = [];
    this.totalDuration = 0;
    this.currentTime = 0;
    this.isPlaying = true;
    this.playbackRate = 1.0;
    this.activeStepIndex = -1;

    // Smooth camera damping state
    this.currentCameraTarget = new THREE.Vector3(0, 1.38, 0);
    this.targetCameraTarget = new THREE.Vector3(0, 1.38, 0);
    this.targetCameraPos = new THREE.Vector3(0, 1.45, 2.8);

    // Callbacks
    this.onStepChange = null;
    this.onProgress = null;

    this.setSteps(steps);
  }

  /**
   * Parse and calculate step time boundaries.
   */
  setSteps(steps) {
    this.steps = [];
    let accTime = 0;

    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      const dur = Math.max(0.5, s.duration || 3.0);
      const stepObj = {
        index: i,
        id: s.id || `step_${i}`,
        duration: dur,
        startTime: accTime,
        endTime: accTime + dur,
        cameraPos: new THREE.Vector3(...(s.cameraPos || [0, 1.45, 2.8])),
        cameraLookAt: new THREE.Vector3(...(s.cameraLookAt || [0, 1.38, 0])),
        animationClip: s.animationClip || 'Idle',
        shirtColor: s.shirtColor || '#2563EB',
        shirtPattern: s.shirtPattern || null,
        subtitleText: s.subtitleText || '',
      };
      this.steps.push(stepObj);
      accTime += dur;
    }

    this.totalDuration = accTime;
    this.currentTime = 0;
    this.activeStepIndex = -1;
  }

  /**
   * Jump timeline to specific time in seconds.
   */
  seek(time, instantCamera = false) {
    this.currentTime = Math.max(0, Math.min(this.totalDuration, time));
    const step = this.findStepAtTime(this.currentTime);
    if (step) {
      this.applyStep(step, instantCamera);
    }
  }

  /**
   * Jump to specific step by index.
   */
  jumpToStep(index) {
    if (index >= 0 && index < this.steps.length) {
      const step = this.steps[index];
      this.seek(step.startTime, false);
    }
  }

  /**
   * Locate active step object for given elapsed timestamp.
   */
  findStepAtTime(t) {
    return (
      this.steps.find((s) => t >= s.startTime && t < s.endTime) ||
      this.steps[this.steps.length - 1]
    );
  }

  /**
   * Apply step parameters (Animation, Shirt Color, Subtitle, Camera Targets).
   */
  applyStep(step, instantCamera = false) {
    if (this.activeStepIndex === step.index && !instantCamera) return;

    this.activeStepIndex = step.index;

    // 1. Crossfade Animation Clip
    if (this.animator && step.animationClip) {
      this.animator.crossfadeTo(step.animationClip, 0.3);
    }

    // 2. Dynamic Outfit Recoloring
    if (this.configurator) {
      if (step.shirtPattern) {
        this.configurator.setShirtPattern(
          step.shirtPattern.type || 'stripes',
          step.shirtPattern.base || step.shirtColor,
          step.shirtPattern.accent || '#FFFFFF'
        );
      } else if (step.shirtColor) {
        this.configurator.setShirtColor(step.shirtColor);
      }
    }

    // 3. 2D Decoupled Subtitle Update
    if (this.hud) {
      this.hud.setSubtitle(step.subtitleText);
      this.hud.setBadge(`BEAT ${step.index + 1}/${this.steps.length} · ${step.animationClip.toUpperCase()}`);
    }

    // 4. Camera targets (Auto-framed to character's upper chest & height)
    const scaleFactor = this.configurator?.character?.userData?.scaleFactor || 1.0;
    const chestY = this.configurator?.character?.userData?.chestY ?? 1.38;

    const scaledTarget = new THREE.Vector3(
      step.cameraLookAt.x,
      chestY,
      step.cameraLookAt.z
    );
    const scaledPos = new THREE.Vector3(
      step.cameraPos.x * Math.max(0.6, scaleFactor),
      chestY + (step.cameraPos.y - 1.38) * Math.max(0.6, scaleFactor),
      step.cameraPos.z * Math.max(0.6, scaleFactor)
    );

    this.targetCameraPos.copy(scaledPos);
    this.targetCameraTarget.copy(scaledTarget);

    if (instantCamera) {
      this.camera.position.copy(scaledPos);
      this.currentCameraTarget.copy(scaledTarget);
      this.camera.lookAt(this.currentCameraTarget);
    }

    if (typeof this.onStepChange === 'function') {
      this.onStepChange(step);
    }
  }

  /**
   * Advance timeline each animation frame.
   * @param {number} delta - Delta time in seconds
   */
  update(delta) {
    if (this.isPlaying && this.totalDuration > 0) {
      this.currentTime += delta * this.playbackRate;

      // Loop timeline seamlessly
      if (this.currentTime >= this.totalDuration) {
        this.currentTime = 0;
      }

      const activeStep = this.findStepAtTime(this.currentTime);
      if (activeStep && activeStep.index !== this.activeStepIndex) {
        this.applyStep(activeStep, false);
      }
    }

    // Smooth cinematic camera damping (no jitter or sudden jumps)
    const dampFactor = Math.min(1.0, delta * 3.8);
    this.camera.position.lerp(this.targetCameraPos, dampFactor);
    this.currentCameraTarget.lerp(this.targetCameraTarget, dampFactor);
    this.camera.lookAt(this.currentCameraTarget);

    if (typeof this.onProgress === 'function') {
      this.onProgress(this.currentTime, this.totalDuration, this.activeStepIndex);
    }
  }

  play() {
    this.isPlaying = true;
  }

  pause() {
    this.isPlaying = false;
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    return this.isPlaying;
  }
}
