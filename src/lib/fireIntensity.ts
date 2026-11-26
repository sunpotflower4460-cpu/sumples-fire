import { BURN_TIMING, REDUCED_MOTION_FACTOR } from './fireAnimationConstants';

/** Everything a flame renderer needs to know about "how alive the fire is" right now. */
export type FireLook = {
  /** 0 = embers only, 1 = full burn, >1 = roaring. */
  intensity: number;
  /** Ignition flare: a bright flash hugging the base. */
  flash: number;
  /** Smoke that appears as the flame cools. */
  smoke: number;
  /** Embers emitted per second. */
  emberRate: number;
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOutCubic = (k: number) => 1 - (1 - k) ** 3;
const easeInQuad = (k: number) => k * k;
const smooth = (k: number) => k * k * (3 - 2 * k);

/**
 * The visual score of the burn ritual, authored in full-motion milliseconds and
 * scaled by the reduced-motion factor so it stays locked to the overlay clock.
 *
 *   ignite       gas flare → flames climb
 *   burning      full, restless flames
 *   carbonizing  flames die back, smoke rises
 *   complete     last glow fades into embers and smoke
 */
export const ritualLook = (elapsedMs: number, reduceMotion = false): FireLook => {
  const scale = reduceMotion ? REDUCED_MOTION_FACTOR : 1;
  const t = elapsedMs / scale;
  const { IGNITE_END, BURNING_END, CARBONIZING_END, COMPLETE_END } = BURN_TIMING;

  let intensity: number;
  let smoke: number;

  if (t < IGNITE_END) {
    const k = clamp01(t / IGNITE_END);
    intensity = 0.16 + 0.84 * easeOutCubic(k);
    smoke = 0;
  } else if (t < BURNING_END) {
    const k = (t - IGNITE_END) / (BURNING_END - IGNITE_END);
    intensity = 1 + 0.06 * Math.sin(k * Math.PI);
    smoke = 0.1 * smooth(k);
  } else if (t < CARBONIZING_END) {
    const k = (t - BURNING_END) / (CARBONIZING_END - BURNING_END);
    intensity = 1 - 0.72 * easeInQuad(k);
    smoke = 0.1 + 0.7 * smooth(k);
  } else {
    const k = clamp01((t - CARBONIZING_END) / (COMPLETE_END - CARBONIZING_END));
    intensity = 0.28 * (1 - smooth(k));
    smoke = 0.8 - 0.3 * smooth(k);
  }

  // The flare is brief: it peaks ~120 ms in and is gone by ~480 ms.
  const flashK = clamp01(t / 480);
  const flash = t < 480 ? Math.sin(Math.PI * Math.min(1, flashK * 1.9)) ** 2 * (1 - flashK) : 0;

  return {
    intensity: Math.max(0, intensity),
    flash,
    smoke,
    emberRate: 8 + 78 * Math.max(0, intensity) ** 1.4 + flash * 90,
  };
};

/** A living campfire: a steady flame whose size follows the campfire stage. */
export const CAMPFIRE_STAGE_INTENSITY = [0.5, 0.64, 0.78, 0.92, 1.06, 1.2] as const;

export const campfireLook = (stage: number, flare = 0): FireLook => {
  const base = CAMPFIRE_STAGE_INTENSITY[Math.min(CAMPFIRE_STAGE_INTENSITY.length - 1, Math.max(0, stage))];
  const intensity = base + flare * 0.45;
  return {
    intensity,
    flash: flare * 0.55,
    smoke: 0.08 + stage * 0.025,
    emberRate: 3 + stage * 2.4 + flare * 70,
  };
};
