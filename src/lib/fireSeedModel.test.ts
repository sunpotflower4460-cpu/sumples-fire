import { describe, expect, it } from 'vitest';
import { burnSeed, createSampleSeeds, getFireSeedStats, getFocusSeed, normalizeSeed } from './fireSeedModel';
import type { FireSeed } from '../types/fireSeed';

const timestamp = '2026-04-26T00:00:00.000Z';

describe('fireSeedModel', () => {
  it('normalizes legacy seeds safely as burned tasks when completed', () => {
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
    expect(seed.burned).toBe(true);
    expect(seed.ashPoints).toBe(10);
    expect(seed.updatedAt).toBe(timestamp);
  });

  it('selects the highest-priority unburned seed as focus', () => {
    const seeds: FireSeed[] = [
      { ...createSampleSeeds(timestamp)[0], id: 'low', priority: 'low', burned: false, completed: false },
      { ...createSampleSeeds(timestamp)[1], id: 'done', priority: 'high', burned: true, completed: true },
      { ...createSampleSeeds(timestamp)[2], id: 'focus', priority: 'high', difficulty: 'boss', burned: false, completed: false },
    ];

    expect(getFocusSeed(seeds)?.id).toBe('focus');
  });

  it('burns a seed and preserves its ash points', () => {
    const seed = createSampleSeeds(timestamp)[0];
    const burned = burnSeed(seed, timestamp);

    expect(burned.burned).toBe(true);
    expect(burned.completed).toBe(true);
    expect(burned.stage).toBe('flame');
    expect(burned.burnedAt).toBe(timestamp);
    expect(burned.ashPoints).toBe(5);
  });

  it('calculates Fire dashboard stats', () => {
    const seeds = createSampleSeeds(timestamp);
    const stats = getFireSeedStats(seeds);

    expect(stats.total).toBe(3);
    expect(stats.active).toBe(2);
    expect(stats.completed).toBe(1);
    expect(stats.high).toBe(1);
    expect(stats.flame).toBe(1);
    expect(stats.burned).toBe(1);
    expect(stats.totalAshPoints).toBe(20);
  });
});
