import { describe, expect, it } from 'vitest';
import { createFireBurnUndoSnapshot, restoreFireSeedFromUndo } from './fireBurnUndo';
import type { FireStreakData } from './fireStreak';
import type { FireSeed } from '../types/fireSeed';

const seed: FireSeed = {
  id: 'seed-undo',
  title: '提出する',
  body: '添付を確認して送る',
  nextAction: 'PDFを開く',
  category: 'task',
  priority: 'high',
  stage: 'kindling',
  difficulty: 'heavy',
  urgency: 'high',
  importance: 'high',
  quadrant: 'doNow',
  ashPoints: 10,
  burned: false,
  completed: false,
  isBurning: false,
  createdAt: '2026-08-27T00:00:00.000Z',
  updatedAt: '2026-08-27T01:00:00.000Z',
};

const streak: FireStreakData = {
  currentStreak: 4,
  longestStreak: 7,
  lastBurnDate: '2026-08-27',
};

describe('Fire burn undo snapshot', () => {
  it('keeps the exact pre-burn task and streak context', () => {
    const snapshot = createFireBurnUndoSnapshot(seed, streak);

    expect(snapshot.seed).toEqual(seed);
    expect(snapshot.streakBefore).toEqual(streak);
    expect(snapshot.seed).not.toBe(seed);
    expect(snapshot.streakBefore).not.toBe(streak);
  });

  it('restores lifecycle flags without losing pre-burn stage or metadata', () => {
    const snapshot = createFireBurnUndoSnapshot(seed, streak);
    const restored = restoreFireSeedFromUndo(snapshot, '2026-08-28T01:00:00.000Z');

    expect(restored.burned).toBe(false);
    expect(restored.completed).toBe(false);
    expect(restored.isBurning).toBe(false);
    expect(restored.burnedAt).toBeUndefined();
    expect(restored.stage).toBe('kindling');
    expect(restored.body).toBe(seed.body);
    expect(restored.quadrant).toBe(seed.quadrant);
    expect(restored.updatedAt).toBe('2026-08-28T01:00:00.000Z');
  });
});
