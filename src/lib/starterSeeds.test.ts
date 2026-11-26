import { describe, expect, it } from 'vitest';
import { createStarterSeeds, getFireSeedStats, getFocusSeed, normalizeSeed } from './fireSeedModel';

describe('optional starter templates', () => {
  let counter = 0;
  const seeds = createStarterSeeds(() => `starter-${(counter += 1)}`, '2026-09-24T00:00:00.000Z');

  it('adds only unburned tasks so no ash, history or streak is fabricated', () => {
    expect(seeds).toHaveLength(3);
    expect(seeds.every((seed) => !seed.burned && !seed.completed && !seed.isBurning && !seed.burnedAt)).toBe(true);
    expect(getFireSeedStats(seeds).totalAshPoints).toBe(0);
    expect(getFireSeedStats(seeds).burned).toBe(0);
  });

  it('uses fresh ids so templates behave like user-written tasks', () => {
    expect(new Set(seeds.map((seed) => seed.id)).size).toBe(3);
    expect(seeds.some((seed) => seed.id.startsWith('sample-'))).toBe(false);
  });

  it('survives the storage normalizer unchanged and yields a focus task', () => {
    seeds.forEach((seed, index) => expect(normalizeSeed(seed, index)).toEqual(seed));
    expect(getFocusSeed(seeds)?.title).toBe('先延ばししていた返信をする');
  });
});
