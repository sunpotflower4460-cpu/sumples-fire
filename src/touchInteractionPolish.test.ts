import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('coarse-pointer touch interaction polish', () => {
  const cssSource = readFileSync(resolve(__dirname, 'touchInteractionPolish.css'), 'utf-8');
  const mainSource = readFileSync(resolve(__dirname, 'main.tsx'), 'utf-8');

  it('uses manipulation on explicit tap controls without disabling page pinch zoom', () => {
    expect(cssSource).toContain('touch-action: manipulation;');
    expect(cssSource).not.toContain('touch-action: none;');
  });

  it('contains record-sheet edge overscroll instead of chaining into the locked page', () => {
    expect(cssSource).toContain('.record-sheet');
    expect(cssSource).toContain('overscroll-behavior-y: contain;');
    expect(cssSource).toContain('-webkit-overflow-scrolling: touch;');
  });

  it('reserves vertical drag-zone motion for intentional dismiss while preserving pinch zoom', () => {
    expect(cssSource).toContain('.sheet-drag-zone');
    expect(cssSource).toContain('touch-action: pan-x pinch-zoom;');
  });

  it('removes hover movement only for touch-only coarse pointers', () => {
    expect(cssSource).toContain('@media (hover: none) and (pointer: coarse)');
    expect(cssSource).toContain('.fire-card:hover:not(.is-burning)');
    expect(cssSource).toContain('.matrix-cell:hover');
    expect(cssSource).toContain('transform: none;');
  });

  it('loads touch polish before the final accessibility floor', () => {
    const touchIndex = mainSource.indexOf("import './touchInteractionPolish.css';");
    const accessibilityIndex = mainSource.indexOf("import './accessibilityPolish.css';");

    expect(touchIndex).toBeGreaterThanOrEqual(0);
    expect(accessibilityIndex).toBeGreaterThan(touchIndex);
  });
});
