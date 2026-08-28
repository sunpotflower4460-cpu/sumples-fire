import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('capture focus recovery', () => {
  const appSource = readFileSync(resolve(__dirname, 'App.tsx'), 'utf-8');
  const mainSource = readFileSync(resolve(__dirname, 'main.tsx'), 'utf-8');

  it('returns to the opener only while that opener still exists', () => {
    expect(appSource).toContain('const previousFocus = previouslyFocusedElementRef.current');
    expect(appSource).toContain('previousFocus?.isConnected');
    expect(appSource).toContain('restoreTarget?.focus({ preventScroll: true })');
  });

  it('falls through to a useful surviving control when save changes the screen state', () => {
    const closeStart = appSource.indexOf('const closeRecord =');
    const navigationStart = appSource.indexOf('const navigateToTab =');
    const closeImplementation = appSource.slice(closeStart, navigationStart);

    expect(closeStart).toBeGreaterThanOrEqual(0);
    expect(navigationStart).toBeGreaterThan(closeStart);
    expect(closeImplementation.indexOf('focusFireButtonRef.current'))
      .toBeLessThan(closeImplementation.indexOf('allClearActionRef.current'));
    expect(closeImplementation.indexOf('allClearActionRef.current'))
      .toBeLessThan(closeImplementation.indexOf('floatingActionRef.current'));
    expect(closeImplementation).toContain('.tab-button[aria-current="page"]');
  });

  it('keeps Escape and backdrop dismissal on the same safe close path', () => {
    expect(appSource).toContain("if (event.key !== 'Escape') return");
    expect(appSource).toContain('onClick={closeRecord}');
  });

  it('does not load the obsolete confirmation-dialog polish layer', () => {
    expect(mainSource).not.toContain("import './dialogPolish.css';");
    expect(mainSource.trim().endsWith(');')).toBe(true);
  });
});
