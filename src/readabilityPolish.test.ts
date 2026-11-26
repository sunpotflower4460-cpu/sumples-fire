import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('final readability pass', () => {
  const css = readFileSync(resolve(__dirname, 'readabilityPolish.css'), 'utf-8');
  const main = readFileSync(resolve(__dirname, 'main.tsx'), 'utf-8');

  it('is the last stylesheet imported so it wins the cascade', () => {
    const imports = main.split('\n').filter((line) => line.startsWith("import './") && line.endsWith(".css';"));
    expect(imports[imports.length - 1]).toBe("import './readabilityPolish.css';");
  });

  it('keeps secondary text at AA-friendly alpha and labels no smaller than 12px', () => {
    const muted = css.match(/--readable-text-muted:\s*rgba\(245, 232, 211, ([\d.]+)\)/);
    expect(muted).not.toBeNull();
    expect(Number(muted![1])).toBeGreaterThanOrEqual(0.7);
    expect(css).toContain('font-size: 0.78rem');
    expect(css).not.toMatch(/font-size:\s*0\.[0-6]\d*rem/);
  });

  it('keeps pinned chrome opaque enough that scrolled content does not ghost through', () => {
    expect(css).toMatch(/\.app-topbar\s*\{[^}]*rgba\(20, 16, 14, 0\.9\d\)/);
    expect(css).toMatch(/\.bottom-tabs\s*\{[^}]*rgba\(18, 15, 13, 0\.9\d\)/);
    expect(css).toMatch(/\.sheet-drag-zone\s*\{[^}]*background: var\(--sheet-bg, #1a1512\)/);
  });

  it('does not leave inactive tabs dimmed by opacity', () => {
    expect(css).toMatch(/\.tab-button:not\(\.is-active\)\s*\{[^}]*opacity: 1/);
  });
});
