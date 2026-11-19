# Remocn Motion Style Guide (`remocn`)

> **Stack**: React · Remotion · Remocn Component Library (`@remocn/*`) · TypeScript · Tailwind CSS
> **Aspect**: 9:16 vertical (1080x1920 @ 30fps)
> **Best for**: SaaS & tech breakdowns, kinetic typography explainers, viral product demos, countdown stat tickers, animated terminal/code diffs, modern social clips.

---

## 1. What is Remocn?

[Remocn](https://github.com/Remocn/remocn) is the *shadcn/ui of programmatic video*. It is a collection of 110+ production-ready, open-source motion components and visual primitives designed specifically for Remotion (React-based video framework).

Instead of inventing transitions, spring physics, or text animations from scratch, components are copied directly into the project codebase using the shadcn CLI pattern or agent skills:

```bash
npx shadcn@latest add @remocn/<component-name>
# or for agents:
npx skills add Remocn/remocn
```

---

## 2. Remocn Component Catalog

### A. Kinetic Typography
| Component | Visual Effect | Best For |
| :--- | :--- | :--- |
| `@remocn/blur-reveal` | Words fade in smoothly with expanding letter-spacing and lens blur | Opening hooks & punchlines |
| `@remocn/typewriter` | Monospace or modern typing effect with glowing blinking cursor | Code lines, chat scripts, direct quotes |
| `@remocn/per-character-rise` | Individual glyphs rise on spring curves with slight stagger | High-energy dynamic statements |
| `@remocn/marker-highlight` | Translucent highlighter pen sweeps behind emphasized words | Focus phrases, key statistics |
| `@remocn/shimmer-sweep` | Metallic specular gleam moves across polished text | Premium features, milestone reveals |
| `@remocn/slot-machine-roll` | Numbers and words roll vertically into place like a slot cylinder | Timelines, years, metric benchmarks |
| `@remocn/rgb-glitch` | Chromatic aberration split with red/cyan color displacement | Disruption, rewinds, danger, errors |
| `@remocn/rolling-number` | Smooth animated counter with commas, currency, and unit symbols | Revenue, counts, percentages |

### B. Device Mockups & UI Primitives
| Component | Visual Effect | Best For |
| :--- | :--- | :--- |
| `@remocn/device-mockup` | 3D-styled smartphone or tablet frame with realistic glass reflection | Mobile app walkthroughs, text message threads |
| `@remocn/browser-frame` | macOS/Windows-styled browser window with URL bar and controls | SaaS walkthroughs, website teardowns |
| `@remocn/terminal-simulator` | Dark-mode terminal executing shell commands and streaming logs | Developer tools, CLI features, backend demos |
| `@remocn/glass-code-block` | Syntax-highlighted code container with line highlights | Code explainers, architecture reviews |
| `@remocn/notification-toast` | Floating mobile/desktop notification pill sliding in with spring physics | Alerts, incoming texts, breaking news |
| `@remocn/social-card` | Tweet / X post or Instagram comment card with avatar and likes counter | Testimonials, viral quotes, public sentiment |

### C. Transitions & Spatial Motion
| Component | Visual Effect | Best For |
| :--- | :--- | :--- |
| `@remocn/zoom-through` | Camera flies through a screen or hole into the next composition | Fast-paced scene shifts |
| `@remocn/spatial-push` | 3D layered slide push with depth parallax and motion blur | Chapter markers, attempt branches |
| `@remocn/frosted-glass-wipe` | Blurry glass slab sweeps across the canvas revealing the next layer | Clean, modern topic transitions |
| `@remocn/chromatic-wipe` | Color fringe split transition on fast beat cuts | Music drops, impact moments |

### D. Ambient Environments & Backgrounds
| Component | Visual Effect | Best For |
| :--- | :--- | :--- |
| `@remocn/mesh-gradient` | Smooth, organic multi-point animated color mesh | Modern tech aesthetics |
| `@remocn/spotlight-grid` | Perspective grid floor illuminated by a dynamic following spotlight | Product showcases, dramatic focus |
| `@remocn/floating-particles` | Gentle floating dust motes or celebratory confetti bursts | Atmosphere, triumphs, milestones |

---

## 3. Project Architecture

A Remocn video project is organized cleanly:

```
my-remocn-video/
├── remotion.config.ts         # Remotion render settings (1080x1920, 30fps)
├── package.json               # Dependencies (@remotion/*, lucide-react, tailwindcss)
├── script.json                # Word-synced script with beat timings
├── data/
│   ├── narration.wav          # Spoken voiceover track
│   └── mix.wav                # Narration + music bed + SFX
└── src/
    ├── index.ts               # Entry point registering Root
    ├── Root.tsx               # Remotion Root declaring Composition
    ├── Composition.tsx        # Master timeline sequencing scenes & audio
    ├── scenes/                # Scene components mapped to script cuts
    │   ├── Scene0_Hook.tsx
    │   ├── Scene1_Problem.tsx
    │   └── Scene2_Resolution.tsx
    └── components/remocn/     # Copied Remocn primitives
        ├── BlurReveal.tsx
        ├── DeviceMockup.tsx
        ├── NotificationToast.tsx
        └── RollingNumber.tsx
```

---

## 4. Script-to-Component Mapping

When planning in Phase 0, each script beat maps to a specific Remocn visual component:

```json
{
  "lines": [
    {
      "text": "Six years. Then you find the messages.",
      "remocn_component": "DeviceMockup + NotificationToast",
      "transition": "ZoomThrough"
    },
    {
      "text": "Attempt one. You text her forty-seven times.",
      "remocn_component": "RollingNumber (47) + GlitchText",
      "transition": "SpatialPush"
    },
    {
      "text": "Self-respect isn't winning the breakup.",
      "remocn_component": "MarkerHighlight + ShimmerSweep",
      "transition": "FrostedGlassWipe"
    }
  ]
}
```

---

## 5. Dual-Engine Capability

In this video engine, Remocn components can be used in two ways:
1. **Full Remotion Mode (`styles/remocn/`)**: A pure React/TypeScript Remotion project rendered via Remotion CLI (`npx remotion render`).
2. **Universal Canvas Mode (`src/core/remocn_canvas.js`)**: All key Remocn motion primitives (BlurReveal, Typewriter, Shimmer, Marker, Glitch, Rolling Numbers, Device Mockups, Notification Toasts) are also implemented as pure, zero-dependency HTML5 canvas renderers available directly in `deep-dive`, `tall-tale`, `stick-story`, and `inside-out`!
