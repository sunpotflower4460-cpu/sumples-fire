import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnimate, useReducedMotion } from 'framer-motion';
import {
  BURN_TIMING,
  CARBONIZE_EASE,
  PARTICLE_BURST_CLEAR_MS,
  PARTICLE_BURST_MAX_DELAY_MS,
  REDUCED_MOTION_FACTOR,
} from '../lib/fireAnimationConstants';

export type BurnPhase = 'ignite' | 'burning' | 'carbonizing' | 'complete';

export interface BurnConfig {
  difficulty: 'small' | 'normal' | 'heavy' | 'boss';
  specialEffect?: string | null;
  streak: number;
}

const sleep = (ms: number) => new Promise<void>((resolve) => { window.setTimeout(resolve, ms); });

/**
 * useBurnSequence — orchestrates the 4-phase visual burn sequence.
 *
 * Phase timing (full motion):
 *   ignite      (0 – 500 ms)     overlay fades in, title appears
 *   burning     (500 – 1700 ms)  intense flames, text distortion, particles
 *   carbonizing (1700 – 2300 ms) flames settle, edges char, brightness dims
 *   complete    (2300 – 3000 ms) reward badge pops, spectacle burst
 *
 * Respects prefers-reduced-motion: all durations scale to 35%, keeping the
 * same semantic phases while reducing the full sequence to about one second.
 * Use the returned `scope` ref on the root motion element.
 */
export function useBurnSequence() {
  const [phase, setPhase] = useState<BurnPhase>('ignite');
  const [scope, animate] = useAnimate();
  const shouldReduceMotion = useReducedMotion() ?? false;
  const hasRun = useRef(false);

  const triggerBurn = useCallback(async () => {
    if (hasRun.current || !scope.current) return;
    hasRun.current = true;

    const f = shouldReduceMotion ? REDUCED_MOTION_FACTOR : 1;

    setPhase('ignite');
    await sleep(BURN_TIMING.IGNITE_END * f);

    setPhase('burning');
    await sleep((BURN_TIMING.BURNING_END - BURN_TIMING.IGNITE_END) * f);

    setPhase('carbonizing');
    const carbonizeDurS = 0.6 * f;
    await animate(
      scope.current,
      { filter: 'brightness(0.75)' },
      { duration: carbonizeDurS, ease: CARBONIZE_EASE },
    );
    const remainingCarbonizeMs = Math.max(
      0,
      (BURN_TIMING.CARBONIZING_END - BURN_TIMING.BURNING_END) * f - carbonizeDurS * 1000,
    );
    await sleep(remainingCarbonizeMs);

    setPhase('complete');
    await sleep((BURN_TIMING.COMPLETE_END - BURN_TIMING.CARBONIZING_END) * f);
  }, [scope, animate, shouldReduceMotion]);

  return { phase, scope, triggerBurn, shouldReduceMotion };
}

export type FireParticle = {
  id: number;
  x: number;
  angle: number;
  delay: number;
  size: number;
};

/**
 * useFireParticles — generates the completion particle burst.
 *
 * The hook keeps a defensive cap of 120 particles; current spectacle configs
 * top out at 80. Delays are clustered into the opening milliseconds so every
 * particle can be seen before the complete phase ends.
 */
export function useFireParticles(count: number) {
  const [particles, setParticles] = useState<FireParticle[]>([]);
  const idRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
  }, []);

  const burst = useCallback(() => {
    const safeCount = Math.min(count, 120);
    const next: FireParticle[] = Array.from({ length: safeCount }, () => ({
      id: (idRef.current += 1),
      x: 5 + Math.random() * 90,
      angle: -70 + Math.random() * 140,
      delay: Math.random() * PARTICLE_BURST_MAX_DELAY_MS,
      size: 2 + Math.random() * 5,
    }));
    setParticles(next);

    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setParticles([]);
      timerRef.current = null;
    }, PARTICLE_BURST_CLEAR_MS);
  }, [count]);

  return { particles, burst };
}
