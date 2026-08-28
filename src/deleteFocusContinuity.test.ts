import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('delete modal focus continuity', () => {
  const source = readFileSync(resolve(__dirname, 'components/FireDeleteModal.tsx'), 'utf-8');

  it('captures the launch control before passive focus-trap effects can move focus', () => {
    expect(source).toContain("import { useEffect, useLayoutEffect, useRef } from 'react';");
    expect(source).toContain('useLayoutEffect(() => {');
    expect(source).toContain('previousFocusRef.current = activeElement;');
    expect(source).toContain('deleteOriginRef.current = captureDeleteOrigin(activeElement);');
  });

  it('guards the original launch context from StrictMode effect replay', () => {
    expect(source).toContain('const hasCapturedOriginRef = useRef(false);');
    expect(source).toContain('if (hasCapturedOriginRef.current) return;');
    expect(source).toContain('hasCapturedOriginRef.current = true;');
  });

  it('returns queue and ash deletions to the same list position when possible', () => {
    expect(source).toContain("element.matches('#ash-records-list .ash-record-delete')");
    expect(source).toContain("element.matches('#up-next-list .card-delete-button')");
    expect(source).toContain("focusIndexedControl('#ash-records-list .ash-record-delete', origin.index)");
    expect(source).toContain("focusIndexedControl('#up-next-list .card-delete-button', origin.index)");
  });

  it('moves the last ash deletion to the new empty-state heading instead of losing focus', () => {
    expect(source).toContain("document.querySelector<HTMLElement>('#ash-empty-title')");
    expect(source).toContain('emptyHeading.tabIndex = -1;');
    expect(source).toContain("emptyHeading.scrollIntoView({ block: 'nearest', behavior: 'auto' });");
  });

  it('still restores the exact launch control when deletion is cancelled', () => {
    expect(source).toContain('if (previousFocusRef.current?.isConnected)');
    expect(source).toContain('previousFocusRef.current.focus({ preventScroll: true });');
    expect(source).toContain('shouldRestorePreviousFocusRef.current = false;');
  });
});
