import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('accessibility polish contracts', () => {
  const css = readFileSync(resolve(__dirname, 'accessibilityPolish.css'), 'utf-8');

  it('keeps semantic secondary text on the final muted token', () => {
    expect(css).toContain('.stat-card > span');
    expect(css).toContain('.rank-stat-card small');
    expect(css).toContain('.fire-card:not(.is-burned) .card-footer');
    expect(css).toContain('color: var(--wc-muted);');
  });

  it('uses an opaque charcoal archive surface with readable text', () => {
    expect(css).toContain('background: #252d2e;');
    expect(css).toContain('color: #f5e8d3;');
    expect(css).toContain('color: #f0c84d;');
  });

  it('keeps compact destructive, close, reset, and disclosure controls at least 44px', () => {
    expect(css).toContain('min-width: 44px;');
    expect(css).toContain('min-height: 44px;');
    expect(css).toContain('.matrix-reset-button');
    expect(css).toContain('.fire-card .card-details > summary');
  });

  it('supports higher contrast and forced-colors environments', () => {
    expect(css).toContain('@media (prefers-contrast: more)');
    expect(css).toContain('@media (forced-colors: active)');
  });
});
