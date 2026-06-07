import { afterEach, describe, expect, it } from 'vitest';

const originalWindow = globalThis.window;

afterEach(() => {
  if (originalWindow === undefined) {
    // @ts-expect-error test cleanup for optional window
    delete globalThis.window;
  } else {
    Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true });
  }
});

describe('fireSoundEngine warm-up', () => {
  it('fails quietly when AudioContext is unavailable', async () => {
    // @ts-expect-error test setup for optional window
    delete globalThis.window;

    const { warmUpFireSound } = await import('./fireSoundEngine');
    await expect(warmUpFireSound()).resolves.toBe(false);
  });

  it('initializes AudioContext when available and reuses it', async () => {
    let constructed = 0;

    class FakeAudioContext {
      state: AudioContextState = 'running';

      constructor() {
        constructed += 1;
      }

      resume() {
        return Promise.resolve();
      }
    }

    Object.defineProperty(globalThis, 'window', {
      value: {
        AudioContext: FakeAudioContext,
      },
      configurable: true,
    });

    const { warmUpFireSound } = await import('./fireSoundEngine');
    await expect(warmUpFireSound()).resolves.toBe(true);
    await expect(warmUpFireSound()).resolves.toBe(true);
    expect(constructed).toBe(1);
  });
});
