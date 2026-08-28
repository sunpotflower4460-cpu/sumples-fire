import type { SpringOptions, Transition } from 'framer-motion';

/** Natural fire wobble — stiffness/damping tuned for organic movement */
export const FIRE_SPRING: SpringOptions = {
  stiffness: 80,
  damping: 12,
  mass: 0.8,
};

/** Reward pop — snappy and satisfying */
export const REWARD_SPRING: SpringOptions = {
  stiffness: 140,
  damping: 14,
  mass: 0.5,
};

/** Spectacle burst spring */
export const BURST_SPRING: SpringOptions = {
  stiffness: 120,
  damping: 10,
  mass: 0.6,
};

/** Smooth ignition easing */
export const BURN_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Carbonize — slow and heavy */
export const CARBONIZE_EASE: [number, number, number, number] = [0.4, 0, 0.8, 1];

/**
 * Phase timing in milliseconds.
 * The full ritual is intentionally kept at 3 seconds: long enough to feel
 * ceremonial, short enough to repeat during everyday task completion.
 */
export const BURN_TIMING = {
  IGNITE_END: 500,
  BURNING_END: 1700,
  CARBONIZING_END: 2300,
  COMPLETE_END: 3000,
} as const;

export const BURN_SEQUENCE_DURATION = BURN_TIMING.COMPLETE_END;

/** Reduced-motion keeps the semantic phases but completes in about one second. */
export const REDUCED_MOTION_FACTOR = 0.35;

export const getBurnSequenceDuration = (reduceMotion: boolean) => Math.round(
  BURN_SEQUENCE_DURATION * (reduceMotion ? REDUCED_MOTION_FACTOR : 1),
);

export const IGNITE_TRANSITION: Transition = {
  duration: 0.3,
  ease: BURN_EASE,
};

export const PHASE_LABEL_TRANSITION: Transition = {
  duration: 0.18,
  ease: BURN_EASE,
};
