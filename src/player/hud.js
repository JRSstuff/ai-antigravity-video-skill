// 2D HTML/CSS HUD Overlay Controller (Strict Fix)
// Completely decoupled from 3D WebGL canvas. Zero 3D text geometry near characters.
export class HUDController {
  constructor(container = document.body) {
    this.container = container;
    this.hudElement = null;
    this.subtitleElement = null;
    this.badgeElement = null;

    this.createHUD();
  }

  createHUD() {
    // 1. Inject High-Performance CSS
    const style = document.createElement('style');
    style.id = 'hud-overlay-styles';
    style.textContent = `
      #hud-overlay-container {
        position: fixed;
        bottom: 8%;
        left: 0;
        width: 100%;
        text-align: center;
        pointer-events: none;
        z-index: 10;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 0 20px;
        box-sizing: border-box;
      }

      .hud-subtitle-pill {
        display: inline-block;
        max-width: 860px;
        padding: 16px 32px;
        background: rgba(11, 15, 25, 0.85);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 9999px;
        color: #F8FAFC;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 22px;
        font-weight: 700;
        line-height: 1.45;
        letter-spacing: -0.015em;
        box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.2);
        opacity: 0;
        transform: translateY(12px) scale(0.97);
        transition: opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
      }

      .hud-subtitle-pill.active {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .hud-subtitle-pill .hl {
        color: #FACC15; /* Radiant Gold */
        font-weight: 800;
        text-shadow: 0 0 12px rgba(250, 204, 21, 0.55);
      }

      .hud-subtitle-pill .accent {
        color: #38BDF8; /* Electric Cyan */
        font-weight: 800;
        text-shadow: 0 0 12px rgba(56, 189, 248, 0.55);
      }

      .hud-subtitle-pill .fire {
        color: #EF4444; /* Flame Red */
        font-weight: 800;
      }

      #hud-header-badge {
        position: fixed;
        top: 24px;
        left: 28px;
        pointer-events: none;
        z-index: 10;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 16px;
        background: rgba(15, 23, 42, 0.8);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 9999px;
        color: #94A3B8;
        font-family: 'Inter', sans-serif;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      #hud-header-badge .dot {
        width: 8px;
        height: 8px;
        background: #10B981;
        border-radius: 50%;
        box-shadow: 0 0 8px #10B981;
        animation: pulse-dot 2s infinite ease-in-out;
      }

      @keyframes pulse-dot {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.3); opacity: 0.7; }
      }
    `;
    document.head.appendChild(style);

    // 2. Subtitle Overlay
    this.hudElement = document.createElement('div');
    this.hudElement.id = 'hud-overlay-container';

    this.subtitleElement = document.createElement('div');
    this.subtitleElement.className = 'hud-subtitle-pill';
    this.hudElement.appendChild(this.subtitleElement);
    this.container.appendChild(this.hudElement);

    // 3. Top Status Badge
    this.badgeElement = document.createElement('div');
    this.badgeElement.id = 'hud-header-badge';
    this.badgeElement.innerHTML = `<span class="dot"></span> <span id="badge-text">THREE.JS 3D SCENE PLAYER</span>`;
    this.container.appendChild(this.badgeElement);
  }

  /**
   * Set and animate subtitle text.
   * @param {string} htmlText - Text with optional <span class="hl"> or <span class="accent">
   */
  setSubtitle(htmlText) {
    if (!htmlText || htmlText.trim() === '') {
      this.subtitleElement.classList.remove('active');
      return;
    }

    if (this.subtitleElement.innerHTML === htmlText && this.subtitleElement.classList.contains('active')) {
      return;
    }

    // Quick subtle transition
    this.subtitleElement.classList.remove('active');
    setTimeout(() => {
      this.subtitleElement.innerHTML = htmlText;
      this.subtitleElement.classList.add('active');
    }, 80);
  }

  /**
   * Update header status badge info.
   */
  setBadge(text) {
    const textSpan = this.badgeElement.querySelector('#badge-text');
    if (textSpan) textSpan.textContent = text;
  }
}
