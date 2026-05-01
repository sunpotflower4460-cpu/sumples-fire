import type { Variants } from 'framer-motion';
import type { BurnSpectacleType } from './fireBurnSpectacle';
import { BURN_EASE, BURST_SPRING, CARBONIZE_EASE, FIRE_SPRING, REWARD_SPRING } from './fireAnimationConstants';

/** Per-spectacle glow and particle configuration */
export type SpecialVariantConfig = {
  titleGlow: string;
  particleCount: number;
  burstScale: number;
};

export const specialVariantConfigs: Record<BurnSpectacleType, SpecialVariantConfig> = {
  normal:      { titleGlow: 'drop-shadow(0 0 20px rgba(255,100,30,0.8))',   particleCount: 20, burstScale: 1.0 },
  blueGhost:   { titleGlow: 'drop-shadow(0 0 24px rgba(50,160,255,0.9))',   particleCount: 30, burstScale: 1.2 },
  golden:      { titleGlow: 'drop-shadow(0 0 28px rgba(255,220,50,0.95))',  particleCount: 40, burstScale: 1.3 },
  explosion:   { titleGlow: 'drop-shadow(0 0 32px rgba(255,80,20,0.95))',   particleCount: 60, burstScale: 1.8 },
  dragon:      { titleGlow: 'drop-shadow(0 0 30px rgba(180,60,255,0.9))',   particleCount: 50, burstScale: 1.6 },
  cherry:      { titleGlow: 'drop-shadow(0 0 22px rgba(230,130,180,0.85))', particleCount: 35, burstScale: 1.1 },
  ironFire:    { titleGlow: 'drop-shadow(0 0 26px rgba(100,180,255,0.9))',  particleCount: 30, burstScale: 1.2 },
  voidFire:    { titleGlow: 'drop-shadow(0 0 28px rgba(160,50,240,0.88))',  particleCount: 35, burstScale: 1.3 },
  phoenixRise: { titleGlow: 'drop-shadow(0 0 40px rgba(255,200,50,0.99))',  particleCount: 80, burstScale: 2.0 },
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
    scale: 1,
    transition: { duration: 0.4, ease: BURN_EASE },
  },
  burning: {
    opacity: 0.95,
    scale: 1.02,
    transition: { ...FIRE_SPRING },
  },
  carbonizing: {
    opacity: 0.65,
    scale: 0.97,
    transition: { duration: 0.7, ease: CARBONIZE_EASE },
  },
  complete: {
    opacity: 0.5,
    scale: 0.93,
    transition: { duration: 0.5, ease: CARBONIZE_EASE },
  },
};

/** Reward badge — spring pop-in */
export const rewardVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.72, y: 16 },
  visible: { opacity: 1, scale: 1,    y: 0,  transition: { ...REWARD_SPRING } },
  exit:    { opacity: 0, scale: 0.88, y: -8, transition: { duration: 0.25, ease: CARBONIZE_EASE } },
};

/** Spectacle burst ring */
export const spectacleBurstVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.2 },
  visible: {
    opacity: [0, 0.9, 0.5, 0],
    scale:   [0.2, 1, 1.5, 2.2],
    transition: { ...BURST_SPRING, duration: 1.4, times: [0, 0.25, 0.6, 1] },
  },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/** Small phase label above the title */
export const phaseLabelVariants: Variants = {
  hidden:  { opacity: 0, y: -6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: BURN_EASE } },
  exit:    { opacity: 0, y:  4, transition: { duration: 0.15 } },
};

/** Difficulty / flavour text below the title */
export const difficultyVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
};
