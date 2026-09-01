import { describe, expect, it } from 'vitest';
import {
  SHEET_DRAG_RESISTANCE,
  SHEET_DRAG_UP_RESISTANCE,
  SCROLL_DEPTH_RANGE_PX,
  TILT_MAX_DEGREES,
  computePointerTilt,
  computeScrollDepth,
  computeSheetDragOffset,
} from './motionTokens';

describe('pointer tilt geometry', () => {
  it('stays flat at the centre of a surface', () => {
    const tilt = computePointerTilt(50, 50, 100, 100);
    expect(tilt.rotateX).toBe(0);
    expect(tilt.rotateY).toBe(0);
    expect(tilt.glareX).toBe(50);
    expect(tilt.glareY).toBe(50);
  });

  it('tips the top away from the viewer when the pointer is high on the card', () => {
    const top = computePointerTilt(50, 0, 100, 100);
    const bottom = computePointerTilt(50, 100, 100, 100);
    expect(top.rotateX).toBe(TILT_MAX_DEGREES);
    expect(bottom.rotateX).toBe(-TILT_MAX_DEGREES);
  });

  it('turns toward the pointer horizontally and tracks the glare with it', () => {
    const right = computePointerTilt(100, 50, 100, 100);
    expect(right.rotateY).toBe(TILT_MAX_DEGREES);
    expect(right.glareX).toBe(100);
  });

  it('clamps a pointer that has left the box instead of tilting without limit', () => {
    const outside = computePointerTilt(-400, 900, 100, 100);
    expect(outside.rotateY).toBe(-TILT_MAX_DEGREES);
    expect(outside.rotateX).toBe(-TILT_MAX_DEGREES);
  });

  it('never divides by a collapsed box', () => {
    expect(computePointerTilt(10, 10, 0, 0)).toEqual({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  });
});

describe('sheet drag resistance', () => {
  it('follows a downward drag loosely and an upward drag stiffly', () => {
    expect(computeSheetDragOffset(100)).toBeCloseTo(100 * SHEET_DRAG_RESISTANCE, 2);
    expect(computeSheetDragOffset(-100)).toBeCloseTo(-100 * SHEET_DRAG_UP_RESISTANCE, 2);
    expect(Math.abs(computeSheetDragOffset(-100))).toBeLessThan(computeSheetDragOffset(100));
  });
});

describe('scroll depth', () => {
  it('ramps from 0 to 1 across the condensing range and then holds', () => {
    expect(computeScrollDepth(0)).toBe(0);
    expect(computeScrollDepth(SCROLL_DEPTH_RANGE_PX / 2)).toBe(0.5);
    expect(computeScrollDepth(SCROLL_DEPTH_RANGE_PX)).toBe(1);
    expect(computeScrollDepth(SCROLL_DEPTH_RANGE_PX * 40)).toBe(1);
  });
});
