# Master Scriptwriting & Viral Retention Guide

> **Synthesis of**:
> - `instagram-agent-skill` (`ig-reel`, `ig-human`, `ig-viral`, `ig-caption`)
> - `marketingskills` (`copywriting`, `marketing-psychology`, `video`)
> - `Remocn` motion component mapping (`https://github.com/Remocn/remocn`)

This guide governs all scriptwriting, hook generation, and narrative pacing across every video style in the engine.

---

## 1. The Core Philosophy: Decided in 2 Seconds, Kept in 5

A short-form video (Shorts, Reels, TikTok) is won or lost before second three:
- **0:00 – 0:02 (The Hook)**: The claim, question, or pattern interrupt. Motion in the very first frame. Spoken line and on-screen line written separately.
- **0:02 – 0:07 (The Stake)**: Why this matters to the viewer *right now*. One line establishing loss aversion, cost, or curiosity gap.
- **0:07 – Payoff (The Body)**: One concrete idea per cut. The frame or camera angle changes every 1.5–3.5s. Never stay on one static frame past 4.0s.
- **Last 3s (The Payoff & Loop)**: Deliver on the hook's promise, followed by an echo loop where the last word echoes a word from the opening hook for seamless replay.

---

## 2. Hook Engineering: 26 Formulas & 5-Factor Scoring

### The Dual-Track Hook Rule
A video has **two hooks** that fire simultaneously:
1. **Spoken Hook**: What the narrator says (~2 seconds, 5–11 words, natural spoken cadence).
2. **On-Screen Hook**: What is rendered on screen (blunt, bold, 3–6 words, high-contrast, read in 1 second before heard).

*Example*:
- **Spoken**: *"Six years. Then you find the messages."*
- **On-Screen**: `6 YEARS SHATTERED`

### The 26 Proven Hook Formulas
Selected top performers from `assets/hooks.json`:

| Category | Formula Name | Spoken Template | On-Screen Text | Best For |
| :--- | :--- | :--- | :--- | :--- |
| **Stakes / Cost** | **Cost Confession** | *"{Specific amount} is what {one mistake} cost me."* | `$18,000 MISTAKE` | Instant trust; high vulnerability |
| **Imperative** | **Negative Command** | *"Stop {common action}. Do {alternative} instead."* | `STOP DOING THIS` | Saves & pattern interrupts |
| **Truth** | **Nobody Tells You** | *"Nobody tells you that {uncomfortable truth}."* | `THE TRUTH ABOUT X` | Counter-intuitive discoveries |
| **Comparison** | **The Replacement** | *"{Cheap thing} replaced {expensive thing} for {price}."* | `$2,000 -> $12` | Life hacks, tool demos |
| **Curiosity** | **The Specific Test** | *"I tested {X} for {time} so you don't have to."* | `TESTED FOR 30 DAYS` | Proof & experiment breakdowns |
| **Warning** | **The Red Flag** | *"If they say {exact phrase}, walk away immediately."* | `MASSIVE RED FLAG` | Dating, contracts, negotiations |
| **Inversion** | **The Anti-Goal** | *"Here is how to guarantee you stay broke at 30."* | `HOW TO STAY BROKE` | Reverse psychology |

### The 5-Factor Hook Scoring Formula (`python scripts/writer.py score-hook`)
Hooks are mathematically scored 0–100 before drafting:
1. **Length (25%)**: 5–11 words (sayable in under 3.0s).
2. **Specificity (20%)**: Contains at least 1 concrete marker (digits, spoken numbers like *forty-seven*, currency, or named nouns).
3. **Stakes (25%)**: Contains active tension/conflict markers (*mistake, lost, cost, fail, never, secret, danger, regret, wound*).
4. **Front-Loaded Payload (15%)**: Core topic hits in the first 3 words. Zero wasted greetings (*"Hey guys", "So today", "In this video"*).
5. **Direct Address (15%)**: Aimed at the viewer (*"you", "your"*) or opens with a strong imperative verb (*"Stop", "Write", "Check"*).

**Dealbreakers (Instant Fail)**:
- *"Stop scrolling"* (proves you haven't earned attention).
- *"Wait till the end"* (cheap teasing that increases swipe rate).
- *"In this video I'm going to show you..."* (deadly corporate preamble).

---

## 3. Conversion Copywriting Principles

Adapted from expert direct-response copywriting and marketing psychology:

### The Three-Question Gate
Every single line in `script.json` must pass:
1. **Can the viewer picture it?** (Concrete objects, actions, and scenes beat vague abstractions).
   - *Bad*: "He experienced deep emotional turmoil."
   - *Good*: "You text her forty-seven times at two a.m."
2. **Can it be proven true or false?** (Falsifiable claims beat hollow buzzwords).
   - *Bad*: "This is a revolutionary, game-changing mindset."
   - *Good*: "Day one hurts. Day thirty hurts less. Day ninety, you laugh."
3. **The Swap Test**: Could another creator or competitor say this exact sentence? If yes, it fails. Infuse specific personal framing.

### Psychological Levers
- **Loss Aversion**: Pain of losing something hurts 2.5× more than the pleasure of gaining it. Frame early attempts around what is lost (*self-respect, time, money*).
- **The Contrast Effect**: Anchor a bad baseline before revealing the solution (Attempt 1 vs Attempt 2 vs Attempt 3).
- **Cognitive Simplicity**: Exactly **one idea per cut**. Never stack multiple arguments into a single sentence.

---

## 4. Timed Beat Sheet & Replay Loop Rules

Run `python scripts/writer.py audit-script script.json`:
- **Pacing Rate**: 150–165 WPM.
- **Cut Duration**: Every line in `script.json` represents a visual cut lasting **1.5s to 3.5s**. Any line exceeding 3.8s must be split into two sub-cuts.
- **Abstract Run Limit**: No more than 2 consecutive lines without a concrete noun, number, or prop.
- **The Replay Loop**: The final line must echo a root keyword from Line 0. When the platform loops the video, the ending connects smoothly into the beginning.

---

## 5. Anti-Slop & Humanizer Gate

All drafts are audited via `python scripts/writer.py humanize` and `detect-slop`:

### 1. Invisible Character Elimination
Strips zero-width joiners, byte-order marks, soft hyphens, and narrow spaces that flag machine-generated drafts.

### 2. Typographic Normalization
Converts mechanical em-dashes (`—`) into natural spoken commas, straightens quotes, and cleans double punctuation.

### 3. Slop Lexicon Replacements
Replaces stock AI jargon with conversational English:
- *delve* → *look into* / *dig*
- *leverage* → *use*
- *robust* → *solid* / *strong*
- *crucial* → *important*
- *testament to* → *proof that*
- *in today's fast-paced world* → *right now*
- *it's not just X, it's Y* → (flagged for manual rewrite)

### 4. 5-Signal Detection Score (Target $\ge 70$ Human Pass)
- **Burstiness**: Variation in sentence lengths (combats monotonous AI sentence rhythm).
- **Specificity**: Density of numbers, proper nouns, and tangible items.
- **Slop Density**: Frequency of AI vocabulary.
- **Fingerprint**: Typographical perfection vs authentic human input.
- **Voice**: Presence of natural contractions (*you're, don't, that's*) and spoken rhythm.

---

## 6. Remocn Motion Component Mapping

Every script line should specify its accompanying visual component from Remocn (`https://github.com/Remocn/remocn` or `src/core/remocn_canvas.js`):

| Script Moment | Remocn Visual Component | Effect |
| :--- | :--- | :--- |
| **Opening Hook** | `REMOCN.shimmerText` / `BlurReveal` | Polished metallic gleam / lens blur entrance |
| **Shock / Betrayal / Chaos** | `REMOCN.glitchText` | RGB red/cyan chromatic displacement |
| **Alert / Incoming Drama** | `REMOCN.notificationToast` | Spring-animated frosted glass message banner |
| **Statistics / Counts** | `REMOCN.rollingNumber` | Smooth rolling odometer counter |
| **Emphasis / Rule of Thumb** | `REMOCN.markerHighlight` | Highlighter pen stroke sliding behind keyword |
| **Technical / Code / Quotes** | `REMOCN.typewriter` | Monospace typing with pulsing cursor |
| **Hero Object Showcase** | `REMOCN.deviceMockup` | 3D-styled glass smartphone frame |
| **Healing / Progress Arc** | `REMOCN.progressHUD` | Glowing progress bar with dynamic percentage |

---

## 7. Companion Packaging: Viral Caption & Tags

After finalizing the script, output the companion post bundle:
- **Title**: High-curiosity headline under 60 characters.
- **Caption**:
  - Line 1: Hook (repeats or expands the spoken hook).
  - Lines 2–4: Insight body (the core lesson or transformation).
  - Line 5: Low-friction CTA (*"Save this for when you need it"*).
  - Hashtags: 5–8 targeted hashtags (3 niche, 2 broad, 1 brand).
