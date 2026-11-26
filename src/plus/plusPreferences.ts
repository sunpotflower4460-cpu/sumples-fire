import { FLAME_IDS, isFlameId } from './flames';
import type { FlameId } from './flames';
import { PLUS_PREFERENCES_KEY } from './plusConstants';

export { PLUS_PREFERENCES_KEY };

export type FlameMode = 'auto' | 'fixed' | 'favorites';
export type SceneId = 'night' | 'lake' | 'forest';

/** Ambient layer volumes, 0–100. */
export type AmbientMix = {
  fire: number;
  rain: number;
  wind: number;
};

export type PlusPreferences = {
  version: 1;
  flameMode: FlameMode;
  /** Used when `flameMode === 'fixed'`. */
  fixedFlame: FlameId;
  /** Used when `flameMode === 'favorites'`. At least one when that mode is saved. */
  favoriteFlames: FlameId[];
  /** The flame shown by the last *real* Fire, so favourites do not repeat it. */
  lastRealFlame: FlameId | null;
  scene: SceneId;
  mix: AmbientMix;
};

export const SCENE_IDS = ['night', 'lake', 'forest'] as const satisfies readonly SceneId[];

export type SceneInfo = {
  id: SceneId;
  label: string;
  /** Free scenes are available to everyone; the rest need Plus to be saved. */
  plus: boolean;
  /** Starting volumes when this scene is picked. Playing never starts by itself. */
  preset: AmbientMix;
};

export const SCENES: Record<SceneId, SceneInfo> = {
  night: { id: 'night', label: '夜の焚き火', plus: false, preset: { fire: 0, rain: 0, wind: 0 } },
  lake: { id: 'lake', label: '星明かりの湖', plus: true, preset: { fire: 35, rain: 0, wind: 15 } },
  forest: { id: 'forest', label: '雨あがりの森', plus: true, preset: { fire: 35, rain: 20, wind: 0 } },
};

export const isSceneId = (value: unknown): value is SceneId => (
  typeof value === 'string' && (SCENE_IDS as readonly string[]).includes(value)
);

export const DEFAULT_PLUS_PREFERENCES: PlusPreferences = {
  version: 1,
  flameMode: 'auto',
  fixedFlame: 'normal',
  favoriteFlames: [],
  lastRealFlame: null,
  scene: 'night',
  mix: { fire: 0, rain: 0, wind: 0 },
};

export const clampVolume = (value: unknown): number => {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return Math.min(100, Math.max(0, Math.round(n)));
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

/**
 * Turn anything read from storage into valid preferences.
 *
 * Corrupt values, unknown flame ids (for example a flame removed in a later
 * version) and impossible combinations all degrade to "おまかせ" / the free
 * scene instead of throwing or leaving the app in a half-applied state.
 */
export const normalizePlusPreferences = (raw: unknown): PlusPreferences => {
  if (!isRecord(raw)) return { ...DEFAULT_PLUS_PREFERENCES, favoriteFlames: [], mix: { ...DEFAULT_PLUS_PREFERENCES.mix } };

  const favorites: FlameId[] = [];
  if (Array.isArray(raw.favoriteFlames)) {
    for (const id of raw.favoriteFlames) {
      if (isFlameId(id) && !favorites.includes(id)) favorites.push(id);
    }
  }

  const fixedFlame = isFlameId(raw.fixedFlame) ? raw.fixedFlame : DEFAULT_PLUS_PREFERENCES.fixedFlame;
  const hasValidFixed = isFlameId(raw.fixedFlame);

  let flameMode: FlameMode = 'auto';
  if (raw.flameMode === 'fixed' && hasValidFixed) flameMode = 'fixed';
  if (raw.flameMode === 'favorites' && favorites.length > 0) flameMode = 'favorites';

  const mix = isRecord(raw.mix) ? raw.mix : {};

  return {
    version: 1,
    flameMode,
    fixedFlame,
    favoriteFlames: favorites,
    lastRealFlame: isFlameId(raw.lastRealFlame) ? raw.lastRealFlame : null,
    scene: isSceneId(raw.scene) ? raw.scene : 'night',
    mix: {
      fire: clampVolume(mix.fire),
      rain: clampVolume(mix.rain),
      wind: clampVolume(mix.wind),
    },
  };
};

export const parsePlusPreferences = (raw: string | null): PlusPreferences => {
  if (!raw) return normalizePlusPreferences(null);
  try {
    return normalizePlusPreferences(JSON.parse(raw));
  } catch {
    return normalizePlusPreferences(null);
  }
};

export const serializePlusPreferences = (preferences: PlusPreferences): string => (
  JSON.stringify(normalizePlusPreferences(preferences))
);

/** Why a draft cannot be saved, or null when it can. */
export const validatePlusPreferences = (preferences: PlusPreferences): string | null => {
  if (preferences.flameMode === 'favorites' && preferences.favoriteFlames.length === 0) {
    return '1つ以上選んでください。';
  }
  return null;
};

export const ALL_FLAME_IDS = FLAME_IDS;
