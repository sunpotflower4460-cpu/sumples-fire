import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('text scale and narrow-width resilience', () => {
  const cssSource = readFileSync(resolve(__dirname, 'textScaleResilience.css'), 'utf-8');
  const mainSource = readFileSync(resolve(__dirname, 'main.tsx'), 'utf-8');
  const indexSource = readFileSync(resolve(__dirname, '../index.html'), 'utf-8');

  it('lets user-generated and action copy wrap instead of clipping', () => {
    expect(cssSource).toContain('overflow-wrap: anywhere');
    expect(cssSource).toContain('.toast-action-message');
    expect(cssSource).toContain('white-space: normal');
    expect(cssSource).toContain('text-overflow: clip');
    expect(cssSource).toContain('.fire-card h3');
    expect(cssSource).toContain('.focus-seed .section-heading h2');
  });

  it('allows horizontal layouts to become multi-line without fixed heights', () => {
    expect(cssSource).toContain('.task-queue-heading');
    expect(cssSource).toContain('.card-footer');
    expect(cssSource).toContain('.progress-disclosure > summary');
    expect(cssSource).toContain('flex-wrap: wrap');
    expect(cssSource).toContain('.primary-button');
    expect(cssSource).toContain('height: auto');
  });

  it('keeps bottom navigation columns shrink-safe at narrow widths', () => {
    expect(cssSource).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))');
    expect(cssSource).toContain('.tab-button');
    expect(cssSource).toContain('min-width: 0');
  });

  it('preserves browser zoom and loads resilience before final accessibility overrides', () => {
    expect(indexSource).toContain('width=device-width, initial-scale=1.0, viewport-fit=cover');
    expect(indexSource).not.toContain('user-scalable=no');
    expect(indexSource).not.toContain('maximum-scale=1');
    expect(mainSource).toContain("import './textScaleResilience.css';");
    expect(mainSource.indexOf("import './textScaleResilience.css';"))
      .toBeLessThan(mainSource.indexOf("import './accessibilityPolish.css';"));
  });
});
