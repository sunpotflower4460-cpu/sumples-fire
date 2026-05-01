# Animation Spec — Burning Engine (Phase 18.5)

## Overview

The Burning Engine provides a 4-phase, 4200 ms animated overlay for the "Fire Task"
burn ritual. Implemented with **Framer Motion v12** (Motion) + **Web Audio API**.

---

## Phase Timing

| Time (ms)   | Phase        | Visual                                              | Audio                  |
|-------------|--------------|-----------------------------------------------------|------------------------|
| 0 – 800     | `ignite`     | Overlay fades in; title appears; background flashes | 着火音 (ignition snap) |
| 800 – 2600  | `burning`    | Flames at full intensity; SVG turbulence distortion | 激しい燃焼音            |
| 2600 – 3400 | `carbonizing`| Flames settle; overlay dims (brightness 0.75)       | 炭化音 + 鎮火音         |
| 3400 – 4200 | `complete`   | Reward badge pops; spectacle burst (special only)   | 報酬音 + 特別SE         |

**`prefers-reduced-motion`:** all durations × 0.25 (total ≈ 1050 ms).  
**Sound sync target:** ≤ 50 ms offset (Web Audio API scheduling + same render frame).

---

## Custom Hooks

### `useBurnSequence` — `src/hooks/useBurnSequence.ts`

Orchestrates the four-phase visual sequence.

```ts
const { phase, scope, triggerBurn, shouldReduceMotion } = useBurnSequence();
```

| Return       | Type                   | Description                                       |
|--------------|------------------------|---------------------------------------------------|
| `phase`      | `BurnPhase`            | Current phase: `ignite \| burning \| carbonizing \| complete` |
| `scope`      | `AnimationScope`       | Ref to attach to the root `motion.*` element      |
| `triggerBurn`| `() => Promise<void>`  | Start the sequence (idempotent — runs once)       |
| `shouldReduceMotion` | `boolean`    | True when OS reduce-motion is set                 |

- Uses `useAnimate()` to dim the overlay (`brightness(0.75)`) in the carbonizing phase.
- Uses `useReducedMotion()` from Framer Motion for system preference detection.

### `useFireParticles` — `src/hooks/useBurnSequence.ts`

Manages JS-driven particle bursts for special effects.

```ts
const { particles, burst } = useFireParticles(count);
```

| Param / Return | Type              | Description                            |
|----------------|-------------------|----------------------------------------|
| `count`        | `number`          | Desired particle count (capped at 120) |
| `particles`    | `FireParticle[]`  | Active particle descriptors            |
| `burst()`      | `() => void`      | Emits a new burst; auto-clears at 2.2 s |

Each `FireParticle` has `{ id, x, angle, delay, size }` — render with `motion.span`.

---

## Animation Constants — `src/lib/fireAnimationConstants.ts`

| Constant             | Value                                   | Use                                  |
|----------------------|-----------------------------------------|--------------------------------------|
| `FIRE_SPRING`        | `{ stiffness: 80, damping: 12, mass: 0.8 }` | Organic fire wobble                |
| `REWARD_SPRING`      | `{ stiffness: 140, damping: 14, mass: 0.5 }` | Snappy reward pop                 |
| `BURST_SPRING`       | `{ stiffness: 120, damping: 10, mass: 0.6 }` | Spectacle burst ring              |
| `BURN_EASE`          | `[0.22, 1, 0.36, 1]`                   | Smooth ignition transitions          |
| `CARBONIZE_EASE`     | `[0.4, 0, 0.8, 1]`                     | Slow, heavy settle                   |
| `BURN_TIMING`        | `{ IGNITE_END: 800, BURNING_END: 2600, CARBONIZING_END: 3400, COMPLETE_END: 4200 }` | Phase timestamps |
| `REDUCED_MOTION_FACTOR` | `0.25`                              | Duration multiplier for reduced-motion |

---

## Special Variants — `src/lib/specialVariants.ts`

All Framer Motion `Variants` objects for the burning overlay.

| Export                   | Element             | Phase keys used                        |
|--------------------------|---------------------|----------------------------------------|
| `overlayVariants`        | Root overlay        | `hidden / visible / exit`              |
| `titleVariants`          | `motion.h2` title   | `ignite / burning / carbonizing / complete` |
| `rewardVariants`         | Reward badge        | `hidden / visible / exit`              |
| `spectacleBurstVariants` | Burst ring          | `hidden / visible / exit`              |
| `phaseLabelVariants`     | Phase text          | `hidden / visible / exit`              |
| `difficultyVariants`     | Flavour text        | `hidden / visible / exit`              |
| `specialVariantConfigs`  | Per-spectacle data  | `titleGlow`, `particleCount`, `burstScale` |

---

## `BurningRitual` Component — `src/components/BurningRitual.tsx`

Renders a full-screen burning overlay via `createPortal(overlay, document.body)`.

**Framer Motion element budget (max 7):**

| # | Element             | Role                                 |
|---|---------------------|--------------------------------------|
| 1 | `motion.div` (root) | Fade-in entrance; `useAnimate` scope |
| 2 | `motion.div`        | Spectacle burst ring (AnimatePresence) |
| 3 | `motion.p`          | Phase label (AnimatePresence key=phase) |
| 4 | `motion.h2`         | Task title with phase variants       |
| 5 | `motion.div`        | Reward badge (AnimatePresence)       |
| 6 | `motion.p`          | Difficulty / flavour text (AnimatePresence) |

**SVG filter:** `url(#fm-fire-distort)` is applied to `.ritual-title-wrapper` during
the `burning` phase (disabled when `prefers-reduced-motion`). The filter uses
`feTurbulence` + `feDisplacementMap` with an animated `baseFrequency` to produce
realistic flame distortion.

**Spectacle CSS custom properties** set on the root `motion.div`:
`--flame-a`, `--flame-b`, `--flame-c`, `--bg-glow`, `--particle`, `--particle-shadow`.

---

## Special Effect Probabilities

| Effect        | Base probability | Streak boost |
|---------------|------------------|--------------|
| Normal 炎     | 55 %             | −0.6 / streak |
| 黄金の炎       | 7 %              | +0.25 / streak |
| 桜の火        | 6 %              | +0.1 / streak |
| 鬼火           | 4 %              | +0.35 / streak |
| 爆炎 (heavy/boss) | 10 % / 3 %    | —            |
| 鉄の火        | 3 %              | +0.15 / streak |
| 龍の炎        | 2 %              | +0.2 / streak |
| 虚空の火       | 1.5 %            | +0.1 / streak |
| フェニックス  | 0.4 % (boss: 2 %) | —           |

Implemented in `src/lib/fireBurnSpectacle.ts → selectBurnSpectacle()`.

---

## Performance Guidelines

- **Particle budget:** ≤ 80 particles (≤ 120 for legendary spectacles).
- **`will-change: transform`** on `.ritual-flames i` and `.ritual-embers i`.
- Keep `motion.*` nesting shallow — avoid wrapping the same element in multiple
  `AnimatePresence` boundaries.
- Test target: **iPhone SE 3rd gen at 60 fps** stable across 3 consecutive legendaries.
