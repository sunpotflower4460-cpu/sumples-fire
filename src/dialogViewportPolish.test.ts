import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('destructive dialog viewport resilience', () => {
  const css = readFileSync(resolve(__dirname, 'dialogViewportPolish.css'), 'utf-8');
  const mainSource = readFileSync(resolve(__dirname, 'main.tsx'), 'utf-8');

  it('keeps the backdrop scrollable when enlarged content exceeds the viewport', () => {
    expect(css).toContain('.fire-delete-backdrop');
    expect(css).toContain('overflow-y: auto');
    expect(css).toContain('overscroll-behavior: contain');
    expect(css).toContain('env(safe-area-inset-top)');
    expect(css).toContain('env(safe-area-inset-bottom)');
  });

  it('caps the dialog to the dynamic viewport and lets its own content scroll', () => {
    expect(css).toContain('max-height: calc(100dvh - 24px)');
    expect(css).toContain('scroll-padding-block: 16px');
    expect(css).toContain('-webkit-overflow-scrolling: touch');
  });

  it('stacks destructive choices at reflow widths without truncating labels', () => {
    expect(css).toContain('@media (max-width: 420px)');
    expect(css).toContain('.fire-delete-actions');
    expect(css).toContain('grid-template-columns: 1fr');
    expect(css).toContain('white-space: normal');
    expect(css).toContain('overflow-wrap: anywhere');
  });

  it('compresses decoration before content in short viewports', () => {
    expect(css).toContain('@media (max-height: 520px)');
    expect(css).toContain('.fire-delete-icon');
    expect(css).toContain('display: none');
  });

  it('loads after text scaling but before the final accessibility layer', () => {
    const textScaleIndex = mainSource.indexOf("import './textScaleResilience.css';");
    const dialogIndex = mainSource.indexOf("import './dialogViewportPolish.css';");
    const accessibilityIndex = mainSource.indexOf("import './accessibilityPolish.css';");

    expect(textScaleIndex).toBeGreaterThanOrEqual(0);
    expect(dialogIndex).toBeGreaterThan(textScaleIndex);
    expect(accessibilityIndex).toBeGreaterThan(dialogIndex);
  });
});
