import type { FireStreakData } from './fireStreak';
import type { FireSeed } from '../types/fireSeed';

export type FireBurnUndoSnapshot = {
  seed: FireSeed;
  streakBefore: FireStreakData;
};

export const createFireBurnUndoSnapshot = (
  seed: FireSeed,
  streakBefore: FireStreakData,
): FireBurnUndoSnapshot => ({
  seed: { ...seed, isBurning: false },
  streakBefore: { ...streakBefore },
});

export const restoreFireSeedFromUndo = (
  snapshot: FireBurnUndoSnapshot,
  timestamp: string,
): FireSeed => ({
  ...snapshot.seed,
  burned: false,
  burnedAt: undefined,
  // Undone: this completion no longer exists, so neither does its day.
  burnedLocalDate: undefined,
  completed: false,
  isBurning: false,
  updatedAt: timestamp,
});
