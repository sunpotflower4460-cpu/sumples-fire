import { describe, expect, it } from 'vitest';
import {
  BURN_SEQUENCE_DURATION,
  BURN_TIMING,
  COMPLETE_PHASE_DURATION_MS,
  PARTICLE_BURST_DURATION_S,
  PARTICLE_BURST_MAX_DELAY_MS,
  SPECTACLE_BURST_DURATION_S,
  getBurnSequenceDuration,
} from './fireAnimationConstants';

describe('fireAnimationConstants', () => {
  it('keeps burn phases ordered inside a three-second ritual', () => {
    expect(BURN_TIMING.IGNITE_END).toBeLessThan(BURN_TIMING.BURNING_END);
    expect(BURN_TIMING.BURNING_END).toBeLessThan(BURN_TIMING.CARBONIZING_END);
    expect(BURN_TIMING.CARBONIZING_END).toBeLessThan(BURN_TIMING.COMPLETE_END);
    expect(BURN_SEQUENCE_DURATION).toBe(3000);
    expect(COMPLETE_PHASE_DURATION_MS).toBe(700);
  });

  it('keeps reduced-motion completion synchronized to about one second', () => {
    expect(getBurnSequenceDuration(false)).toBe(BURN_SEQUENCE_DURATION);
    expect(getBurnSequenceDuration(true)).toBe(1050);
  });

  it('fits visible completion effects inside the complete phase', () => {
    expect(PARTICLE_BURST_MAX_DELAY_MS + PARTICLE_BURST_DURATION_S * 1000)
      .toBeLessThanOrEqual(COMPLETE_PHASE_DURATION_MS);
    expect(SPECTACLE_BURST_DURATION_S * 1000)
      .toBeLessThanOrEqual(COMPLETE_PHASE_DURATION_MS);
  });
});
