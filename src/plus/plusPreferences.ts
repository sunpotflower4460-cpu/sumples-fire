import { AMBIENT_LAYERS, makeAmbientMix } from './ambientOptions';
import type { AmbientMix } from './ambientOptions';
import { isFlameId } from './flames';
import type { FlameId } from './flames';
import { PLUS_PREFERENCES_KEY } from './plusConstants';
import { isSceneId, SCENE_IDS, SCENES } from './scenes';
import type { SceneId } from './scenes';

export { PLUS_PREFERENCES_KEY };

export type FlameMode = 'auto' | 'fixed' | 'favorites';
type SceneSettings = {
  scene: SceneId;
  mix: AmbientMix;
  /** Sound settings for the other scenes. The active scene is stored in mix. */
  sceneMixes: Partial<Record<SceneId, AmbientMix>>;
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
} & SceneSettings;

export const DEFAULT_PLUS_PREFERENCES: PlusPreferences = {
  version: 1,
  flameMode: 'auto',
  fixedFlame: 'normal',
  favoriteFlames: [],
  lastRealFlame: null,
  scene: 'night',
  mix: makeAmbientMix(),
  sceneMixes: {},
};

export const clampVolume = (value: unknown): number => {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return Math.min(100, Math.max(0, Math.round(n)));
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const normalizeMix = (source: unknown) => {
  const values = isRecord(source) ? source : {};
  const mix = makeAmbientMix();
  for (const layer of AMBIENT_LAYERS) mix[layer] = clampVolume(values[layer]);
  return mix;
};

export const sceneSettingsOf = ({ scene, mix, sceneMixes }: SceneSettings): SceneSettings => (
  { scene, mix, sceneMixes }
);

/** Switch scenes without losing the draft mix, including intentional silence. */
export const switchScene = (settings: SceneSettings, scene: SceneId): SceneSettings => {
  if (scene === settings.scene) return settings;
  const { [scene]: previousMix, ...sceneMixes } = settings.sceneMixes;
  return {
    scene,
    mix: previousMix ?? { ...SCENES[scene].preset },
    sceneMixes: { ...sceneMixes, [settings.scene]: settings.mix },
  };
};

/**
 * Turn anything read from storage into valid preferences.
 *
 * Corrupt values, unknown flame ids (for example a flame removed in a later
 * version) and impossible combinations all degrade to "おまかせ" / the free
 * scene instead of throwing or leaving the app in a half-applied state.
 */
export const normalizePlusPreferences = (raw: unknown): PlusPreferences => {
  if (!isRecord(raw)) {
    return { ...DEFAULT_PLUS_PREFERENCES, favoriteFlames: [], mix: makeAmbientMix(), sceneMixes: {} };
  }

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

  const scene = isSceneId(raw.scene) ? raw.scene : 'night';
  const sourceSceneMixes = isRecord(raw.sceneMixes) ? raw.sceneMixes : {};
  const sceneMixes: SceneSettings['sceneMixes'] = {};
  for (const id of SCENE_IDS) {
    if (id !== scene && isRecord(sourceSceneMixes[id])) {
      sceneMixes[id] = normalizeMix(sourceSceneMixes[id]);
    }
  }

  return {
    version: 1,
    flameMode,
    fixedFlame,
    favoriteFlames: favorites,
    lastRealFlame: isFlameId(raw.lastRealFlame) ? raw.lastRealFlame : null,
    scene,
    mix: normalizeMix(raw.mix),
    sceneMixes,
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
