// Roy's Breakup Rewind: The Complete Shot List (Tall Tale 3D)
// PROBLEM 1 RESOLUTION: Full-body auto-framing system (src/core/framing.js)
// Guaranteed head-to-toe visibility, hand containment, and shot grammar.
import * as THREE from 'three';
import { W, H, ctx, clamp, lerp, seg, eo, eio, eob, TAU, bigText } from './core/lib.js';
import { L, Le, Wd, T, rhubarbTalk } from './core/timing.js';
import { camera } from './core/engine.js';
import * as WD from './core/world.js';
import * as PR from './core/props.js';
import { Toon, PROPS, INK } from './core/toon.js';
import { computeFraming, projectToScreen, validateShotSequence, SHOT_SIZES } from './core/framing.js';
import { setEmotion, evaluateEmotion, applyEmotion, EMOTION_PRESETS } from './core/emotion.js';
import { GLOBAL_MOOD, applyMoodToScene, drawMoodGrading, dressBedroom, dressCafe, dressMeadow, getCameraFeelOffset } from './core/mood_world.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const mix = (a, b, k) => a.clone().lerp(b, k);
const blink = (t, off = 0) => (((t + off) % 3.2) < 0.12 ? 1 : 0);

// Cast configuration
const LOOK = {
  roy: {
    body: '#2563EB', // Blue hoodie
    head: '#FDE047', // Warm cartoon head
    hat: 'beanie',
    hatCol: '#1E293B',
    neck: 'collar',
    neckCol: '#FFFFFF',
    extra: ['freckles'],
  },
  ex: {
    body: '#334155', // Faceless silhouette / neutral tone
    head: '#475569',
    hat: 'bun',
    hatCol: '#1E293B',
    neck: 'scarf',
    neckCol: '#64748B',
    extra: [],
  },
  friendDave: {
    body: '#059669', // Emerald sweater
    head: '#FDE047',
    hat: 'cap',
    hatCol: '#047857',
    neck: 'collar',
    extra: ['mustache'],
  },
  friendSam: {
    body: '#D97706', // Amber flannel
    head: '#FDE047',
    hat: 'none',
    neck: 'bowtie',
    neckCol: '#B45309',
    extra: ['glasses'],
  },
};

const person = (k, opts) => new Toon({ ...LOOK[k], extra: [...(LOOK[k].extra || [])] }, opts);

export function buildShots(E) {
  const S = [], CUES = [], add = (o) => (S.push(o), o);
  const cue = (t, typeOrFn, o = {}) => {
    if (typeof typeOrFn === 'function') { typeOrFn(t); return; }
    CUES.push({ t: +t.toFixed(3), type: typeOrFn, ...o });
  };
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.05);
  const cam = camera(38);

  const shoot = (scene, people, from, to, at, at2, k, look = {}, focus = null) => {
    if (cam.fov !== (look.fov || 38)) { cam.fov = look.fov || 38; cam.updateProjectionMatrix(); }
    cam.position.copy(mix(from, to, k));
    cam.lookAt(at2 ? mix(at, at2, k) : at);
    people.forEach((p) => p && p.face && p.face(cam));
    E.render(scene, cam, {
      bloom: look.bloom ?? 0.2,
      aperture: look.aperture ?? 0.001,
      maxblur: look.maxblur ?? 0.008,
      focus: focus ?? cam.position.distanceTo(at2 ? mix(at, at2, k) : at),
    });
  };

  // Helper for dynamic auto-framing
  const autoFrame = (shotType, charObj, opts = {}) => computeFraming(shotType, charObj, cam, opts);

  // Helper for mood-reactive 3D lighting, camera feel and scene shooting
  function shootMood(scene, people, f0, f1, k, t, opts = {}) {
    const mood = GLOBAL_MOOD.evaluate(t);
    applyMoodToScene(scene, mood, f0.camPos, t);
    const feel = getCameraFeelOffset(mood, t);
    const p0 = f0.camPos.clone().add(feel);
    const p1 = f1.camPos.clone().add(feel);
    shoot(scene, people, p0, p1, f0.target, f1.target, k, opts);
    return mood;
  }

  // ── 3D Sets Setup ────────────────────────────────────────────────────────
  // Set 1: Dark Bedroom / Night Desk (Cold Blue Grade for Attempts 1 & 2)
  const BEDROOM = WD.interior(E, {
    w: 8, depth: 7, h: 4.5,
    wall: '#0F172A', motif: '#1E293B', floor: '#1E293B', ceiling: '#0B0F19',
    signText: null, counterOn: false, picture: false, bulbs: false
  });
  const desk = PR.desk ? PR.desk() : PR.parcel(1.8, 0.75, 0.9);
  desk.position.set(0, 0, -2.1);
  BEDROOM.scene.add(desk);

  const royNight = person('roy');
  BEDROOM.scene.add(royNight.group);
  royNight.at(0, 0, -1.8);

  // Set 2: Street Cafe / Sidewalk (Attempt 2 - Closure Meeting)
  const CAFE = WD.mainStreet(E, { len: 45, dusk: true, people: false, cars: false });
  const royCafe = person('roy');
  const exSilhouette = person('ex');
  CAFE.scene.add(royCafe.group);
  CAFE.scene.add(exSilhouette.group);
  royCafe.at(-0.8, 0.18, -3.5);
  exSilhouette.at(0.8, 0.18, -3.5);

  // Set 3: Warm Park / Morning Pathway (Attempt 3 & Sunrise Walk)
  const MEADOW = WD.meadow(E, { sunset: true, fenceOn: false });
  const royDay = person('roy');
  const dave = person('friendDave');
  const sam = person('friendSam');
  MEADOW.scene.add(royDay.group);
  MEADOW.scene.add(dave.group);
  MEADOW.scene.add(sam.group);
  royDay.at(0, 0, -4);
  dave.at(-0.9, 0, -4.1);
  sam.at(0.9, 0, -4.1);

  // ── Problem 3: Rich Multi-Layer Set Dressing (15-25 Props per scene) ─────
  dressBedroom(BEDROOM.scene);
  dressCafe(CAFE.scene);
  dressMeadow(MEADOW.scene);

  // ── Problem 3: Global Mood Timeline Transitions (0.5 - 1.0s blends) ─────
  GLOBAL_MOOD.cues = [];
  GLOBAL_MOOD.setMood('shocked', { at: cut(0), blendTime: 0.3 });
  GLOBAL_MOOD.setMood('anxious', { at: cut(1), blendTime: 0.4 });
  GLOBAL_MOOD.setMood('comedic', { at: cut(2), blendTime: 0.4 });
  GLOBAL_MOOD.setMood('angry', { at: cut(3), blendTime: 0.35 });
  GLOBAL_MOOD.setMood('shocked', { at: cut(4), blendTime: 0.2 });
  GLOBAL_MOOD.setMood('comedic', { at: cut(5), blendTime: 0.5 });
  GLOBAL_MOOD.setMood('heartbroken', { at: cut(6), blendTime: 0.4 });
  GLOBAL_MOOD.setMood('shocked', { at: cut(7), blendTime: 0.2 });
  GLOBAL_MOOD.setMood('calm', { at: cut(8), blendTime: 0.6 });
  GLOBAL_MOOD.setMood('sad', { at: cut(9), blendTime: 0.5 });
  GLOBAL_MOOD.setMood('healing', { at: cut(10), blendTime: 0.5 });
  GLOBAL_MOOD.setMood('calm', { at: cut(11), blendTime: 0.5 });
  GLOBAL_MOOD.setMood('healing', { at: cut(12), blendTime: 0.4 });
  GLOBAL_MOOD.setMood('joyful', { at: cut(13), blendTime: 0.5 });
  GLOBAL_MOOD.setMood('hopeful', { at: cut(14), blendTime: 0.5 });
  GLOBAL_MOOD.setMood('hopeful', { at: cut(15), blendTime: 0.6 });

  // ── Problem 2 Emotion Engine Setup: Line-Level Emotion Arc ───────────────
  // Set 1: Roy Night (Attempt 1: Panic & Revenge)
  setEmotion(royNight, 'shocked', { at: cut(0), blendTime: 0.3, intensity: 0.95, beat: 'flinch' });
  setEmotion(royNight, 'anxious', { at: cut(1), blendTime: 0.4, intensity: 0.75, beat: 'gasp' });
  setEmotion(royNight, 'anxious', { at: cut(2), blendTime: 0.3, intensity: 0.90, beat: 'fist_clench' });
  setEmotion(royNight, 'angry', { at: cut(3), blendTime: 0.35, intensity: 0.85, beat: 'fist_clench' });
  setEmotion(royNight, 'shocked', { at: cut(4), blendTime: 0.2, intensity: 0.70, beat: 'flinch' });

  // Set 2: Roy Cafe (Attempt 2: Fake Closure & Heartbreak)
  setEmotion(royCafe, 'smug', { at: cut(5), blendTime: 0.4, intensity: 0.80 });
  setEmotion(royCafe, 'heartbroken', { at: cut(6), blendTime: 0.35, intensity: 0.95, beat: 'heartbreak_clench' });
  setEmotion(royCafe, 'shocked', { at: cut(7), blendTime: 0.2, intensity: 0.70, beat: 'flinch' });

  // Set 3: Roy Day (Attempt 3: Healing, Boundaries & Self-Respect)
  setEmotion(royDay, 'determined', { at: cut(8), blendTime: 0.5, intensity: 0.85, beat: 'shoulder_drop' });
  setEmotion(royDay, 'sad', { at: cut(9), blendTime: 0.4, intensity: 0.75, beat: 'sigh' });
  setEmotion(royDay, 'relieved', { at: cut(10), blendTime: 0.4, intensity: 0.80, beat: 'sigh' });
  setEmotion(royDay, 'neutral', { at: cut(11), blendTime: 0.5, intensity: 0.70 });
  setEmotion(royDay, 'determined', { at: cut(12), blendTime: 0.4, intensity: 0.85, beat: 'fist_clench' });
  setEmotion(royDay, 'happy', { at: cut(13), blendTime: 0.4, intensity: 0.90, beat: 'laugh_bounce' });
  setEmotion(royDay, 'determined', { at: cut(14), blendTime: 0.4, intensity: 0.95, beat: 'shoulder_drop' });
  setEmotion(royDay, 'relieved', { at: cut(15), blendTime: 0.5, intensity: 0.90, beat: 'sigh' });

  // Secondary characters
  setEmotion(exSilhouette, 'neutral', { at: 0 });
  setEmotion(dave, 'happy', { at: cut(9), intensity: 0.7 });
  setEmotion(sam, 'happy', { at: cut(9), intensity: 0.7 });

  // ── Helper 2D HUD Drawers ───────────────────────────────────────────────
  function drawSelfRespectHUD(attemptNum, pct, isWarm = false) {
    ctx.save();
    // Attempt Badge
    ctx.fillStyle = isWarm ? '#059669' : '#DC2626';
    ctx.beginPath();
    ctx.roundRect(80, 110, 260, 68, 16);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 32px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`ATTEMPT ${attemptNum}`, 210, 144);

    // Self Respect Bar Container
    const barX = 640, barY = 110, barW = 360, barH = 68;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 16);
    ctx.fill();
    ctx.strokeStyle = isWarm ? '#10B981' : '#64748B';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Fill
    const fillW = Math.max(12, (barW - 16) * clamp(pct, 0, 1));
    ctx.fillStyle = isWarm ? '#10B981' : pct > 0.3 ? '#F59E0B' : '#EF4444';
    ctx.beginPath();
    ctx.roundRect(barX + 8, barY + 8, fillW, barH - 16, 10);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 24px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`SELF-RESPECT: ${Math.round(pct * 100)}%`, barX + barW / 2, barY + 34);
    ctx.restore();
  }

  function drawRewindOverlay(lt, d) {
    ctx.save();
    // VHS glitch scanlines
    ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 3;
    for (let y = 0; y < H; y += 14) {
      if ((y + Math.floor(lt * 120)) % 28 === 0) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
    }

    // Huge REWIND Banner
    const blinkOn = Math.sin(lt * 24) > 0;
    if (blinkOn) {
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 280, H / 2 - 90, 560, 180, 24);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 8;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 76px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('◀◀ REWIND', W / 2, H / 2 - 10);

      ctx.font = '700 30px Inter';
      ctx.fillText('TRYING AGAIN...', W / 2, H / 2 + 45);
    }

    // Spinning backward clock HUD
    const clockAngle = -lt * 18;
    ctx.translate(W / 2, 380);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(0, 0, 75, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.sin(clockAngle) * 45, -Math.cos(clockAngle) * 45);
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.sin(clockAngle * 12) * 60, -Math.cos(clockAngle * 12) * 60);
    ctx.stroke();

    ctx.restore();
  }

  // ── Shot 0 (Line 0: "Six years. Then you find the messages.") ───────────
  // SHOT SIZE: WIDE (Establishing Roy in dark bedroom, phone glow)
  cue(Wd('six', 0), 'shatter');
  cue(Wd('messages', 0), 'alarm');
  add({
    id: 'shot0_hook',
    shotType: 'WIDE',
    character: royNight,
    hasArmAction: true,
    at: cut(0),
    note: 'WIDE establishing night desk, phone lights up, 6 YEARS shatters',
    draw(lt, d, t, blit) {
      const k = lt / d;
      applyEmotion(royNight, t, {
        armL: [25, 20],
        armR: [45, 60], // Hand 1: holding phone
        holdR: PROPS.phone(true),
        talk: rhubarbTalk(t),
        look: [0, -0.4],
      });

      // Auto-fit WIDE framing with subtle camera track & impact shake
      const f0 = autoFrame('WIDE', royNight, { azimuthDeg: -8, targetYOffset: -0.1 });
      const f1 = autoFrame('WIDE', royNight, { azimuthDeg: 0, targetYOffset: 0.05 });
      const shake = lt < 1.1 ? Math.sin(lt * 40) * Math.exp(-lt * 4) * 0.1 : 0;
      f0.camPos.x += shake;

      const mood = shootMood(BEDROOM.scene, [royNight], f0, f1, eo(k), t, { bloom: 0.35 });
      blit();
      drawMoodGrading(ctx, mood, W, H, t);

      // Glass shatter effect overlay: "6 YEARS" explodes into shards
      ctx.save();
      const shatterProgress = seg(lt, 0.35, 1.8);
      const shardCount = 18;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 120px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (shatterProgress < 0.05) {
        ctx.lineWidth = 16;
        ctx.strokeStyle = '#0F172A';
        ctx.strokeText('6 YEARS', W / 2, 600);
        ctx.fillText('6 YEARS', W / 2, 600);
      } else if (shatterProgress < 1.0) {
        for (let i = 0; i < shardCount; i++) {
          const ang = (i / shardCount) * TAU;
          const dist = eo(shatterProgress) * 550;
          const sx = W / 2 + Math.cos(ang) * dist;
          const sy = 600 + Math.sin(ang) * dist + shatterProgress * shatterProgress * 350;
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(shatterProgress * (i % 2 === 0 ? 6 : -6));
          ctx.fillStyle = 'rgba(255, 255, 255, ' + (1 - shatterProgress * 0.8) + ')';
          ctx.strokeStyle = '#0F172A';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(-45, -30);
          ctx.lineTo(50, -15);
          ctx.lineTo(15, 55);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }
      ctx.restore();
    }
  });

  // ── Shot 1 (Line 1: "You're Roy. And you are about to make a choice.") ───
  // SHOT SIZE: MEDIUM (Default head-to-toe full body, choice HUD branches A and B)
  cue(Wd('roy', 1), 'whoosh');
  cue(Wd('choice', 1), 'pop');
  add({
    id: 'shot1_choice',
    shotType: 'MEDIUM',
    character: royNight,
    hasArmAction: true,
    at: cut(1),
    note: 'MEDIUM full body, choice HUD branches A and B',
    draw(lt, d, t, blit) {
      const k = lt / d;
      applyEmotion(royNight, t, {
        armL: [55, 35], // Hand 2: gesturing outward at viewer
        armR: [25, 20],
        holdR: PROPS.phone(true),
        talk: rhubarbTalk(t),
      });

      const f0 = autoFrame('MEDIUM', royNight, { azimuthDeg: 6, hasWideArms: true });
      const f1 = autoFrame('MEDIUM', royNight, { azimuthDeg: -4, hasWideArms: true });

      const mood = shootMood(BEDROOM.scene, [royNight], f0, f1, eio(k), t, { bloom: 0.25 });
      blit();
      drawMoodGrading(ctx, mood, W, H, t);

      ctx.save();
      const popK = eob(seg(lt, 0.8, 1.6));
      ctx.translate(W / 2, 420);
      ctx.scale(popK, popK);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(-420, -100, 840, 200, 24);
      ctx.fill();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.fillStyle = '#EF4444';
      ctx.font = '900 36px Inter';
      ctx.textAlign = 'left';
      ctx.fillText('[A] PANIC & REVENGE', -370, -30);
      ctx.fillStyle = '#10B981';
      ctx.fillText('[B] SELF-RESPECT', -370, 35);
      ctx.restore();
    }
  });

  // ── Shot 2a (Line 2: "Attempt one. You text her forty-seven times...") ─────
  // SHOT SIZE: MEDIUM (Full body panic flail, cascading 47 missed calls)
  cue(Wd('one', 2), 'thud');
  cue(Wd('forty-seven', 2), 'chug');
  add({
    id: 'shot2a_attempt1',
    shotType: 'MEDIUM',
    character: royNight,
    hasArmAction: true,
    at: cut(2),
    note: 'MEDIUM full body: 47 texts cascade, panic flail',
    draw(lt, d, t, blit) {
      const k = lt / d;
      const flailL = 120 + Math.sin(t * 16) * 35;
      const flailR = 120 - Math.sin(t * 16) * 35;
      applyEmotion(royNight, t, {
        armL: [flailL, 25], // Hand 3: panic arm flailing
        armR: [flailR, 25],
        holdR: PROPS.phone(true),
        talk: rhubarbTalk(t),
        sweat: 1,
      });

      const f0 = autoFrame('MEDIUM', royNight, { azimuthDeg: -8, hasWideArms: true });
      const f1 = autoFrame('MEDIUM', royNight, { azimuthDeg: 4, hasWideArms: true });

      const mood = shootMood(BEDROOM.scene, [royNight], f0, f1, eo(k), t, { bloom: 0.28 });
      blit();
      drawMoodGrading(ctx, mood, W, H, t);

      const respectPct = lerp(0.40, 0.22, seg(lt, 0, d));
      drawSelfRespectHUD(1, respectPct, false);

      ctx.save();
      const msgs = ['47 MISSED CALLS', 'PLEASE ANSWER', 'WHY???', 'WHO WAS HE?'];
      msgs.forEach((txt, idx) => {
        const bubbleY = 820 - idx * 95 + Math.sin(t * 8 + idx) * 12;
        const bubbleX = 260 + (idx % 2 === 0 ? 50 : -50);
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.roundRect(bubbleX - 190, bubbleY - 35, 380, 70, 20);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 28px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(txt, bubbleX, bubbleY);
      });
      ctx.restore();
    }
  });

  // ── Shot 2b (Line 2 sub-cut: "...at two a.m.") ──────────────────────────
  // SHOT SIZE: CLOSE (Max 1.5s emotional peak on 2:00 AM clock, 1.27s duration!)
  cue(Wd('two', 2), 'alarm');
  add({
    id: 'shot2b_late_night',
    shotType: 'CLOSE',
    character: royNight,
    hasArmAction: false,
    at: Wd('two', 2),
    note: 'CLOSE emotional peak: 2:00 AM clock, extreme spiral (1.27s <= 1.5s)',
    draw(lt, d, t, blit) {
      const k = lt / d;
      applyEmotion(royNight, t, {
        armL: [70, 30],
        armR: [70, 30],
        talk: rhubarbTalk(t),
        sweat: 1,
      });

      const f0 = autoFrame('CLOSE', royNight, { pitchDeg: 2 });
      const f1 = autoFrame('CLOSE', royNight, { pitchDeg: 0, distanceMultiplier: 0.95 });

      const mood = shootMood(BEDROOM.scene, [royNight], f0, f1, eo(k), t, { bloom: 0.32 });
      blit();
      drawMoodGrading(ctx, mood, W, H, t);

      drawSelfRespectHUD(1, 0.15, false);

      ctx.save();
      ctx.fillStyle = '#EF4444';
      ctx.font = '900 72px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('2:00 AM', W / 2, 540);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 5;
      ctx.strokeText('2:00 AM', W / 2, 540);
      ctx.restore();
    }
  });

  // ── Shot 3a (Line 3: "You post a savage story.") ────────────────────────
  // SHOT SIZE: MEDIUM (Rule: returns to MEDIUM after CLOSE! Full body posting story)
  cue(Wd('savage', 3), 'slam');
  add({
    id: 'shot3a_savage_post',
    shotType: 'MEDIUM',
    character: royNight,
    hasArmAction: true,
    at: cut(3),
    note: 'MEDIUM full body: Savage story posted, social view explosion',
    draw(lt, d, t, blit) {
      const k = lt / d;
      applyEmotion(royNight, t, {
        armL: [30, 30],
        armR: [50, 60],
        holdR: PROPS.phone(true),
        talk: rhubarbTalk(t),
      });

      const f0 = autoFrame('MEDIUM', royNight, { azimuthDeg: -6 });
      const f1 = autoFrame('MEDIUM', royNight, { azimuthDeg: 2 });

      const mood = shootMood(BEDROOM.scene, [royNight], f0, f1, eo(k), t, { bloom: 0.3 });
      blit();
      drawMoodGrading(ctx, mood, W, H, t);

      drawSelfRespectHUD(1, 0.08, false);

      ctx.save();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 260, 480, 520, 120, 24);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 44px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('SAVAGE STORY POSTED', W / 2, 545);
      ctx.restore();
    }
  });

  // ── Shot 3b (Line 3 sub-cut: "Everyone sees it. Everyone.") ──────────────
  // SHOT SIZE: MEDIUM (Full body phone throw arc, arms flinging forward)
  cue(Wd('everyone', 3), 'whoosh');
  add({
    id: 'shot3b_phone_throw',
    shotType: 'MEDIUM',
    character: royNight,
    hasArmAction: true,
    at: Wd('everyone', 3),
    note: 'MEDIUM full body: Roy throws phone in regret, everyone saw it',
    draw(lt, d, t, blit) {
      const k = lt / d;
      const throwPhase = seg(lt, 0.2, 1.0);
      const armR_angle = lerp(135, 35, eo(throwPhase));
      applyEmotion(royNight, t, {
        armL: [45, 40],
        armR: [armR_angle, 80], // Hand 4: phone throw gesture
        holdR: throwPhase < 0.6 ? PROPS.phone(true) : null,
        talk: rhubarbTalk(t),
      });

      const f0 = autoFrame('MEDIUM', royNight, { azimuthDeg: 4, hasWideArms: true });
      const f1 = autoFrame('MEDIUM', royNight, { azimuthDeg: -3, hasWideArms: true });

      const mood = shootMood(BEDROOM.scene, [royNight], f0, f1, eo(k), t, { bloom: 0.3 });
      blit();
      drawMoodGrading(ctx, mood, W, H, t);

      drawSelfRespectHUD(1, 0.03, false);

      ctx.save();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 260, 480, 520, 120, 24);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 48px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('EVERYONE SAW IT', W / 2, 550);
      ctx.restore();
    }
  });

  // ── Shot 4 (Line 4: "Rewind.") ───────────────────────────────────────────
  // SHOT SIZE: WIDE (Establishing reverse motion & room warp)
  cue(L(4), 'rewind');
  add({
    id: 'shot4_rewind1',
    shotType: 'WIDE',
    character: royNight,
    hasArmAction: true,
    at: cut(4),
    note: 'WIDE reverse camera motion, backward clock, VHS scanlines',
    draw(lt, d, t, blit) {
      const k = 1 - (lt / d); // Reversed motion!
      applyEmotion(royNight, t, {
        armL: [90, 45],
        armR: [90, 45],
        talk: 0.5,
      });

      const f0 = autoFrame('WIDE', royNight, { distanceMultiplier: 1.15 });
      const f1 = autoFrame('WIDE', royNight, { distanceMultiplier: 0.85 });

      const mood = shootMood(BEDROOM.scene, [royNight], f0, f1, k, t, { bloom: 0.4 });
      blit();
      drawMoodGrading(ctx, mood, W, H, t);

      drawRewindOverlay(lt, d);
    }
  });

  // ── Shot 5 (Line 5: "Attempt two. You act fine. You even meet her for closure.")
  // SHOT SIZE: WIDE (Establishing cafe street scene with ex silhouette sitting across)
  cue(Wd('two', 5), 'thud');
  cue(Wd('closure', 5), 'pop');
  add({
    id: 'shot5_attempt2_cafe',
    shotType: 'WIDE',
    character: royCafe,
    hasArmAction: true,
    at: cut(5),
    note: 'WIDE establishing cafe meeting, forced smile, nervous cup',
    draw(lt, d, t, blit) {
      const k = lt / d;
      applyEmotion(royCafe, t, {
        legs: 'sit',
        armL: [25, 40],
        armR: [45, 60], // Hand 5: fidgeting with cup
        holdR: PROPS.cup,
        talk: rhubarbTalk(t),
        sweat: 0.6,
      });
      applyEmotion(exSilhouette, t, {
        legs: 'sit',
        armL: [15, 20],
        armR: [15, 20],
      });

      // Frame Roy and Ex in cafe scene
      const f0 = autoFrame('WIDE', royCafe, { azimuthDeg: 8, extraPeople: [exSilhouette] });
      const f1 = autoFrame('WIDE', royCafe, { azimuthDeg: -6, extraPeople: [exSilhouette] });

      const mood = shootMood(CAFE.scene, [royCafe, exSilhouette], f0, f1, eo(k), t, { bloom: 0.22 });
      blit();
      drawMoodGrading(ctx, mood, W, H, t);

      drawSelfRespectHUD(2, 0.15, false);

      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(160, 480, 400, 90, 20);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.fillStyle = INK;
      ctx.font = '900 32px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('"I\'M TOTALLY FINE"', 360, 538);
      ctx.restore();
    }
  });

  // ── Shot 6a (Line 6: "But closure from the person who hurt you?") ─────────
  // SHOT SIZE: MEDIUM (Full body head-to-toe, facepalm, ex walks away)
  cue(Wd('closure', 6), 'plop');
  add({
    id: 'shot6a_closure_fail',
    shotType: 'MEDIUM',
    character: royCafe,
    hasArmAction: true,
    at: cut(6),
    note: 'MEDIUM full body: Closure question, ex silhouette turns away, facepalm',
    draw(lt, d, t, blit) {
      const k = lt / d;
      applyEmotion(royCafe, t, {
        legs: 'stand',
        armL: [30, 20],
        armR: [145, -75], // Hand 6: facepalm touching forehead
        talk: rhubarbTalk(t),
      });
      applyEmotion(exSilhouette, t, {
        legs: 'walk',
        phase: t * 2,
        flip: true,
      });

      const f0 = autoFrame('MEDIUM', royCafe, { azimuthDeg: 5, targetYOffset: 0.05 });
      const f1 = autoFrame('MEDIUM', royCafe, { azimuthDeg: -3, targetYOffset: -0.05 });

      const mood = shootMood(CAFE.scene, [royCafe, exSilhouette], f0, f1, eo(k), t, { bloom: 0.26 });
      blit();
      drawMoodGrading(ctx, mood, W, H, t);

      drawSelfRespectHUD(2, 0.08, false);

      ctx.save();
      ctx.fillStyle = '#EF4444';
      ctx.font = '900 36px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('"CAN WE GET CLOSURE?"', W / 2, 480);
      ctx.restore();
    }
  });

  // ── Shot 6b (Line 6 sub-cut: "That's just the wound, reopened.") ──────────
  // SHOT SIZE: CLOSE (Emotional climax on reopened wound heart crack, 1.30s <= 1.5s!)
  cue(Wd('wound', 6), 'slam');
  add({
    id: 'shot6b_wound_reopened',
    shotType: 'CLOSE',
    character: royCafe,
    hasArmAction: false,
    at: Wd('wound', 6),
    note: 'CLOSE emotional peak: heart crack, defeated shrug (1.30s <= 1.5s)',
    draw(lt, d, t, blit) {
      const k = lt / d;
      applyEmotion(royCafe, t, {
        legs: 'stand',
        armL: [65, 50],
        armR: [65, 50],
        talk: rhubarbTalk(t),
        tears: 1.0,
      });

      const f0 = autoFrame('CLOSE', royCafe, { pitchDeg: 1 });
      const f1 = autoFrame('CLOSE', royCafe, { pitchDeg: 0, distanceMultiplier: 0.95 });

      const mood = shootMood(CAFE.scene, [royCafe], f0, f1, eo(k), t, { bloom: 0.28 });
      blit();
      drawMoodGrading(ctx, mood, W, H, t);

      drawSelfRespectHUD(2, 0.0, false);

      ctx.save();
      ctx.translate(W / 2, 540);
      const pulse = 1 + Math.sin(t * 8) * 0.08;
      ctx.scale(pulse, pulse);

      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.moveTo(0, 30);
      ctx.bezierCurveTo(-80, -60, -120, 20, 0, 110);
      ctx.bezierCurveTo(120, 20, 80, -60, 0, 30);
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(-15, 10);
      ctx.lineTo(20, 40);
      ctx.lineTo(-10, 70);
      ctx.lineTo(0, 105);
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 36px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('WOUND REOPENED', 0, 175);
      ctx.restore();
    }
  });

  // ── Shot 7 (Line 7: "Rewind.") ───────────────────────────────────────────
  // SHOT SIZE: WIDE (Rule: returns to WIDE after CLOSE! Full reverse speed ramp)
  cue(L(7), 'rewind');
  add({
    id: 'shot7_rewind2',
    shotType: 'WIDE',
    character: royCafe,
    hasArmAction: true,
    at: cut(7),
    note: 'WIDE reverse camera speed ramp, backward clock',
    draw(lt, d, t, blit) {
      const k = 1 - (lt / d);
      applyEmotion(royCafe, t, { armL: [90, 45], armR: [90, 45], talk: 0.4 });
      const f0 = autoFrame('WIDE', royCafe, { distanceMultiplier: 1.1 });
      const f1 = autoFrame('WIDE', royCafe, { distanceMultiplier: 0.8 });

      const mood = shootMood(CAFE.scene, [royCafe], f0, f1, k, t, { bloom: 0.4 });
      blit();
      drawMoodGrading(ctx, mood, W, H, t);
      drawRewindOverlay(lt, d);
    }
  });

  // ── Shot 8 (Line 8: "Attempt three. You put the phone down. That's step one.")
  // SHOT SIZE: MEDIUM (Rule: returns to MEDIUM! Roy lowers phone down on table, warm golden grade)
  cue(Wd('three', 8), 'thud');
  cue(Wd('down', 8), 'tock');
  cue(Wd('one', 8), 'ding');
  add({
    id: 'shot8_attempt3_step1',
    shotType: 'MEDIUM',
    character: royDay,
    hasArmAction: true,
    at: cut(8),
    note: 'MEDIUM full body: Roy places phone down on table, warm golden grade',
    draw(lt, d, t, blit) {
      const k = lt / d;
      const isPlacing = lt < 1.6;
      applyEmotion(royDay, t, {
        armL: [20, 15],
        armR: isPlacing ? [45, 60] : [25, 20], // Hand 8: placing phone face-down
        holdR: isPlacing ? PROPS.phone(false) : null,
        talk: rhubarbTalk(t),
      });

      const f0 = autoFrame('MEDIUM', royDay, { azimuthDeg: -5 });
      const f1 = autoFrame('MEDIUM', royDay, { azimuthDeg: 3 });

      const mood = shootMood(MEADOW.scene, [royDay], f0, f1, eo(k), t, { bloom: 0.25 });
      blit();
      drawMoodGrading(ctx, mood, W, H, t);

      const respectPct = lerp(0.20, 0.50, seg(lt, 0.5, 2.5));
      drawSelfRespectHUD(3, respectPct, true);

      ctx.save();
      const popK = eob(seg(lt, 0.8, 1.8));
      ctx.translate(W / 2, 520);
      ctx.scale(popK, popK);
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.roundRect(-340, -60, 680, 120, 24);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 42px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('STEP 1: PUT THE PHONE DOWN', 0, 0);
      ctx.restore();
    }
  });

  // ── Shot 9a (Line 9: "Tell two real people the truth.") ──────────────────
  // SHOT SIZE: MEDIUM (Full body with Dave and Sam, open dialogue)
  cue(Wd('truth', 9), 'pop');
  add({
    id: 'shot9a_two_friends',
    shotType: 'MEDIUM',
    character: royDay,
    hasArmAction: true,
    at: cut(9),
    note: 'MEDIUM full body: Talking to two friends, open arms',
    draw(lt, d, t, blit) {
      const k = lt / d;
      applyEmotion(royDay, t, {
        armL: [45, 25], // Hand 9: open arms talking honestly
        armR: [45, 25],
        talk: rhubarbTalk(t),
      });
      applyEmotion(dave, t, { armL: [20, 10], armR: [35, 45], talk: 0 });
      applyEmotion(sam, t, { armL: [35, 45], armR: [20, 10], talk: 0 });

      const f0 = autoFrame('MEDIUM', royDay, { azimuthDeg: -8, hasWideArms: true, extraPeople: [dave, sam] });
      const f1 = autoFrame('MEDIUM', royDay, { azimuthDeg: 6, hasWideArms: true, extraPeople: [dave, sam] });

      const mood = shootMood(MEADOW.scene, [royDay, dave, sam], f0, f1, eio(k), t, { bloom: 0.24 });
      blit();
      drawMoodGrading(ctx, mood, W, H, t);

      drawSelfRespectHUD(3, 0.60, true);

      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 280, 480, 560, 90, 24);
      ctx.fill();
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 32px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TELL TWO REAL PEOPLE', W / 2, 525);
      ctx.restore();
    }
  });

  // ── Shot 9b (Line 9 sub-cut: "Secrets make heartbreak heavier.") ──────────
  // SHOT SIZE: MEDIUM (Full body supportive nod, burden lifted)
  cue(Wd('heavier', 9), 'whoosh');
  add({
    id: 'shot9b_heavy_secrets',
    shotType: 'MEDIUM',
    character: royDay,
    hasArmAction: true,
    at: Wd('secrets', 9),
    note: 'MEDIUM full body: Burden lifted, warm supportive nod',
    draw(lt, d, t, blit) {
      const k = lt / d;
      applyEmotion(royDay, t, {
        armL: [30, 15],
        armR: [30, 15],
        talk: rhubarbTalk(t),
      });

      const f0 = autoFrame('MEDIUM', royDay, { azimuthDeg: 4, extraPeople: [dave, sam] });
      const f1 = autoFrame('MEDIUM', royDay, { azimuthDeg: -4, extraPeople: [dave, sam] });

      const mood = shootMood(MEADOW.scene, [royDay, dave, sam], f0, f1, eo(k), t, { bloom: 0.25 });
      blit();
      drawMoodGrading(ctx, mood, W, H, t);

      drawSelfRespectHUD(3, 0.70, true);
    }
  });

  // ── Shot 10a (Line 10: "Mute her. Move the photos out of sight.") ─────────
  // SHOT SIZE: MEDIUM_CU (Waist-up, packing memories box in hands clearly visible)
  cue(Wd('mute', 10), 'zip');
  add({
    id: 'shot10a_mute',
    shotType: 'MEDIUM_CU',
    character: royDay,
    hasArmAction: true,
    at: cut(10),
    note: 'MEDIUM_CU waist-up: Packing memories in a box, holding box prop',
    draw(lt, d, t, blit) {
      const k = lt / d;
      applyEmotion(royDay, t, {
        armL: [40, 50],
        armR: [40, 50],
        holdL: PROPS.photoBox, // Hand 10: holding photo archive box
        talk: rhubarbTalk(t),
      });

      const f0 = autoFrame('MEDIUM_CU', royDay, { azimuthDeg: -4, hasWideArms: true });
      const f1 = autoFrame('MEDIUM_CU', royDay, { azimuthDeg: 4, hasWideArms: true });

      const mood = shootMood(MEADOW.scene, [royDay], f0, f1, eo(k), t, { bloom: 0.22 });
      blit();
      drawMoodGrading(ctx, mood, W, H, t);

      drawSelfRespectHUD(3, 0.75, true);
    }
  });

  // ── Shot 10b (Line 10 sub-cut: "Not revenge, just space.") ────────────────
  // SHOT SIZE: MEDIUM (Full body, healthy space banner)
  cue(Wd('space', 10), 'whoosh');
  add({
    id: 'shot10b_space',
    shotType: 'MEDIUM',
    character: royDay,
    hasArmAction: true,
    at: Wd('not', 10),
    note: 'MEDIUM full body: Healthy space banner, clean perspective',
    draw(lt, d, t, blit) {
      const k = lt / d;
      applyEmotion(royDay, t, {
        armL: [25, 15],
        armR: [25, 15],
        talk: rhubarbTalk(t),
      });

      const f0 = autoFrame('MEDIUM', royDay, { azimuthDeg: 4 });
      const f1 = autoFrame('MEDIUM', royDay, { azimuthDeg: -4 });

      const mood = shootMood(MEADOW.scene, [royDay], f0, f1, eo(k), t, { bloom: 0.25 });
      blit();
      drawMoodGrading(ctx, mood, W, H, t);

      drawSelfRespectHUD(3, 0.80, true);

      ctx.save();
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 300, 500, 600, 100, 24);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 38px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('NOT REVENGE. JUST SPACE.', W / 2, 550);
      ctx.restore();
    }
  });

  // ── Shot 11a (Line 11: "Sleep, eat, walk.") ──────────────────────────────
  // SHOT SIZE: MEDIUM (Full body head-to-toe walk cycle, 3 recovery pillars)
  cue(Wd('sleep', 11), 'inhale');
  cue(Wd('walk', 11), 'slide');
  add({
    id: 'shot11a_sleep_eat',
    shotType: 'MEDIUM',
    character: royDay,
    hasArmAction: true,
    at: cut(11),
    note: 'MEDIUM full body: Sleep, eat, walk: 3 pillars of recovery',
    draw(lt, d, t, blit) {
      const k = lt / d;
      applyEmotion(royDay, t, {
        armL: [30, 10], // Hand 11: calm, deep breathing posture
        armR: [30, 10],
        talk: rhubarbTalk(t),
        legs: 'walk',
        phase: t * 4,
      });

      const f0 = autoFrame('MEDIUM', royDay, { azimuthDeg: -7 });
      const f1 = autoFrame('MEDIUM', royDay, { azimuthDeg: 5 });

      const mood = shootMood(MEADOW.scene, [royDay], f0, f1, eio(k), t, { bloom: 0.25 });
      blit();
      drawMoodGrading(ctx, mood, W, H, t);

      drawSelfRespectHUD(3, 0.84, true);

      ctx.save();
      const pillars = ['SLEEP 🛌', 'EAT 🥗', 'WALK 🚶'];
      pillars.forEach((p, idx) => {
        const px = 220 + idx * 320;
        ctx.fillStyle = '#059669';
        ctx.beginPath();
        ctx.roundRect(px - 140, 500, 280, 80, 20);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 28px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p, px, 540);
      });
      ctx.restore();
    }
  });

  // ── Shot 11b (Line 11 sub-cut: "Your body is grieving too, so treat it like it is.")
  // SHOT SIZE: MEDIUM_CU (Waist-up, deep breath, chest expansion, hands visible)
  add({
    id: 'shot11b_body_grieving',
    shotType: 'MEDIUM_CU',
    character: royDay,
    hasArmAction: true,
    at: Wd('your', 11),
    note: 'MEDIUM_CU waist-up: Deep breath, chest expansion, self-compassion',
    draw(lt, d, t, blit) {
      const k = lt / d;
      const breathPhase = Math.sin(lt * 3.0);
      applyEmotion(royDay, t, {
        armL: [20 + breathPhase * 6, 8],
        armR: [20 + breathPhase * 6, 8],
        squash: -0.15 * Math.max(0, breathPhase),
        talk: rhubarbTalk(t),
      });

      const f0 = autoFrame('MEDIUM_CU', royDay, { azimuthDeg: 0 });
      const f1 = autoFrame('MEDIUM_CU', royDay, { azimuthDeg: 4 });

      const mood = shootMood(MEADOW.scene, [royDay], f0, f1, eo(k), t, { bloom: 0.25 });
      blit();
      drawMoodGrading(ctx, mood, W, H, t);

      drawSelfRespectHUD(3, 0.88, true);
    }
  });

  // ── Shot 12 (Line 12: "Write the angry message. Then don't send it.") ────
  // SHOT SIZE: MEDIUM_CU (Waist-up, drafts message on paper/screen, pauses, deletes it)
  cue(Wd('angry', 12), 'slide');
  cue(Wd('send', 12), 'tock');
  add({
    id: 'shot12_dont_send',
    shotType: 'MEDIUM_CU',
    character: royDay,
    hasArmAction: true,
    at: cut(12),
    note: 'MEDIUM_CU waist-up: Drafts message on paper/screen, pauses, deletes it',
    draw(lt, d, t, blit) {
      const k = lt / d;
      applyEmotion(royDay, t, {
        armL: [30, 45],
        armR: [45, 65], // Hand 12: typing/crumpling draft
        holdL: PROPS.paper('UNSENT'),
        talk: rhubarbTalk(t),
      });

      const f0 = autoFrame('MEDIUM_CU', royDay, { azimuthDeg: -4, hasWideArms: true });
      const f1 = autoFrame('MEDIUM_CU', royDay, { azimuthDeg: 3, hasWideArms: true });

      const mood = shootMood(MEADOW.scene, [royDay], f0, f1, eo(k), t, { bloom: 0.24 });
      blit();
      drawMoodGrading(ctx, mood, W, H, t);

      drawSelfRespectHUD(3, 0.92, true);

      ctx.save();
      if (lt > 1.0) {
        ctx.translate(W / 2, 540);
        ctx.rotate(-0.15);
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 10;
        ctx.strokeRect(-240, -55, 480, 110);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.fillRect(-240, -55, 480, 110);

        ctx.fillStyle = '#EF4444';
        ctx.font = '900 54px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('DO NOT SEND', 0, 0);
      }
      ctx.restore();
    }
  });

  // ── Shot 13a (Line 13: "Day one hurts. Day thirty hurts less.") ──────────
  // SHOT SIZE: MEDIUM (Full body head-to-toe, Day 1 -> Day 30 timeline)
  cue(Wd('thirty', 13), 'ding');
  add({
    id: 'shot13a_day1_30',
    shotType: 'MEDIUM',
    character: royDay,
    hasArmAction: true,
    at: cut(13),
    note: 'MEDIUM full body: Day 1 -> Day 30 emotional progress',
    draw(lt, d, t, blit) {
      const k = lt / d;
      applyEmotion(royDay, t, {
        armL: [25, 15],
        armR: [40, 45], // Hand 13: pointing at timeline
        talk: rhubarbTalk(t),
      });

      const f0 = autoFrame('MEDIUM', royDay, { azimuthDeg: -6 });
      const f1 = autoFrame('MEDIUM', royDay, { azimuthDeg: 4 });

      const mood = shootMood(MEADOW.scene, [royDay], f0, f1, eio(k), t, { bloom: 0.26 });
      blit();
      drawMoodGrading(ctx, mood, W, H, t);

      drawSelfRespectHUD(3, 0.95, true);

      ctx.save();
      const nodes = [
        { label: 'DAY 1', sub: '🌧️ Hurts', done: true, color: '#EF4444' },
        { label: 'DAY 30', sub: '⛅ Hurts Less', done: lt > 1.0, color: '#F59E0B' },
      ];
      nodes.forEach((n, idx) => {
        const ny = 480 + idx * 115;
        ctx.fillStyle = n.done ? n.color : 'rgba(100, 116, 139, 0.6)';
        ctx.beginPath();
        ctx.roundRect(140, ny, 800, 95, 20);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 36px Inter';
        ctx.textAlign = 'left';
        ctx.fillText(n.label, 190, ny + 48);

        ctx.textAlign = 'right';
        ctx.font = '700 32px Inter';
        ctx.fillText(n.sub, 900, ny + 48);
      });
      ctx.restore();
    }
  });

  // ── Shot 13b (Line 13 sub-cut: "Day ninety, you laugh at something.") ────
  // SHOT SIZE: MEDIUM (Full body head-to-toe, genuine laugh, hands on hips)
  cue(Wd('ninety', 13), 'sparkle');
  add({
    id: 'shot13b_day90',
    shotType: 'MEDIUM',
    character: royDay,
    hasArmAction: true,
    at: Wd('ninety', 13) - 0.15,
    note: 'MEDIUM full body: Day 90 triumph, laughing with genuine joy',
    draw(lt, d, t, blit) {
      const k = lt / d;
      applyEmotion(royDay, t, {
        armL: [30, 25],
        armR: [40, 45],
        talk: rhubarbTalk(t),
      });

      const f0 = autoFrame('MEDIUM', royDay, { azimuthDeg: 4 });
      const f1 = autoFrame('MEDIUM', royDay, { azimuthDeg: -3 });

      const mood = shootMood(MEADOW.scene, [royDay], f0, f1, eo(k), t, { bloom: 0.28 });
      blit();
      drawMoodGrading(ctx, mood, W, H, t);

      drawSelfRespectHUD(3, 0.98, true);

      ctx.save();
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.roundRect(140, 520, 800, 110, 24);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 42px Inter';
      ctx.textAlign = 'left';
      ctx.fillText('DAY 90', 190, 575);

      ctx.textAlign = 'right';
      ctx.font = '800 36px Inter';
      ctx.fillText('☀️ YOU LAUGH AGAIN', 900, 575);
      ctx.restore();
    }
  });

  // ── Shot 14a (Line 14: "Self-respect isn't winning the breakup.") ─────────
  // SHOT SIZE: MEDIUM (Full body head-to-toe, dignified posture)
  cue(Wd('self-respect', 14), 'ding');
  add({
    id: 'shot14a_not_winning',
    shotType: 'MEDIUM',
    character: royDay,
    hasArmAction: true,
    at: cut(14),
    note: 'MEDIUM full body: Self respect isn\'t winning, steady posture',
    draw(lt, d, t, blit) {
      const k = lt / d;
      applyEmotion(royDay, t, {
        armL: [25, 15],
        armR: [25, 15],
        talk: rhubarbTalk(t),
      });

      const f0 = autoFrame('MEDIUM', royDay, { azimuthDeg: -4 });
      const f1 = autoFrame('MEDIUM', royDay, { azimuthDeg: 2 });

      const mood = shootMood(MEADOW.scene, [royDay], f0, f1, eo(k), t, { bloom: 0.3 });
      blit();
      drawMoodGrading(ctx, mood, W, H, t);

      drawSelfRespectHUD(3, 1.0, true);
    }
  });

  // ── Shot 14b (Line 14 sub-cut: "It's refusing to beg for what you deserve.")
  // SHOT SIZE: MEDIUM_CU (Waist-up, proud thumbs-up gesture clearly visible in frame)
  cue(Wd('beg', 14), 'tock');
  cue(Wd('deserve', 14), 'sparkle');
  add({
    id: 'shot14b_refuse_beg',
    shotType: 'MEDIUM_CU',
    character: royDay,
    hasArmAction: true,
    at: Wd('refusing', 14),
    note: 'MEDIUM_CU waist-up: Proud thumbs up gesture, 100% self-respect',
    draw(lt, d, t, blit) {
      const k = lt / d;
      applyEmotion(royDay, t, {
        armL: [25, 15],
        armR: [75, 40], // Hand 14: thumbs up gesture!
        holdR: PROPS.thumbsUp,
        talk: rhubarbTalk(t),
      });

      const f0 = autoFrame('MEDIUM_CU', royDay, { azimuthDeg: 0, hasWideArms: true });
      const f1 = autoFrame('MEDIUM_CU', royDay, { azimuthDeg: -3, hasWideArms: true });

      const mood = shootMood(MEADOW.scene, [royDay], f0, f1, eo(k), t, { bloom: 0.32 });
      blit();
      drawMoodGrading(ctx, mood, W, H, t);

      drawSelfRespectHUD(3, 1.0, true);

      ctx.save();
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 420, 500, 840, 120, 24);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 42px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('REFUSE TO BEG.', W / 2, 560);
      ctx.restore();
    }
  });

  // ── Shot 15a (Line 15: "Roy didn't forget her.") ─────────────────────────
  // SHOT SIZE: MEDIUM (Full body head-to-toe walking stride)
  cue(Wd('forget', 15), 'pop');
  add({
    id: 'shot15a_stopped_waiting',
    shotType: 'MEDIUM',
    character: royDay,
    hasArmAction: true,
    at: cut(15),
    note: 'MEDIUM full body: Roy walking away into golden sunrise, calm stride',
    draw(lt, d, t, blit) {
      const k = lt / d;
      applyEmotion(royDay, t, {
        armL: [-30, 20], // Hand 15: rhythmic walking stride
        armR: [30, 20],
        legs: 'walk',
        phase: t * 5,
        talk: rhubarbTalk(t),
      });

      const f0 = autoFrame('MEDIUM', royDay, { azimuthDeg: 0 });
      const f1 = autoFrame('MEDIUM', royDay, { azimuthDeg: 4 });

      const mood = shootMood(MEADOW.scene, [royDay], f0, f1, eo(k), t, { bloom: 0.4 });
      blit();
      drawMoodGrading(ctx, mood, W, H, t);

      drawSelfRespectHUD(3, 1.0, true);
    }
  });

  // ── Shot 15b (Line 15 sub-cut: "He just stopped waiting.") ────────────────
  // SHOT SIZE: WIDE (Grand establishing wide shot, Roy walking away into golden sunrise)
  cue(Wd('stopped', 15), 'sparkle');
  cue(Wd('waiting', 15), 'ding');
  add({
    id: 'shot15b_sunrise_walk',
    shotType: 'WIDE',
    character: royDay,
    hasArmAction: true,
    at: Wd('stopped', 15),
    note: 'WIDE slow push-in on Roy walking away into sunrise, peaceful closure',
    draw(lt, d, t, blit) {
      const k = lt / d;
      applyEmotion(royDay, t, {
        armL: [-30, 20],
        armR: [30, 20],
        legs: 'walk',
        phase: t * 5,
        talk: rhubarbTalk(t),
      });

      const f0 = autoFrame('WIDE', royDay, { azimuthDeg: 2 });
      const f1 = autoFrame('WIDE', royDay, { azimuthDeg: -2, distanceMultiplier: 0.9 });

      const mood = shootMood(MEADOW.scene, [royDay], f0, f1, eo(k), t, { bloom: 0.45 });
      blit();
      drawMoodGrading(ctx, mood, W, H, t);

      drawSelfRespectHUD(3, 1.0, true);

      ctx.save();
      const popK = eob(seg(lt, 0.4, 1.4));
      ctx.translate(W / 2, 540);
      ctx.scale(popK, popK);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(-400, -65, 800, 130, 24);
      ctx.fill();
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 46px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('HE STOPPED WAITING.', 0, 0);
      ctx.restore();
    }
  });

  return { shots: S, cues: CUES, cam };
}
