import { describe, expect, it } from 'vitest';
import { DURABLE_STORAGE_KEYS } from '../lib/appStorage';
import { spectacles } from '../lib/fireBurnSpectacle';
import { FLAME_CATALOG, FLAME_IDS } from './flames';
import {
  DEFAULT_PLUS_PREFERENCES,
  PLUS_PREFERENCES_KEY,
  SCENES,
  clampVolume,
  normalizePlusPreferences,
  parsePlusPreferences,
  serializePlusPreferences,
  validatePlusPreferences,
} from './plusPreferences';

describe('flame catalog', () => {
  it('lists exactly the nine existing flames, in order, using their existing ids', () => {
    expect(FLAME_IDS).toHaveLength(9);
    expect([...FLAME_IDS].sort()).toEqual(Object.keys(spectacles).sort());
    expect(FLAME_CATALOG.map((flame) => flame.label)).toEqual([
      '炎', '鬼火', '黄金の炎', '爆炎', '龍の炎', '桜の火', '鉄の火', '虚空の火', 'フェニックス',
    ]);
  });
});

describe('plus preferences storage', () => {
  it('is preloaded by the native storage driver (a durable key)', () => {
    expect(DURABLE_STORAGE_KEYS).toContain(PLUS_PREFERENCES_KEY);
  });

  it('defaults to the free experience', () => {
    expect(DEFAULT_PLUS_PREFERENCES).toMatchObject({ flameMode: 'auto', scene: 'night', lastRealFlame: null });
    expect(DEFAULT_PLUS_PREFERENCES.mix).toEqual({ fire: 0, rain: 0, wind: 0 });
    // No "playing" flag exists to persist: sound never resumes by itself.
    expect(Object.keys(DEFAULT_PLUS_PREFERENCES)).not.toContain('playing');
  });

  it('round-trips valid preferences', () => {
    const preferences = normalizePlusPreferences({
      flameMode: 'favorites',
      fixedFlame: 'dragon',
      favoriteFlames: ['cherry', 'golden'],
      lastRealFlame: 'cherry',
      scene: 'lake',
      mix: { fire: 35, rain: 0, wind: 15 },
    });
    expect(parsePlusPreferences(serializePlusPreferences(preferences))).toEqual(preferences);
  });

  it('a removed or unknown flame id degrades to おまかせ instead of breaking', () => {
    expect(normalizePlusPreferences({ flameMode: 'fixed', fixedFlame: 'meteor' }).flameMode).toBe('auto');
    const favorites = normalizePlusPreferences({ flameMode: 'favorites', favoriteFlames: ['meteor', 'cherry', 'cherry', 7] });
    expect(favorites.favoriteFlames).toEqual(['cherry']);
    expect(favorites.flameMode).toBe('favorites');
    expect(normalizePlusPreferences({ flameMode: 'favorites', favoriteFlames: ['meteor'] }).flameMode).toBe('auto');
    expect(normalizePlusPreferences({ lastRealFlame: 'meteor' }).lastRealFlame).toBeNull();
  });

  it('unknown scenes fall back to the free scene; volumes are clamped integers', () => {
    expect(normalizePlusPreferences({ scene: 'moon' }).scene).toBe('night');
    expect(normalizePlusPreferences({ mix: { fire: 250, rain: -5, wind: 12.6 } }).mix).toEqual({ fire: 100, rain: 0, wind: 13 });
    expect(clampVolume('loud')).toBe(0);
    expect(clampVolume(Number.NaN)).toBe(0);
  });

  it('survives garbage in storage', () => {
    for (const raw of [null, '', '{', '[]', '"x"', '123', 'null']) {
      expect(parsePlusPreferences(raw)).toEqual(DEFAULT_PLUS_PREFERENCES);
    }
  });

  it('an empty favourites set cannot be saved as favourites', () => {
    expect(validatePlusPreferences({ ...DEFAULT_PLUS_PREFERENCES, flameMode: 'favorites', favoriteFlames: [] })).toBe('1つ以上選んでください。');
    expect(validatePlusPreferences({ ...DEFAULT_PLUS_PREFERENCES, flameMode: 'favorites', favoriteFlames: ['golden'] })).toBeNull();
  });

  it('scene presets match the design and the free scene needs no Plus', () => {
    expect(SCENES.night).toMatchObject({ plus: false, preset: { fire: 0, rain: 0, wind: 0 } });
    expect(SCENES.lake).toMatchObject({ plus: true, preset: { fire: 35, rain: 0, wind: 15 } });
    expect(SCENES.forest).toMatchObject({ plus: true, preset: { fire: 35, rain: 20, wind: 0 } });
  });
});
