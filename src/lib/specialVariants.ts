import type { Variants } from 'framer-motion';
import type { BurnSpectacleType } from './fireBurnSpectacle';
import {
  BURN_EASE,
  BURST_SPRING,
  CARBONIZE_EASE,
  FIRE_SPRING,
  REWARD_SPRING,
  SPECTACLE_BURST_DURATION_S,
} from './fireAnimationConstants';

/** Per-spectacle glow and particle configuration */
export type SpecialVariantConfig = {
  titleGlow: string;
  particleCount: number;
  burstScale: number;
};

export const specialVariantConfigs: Record<BurnSpectacleType, SpecialVariantConfig> = {
  normal:      { titleGlow: 'drop-shadow(0 0 22px rgba(255,107,0,0.82))',    particleCount: 40, burstScale: 1.15 },
  blueGhost:   { titleGlow: 'drop-shadow(0 0 26px rgba(50,160,255,0.92))',   particleCount: 44, burstScale: 1.3 },
  golden:      { titleGlow: 'drop-shadow(0 0 30px rgba(232,185,35,0.96))',   particleCount: 52, burstScale: 1.4 },
  explosion:   { titleGlow: 'drop-shadow(0 0 34px rgba(255,107,0,0.96))',    particleCount: 64, burstScale: 1.85 },
  dragon:      { titleGlow: 'drop-shadow(0 0 32px rgba(180,60,255,0.92))',   particleCount: 56, burstScale: 1.6 },
  cherry:      { titleGlow: 'drop-shadow(0 0 24px rgba(230,130,180,0.88))',  particleCount: 42, burstScale: 1.2 },
  ironFire:    { titleGlow: 'drop-shadow(0 0 28px rgba(100,180,255,0.92))',   particleCount: 40, burstScale: 1.3 },
  voidFire:    { titleGlow: 'drop-shadow(0 0 30px rgba(160,50,240,0.9))',    particleCount: 46, burstScale: 1.4 },
  phoenixRise: { titleGlow: 'drop-shadow(0 0 42px rgba(232,185,35,1))',      particleCount: 80, burstScale: 2.05 },
};

/** Overlay entrance / exit (managed by AnimatePresence in App.tsx) */
export const overlayVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.28, ease: BURN_EASE } },
  exit:    { opacity: 0, transition: { duration: 0.45, ease: CARBONIZE_EASE } },
};

/**
 * Title text variants keyed to BurnPhase values.
 * Note: does NOT include a CSS `filter` property so that the SVG
 * displacement filter applied to a wrapper element does not conflict.
 */
export const titleVariants: Variants = {
  ignite: {
    opacity: 1,
    scale: 1.06,
    y: 0,
    transition: { duration: 0.32, ease: BURN_EASE },
  },
  burning: {
    opacity: 0.96,
    scale: 1.03,
    transition: { ...FIRE_SPRING },
  },
  carbonizing: {
    opacity: 0.58,
    scale: 0.95,
    transition: { duration: 0.5, ease: CARBONIZE_EASE },
  },
  complete: {
    opacity: 0.4,
    scale: 0.9,
    transition: { duration: 0.4, ease: CARBONIZE_EASE },
  },
};

/** Reward badge — spring pop-in */
export const rewardVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.62, y: 22 },
  visible: { opacity: 1, scale: 1,    y: 0,  transition: { ...REWARD_SPRING } },
  exit:    { opacity: 0, scale: 0.88, y: -8, transition: { duration: 0.18, ease: CARBONIZE_EASE } },
};

/** Spectacle burst ring — kept inside the complete phase. */
export const spectacleBurstVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.2 },
  visible: {
    opacity: [0, 0.9, 0.5, 0],
    scale:   [0.2, 1, 1.5, 2.2],
    transition: { ...BURST_SPRING, duration: SPECTACLE_BURST_DURATION_S, times: [0, 0.25, 0.6, 1] },
  },
  exit: { opacity: 0, transition: { duration: 0.08 } },
};

/** Small phase label above the title */
export const phaseLabelVariants: Variants = {
  hidden:  { opacity: 0, y: -6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: BURN_EASE } },
  exit:    { opacity: 0, y:  4, transition: { duration: 0.12 } },
};

/** Difficulty / flavour text below the title */
export const difficultyVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.16 } },
  exit:    { opacity: 0, transition: { duration: 0.12 } },
};
