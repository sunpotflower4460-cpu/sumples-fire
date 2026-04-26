import { describe, expect, it } from 'vitest';
import { createSampleSeeds, getFireSeedStats, getFocusSeed, normalizeSeed } from './fireSeedModel';
import type { FireSeed } from '../types/fireSeed';

const timestamp = '2026-04-26T00:00:00.000Z';

describe('fireSeedModel', () => {
  it('normalizes legacy seeds safely', () => {
    const seed = normalizeSeed(
      {
        title: '  古いメモ  ',
        body: '  本文  ',
        priority: 'high',
        completed: true,
        createdAt: timestamp,
      },
      0,
      timestamp,
    );

    expect(seed.title).toBe('古いメモ');
    expect(seed.body).toBe('本文');
    expect(seed.nextAction).toBe('');
    expect(seed.stage).toBe('flame');
    expect(seed.updatedAt).toBe(timestamp);
  });

  it('selects the highest-priority incomplete seed as focus', () => {
    const seeds: FireSeed[] = [
      { ...createSampleSeeds(timestamp)[0], id: 'low', priority: 'low', completed: false },
      { ...createSampleSeeds(timestamp)[1], id: 'done', priority: 'high', completed: true },
      { ...createSampleSeeds(timestamp)[2], id: 'focus', priority: 'high', completed: false },
    ];

    expect(getFocusSeed(seeds)?.id).toBe('focus');
  });

  it('calculates dashboard stats', () => {
    const seeds = createSampleSeeds(timestamp);
    const stats = getFireSeedStats(seeds);

    expect(stats.total).toBe(3);
    expect(stats.active).toBe(2);
    expect(stats.completed).toBe(1);
    expect(stats.high).toBe(1);
    expect(stats.flame).toBe(1);
  });
});
