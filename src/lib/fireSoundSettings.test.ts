import { afterEach, describe, expect, it } from 'vitest';
import { isFireSoundEnabled, setFireSoundEnabled } from './fireSoundSettings';

const originalWindow = globalThis.window;

afterEach(() => {
  if (originalWindow === undefined) {
    // @ts-expect-error test cleanup for optional window
    delete globalThis.window;
    return;
  }
  Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true });
});

describe('fireSoundSettings', () => {
  it('falls back safely when localStorage is inaccessible', () => {
    Object.defineProperty(globalThis, 'window', {
      value: {
        get localStorage() {
          throw new Error('blocked');
        },
      },
      configurable: true,
    });

    expect(isFireSoundEnabled()).toBe(true);
    expect(() => setFireSoundEnabled(false)).not.toThrow();
  });

  it('treats storage read errors as enabled', () => {
    Object.defineProperty(globalThis, 'window', {
      value: {
        localStorage: {
          getItem() {
            throw new Error('blocked read');
          },
          setItem() {
            throw new Error('blocked write');
          },
        },
      },
      configurable: true,
    });

    expect(isFireSoundEnabled()).toBe(true);
    expect(() => setFireSoundEnabled(false)).not.toThrow();
  });
});
