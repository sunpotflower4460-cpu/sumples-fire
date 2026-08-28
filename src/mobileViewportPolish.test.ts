import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('mobile capture viewport contracts', () => {
  const css = readFileSync(resolve(__dirname, 'mobileViewportPolish.css'), 'utf-8');
  const main = readFileSync(resolve(__dirname, 'main.tsx'), 'utf-8');

  it('uses dynamic viewport height while retaining vh fallback', () => {
    expect(css).toContain('min-height: 100vh');
    expect(css).toContain('min-height: 100dvh');
    expect(css).toContain('max-height: min(92dvh, 820px)');
    expect(css).toContain('max-height: min(84dvh, 820px)');
  });

  it('keeps focused fields clear of the sticky submit control', () => {
    expect(css).toContain('scroll-padding-bottom: 96px');
    expect(css).toContain('scroll-margin-bottom: 104px');
    expect(css).toContain('.form-sticky-submit {\n  bottom: 0;');
  });

  it('promotes the sheet to a full-height surface on short phone landscape', () => {
    expect(css).toContain('(max-height: 500px) and (orientation: landscape)');
    expect(css).toContain('height: 100dvh');
    expect(css).toContain('border-radius: 0');
    expect(css).toContain('env(safe-area-inset-left)');
    expect(css).toContain('env(safe-area-inset-right)');
  });

  it('loads viewport polish before the final accessibility layer', () => {
    expect(main.indexOf("import './mobileViewportPolish.css';"))
      .toBeLessThan(main.indexOf("import './accessibilityPolish.css';"));
  });
});
