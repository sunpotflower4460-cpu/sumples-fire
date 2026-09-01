import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('tactile polish contracts', () => {
  const cssSource = readFileSync(resolve(__dirname, 'tactilePolish.css'), 'utf-8');
  const dimensionalSource = readFileSync(resolve(__dirname, 'dimensionalPolish.css'), 'utf-8');
  const mainSource = readFileSync(resolve(__dirname, 'main.tsx'), 'utf-8');
  const appSource = readFileSync(resolve(__dirname, 'App.tsx'), 'utf-8');
  const tiltSource = readFileSync(resolve(__dirname, 'hooks/usePointerTilt.ts'), 'utf-8');
  const dragSource = readFileSync(resolve(__dirname, 'hooks/useSheetDrag.ts'), 'utf-8');

  it('loads after the dimensional layer it extends', () => {
    expect(mainSource).toContain("import './tactilePolish.css';");
    expect(mainSource.indexOf("import './dimensionalPolish.css';"))
      .toBeLessThan(mainSource.indexOf("import './tactilePolish.css';"));
  });

  it('keeps the app chrome pinned to the viewport', () => {
    // Regression guard: a later blanket rule set `position: relative` on all of
    // these, which unstuck the header and parked the tab dock below the fold.
    expect(cssSource).toContain('.app-topbar {\n  position: sticky;');
    expect(cssSource).toContain('.bottom-tabs {\n  position: fixed;');
    expect(cssSource).toContain('.floating-action {\n  position: fixed;');
    expect(cssSource).toContain('.sheet-backdrop {\n  position: fixed;');
  });

  it('leaves the floating action button its plus-glyph pseudo elements', () => {
    // `::before`/`::after` on the FAB draw the two bars of the "+" icon.
    expect(dimensionalSource).not.toContain('.floating-action::after {');
    expect(dimensionalSource).not.toContain('.floating-action::before {');
  });

  it('lets the entrance animations hand the transform back for tilt and drag', () => {
    // `both` would freeze the final keyframe and outrank the pointer-tilt and
    // sheet-drag base transforms for the life of the element.
    expect(dimensionalSource).toContain('animation: dpCardRise 0.52s var(--dp-ease-pop) backwards;');
    expect(dimensionalSource).toContain('animation: dpSheetRise 0.42s var(--dp-ease-pop) backwards;');
  });

  it('gives the toast to framer-motion and centres it without a transform', () => {
    expect(cssSource).toContain('.toast {\n  animation: none;');
    expect(cssSource).toContain('margin-inline: auto;');
    expect(appSource).toContain('variants={toastVariants}');
  });

  it('cross-fades screens in one grid cell so scroll restoration survives', () => {
    expect(cssSource).toContain('.app-screen {\n  display: grid;');
    expect(cssSource).toContain('grid-area: 1 / 1;');
    expect(appSource).toContain('<AnimatePresence initial={false} custom={screenDepth}>');
    expect(appSource).toContain('<ScreenLayer key="today" depth={screenDepth}>');
    expect(appSource).toContain('scrollPositionsRef.current[activeTab] = window.scrollY');
  });

  it('drives pointer tilt from a callback ref so late-mounting cards get it', () => {
    expect(tiltSource).toContain('return useCallback((node: T | null) => {');
    expect(tiltSource).toContain('requestAnimationFrame');
    expect(tiltSource).toContain("matches('(hover: hover) and (pointer: fine)')");
    expect(tiltSource).toContain("matches('(prefers-reduced-motion: reduce)')");
  });

  it('keeps sheet dragging visual only, leaving the close decision in App.tsx', () => {
    expect(dragSource).not.toContain('onClose');
    expect(dragSource).not.toContain('setIsRecordOpen');
    expect(dragSource).toContain("node.style.setProperty('--sheet-drag'");
    expect(appSource).toContain('const handleSheetSwipeCancel = () =>');
  });

  it('guards every addition for touch and reduced motion', () => {
    expect(cssSource).toContain('@media (hover: hover) and (pointer: fine)');
    expect(cssSource).toContain('@media (hover: none), (pointer: coarse)');
    const reduceBlock = cssSource.slice(cssSource.lastIndexOf('@media (prefers-reduced-motion: reduce)'));
    expect(reduceBlock).toContain('animation: none !important');
    expect(reduceBlock).toContain('transform: none !important');
  });

  it('never introduces an ancestor perspective that would unstick fixed layers', () => {
    expect(cssSource).toContain('perspective(');
    expect(cssSource).not.toMatch(/^\s*perspective:\s*\d/m);
  });
});
