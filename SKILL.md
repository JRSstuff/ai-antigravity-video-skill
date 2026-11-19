---
name: ai-antigravity-video-skill
description: Make narrated faceless YouTube Shorts / TikToks / Reels fully in code on the user's computer, with a free local AI voice and word-synced captions, $0. Seven styles - Deep Dive 3D (Zack D. Films-like 3D "what happens if" body/science explainers), Night File 3D (unsolved mysteries, true crime), Inside Out (flat 2D x-ray explainers), Stick Story (stick-figure "what would you do if" survival steps), Paper Atlas (history in cut paper with maps), Tall Tale 3D (funny true stories with flat 2D cartoon people in a sunny 3D world, one-word captions), and Remocn Motion (kinetic typography & modern UI). Use whenever someone wants a faceless short, a what-if or what-happens-if explainer, a Zack D. Films style video, a mystery or true-crime short, a stick-figure story, a history short, a funny true story, or a video in one of these styles, even from just a topic.
---

# 🎬 AI Antigravity Video Skill: Autonomous Production Guide

> **Zero-Context Autonomous Manual**: This document provides the complete, self-contained operational workflow for any AI harness (Antigravity, Claude Code, Cursor, OpenCode, Codex, Hermes) to guide a user from a raw topic idea to a finished broadcast-quality vertical short (1080×1920 @ 30fps) with $0 API cost, 100% local rendering, and deterministic $f(t)$ math.

---

## 1. Core Operating Principles

1. **Autonomous Leadership**: When the user gives a topic (e.g., *"Make a video about Why Do We Yawn"* or *"Create a short about Roy's breakup"*), take immediate initiative. Do not ask 20 open-ended questions. If details are missing, run **Phase 0** (ask ONE multiple-choice block with `(Recommended)` defaults), get approval on the One-Screen Plan, then execute the full pipeline.
2. **100% Code-Driven & Free**: Canvas 2D drawing, Three.js WebGL rendering, headless Chrome capture, local Kokoro-82M ONNX voice, local Whisper small.en word alignment, and procedural numpy sound synthesis. Zero AI video hallucination, zero subscriptions, zero API keys.
3. **Deterministic Math $f(t)$**: All visual animation, character gestures, camera motion, and sound cues are strictly pure mathematical functions of film time $t$. Frame $N$ is byte-for-byte identical every single render.
4. **Never Ship Uninspected Visuals**: Never render the final video without passing `tools/capture.mjs check` and inspecting the contact sheet (`review/all.jpg`) to verify character movement, framing, and caption visibility.

---

## 2. Style Auto-Recommender

When the user specifies a style, honor it. If unspecified, auto-select based on keywords:

| Style | Directory | Topic Keywords & Best Use | Visual Signatures |
| :--- | :--- | :--- | :--- |
| **Deep Dive 3D** | `styles/deep-dive` | Body, biology, health, medicine, science, *"what happens if"*, anatomy | 3D clay characters, sunlit rooms, translucent cyan X-ray bodies, 3D anatomical cutaways, shallow depth of field |
| **Tall Tale 3D** | `styles/tall-tale` | Funny true stories, dating, relationship rewinds, character dilemmas, crazy feats | Sunny 3D world, expressive 2.5D/3D characters with animated arms, dynamic camera moves, comedic pacing |
| **Inside Out** | `styles/inside-out` | Snappy 2D science explainers, fast physical comparisons | Flat bold 2D graphics, cyan/red X-ray cuts, punchy 1–3 word captions |
| **Stick Story** | `styles/stick-story` | Survival guides, emergency hacks, *"what would you do if"* | Stylized stick heroes with animated eyes, gold tactical step cards, flat environments |
| **Paper Atlas** | `styles/paper-atlas` | History, wars, battles, trade routes, ancient voyages | Cut-paper parchment maps, crimson movement routes, gold ribbon dates, period figure silhouettes |
| **Night File 3D** | `styles/night-file` | Unsolved mysteries, true crime, eerie history, creepy lore | Dark 3D sets, single harsh spotlight, red glowing silhouette subjects, typewriter text, case folders |
| **Remocn Motion** | `styles/remocn` | Tech breakdowns, SaaS launches, countdown stats, kinetic typography | Sleek kinetic text, device mockups, notification toasts, rolling counters, smooth spring curves |

---

## 3. The 8-Phase Production Pipeline

Follow these phases sequentially for every video project:

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│ Phase 0        │ ──> │ Phase 1        │ ──> │ Phase 2        │ ──> │ Phase 3 & 4    │
│ Intake & Brief │     │ Dual-Track     │     │ Voice & Whisper│     │ 3D Scene, Rigs │
│ Plan Approval  │     │ Scriptwriting  │     │ Word Alignment │     │ Framing Guards │
└────────────────┘     └────────────────┘     └────────────────┘     └────────────────┘
        │                                                                     │
        ▼                                                                     ▼
┌────────────────┐     ┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│ Delivery       │ <── │ Phase 8        │ <── │ Phase 7        │ <── │ Phase 5 & 6    │
│ Master MP4     │     │ 720p Draft &   │     │ Capture Check  │     │ Remocn HUD &   │
│ Review Report  │     │ 1080p Master   │     │ Contact Sheet  │     │ Procedural Mix │
└────────────────┘     └────────────────┘     └────────────────┘     └────────────────┘
```

---

### Phase 0: Intake & Plan Approval (Mandatory Gate)

1. If the user's prompt is missing key parameters (style, runtime, character, tone), ask **ONE** combined question block (max 5 questions) with multiple-choice letters and smart defaults marked `(Recommended)`.
2. If the user says *"default"*, *"go"*, *"you decide"*, or already provided full details, skip the questions and apply defaults immediately.
3. Save configuration into `<project-dir>/brief.json`:
   ```json
   {
     "topic": "Why Do We Get Goosebumps?",
     "style": "deep-dive",
     "length": "55s",
     "audience": "Ages 16+, social media",
     "tone": "Warm, curious, funny friend narrator",
     "character": "Roy (recolored rigged GLB, expressive arms)",
     "hook_formula": "Nobody Tells You",
     "ending": "Closed replay loop"
   }
   ```
4. Present the **One-Screen Plan Summary**:
   - **Title & Hook**: Spoken hook and on-screen hook.
   - **Full Narration Script**: 14–18 cuts, 150–165 WPM.
   - **Shot Breakdown**: Visual description, shot size (`WIDE`, `MEDIUM`, `CLOSE`), and character actions.
   - **Motion Components**: Remocn HUD overlays (`rollingNumber`, `progressHUD`, `notificationToast`).
5. **Wait for user confirmation ("go" / "proceed")** before executing generation code.

---

### Phase 1: Dual-Track Scriptwriting & Viral Retention

1. **The Dual-Track Hook Rule**:
   - **Spoken Hook**: What the narrator says (5–11 words, natural cadence, sayable under 3.0s).
   - **On-Screen Hook**: Blunt, high-contrast, read in 1 second before heard (3–6 words, e.g. `2 MILLION YEAR MISTAKE`).
2. **Hook Engineering (`assets/hooks.json`)**:
   - Score Line 0 using `python scripts/writer.py score-hook "<hook>"`. Must score $\ge 60$ (evaluating length, specificity, stakes, front-loaded payload, and direct address).
   - Recommended formulas: *Nobody Tells You*, *Cost Confession*, *Negative Command*, *The Red Flag*, *The Replacement*.
3. **Pacing Rules**:
   - 150–165 WPM. **A line is a CUT, not a sentence**. Split sentences into 1.5–3.5s cuts so the picture changes continuously. Never allow a static visual frame past 1.5s.
4. **Anti-Slop & Humanizer Gate**:
   - Run `python scripts/writer.py humanize draft.txt` to strip AI clichés (*delve, tapestry, crucial, testament, pivotal, game-changer*).
5. **The Closed Replay Loop**:
   - The final line must echo a root keyword from Line 0 so the video loops endlessly and seamlessly on Shorts/Reels/TikTok.
6. **`script.json` Schema**:
   > [!IMPORTANT]
   > `script.json` must be a JSON object containing the `lines` array (never a bare array):
   ```json
   {
     "title": "Why Do We Get Goosebumps?",
     "voice": "am_michael",
     "speed": 1.10,
     "lead": 0.45,
     "gap": 0.30,
     "outro": 0.90,
     "emotion_arc": ["shocked", "alarmed", "curious", "determined"],
     "lines": [
       {
         "text": "Nobody tells you goosebumps are a two million year mistake.",
         "caps": "*NOBODY tells you | goosebumps are a *TWO MILLION year mistake.",
         "emotion": "shocked",
         "intensity": 0.9,
         "mood": "tense"
       }
     ]
   }
   ```

---

### Phase 2: Local AI Voice & Word Alignment

Scaffold the project and run the audio pipeline:
```bash
# 1. Scaffold project directory
bash scripts/new_video.sh <style> <project-name>
cd ~/faceless-shorts/<project-name>

# 2. Generate Kokoro-82M ONNX speech (defaults to am_michael 1.10x)
python scripts/voice.py .

# 3. Align word timestamps using Whisper small.en
python scripts/words.py .
```
- Outputs: `data/narration.wav` (speech audio), `data/lines.json` (exact cut timings), `data/words.json` (word-by-word timestamp map).

---

### Phase 3: Three.js 3D Architecture, Characters & Cutaways

1. **Pure Three.js (ES Modules)**: Modular scene architecture, no primitive shapes for characters.
2. **GLTF Asset Loading**:
   - Load rooms from `assets/rooms/<ROOM>.glb` centered at $(0, 0, 0)$ with `receiveShadow = true`.
   - Load humanoid characters from `assets/characters/<CHAR>.glb` grounded at $y = 0$ with `castShadow = true`.
3. **Character & Outfit Configurator**:
   - Traverse loaded meshes (`child.isMesh`). Target shirt mesh/material to swap colors dynamically (`#2563EB`, `#DC2626`, `#059669`) across scenes for visual variety.
4. **Skeletal Animation & Secondary Motion**:
   - Extract `gltf.animations` into a `THREE.AnimationMixer`. Crossfade smoothly (`fadeIn(0.3)`) between clips (`Idle`, `Talk`, `Gesture`).
   - **NO T-POSES OR FROZEN LIMBS**: Character arms must perform expressive actions (shivering, facepalming, pointing, hugging arms, shrugging, holding props).
   - Add procedural life to bones: spine breathing sway (`Math.sin(t * 2.5) * 0.03`), subtle head tilt, and eye blink blendshapes (`morphTargetInfluences['blink']`).
5. **Strict No-3D-Text Rule**:
   - **DO NOT** place 3D `TextGeometry` or floating 3D text sprites near characters in world space where they clip into faces or limbs.
   - All subtitles, captions, and HUD elements must render in 2D HTML/CSS or 2D Canvas overlays.
6. **3D Anatomical Cutaway Best Practices**:
   - When building biological cross-sections (skin strata, organs, blood vessels, brain frisson):
   - **Do NOT enclose elements inside an opaque centered box.**
   - Model the cutaway block extending backwards from $z = 0$ into $-z$ (e.g. $z = 0$ to $z = -2.2$).
   - Mount active internal components (hair bulb, arrector pili muscle, sympathetic nerve fiber, sebaceous gland) directly on or slightly in front of the cut plane ($z = 0.02 - 0.05$) in full 3D relief so they are 100% visible to the camera.

---

### Phase 4: Camera Framing & Strict Guards (`src/core/framing.js`)

Implement camera moves using the framing grammar:
- **Framing Heights & FOV**:
  - Keep camera FOV between $40^\circ$ and $45^\circ$ to prevent wide-angle distortion.
  - Position camera at eye-level or chest height, aimed at upper chest/shoulders (`(0, 1.4, 0)`), never inside the head mesh.
- **Named Shot Sizes**:
  - `WIDE`: Full body + wide environment ($15–25\%$ of runtime).
  - `MEDIUM`: Head-to-toe full body, arms and hands clearly visible (**DEFAULT**, $40–50\%$).
  - `MEDIUM_CU`: Waist-up, hands still visible in gestures ($15–20\%$).
  - `CLOSE`: Head and shoulders ONLY for emotional peaks (max **1.5s** duration).
  - `EXTREME`: Macro insert (eyes, phone screen, needle, follicle) (max **1.0s** duration).
- **Sequence Grammar & Automated Guards**:
  - **$\ge 60\%$ Full Body**: Combined `WIDE` + `MEDIUM` must exceed $60\%$ of total cuts.
  - **No Consecutive Close Shots**: After any `CLOSE` or `EXTREME`, the next shot **must** return to `MEDIUM` or `WIDE`.
  - **Hand Tracking**: During arm animations, hand bone screen coordinates must remain within bounds ($[0, 1]$ screen space).

---

### Phase 5: Remocn Programmatic Motion Graphics (`src/core/remocn_canvas.js`)

Overlay 2D motion graphics onto the video using Remocn canvas primitives:
- `REMOCN.glitchText(ctx, text, lt, opts)`: Chromatic glitch entry for hooks and shocking revelations.
- `REMOCN.shimmerText(ctx, text, lt, opts)`: Gleaming metallic text sweep for key anatomical and character titles.
- `REMOCN.rollingNumber(ctx, start, end, lt, opts)`: Animated counters for temperatures, percentages, and dollar amounts.
- `REMOCN.progressHUD(ctx, opts)`: Sleek horizontal telemetry meter (adrenaline surge, timer, battery level).
- `REMOCN.markerHighlight(ctx, text, lt, opts)`: Animated highlighter bar revealing keywords.
- `REMOCN.notificationToast(ctx, opts)`: Floating iOS/social media notification cards.
- `REMOCN.deviceMockup(ctx, opts)`: 3D-angled smartphone screen displaying text messages or alerts.
- **Safe Zone Rule**: Center captions in the lower third ($y = 1250–1550$ in $1080\times 1920$). Keep top $15\%$ and bottom $15\%$ free of interactive UI.

---

### Phase 6: Sound Design & Procedural Audio Engine

```bash
# 1. Extract visual sound cues from shots.js
node tools/capture.mjs cues

# 2. Synthesize master audio mix
python tools/mix.py .
```
- `data/cues.json`: Captures time-stamped visual triggers (`whoosh`, `thud`, `pop`, `sparkle`, `alarm`, `slide`).
- `tools/mix.py`: Ducks background lo-fi music by $-14\text{ dB}$ during speech, synthesizes procedural SFX, and blends everything into master `data/mix.wav`.

---

### Phase 7: Verification & Contact Sheet QA (Mandatory Gate)

Run the pre-flight checks:
```bash
# 1. Verify framing guards, durations, and shot grammar
node tools/capture.mjs check
# Must output: "FRAMING GUARD: OK" and "CHECK OK"

# 2. Render 36-frame contact sheet
node tools/capture.mjs sheet review/all.jpg 1.8 8
```
- **Visual Inspection**: Read the contact sheet image using your file inspection tool.
  - Verify character arms are moving (no static pose across consecutive cuts).
  - Confirm the camera is framed at upper chest/waist level, not suffocating the face.
  - Verify that 3D cutaways and props are fully visible and not hidden behind opaque walls.
  - Confirm captions are legible and have yellow highlight pops on spoken words.

---

### Phase 8: Final Rendering & Delivery

```bash
# 1. Render 720p draft preview (quick verification)
node tools/capture.mjs video renders/test_720.mp4 --720 --draft

# 2. Render broadcast-quality 1080x1920 master video
node tools/capture.mjs video renders/<project-name>.mp4
```

**Delivery Package**:
Present the finished short to the user with clickable `file:///` links:
1. **Master Video (1080×1920 @ 30fps)**: `file:///path/to/renders/<project-name>.mp4`
2. **Draft Preview (720×1280)**: `file:///path/to/renders/test_720.mp4`
3. **Contact Sheet**: `file:///path/to/review/all.jpg`
4. **Master Audio Mix**: `file:///path/to/data/mix.wav`
5. **Production Summary Report**: Write a clean markdown delivery report artifact.

---

## 4. Troubleshooting & Golden Rules

- **Windows Paths**: Use forward slashes in JS ES module imports (`./core/sets.js`). When calling shell commands with paths containing spaces, wrap them in double quotes.
- **Headless Chrome Cleanup**: On Windows, wrap temporary Chrome profile directory deletion in a `try/catch` with a $400\text{ms}$ delay to avoid `EPERM` file locking.
- **Script Schema Safeguard**: `scripts/voice.py` and `scripts/words.py` support both `{ "lines": [...] }` and bare `[...]`, but always author `script.json` as an object with `title`, `voice`, and `lines`.
- **Never Use Delta In Animation**: Never use `delta` or `requestAnimationFrame` accumulators in `draw(lt, d, t)`. Every transformation, position, rotation, and opacity must be a deterministic closed-form function of local time `lt` or film time `t`.
