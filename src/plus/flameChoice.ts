import { selectBurnSpectacle } from '../lib/fireBurnSpectacle';
import type { BurnSpectacle } from '../lib/fireBurnSpectacle';
import type { FireDifficulty } from '../types/fireSeed';
import { getFlame } from './flames';
import type { FlameId } from './flames';
import type { PlusPreferences } from './plusPreferences';

export type FlameChoiceSource = 'auto' | 'fixed' | 'favorites';

export type FlameChoice = {
  spectacle: BurnSpectacle;
  source: FlameChoiceSource;
};

type ResolveInput = {
  preferences: PlusPreferences;
  /** Verified Plus entitlement. Without it the choice is always the free one. */
  entitled: boolean;
  difficulty: FireDifficulty;
  streak: number;
  random?: () => number;
};

/** Favourites never repeat the previous real flame — unless it is the only one. */
export const pickFavoriteFlame = (
  favorites: readonly FlameId[],
  lastRealFlame: FlameId | null,
  random: () => number = Math.random,
): FlameId => {
  const pool = favorites.length >= 2 && lastRealFlame
    ? favorites.filter((id) => id !== lastRealFlame)
    : favorites;
  const candidates = pool.length > 0 ? pool : favorites;
  const index = Math.min(candidates.length - 1, Math.floor(random() * candidates.length));
  return candidates[index];
};

/**
 * Decide which flame a real Fire uses. Called once, when the Fire starts; the
 * result is handed to both the animation and the sound so they cannot differ.
 *
 * Only the *display* is chosen here. Ash points, rank, growth and streak are
 * computed from the task, never from the flame.
 */
export const resolveBurnSpectacle = ({
  preferences,
  entitled,
  difficulty,
  streak,
  random = Math.random,
}: ResolveInput): FlameChoice => {
  if (entitled) {
    if (preferences.flameMode === 'fixed') {
      return { spectacle: getFlame(preferences.fixedFlame), source: 'fixed' };
    }
    if (preferences.flameMode === 'favorites' && preferences.favoriteFlames.length > 0) {
      const id = pickFavoriteFlame(preferences.favoriteFlames, preferences.lastRealFlame, random);
      return { spectacle: getFlame(id), source: 'favorites' };
    }
  }

  return { spectacle: selectBurnSpectacle(difficulty, streak, random), source: 'auto' };
};
