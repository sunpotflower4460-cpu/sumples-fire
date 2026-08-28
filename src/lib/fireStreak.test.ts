import { afterEach, describe, expect, it } from 'vitest';
import {
  getEffectiveFireStreak,
  loadFireStreak,
  recordBurnForStreak,
  STREAK_STORAGE_KEY,
} from './fireStreak';

const originalWindow = globalThis.window;

afterEach(() => {
  if (originalWindow === undefined) {
    // @ts-expect-error test cleanup for optional window
    delete globalThis.window;
    return;
  }
  Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true });
});

describe('fireStreak', () => {
  it('normalizes malformed persisted streak data safely', () => {
    const storage = {
      getItem: (key: string) => (key === STREAK_STORAGE_KEY
        ? JSON.stringify({ currentStreak: 'oops', longestStreak: 2, lastBurnDate: 123 })
        : null),
    };
    Object.defineProperty(globalThis, 'window', { value: { localStorage: storage }, configurable: true });

    expect(loadFireStreak()).toEqual({
      currentStreak: 0,
      longestStreak: 2,
      lastBurnDate: null,
    });
  });

  it('returns defaults when localStorage access throws', () => {
    Object.defineProperty(globalThis, 'window', {
      value: {
        get localStorage() {
          throw new Error('blocked');
        },
      },
      configurable: true,
    });

    expect(loadFireStreak()).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      lastBurnDate: null,
    });
  });

  it('expires a stale current streak while preserving the personal best', () => {
    const stale = {
      currentStreak: 7,
      longestStreak: 12,
      lastBurnDate: '2026-08-20',
    };

    expect(getEffectiveFireStreak(stale, new Date(2026, 7, 28, 9, 0))).toEqual({
      currentStreak: 0,
      longestStreak: 12,
      lastBurnDate: '2026-08-20',
    });
  });

  it('keeps yesterday active and extends it on today’s first Fire', () => {
    const yesterday = {
      currentStreak: 4,
      longestStreak: 6,
      lastBurnDate: '2026-08-27',
    };
    const now = new Date(2026, 7, 28, 9, 0);

    expect(getEffectiveFireStreak(yesterday, now).currentStreak).toBe(4);
    expect(recordBurnForStreak(yesterday, now)).toEqual({
      currentStreak: 5,
      longestStreak: 6,
      lastBurnDate: '2026-08-28',
    });
  });

  it('does not increment twice when multiple tasks are burned on the same day', () => {
    const today = {
      currentStreak: 5,
      longestStreak: 6,
      lastBurnDate: '2026-08-28',
    };

    expect(recordBurnForStreak(today, new Date(2026, 7, 28, 18, 0))).toEqual(today);
  });
});
