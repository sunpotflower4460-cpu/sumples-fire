import { describe, expect, it } from 'vitest';
import { releaseKeyframes } from './flameRelease';

describe('flame release direction', () => {
  const particle = { angle: 24, x: 37, size: 4 };

  it('draws sparks into the void and away from an explosion', () => {
    const distances = (flight: 'inward' | 'outward') => {
      const { x, y } = releaseKeyframes(flight, particle, 1.3);
      return x.map((offset, index) => Math.hypot(offset, y[index]));
    };
    const inward = distances('inward');
    const outward = distances('outward');
    expect(inward[0]).toBeGreaterThan(inward[1]);
    expect(inward[1]).toBeGreaterThan(inward[2]);
    expect(outward[0]).toBeLessThan(outward[1]);
    expect(outward[1]).toBeLessThan(outward[2]);
  });

  it('lets star rain and petals fall while ordinary embers rise', () => {
    for (const flight of ['shower', 'flutter'] as const) {
      const { y } = releaseKeyframes(flight, particle, 1.3);
      expect(y[2]).toBeGreaterThan(y[0]);
    }
    const { y } = releaseKeyframes('updraft', particle, 1.3);
    expect(y[2]).toBeLessThan(y[0]);
  });
});
