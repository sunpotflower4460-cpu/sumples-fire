import { describe, expect, it } from 'vitest';
import { selectBurnSpectacle, spectacles } from '../lib/fireBurnSpectacle';
import { pickFavoriteFlame, resolveBurnSpectacle } from './flameChoice';
import { FLAME_IDS } from './flames';
import { DEFAULT_PLUS_PREFERENCES } from './plusPreferences';
import type { PlusPreferences } from './plusPreferences';

const prefs = (extra: Partial<PlusPreferences>): PlusPreferences => ({ ...DEFAULT_PLUS_PREFERENCES, ...extra });
const seeded = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe('free automatic selection is unchanged', () => {
  it('still reaches every one of the nine flames across the random range', () => {
    const seen = new Set<string>();
    for (let step = 0; step < 4000; step += 1) {
      seen.add(selectBurnSpectacle('boss', 20, () => step / 4000).type);
    }
    expect([...seen].sort()).toEqual([...FLAME_IDS].sort());
  });

  it('boss tasks make explosion/dragon/phoenix more likely, as before', () => {
    const count = (difficulty: 'small' | 'boss', type: string) => {
      let n = 0;
      for (let step = 0; step < 2000; step += 1) {
        if (selectBurnSpectacle(difficulty, 0, () => step / 2000).type === type) n += 1;
      }
      return n;
    };
    expect(count('boss', 'phoenixRise')).toBeGreaterThan(count('small', 'phoenixRise'));
    expect(count('boss', 'dragon')).toBeGreaterThan(count('small', 'dragon'));
  });
});

describe('resolveBurnSpectacle', () => {
  const base = { difficulty: 'normal' as const, streak: 0 };

  it('without Plus, saved choices are ignored and the free logic runs', () => {
    const choice = resolveBurnSpectacle({
      ...base,
      entitled: false,
      preferences: prefs({ flameMode: 'fixed', fixedFlame: 'dragon' }),
      random: () => 0,
    });
    expect(choice.source).toBe('auto');
    expect(choice.spectacle).toBe(selectBurnSpectacle('normal', 0, () => 0));
  });

  it('おまかせ keeps the free logic even for owners', () => {
    const choice = resolveBurnSpectacle({ ...base, entitled: true, preferences: prefs({ flameMode: 'auto' }), random: () => 0.99 });
    expect(choice.source).toBe('auto');
    expect(choice.spectacle).toBe(selectBurnSpectacle('normal', 0, () => 0.99));
  });

  it('a fixed flame is used every time, whatever the task or streak', () => {
    for (const difficulty of ['small', 'normal', 'heavy', 'boss'] as const) {
      const choice = resolveBurnSpectacle({
        difficulty,
        streak: 12,
        entitled: true,
        preferences: prefs({ flameMode: 'fixed', fixedFlame: 'cherry' }),
        random: Math.random,
      });
      expect(choice).toMatchObject({ source: 'fixed' });
      expect(choice.spectacle).toBe(spectacles.cherry);
    }
  });

  it('favourites only pick from the chosen set', () => {
    const chosen = ['cherry', 'golden', 'ironFire'] as const;
    for (let step = 0; step < 200; step += 1) {
      const choice = resolveBurnSpectacle({
        ...base,
        entitled: true,
        preferences: prefs({ flameMode: 'favorites', favoriteFlames: [...chosen] }),
        random: () => step / 200,
      });
      expect(chosen).toContain(choice.spectacle.type);
      expect(choice.source).toBe('favorites');
    }
  });

  it('with two or more favourites, never repeats the previous real flame', () => {
    for (let step = 0; step < 100; step += 1) {
      const id = pickFavoriteFlame(['cherry', 'golden'], 'cherry', () => step / 100);
      expect(id).toBe('golden');
    }
    for (let step = 0; step < 100; step += 1) {
      expect(pickFavoriteFlame(['cherry', 'golden', 'dragon'], 'golden', () => step / 100)).not.toBe('golden');
    }
  });

  it('with exactly one favourite it behaves like a fixed flame', () => {
    expect(pickFavoriteFlame(['dragon'], 'dragon')).toBe('dragon');
    expect(pickFavoriteFlame(['dragon'], null)).toBe('dragon');
  });

  it('the remaining favourites are chosen with equal probability', () => {
    const counts: Record<string, number> = { golden: 0, dragon: 0 };
    const draw = seeded([0.01, 0.51, 0.26, 0.76, 0.11, 0.61, 0.41, 0.91]);
    for (let n = 0; n < 8; n += 1) {
      counts[pickFavoriteFlame(['cherry', 'golden', 'dragon'], 'cherry', draw)] += 1;
    }
    expect(counts.golden).toBe(4);
    expect(counts.dragon).toBe(4);
  });

  it('an empty favourites set safely falls back to automatic', () => {
    const choice = resolveBurnSpectacle({ ...base, entitled: true, preferences: prefs({ flameMode: 'favorites', favoriteFlames: [] }), random: () => 0 });
    expect(choice.source).toBe('auto');
  });
});
