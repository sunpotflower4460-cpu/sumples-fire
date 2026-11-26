import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('color harmony (夜の焚き火)', () => {
  const css = readFileSync(resolve(__dirname, 'colorHarmony.css'), 'utf-8');
  const main = readFileSync(resolve(__dirname, 'main.tsx'), 'utf-8');
  const app = readFileSync(resolve(__dirname, 'App.tsx'), 'utf-8');
  const card = readFileSync(resolve(__dirname, 'components/FireCard.tsx'), 'utf-8');

  it('loads before the final readability pass so contrast fixes stay on top', () => {
    const order = ["import './colorHarmony.css';", "import './readabilityPolish.css';"].map((line) => main.indexOf(line));
    expect(order[0]).toBeGreaterThan(-1);
    expect(order[0]).toBeLessThan(order[1]);
  });

  it('gives every quadrant its own hue', () => {
    const hues = ['doNow', 'schedule', 'quickBurn', 'backlog'].map((key) => {
      const match = css.match(new RegExp(`--q-${key}-rgb:\\s*([\\d, ]+);`));
      expect(match).not.toBeNull();
      return match![1].trim();
    });
    expect(new Set(hues).size).toBe(4);
  });

  it('themes each screen with its own accent', () => {
    expect(css).toContain('html[data-screen="ash"]');
    expect(css).toContain('html[data-screen="info"]');
    const accents = [...css.matchAll(/--accent:\s*(#[0-9a-f]{6});/gi)].map((m) => m[1].toLowerCase());
    expect(new Set(accents).size).toBe(3);
    expect(app).toContain('document.documentElement.dataset.screen = activeTab');
  });

  it('marks cards and the focus card with their quadrant and difficulty', () => {
    expect(card).toContain('data-quadrant={seed.quadrant}');
    expect(card).toContain('data-difficulty={seed.difficulty}');
    expect(app).toContain('data-quadrant={focusSeed.quadrant}');
  });

  it('keeps the backdrop a cool-to-warm gradient rather than one flat brown', () => {
    expect(css).toMatch(/linear-gradient\(180deg, var\(--sky\) 0%, var\(--mid\) 46%, var\(--ground\) 100%\)/);
  });

  it('does not rely on color-mix (unsupported before iOS 16.2)', () => {
    expect(css).not.toContain('color-mix');
  });
});
