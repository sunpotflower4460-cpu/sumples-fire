import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BURN_TIMING } from './fireAnimationConstants';
import { EmberField, emberColor } from './emberField';
import type { EmberEmitter } from './emberField';
import { campfireLook, CAMPFIRE_STAGE_INTENSITY, ritualLook } from './fireIntensity';
import { FRAGMENT, NORMAL_PALETTE, paletteFromColors, parseColor } from './fireShader';

describe('ritualLook (visual score of the burn)', () => {
  it('flares at ignition, burns hard, then dies back to embers', () => {
    const ignite = ritualLook(150);
    const burning = ritualLook(1100);
    const carbonizing = ritualLook(2000);
    const end = ritualLook(BURN_TIMING.COMPLETE_END - 1);

    expect(ignite.flash).toBeGreaterThan(0.5);
    expect(burning.flash).toBe(0);
    expect(burning.intensity).toBeGreaterThan(0.95);
    expect(carbonizing.intensity).toBeLessThan(burning.intensity);
    expect(end.intensity).toBeLessThan(0.1);
    expect(end.intensity).toBeLessThan(carbonizing.intensity);
  });

  it('only makes smoke once the flame cools', () => {
    expect(ritualLook(100).smoke).toBe(0);
    expect(ritualLook(2200).smoke).toBeGreaterThan(ritualLook(1000).smoke);
  });

  it('scales with the reduced-motion clock', () => {
    const full = ritualLook(1100, false);
    const reduced = ritualLook(1100 * 0.35, true);
    expect(reduced.intensity).toBeCloseTo(full.intensity, 5);
  });

  it('emits more embers when the fire is bigger', () => {
    expect(ritualLook(1100).emberRate).toBeGreaterThan(ritualLook(2900).emberRate);
  });
});

describe('campfireLook', () => {
  it('grows with the campfire stage and surges when poked', () => {
    for (let stage = 1; stage < CAMPFIRE_STAGE_INTENSITY.length; stage += 1) {
      expect(campfireLook(stage).intensity).toBeGreaterThan(campfireLook(stage - 1).intensity);
    }
    expect(campfireLook(2, 1).intensity).toBeGreaterThan(campfireLook(2, 0).intensity);
    expect(campfireLook(2, 1).emberRate).toBeGreaterThan(campfireLook(2, 0).emberRate);
  });

  it('clamps out-of-range stages', () => {
    expect(campfireLook(99).intensity).toBe(CAMPFIRE_STAGE_INTENSITY[CAMPFIRE_STAGE_INTENSITY.length - 1]);
    expect(campfireLook(-3).intensity).toBe(CAMPFIRE_STAGE_INTENSITY[0]);
  });
});

describe('EmberField', () => {
  const emitter: EmberEmitter = { rate: 60, originX: 200, spread: 80, originY: 600, energy: 1, scale: 1 };

  it('emits at the requested rate and never exceeds its cap', () => {
    const field = new EmberField(40, 3);
    for (let i = 0; i < 60; i += 1) field.update(1 / 60, emitter);
    expect(field.embers.length).toBeGreaterThan(20);
    for (let i = 0; i < 600; i += 1) field.update(1 / 60, { ...emitter, rate: 400 });
    expect(field.embers.length).toBeLessThanOrEqual(40);
  });

  it('lifts embers upward and retires them when they cool', () => {
    const field = new EmberField(60, 5);
    field.burst(30, emitter);
    const startY = field.embers.map((e) => e.y);
    field.update(0.3, { ...emitter, rate: 0 });
    const risen = field.embers.filter((e, i) => e.y < startY[i]).length;
    expect(risen).toBeGreaterThan(field.embers.length * 0.9);

    for (let i = 0; i < 400; i += 1) field.update(1 / 60, { ...emitter, rate: 0 });
    expect(field.embers.length).toBe(0);
  });

  it('cools from warm yellow through orange to dull red — never white', () => {
    const hot = emberColor(1);
    const mid = emberColor(0.5);
    const cold = emberColor(0.05);
    expect(hot[0]).toBe(255);
    expect(hot[2]).toBeLessThan(200);
    expect(mid[1]).toBeLessThan(hot[1]);
    expect(cold[1]).toBeLessThan(mid[1]);
    expect(cold[0]).toBeLessThan(255);
  });

  it('ignores a runaway frame delta so a stalled tab does not explode', () => {
    const field = new EmberField(30, 9);
    field.update(30, emitter);
    expect(field.embers.length).toBeLessThanOrEqual(30);
  });
});

describe('fire shader helpers', () => {
  it('parses css colours', () => {
    expect(parseColor('rgba(255, 0, 128, 0.5)')).toEqual([1, 0, 128 / 255]);
    expect(parseColor('#ff8000')).toEqual([1, 128 / 255, 0]);
    expect(parseColor('transparent')).toBeNull();
  });

  it('builds a hot-to-cool palette from spectacle colours and falls back safely', () => {
    const blue = paletteFromColors('rgba(10,30,160,0.98)', 'rgba(30,120,230,0.95)', 'rgba(160,220,255,0.78)');
    expect(blue.body[2]).toBeGreaterThan(blue.body[0]);
    expect(blue.core.every((c) => c >= blue.hot[0] * 0.9)).toBe(true);
    expect(paletteFromColors('nope', 'nope', 'nope')).toBe(NORMAL_PALETTE);
  });

  it('keeps the expensive smoke noise behind a runtime branch', () => {
    expect(FRAGMENT).toContain('if (uSmoke > 0.01)');
    expect(FRAGMENT).toContain('precision highp float;');
  });
});

describe('FireCanvas resource handling', () => {
  const source = readFileSync(resolve(__dirname, '../components/FireCanvas.tsx'), 'utf-8');
  const shader = readFileSync(resolve(__dirname, 'fireShader.ts'), 'utf-8');

  it('releases the GPU context on unmount (browsers cap live WebGL contexts)', () => {
    expect(source).toContain('renderer.dispose()');
    expect(shader).toContain("getExtension('WEBGL_lose_context')");
  });

  it('pauses off-screen, caps the frame rate and adapts quality', () => {
    expect(source).toContain('IntersectionObserver');
    expect(source).toContain('Math.max(10, live.current.fps)');
    expect(source).toContain('quality');
  });

  it('is decorative only', () => {
    expect(source).toContain('aria-hidden="true"');
  });
});
