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
  completed: false,
  isBurning: false,
  updatedAt: timestamp,
});
