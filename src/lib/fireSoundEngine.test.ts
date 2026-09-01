import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { BURN_SEQUENCE_DURATION, getBurnSequenceDuration } from './fireAnimationConstants';
import { FIRE_SOUND_DURATION_S, getFireSoundDuration } from './fireSoundEngine';

const originalWindow = globalThis.window;

afterEach(() => {
  if (originalWindow === undefined) {
    // @ts-expect-error test cleanup for optional window
    delete globalThis.window;
  } else {
    Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true });
  }
});

describe('fireSoundEngine duration', () => {
  it('keeps the Fire SE as long as the visual ritual', () => {
    expect(FIRE_SOUND_DURATION_S * 1000).toBe(BURN_SEQUENCE_DURATION);
    expect(getFireSoundDuration(false) * 1000).toBe(BURN_SEQUENCE_DURATION);
  });

  it('scales to the same reduced-motion clock as the overlay', () => {
    expect(getFireSoundDuration(true) * 1000).toBe(getBurnSequenceDuration(true));
    expect(getFireSoundDuration(true)).toBe(1.05);
  });

  it('passes reduced-motion into Fire SE so audio cannot outlast the overlay', () => {
    const engineSource = readFileSync(resolve(__dirname, 'fireSoundEngine.ts'), 'utf-8');
    const hookSource = readFileSync(resolve(__dirname, '../hooks/useFireSeeds.ts'), 'utf-8');
    expect(engineSource).toContain('reduceMotion = false');
    expect(engineSource).toContain('getSoundClock(reduceMotion)');
    expect(hookSource).toContain('playSpectacleSequence(spectacle.soundProfile, reduceMotion)');
    expect(hookSource).toContain('getBurnSequenceDuration(reduceMotion)');
  });
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
