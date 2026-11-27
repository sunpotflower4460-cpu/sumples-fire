import { makeAmbientMix } from './ambientOptions';
import type { AmbientMix } from './ambientOptions';
import { getFlame } from './flames';
import type { FlameId } from './flames';
import { switchScene } from './plusPreferences';
import type { CampfireSet, PlusPreferences } from './plusPreferences';
import type { SceneId } from './scenes';

export const CAMPFIRE_PRESETS = [
  {
    id: 'polar', name: '極光の夜', scene: 'aurora', flame: 'aurora',
    mix: { wind: 45, fire: 42 },
  },
  {
    id: 'rain', name: '雨音の森', scene: 'forest', flame: 'iris',
    mix: { rain: 53, fire: 35 },
  },
  {
    id: 'tide', name: '波を待つ浜辺', scene: 'coast', flame: 'seaGlass',
    mix: { waves: 68, wind: 22, fire: 26 },
  },
  {
    id: 'dawn', name: '朝焼けのひと息', scene: 'summit', flame: 'daybreak',
    mix: { wind: 46, fire: 30 },
  },
  {
    id: 'brook', name: '渓流のひととき', scene: 'brook', flame: 'lantern',
    mix: { stream: 62, fire: 38 },
  },
  {
    id: 'summer', name: '星降る草原', scene: 'meadow', flame: 'starRain',
    mix: { insects: 52, fire: 35, wind: 20 },
  },
] as const satisfies readonly {
  id: string;
  name: string;
  scene: SceneId;
  flame: FlameId;
  mix: Partial<AmbientMix>;
}[];

export type CampfirePreset = (typeof CAMPFIRE_PRESETS)[number];

export const campfireSetFromPreset = (preset: CampfirePreset): CampfireSet => ({
  scene: preset.scene,
  mix: makeAmbientMix(preset.mix),
  flameMode: 'fixed',
  fixedFlame: preset.flame,
  favoriteFlames: [],
});

export const captureCampfireSet = (preferences: PlusPreferences): CampfireSet => ({
  scene: preferences.scene,
  mix: preferences.mix,
  flameMode: preferences.flameMode,
  fixedFlame: preferences.fixedFlame,
  favoriteFlames: preferences.favoriteFlames,
});

export const applyCampfireSet = (preferences: PlusPreferences, set: CampfireSet) => ({
  ...switchScene(preferences, set.scene),
  mix: set.mix,
  flameMode: set.flameMode,
  fixedFlame: set.fixedFlame,
  favoriteFlames: set.favoriteFlames,
});

export const applyCampfirePreset = (preferences: PlusPreferences, preset: CampfirePreset) => (
  applyCampfireSet(preferences, {
    ...campfireSetFromPreset(preset),
    favoriteFlames: preferences.favoriteFlames,
  })
);

export const describeSetFlame = (set: CampfireSet) => {
  switch (set.flameMode) {
    case 'fixed': return getFlame(set.fixedFlame).label;
    case 'favorites': return `お気に入り ${set.favoriteFlames.length}種類`;
    case 'shuffle': return '全種類シャッフル';
    case 'auto': return 'おまかせ';
  }
};
