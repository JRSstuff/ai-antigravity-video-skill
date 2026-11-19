/**
 * remocn_canvas.js - Remocn-inspired Motion Components for Canvas & Three.js
 *
 * Brings the component paradigms of Remocn (https://github.com/Remocn/remocn)
 * into lightweight, zero-dependency HTML5 Canvas overlays:
 *   1. Kinetic Typography (Typewriter, Shimmer Sweep, Marker Highlight, Blur Reveal, RGB Glitch)
 *   2. Rolling Numbers / Odometer Counters
 *   3. Modern Device Mockups (Smartphone frame, Glass Browser window)
 *   4. Notification Toasts & Message Bubbles
 *   5. Animated Progress Bars & HUD Indicators
 *   6. Dynamic Mesh & Spotlight Backgrounds
 *
 * All functions are pure, deterministic f(t) animations.
 */

// Spring-like smooth easing
function easeOutBack(x) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function clamp(v, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}

function seg(t, a, b) {
  if (t <= a) return 0;
  if (t >= b) return 1;
  return (t - a) / (b - a);
}

export const REMOCN = {
  /**
   * 1. KINETIC TYPOGRAPHY
   */
  typewriter(ctx, text, t, opts = {}) {
    const {
      x = 540,
      y = 960,
      font = '900 48px Inter, sans-serif',
      color = '#FFFFFF',
      align = 'center',
      speed = 24, // chars per sec
      cursor = true,
      cursorColor = '#FBBF24',
    } = opts;

    ctx.save();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';

    const charCount = Math.min(text.length, Math.floor(t * speed));
    const visibleText = text.slice(0, charCount);

    ctx.fillText(visibleText, x, y);

    if (cursor && (charCount < text.length || Math.floor(t * 3) % 2 === 0)) {
      const metrics = ctx.measureText(visibleText);
      const cursorX = align === 'center' ? x + metrics.width / 2 + 6 : (align === 'left' ? x + metrics.width + 6 : x);
      ctx.fillStyle = cursorColor;
      ctx.fillRect(cursorX, y - 24, 4, 48);
    }
    ctx.restore();
  },

  shimmerText(ctx, text, t, opts = {}) {
    const {
      x = 540,
      y = 960,
      font = '900 52px Inter, sans-serif',
      baseColor = '#E2E8F0',
      shimmerColor = '#FBBF24',
      align = 'center',
      period = 2.0,
      bandWidth = 140,
    } = opts;

    ctx.save();
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';

    const textWidth = ctx.measureText(text).width;
    const sweepProgress = (t % period) / period;
    const sweepX = (x - textWidth / 2) + sweepProgress * (textWidth + bandWidth * 2) - bandWidth;

    const grad = ctx.createLinearGradient(sweepX - bandWidth, y, sweepX + bandWidth, y);
    grad.addColorStop(0, baseColor);
    grad.addColorStop(0.5, shimmerColor);
    grad.addColorStop(1, baseColor);

    ctx.fillStyle = grad;
    ctx.fillText(text, x, y);
    ctx.restore();
  },

  markerHighlight(ctx, text, t, opts = {}) {
    const {
      x = 540,
      y = 960,
      font = '900 46px Inter, sans-serif',
      textColor = '#0F172A',
      highlightColor = '#FDE047',
      startTime = 0.2,
      duration = 0.6,
      tiltDeg = -1.2,
    } = opts;

    ctx.save();
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const metrics = ctx.measureText(text);
    const tw = metrics.width + 30;
    const th = 56;
    const progress = clamp(seg(t, startTime, startTime + duration));
    const drawWidth = tw * progress;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((tiltDeg * Math.PI) / 180);

    // Marker stroke
    ctx.fillStyle = highlightColor;
    ctx.beginPath();
    ctx.roundRect(-tw / 2, -th / 2 + 4, drawWidth, th, 8);
    ctx.fill();
    ctx.restore();

    // Text on top
    ctx.fillStyle = textColor;
    ctx.fillText(text, x, y);
    ctx.restore();
  },

  glitchText(ctx, text, t, opts = {}) {
    const {
      x = 540,
      y = 960,
      font = '900 56px Inter, sans-serif',
      color = '#FFFFFF',
      intensity = 1.0,
    } = opts;

    ctx.save();
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const glitchActive = (Math.sin(t * 30) > 0.7);
    if (glitchActive) {
      const offsetX = (Math.sin(t * 50) * 12) * intensity;
      const offsetY = (Math.cos(t * 40) * 4) * intensity;

      // Cyan split
      ctx.fillStyle = '#06B6D4';
      ctx.fillText(text, x - offsetX, y - offsetY);

      // Red/Magenta split
      ctx.fillStyle = '#EF4444';
      ctx.fillText(text, x + offsetX, y + offsetY);
    }

    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  },

  /**
   * 2. ROLLING NUMBER WHEEL
   */
  rollingNumber(ctx, currentVal, targetVal, t, opts = {}) {
    const {
      x = 540,
      y = 960,
      startTime = 0.2,
      duration = 1.2,
      font = '900 64px Inter, sans-serif',
      color = '#10B981',
      prefix = '',
      suffix = '',
    } = opts;

    ctx.save();
    const k = clamp(seg(t, startTime, startTime + duration));
    const easedK = 1 - Math.pow(1 - k, 3); // ease-out cubic
    const val = Math.round(currentVal + (targetVal - currentVal) * easedK);

    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${prefix}${val.toLocaleString()}${suffix}`, x, y);
    ctx.restore();
  },

  /**
   * 3. NOTIFICATION TOAST
   */
  notificationToast(ctx, opts = {}) {
    const {
      x = 540,
      y = 220,
      app = 'MESSAGES',
      title = '47 MISSED CALLS',
      body = 'Why did you do that?',
      t = 0,
      startTime = 0.1,
      duration = 0.5,
      accentColor = '#EF4444',
    } = opts;

    ctx.save();
    const enterK = clamp(seg(t, startTime, startTime + duration));
    const bounce = easeOutBack(enterK);
    const curY = (y - 120) + (120 * bounce);

    ctx.translate(x, curY);
    ctx.scale(Math.min(1, bounce), Math.min(1, bounce));

    const w = 820;
    const h = 130;

    // Frosted glass background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 24);
    ctx.fill();

    // Border
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 4;
    ctx.stroke();

    // App header
    ctx.fillStyle = accentColor;
    ctx.font = '800 22px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(app, -w / 2 + 35, -h / 2 + 38);

    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 32px Inter, sans-serif';
    ctx.fillText(title, -w / 2 + 35, -h / 2 + 80);

    // Subtitle / message
    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 24px Inter, sans-serif';
    ctx.fillText(body, -w / 2 + 35, -h / 2 + 112);

    ctx.restore();
  },

  /**
   * 4. DEVICE MOCKUP (SMARTPHONE FRAME)
   */
  deviceMockup(ctx, x, y, width, height, t, renderContentFn) {
    ctx.save();
    ctx.translate(x, y);

    const cornerRadius = 36;
    // Outer phone body shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;

    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.roundRect(-width / 2, -height / 2, width, height, cornerRadius);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // Outer bezel
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Screen area
    const screenMargin = 12;
    const sw = width - screenMargin * 2;
    const sh = height - screenMargin * 2;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(-sw / 2, -sh / 2, sw, sh, cornerRadius - 8);
    ctx.clip();

    // Render custom content inside screen
    if (renderContentFn) {
      renderContentFn(ctx, sw, sh, t);
    }

    ctx.restore();

    // Top speaker / notch
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.roundRect(-70, -height / 2 + screenMargin + 4, 140, 24, 12);
    ctx.fill();

    ctx.restore();
  },

  /**
   * 5. ANIMATED PROGRESS / STAT HUD
   */
  progressHUD(ctx, opts = {}) {
    const {
      x = 540,
      y = 120,
      width = 720,
      height = 42,
      label = 'PROGRESS',
      pct = 0.5,
      color = '#10B981',
      showPct = true,
    } = opts;

    ctx.save();
    ctx.translate(x, y);

    // Label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 24px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, -width / 2, -16);

    if (showPct) {
      ctx.textAlign = 'right';
      ctx.fillStyle = color;
      ctx.fillText(`${Math.round(pct * 100)}%`, width / 2, -16);
    }

    // Track background
    ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
    ctx.beginPath();
    ctx.roundRect(-width / 2, 0, width, height, height / 2);
    ctx.fill();

    // Fill bar
    const fillWidth = Math.max(height, width * clamp(pct));
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-width / 2, 0, fillWidth, height, height / 2);
    ctx.fill();

    // Glowing rim
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  },
};
