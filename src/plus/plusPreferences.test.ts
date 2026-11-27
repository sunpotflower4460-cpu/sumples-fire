import { describe, expect, it } from 'vitest';
import { DURABLE_STORAGE_KEYS } from '../lib/appStorage';
import { PLUS_BURN_TYPES, spectacles } from '../lib/fireBurnSpectacle';
import { makeAmbientMix } from './ambientOptions';
import { AUTO_FLAME_IDS, FLAME_IDS, getFlame } from './flames';
import {
  DEFAULT_PLUS_PREFERENCES,
  PLUS_PREFERENCES_KEY,
  clampVolume,
  normalizePlusPreferences,
  parsePlusPreferences,
  serializePlusPreferences,
  validatePlusPreferences,
} from './plusPreferences';
import { SCENE_IDS, SCENES } from './scenes';

describe('flame catalog', () => {
  it('keeps the nine automatic flames and adds nine distinct Plus designs', () => {
    expect(FLAME_IDS).toHaveLength(18);
    expect(new Set(FLAME_IDS).size).toBe(FLAME_IDS.length);
    expect([...AUTO_FLAME_IDS].sort()).toEqual(Object.keys(spectacles).sort());
    expect(AUTO_FLAME_IDS.map((id) => getFlame(id).label)).toEqual([
      '炎', '鬼火', '黄金の炎', '爆炎', '龍の炎', '桜の火', '鉄の火', '虚空の火', 'フェニックス',
    ]);
    for (const id of PLUS_BURN_TYPES) expect(getFlame(id)).toMatchObject({ type: id, isSpecial: true });
  });
});

describe('plus preferences storage', () => {
  it('is preloaded by the native storage driver (a durable key)', () => {
    expect(DURABLE_STORAGE_KEYS).toContain(PLUS_PREFERENCES_KEY);
  });

  it('defaults to the free experience', () => {
    expect(DEFAULT_PLUS_PREFERENCES).toMatchObject({ flameMode: 'auto', scene: 'night', lastRealFlame: null });
    expect(DEFAULT_PLUS_PREFERENCES.mix).toEqual(makeAmbientMix());
    // No "playing" flag exists to persist: sound never resumes by itself.
    expect(Object.keys(DEFAULT_PLUS_PREFERENCES)).not.toContain('playing');
  });

  it('round-trips valid preferences', () => {
    const preferences = normalizePlusPreferences({
      flameMode: 'favorites',
      fixedFlame: 'dragon',
      favoriteFlames: ['cherry', 'aurora'],
      lastRealFlame: 'aurora',
      scene: 'coast',
      mix: { fire: 35, waves: 40, stream: 22, insects: 15 },
    });
    expect(preferences).toMatchObject({ favoriteFlames: ['cherry', 'aurora'], scene: 'coast', mix: { waves: 40, stream: 22, insects: 15 } });
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
    expect(normalizePlusPreferences({ mix: { fire: 250, rain: -5, wind: 12.6 } }).mix).toEqual(
      makeAmbientMix({ fire: 100, rain: 0, wind: 13 }),
    );
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

  it('keeps familiar scene presets and ships artwork for every Plus scene', () => {
    expect(SCENE_IDS).toHaveLength(9);
    expect(SCENES.night.preset).toEqual(makeAmbientMix());
    expect(SCENES.lake.preset).toEqual(makeAmbientMix({ fire: 35, wind: 15 }));
    expect(SCENES.forest.preset).toEqual(makeAmbientMix({ fire: 35, rain: 20 }));
    for (const id of SCENE_IDS.slice(1)) expect(SCENES[id].artwork).toMatch(/\.webp$/);
  });
});
