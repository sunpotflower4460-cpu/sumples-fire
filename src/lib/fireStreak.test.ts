import { afterEach, describe, expect, it } from 'vitest';
import { loadFireStreak, STREAK_STORAGE_KEY } from './fireStreak';

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
});
