import { describe, expect, it } from 'vitest';
import {
  BURN_SEQUENCE_DURATION,
  BURN_TIMING,
  getBurnSequenceDuration,
} from './fireAnimationConstants';

describe('fireAnimationConstants', () => {
  it('keeps burn phases ordered inside a three-second ritual', () => {
    expect(BURN_TIMING.IGNITE_END).toBeLessThan(BURN_TIMING.BURNING_END);
    expect(BURN_TIMING.BURNING_END).toBeLessThan(BURN_TIMING.CARBONIZING_END);
    expect(BURN_TIMING.CARBONIZING_END).toBeLessThan(BURN_TIMING.COMPLETE_END);
    expect(BURN_SEQUENCE_DURATION).toBe(3000);
  });

  it('keeps reduced-motion completion synchronized to about one second', () => {
    expect(getBurnSequenceDuration(false)).toBe(BURN_SEQUENCE_DURATION);
    expect(getBurnSequenceDuration(true)).toBe(1050);
  });
});
