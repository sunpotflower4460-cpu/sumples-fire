import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('dimensional polish contracts', () => {
  const cssSource = readFileSync(resolve(__dirname, 'dimensionalPolish.css'), 'utf-8');
  const mainSource = readFileSync(resolve(__dirname, 'main.tsx'), 'utf-8');
  const appSource = readFileSync(resolve(__dirname, 'App.tsx'), 'utf-8');

  it('loads dimensional polish last, after accessibility polish', () => {
    expect(mainSource).toContain("import './dimensionalPolish.css';");
    expect(mainSource.indexOf("import './accessibilityPolish.css';"))
      .toBeLessThan(mainSource.indexOf("import './dimensionalPolish.css';"));
  });

  it('renders the ambient ember layer as decorative and non-interactive', () => {
    expect(appSource).toContain('<div className="ambient-embers" aria-hidden="true">');
  });

  it('gives 3D tilt its own local vanishing point instead of an ancestor perspective', () => {
    expect(cssSource).toContain('perspective(');
    expect(cssSource).not.toMatch(/^\s*perspective:\s*\d/m);
  });

  it('keeps every added motion reachable from a reduced-motion fallback', () => {
    expect(cssSource).toContain('@media (prefers-reduced-motion: no-preference)');
    expect(cssSource).toContain('@media (prefers-reduced-motion: reduce)');
    const reduceBlockStart = cssSource.lastIndexOf('@media (prefers-reduced-motion: reduce)');
    const reduceBlock = cssSource.slice(reduceBlockStart);
    expect(reduceBlock).toContain('animation: none !important');
    expect(reduceBlock).toContain('transform: none !important');
  });

  it('keeps ash/matrix hover tilt behind a fine-pointer hover guard', () => {
    expect(cssSource).toContain('@media (hover: hover) and (pointer: fine)');
  });
});
