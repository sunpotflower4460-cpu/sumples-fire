import { describe, expect, it } from 'vitest';
import { measureFire, mulberry32, renderFire, renderRoomImpulse } from './fireSynth';

const SR = 22050;
const phases = { ignite: 0.5, burning: 1.7, carbonizing: 2.3 };
const ritual = (seed: number) => renderFire({
  sampleRate: SR,
  duration: 3,
  seed,
  ignition: true,
  phases,
  peak: 0.9,
});

const windowRms = (data: Float32Array, fromS: number, toS: number) => {
  let sum = 0;
  const a = Math.floor(fromS * SR);
  const b = Math.floor(toS * SR);
  for (let i = a; i < b; i += 1) sum += data[i] * data[i];
  return Math.sqrt(sum / Math.max(1, b - a));
};

describe('fireSynth', () => {
  it('is deterministic for a seed and varies between seeds', () => {
    const a = ritual(3);
    const b = ritual(3);
    const c = ritual(4);
    expect(Array.from(a.left.slice(0, 2000))).toEqual(Array.from(b.left.slice(0, 2000)));
    expect(Array.from(a.left.slice(0, 2000))).not.toEqual(Array.from(c.left.slice(0, 2000)));
  });

  it('renders finite, stereo-decorrelated audio that respects the peak target', () => {
    const fire = ritual(9);
    const stats = measureFire(fire, SR);
    expect(fire.left.length).toBe(3 * SR);
    expect(fire.left.every(Number.isFinite) && fire.right.every(Number.isFinite)).toBe(true);
    expect(stats.peak).toBeLessThanOrEqual(0.9001);
    expect(stats.peak).toBeGreaterThan(0.85);
    expect(stats.rms).toBeGreaterThan(0.05);

    let diff = 0;
    for (let i = 0; i < fire.left.length; i += 1) diff += Math.abs(fire.left[i] - fire.right[i]);
    expect(diff / fire.left.length).toBeGreaterThan(0.01);
  });

  it('crackles are impulsive, not steady noise', () => {
    const crackleOnly = renderFire({ sampleRate: SR, duration: 3, seed: 11, roar: 0.0001, peak: 0.9 });
    expect(measureFire(crackleOnly, SR).kurtosis).toBeGreaterThan(15);

    const roarOnly = renderFire({ sampleRate: SR, duration: 3, seed: 11, crackle: 0.0001, peak: 0.9 });
    expect(measureFire(roarOnly, SR).kurtosis).toBeLessThan(measureFire(crackleOnly, SR).kurtosis);
  });

  it('follows the ritual: swells at ignition, then cools and falls quiet', () => {
    const fire = ritual(21);
    const burning = windowRms(fire.left, 0.6, 1.6);
    const cooling = windowRms(fire.left, 2.0, 2.3);
    const tail = windowRms(fire.left, 2.8, 2.98);
    expect(burning).toBeGreaterThan(cooling);
    expect(cooling).toBeGreaterThan(tail);
    expect(tail).toBeLessThan(burning * 0.45);
  });

  it('keeps most low-frequency weight below 2 kHz (a roar, not a hiss)', () => {
    const fire = ritual(5);
    const mono = fire.left;
    // Crude one-pole split at ~2 kHz.
    const alpha = 1 - Math.exp((-2 * Math.PI * 2000) / SR);
    let lp = 0;
    let low = 0;
    let high = 0;
    for (let i = 0; i < mono.length; i += 1) {
      lp += alpha * (mono[i] - lp);
      low += lp * lp;
      const hp = mono[i] - lp;
      high += hp * hp;
    }
    expect(low).toBeGreaterThan(high * 4);
  });

  it('fades to silence at the very end so nothing clicks', () => {
    const fire = ritual(2);
    expect(Math.abs(fire.left[fire.left.length - 1])).toBeLessThan(0.02);
    expect(Math.abs(fire.right[fire.right.length - 1])).toBeLessThan(0.02);
  });

  it('seeded RNG is stable', () => {
    const a = mulberry32(5);
    const b = mulberry32(5);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('renders a short, quiet room impulse for the reverb tail', () => {
    const ir = renderRoomImpulse(SR);
    expect(ir.left.length).toBeLessThan(SR * 0.6);
    expect(ir.left.every(Number.isFinite)).toBe(true);
    expect(Math.abs(ir.left[ir.left.length - 1])).toBeLessThan(0.02);
  });
});
