// src/core/framing.js - Cinematic Auto-Framing System for 9:16 Vertical Video
// Computes camera distances and targets dynamically from character bounding boxes and FOV.
// Enforces shot-size rules (WIDE, MEDIUM, MEDIUM_CU, CLOSE, EXTREME) and screen-space containment.
import * as THREE from 'three';

export const SHOT_SIZES = {
  WIDE: {
    name: 'WIDE',
    heightMultiplier: 2.2, // Full body + lots of surrounding set
    targetYRatio: 0.50,    // Aimed at torso/hips
    pitchDeg: 4,
    maxDuration: Infinity,
    armActionAllowed: true,
  },
  MEDIUM: {
    name: 'MEDIUM',
    heightMultiplier: 1.25, // Full body head-to-toe with 10% headroom & margin
    targetYRatio: 0.52,     // Aimed at center mass (navel/chest)
    pitchDeg: 3,
    maxDuration: Infinity,
    armActionAllowed: true,
  },
  MEDIUM_CU: {
    name: 'MEDIUM_CU',
    heightMultiplier: 0.75, // Waist-up, chest and active arms clearly visible
    targetYRatio: 0.68,     // Aimed at chest
    pitchDeg: 2,
    maxDuration: Infinity,
    armActionAllowed: true,
  },
  CLOSE: {
    name: 'CLOSE',
    heightMultiplier: 0.42, // Head and shoulders ONLY for emotional peaks
    targetYRatio: 0.85,     // Aimed at face / eyes
    pitchDeg: 1,
    maxDuration: 1.5,       // Enforced rule: max 1.5 s
    armActionAllowed: false,
  },
  EXTREME: {
    name: 'EXTREME',
    heightMultiplier: 0.22, // Tight insert on eyes, phone, or hands
    targetYRatio: 0.90,     // Direct face/prop focus
    pitchDeg: 0,
    maxDuration: 1.0,       // Enforced rule: max 1.0 s
    armActionAllowed: false,
  },
};

/**
 * Calculates bounding box and height of a character (works with Toon, Character GLB, or Object3D).
 */
export function getCharacterBounds(charOrGroup) {
  const root = charOrGroup.group || charOrGroup.root || charOrGroup;
  const box = new THREE.Box3();
  
  if (charOrGroup.H && charOrGroup.group) {
    // Toon cut-out with known height H
    const pos = new THREE.Vector3();
    charOrGroup.group.getWorldPosition(pos);
    const h = charOrGroup.H || 1.82;
    const w = (charOrGroup.mesh && charOrGroup.mesh.geometry && charOrGroup.mesh.geometry.parameters)
      ? charOrGroup.mesh.geometry.parameters.width : (h / 2);
    box.min.set(pos.x - w / 2, pos.y, pos.z - 0.2);
    box.max.set(pos.x + w / 2, pos.y + h, pos.z + 0.2);
  } else {
    box.setFromObject(root);
  }

  // Safety fallback if empty
  if (box.isEmpty() || !isFinite(box.min.y) || !isFinite(box.max.y)) {
    const pos = (root.position) ? root.position.clone() : new THREE.Vector3(0, 0, 0);
    box.min.set(pos.x - 0.5, pos.y, pos.z - 0.2);
    box.max.set(pos.x + 0.5, pos.y + 1.8, pos.z + 0.2);
  }

  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  return {
    box,
    size,
    center,
    height: Math.max(1.2, size.y),
    width: Math.max(0.6, size.x),
    baseY: box.min.y,
    topY: box.max.y,
  };
}

/**
 * Auto-fit framing calculator:
 * Given a character or target and a shot size (MEDIUM, WIDE, etc.), computes camera position
 * and lookAt target so the subject is framed with 10% headroom and padding in 9:16 vertical video.
 */
export function computeFraming(shotType = 'MEDIUM', charOrGroup, cameraObj, options = {}) {
  const spec = SHOT_SIZES[shotType] || SHOT_SIZES.MEDIUM;
  const fovDeg = (cameraObj && cameraObj.fov) ? cameraObj.fov : 38;
  const fovRad = (fovDeg * Math.PI) / 180;
  const aspect = 9 / 16; // Vertical portrait video
  const bounds = getCharacterBounds(charOrGroup);

  // Target framing height
  const visibleHeight = bounds.height * spec.heightMultiplier;

  // Auto-fit distance from vertical FOV
  const tanHalfFovV = Math.tan(fovRad / 2);
  const tanHalfFovH = aspect * tanHalfFovV;

  // Check both height and width constraints
  const distForHeight = (visibleHeight / 2) / tanHalfFovV;
  const armSpan = bounds.width * (options.hasWideArms ? 1.6 : 1.25);
  const distForWidth = (armSpan / 2) / tanHalfFovH;

  const distance = Math.max(distForHeight, distForWidth) * (options.distanceMultiplier || 1.0);

  // LookAt target position
  const target = new THREE.Vector3();
  const root = charOrGroup.group || charOrGroup.root || charOrGroup;
  root.getWorldPosition(target);

  const targetY = bounds.baseY + bounds.height * spec.targetYRatio + (options.targetYOffset || 0);
  target.y = targetY;
  if (options.targetXOffset) target.x += options.targetXOffset;

  // Camera azimuth & pitch offsets
  const azimuthDeg = options.azimuthDeg || 0; // horizontal angle
  const pitchDeg = options.pitchDeg != null ? options.pitchDeg : spec.pitchDeg;
  const azRad = (azimuthDeg * Math.PI) / 180;
  const pitchRad = (pitchDeg * Math.PI) / 180;

  const camPos = target.clone().add(new THREE.Vector3(
    Math.sin(azRad) * Math.cos(pitchRad) * distance,
    Math.sin(pitchRad) * distance,
    Math.cos(azRad) * Math.cos(pitchRad) * distance
  ));

  return {
    shotType: spec.name,
    distance,
    camPos,
    target,
    spec,
    bounds,
  };
}

/**
 * Shot Sequence Grammar Enforcer
 * Enforces:
 * 1. Default shot is MEDIUM
 * 2. After CLOSE or EXTREME, next shot MUST return to MEDIUM or WIDE
 * 3. No two CLOSE shots in a row
 * 4. CLOSE duration <= 1.5s, EXTREME <= 1.0s
 */
export function validateShotSequence(shots) {
  const errors = [];
  let prevType = null;

  for (let i = 0; i < shots.length; i++) {
    const s = shots[i];
    const type = s.shotType || 'MEDIUM';
    const dur = s.dur || 2.0;

    if ((type === 'CLOSE' || type === 'EXTREME') && (prevType === 'CLOSE' || prevType === 'EXTREME')) {
      errors.push(`Shot ${i} (${s.id}): Illegal consecutive close shots (${prevType} -> ${type}). Rule: After CLOSE, next shot must return to MEDIUM or WIDE.`);
    }

    if (type === 'CLOSE' && dur > 1.55) {
      errors.push(`Shot ${i} (${s.id}): CLOSE shot duration is ${dur.toFixed(2)}s, exceeds maximum 1.5s.`);
    }

    if (type === 'EXTREME' && dur > 1.05) {
      errors.push(`Shot ${i} (${s.id}): EXTREME shot duration is ${dur.toFixed(2)}s, exceeds maximum 1.0s.`);
    }

    prevType = type;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Screen Space Point Projector
 * Projects 3D world points into NDC (-1 to 1) and screen space (0 to 1).
 */
export function projectToScreen(point3D, cameraObj) {
  const v = point3D.clone();
  v.project(cameraObj);
  // NDC: x in [-1, 1], y in [-1, 1], z in [0, 1]
  const screenX = (v.x + 1) / 2;
  const screenY = (1 - v.y) / 2;
  const inFrustum = v.x >= -1.02 && v.x <= 1.02 && v.y >= -1.02 && v.y <= 1.02 && v.z >= 0 && v.z <= 1;

  return {
    ndc: v,
    screenX,
    screenY,
    inFrustum,
  };
}

export const autoFrame = (shotType, charOrGroup, options = {}) => computeFraming(shotType, charOrGroup, null, options);
export const frame = autoFrame;
