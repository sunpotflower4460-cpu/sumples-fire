import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('quick view: tasks visible at a glance, one tap to Fire', () => {
  const css = readFileSync(resolve(__dirname, 'quickViewPolish.css'), 'utf-8');
  const main = readFileSync(resolve(__dirname, 'main.tsx'), 'utf-8');
  const app = readFileSync(resolve(__dirname, 'App.tsx'), 'utf-8');
  const card = readFileSync(resolve(__dirname, 'components/FireCard.tsx'), 'utf-8');

  it('loads before the final readability pass', () => {
    expect(main.indexOf("import './quickViewPolish.css';")).toBeGreaterThan(-1);
    expect(main.indexOf("import './quickViewPolish.css';")).toBeLessThan(main.indexOf("import './readabilityPolish.css';"));
  });

  it('puts the Fire button on the same row as the queue task title', () => {
    expect(css).toContain('"head fire"');
    expect(css).toMatch(/\.card-footer,\s*body #up-next-list \.fire-card:not\(\.is-burned\) \.card-actions\s*\{\s*display: contents/);
    expect(css).toMatch(/\.fire-button\s*\{[^}]*min-height: 48px/);
  });

  it('keeps the delete control a full 44px tap target', () => {
    expect(css).toMatch(/\.card-delete-button\s*\{[^}]*width: 44px;[^}]*height: 44px/);
  });

  it('collapses the quadrant filter into one scrolling chip row', () => {
    expect(css).toMatch(/\.matrix-summary\s*\{[^}]*flex-wrap: nowrap[^}]*overflow-x: auto/);
  });

  it('only offers the quadrant filter when there is something to filter', () => {
    expect(app).toContain('matrixItems.filter((item) => item.count > 0).length > 1 || quadrantFilter');
  });

  it('hides the default category label so every row does not repeat "やること"', () => {
    expect(card).toContain("seed.burned || seed.category !== 'task'");
  });
});
