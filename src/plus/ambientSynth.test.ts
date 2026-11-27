import { describe, expect, it } from 'vitest';
import { AMBIENT_LAYERS } from './ambientOptions';
import {
  AMBIENT_LOOP_SECONDS,
  LAYER_MAX_GAIN,
  renderAmbientLayer,
  volumeToGain,
} from './ambientSynth';

const SR = 12000; // small for test speed; the loop logic is rate-independent

const meanAbs = (data: Float32Array, from: number, to: number) => {
  let sum = 0;
  for (let i = from; i < to; i += 1) sum += Math.abs(data[i]);
  return sum / Math.max(1, to - from);
};

describe('ambient layers', () => {
  for (const layer of AMBIENT_LAYERS) {
    describe(layer, () => {
      const loop = renderAmbientLayer(layer, SR, 5);

      it('is the advertised length, finite, audible and never clips', () => {
        expect(loop.left.length).toBe(Math.floor(SR * AMBIENT_LOOP_SECONDS[layer]));
        expect(loop.left.every(Number.isFinite) && loop.right.every(Number.isFinite)).toBe(true);
        let peak = 0;
        for (let i = 0; i < loop.left.length; i += 1) peak = Math.max(peak, Math.abs(loop.left[i]), Math.abs(loop.right[i]));
        expect(peak).toBeGreaterThan(0.5);
        expect(peak).toBeLessThanOrEqual(0.9);
      });

      it('loops without a jump: the seam is no louder than the rest of the signal', () => {
        const { left } = loop;
        const jump = Math.abs(left[0] - left[left.length - 1]);
        let typicalStep = 0;
        for (let i = 1; i < 2000; i += 1) typicalStep = Math.max(typicalStep, Math.abs(left[i] - left[i - 1]));
        // a click at the seam would be a step far above the signal's own movement
        expect(jump).toBeLessThanOrEqual(Math.max(typicalStep * 3, 0.15));
        expect(meanAbs(left, 0, 200)).toBeLessThan(meanAbs(left, 0, left.length) * 6 + 0.05);
      });

      it('is stereo-decorrelated and deterministic per seed', () => {
        let diff = 0;
        for (let i = 0; i < loop.left.length; i += 1) diff += Math.abs(loop.left[i] - loop.right[i]);
        expect(diff / loop.left.length).toBeGreaterThan(0.002);
        const again = renderAmbientLayer(layer, SR, 5);
        expect(Array.from(again.left.slice(0, 500))).toEqual(Array.from(loop.left.slice(0, 500)));
        const other = renderAmbientLayer(layer, SR, 6);
        expect(Array.from(other.left.slice(0, 500))).not.toEqual(Array.from(loop.left.slice(0, 500)));
      });
    });
  }

  it('uses a different loop length for each layer', () => {
    const lengths = Object.values(AMBIENT_LOOP_SECONDS);
    expect(new Set(lengths).size).toBe(AMBIENT_LAYERS.length);
  });

  it('rain (patter and drips) is the brightest layer; fire and wind sit lower', () => {
    const brightness = (layer: 'fire' | 'rain' | 'wind') => {
      const { left } = renderAmbientLayer(layer, SR, 3);
      // zero-crossing rate as a cheap spectral-centroid proxy
      let crossings = 0;
      for (let i = 1; i < left.length; i += 1) if ((left[i] >= 0) !== (left[i - 1] >= 0)) crossings += 1;
      return crossings / left.length;
    };
    expect(brightness('rain')).toBeGreaterThan(brightness('fire') * 1.5);
    expect(brightness('rain')).toBeGreaterThan(brightness('wind') * 1.5);
  });
});

describe('volumeToGain', () => {
  it('is silent at 0, capped per layer at 100, and gentle at low settings', () => {
    for (const layer of AMBIENT_LAYERS) {
      expect(volumeToGain(layer, 0)).toBe(0);
      expect(volumeToGain(layer, 100)).toBe(LAYER_MAX_GAIN[layer]);
      expect(volumeToGain(layer, 50)).toBeLessThan(LAYER_MAX_GAIN[layer] / 3);
      expect(volumeToGain(layer, 999)).toBe(LAYER_MAX_GAIN[layer]);
      expect(volumeToGain(layer, -10)).toBe(0);
    }
  });

  it('grows monotonically', () => {
    let previous = -1;
    for (let v = 0; v <= 100; v += 5) {
      const gain = volumeToGain('rain', v);
      expect(gain).toBeGreaterThanOrEqual(previous);
      previous = gain;
    }
  });
});
