import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('modal background isolation', () => {
  const isolationSource = readFileSync(resolve(__dirname, 'components/AppModalIsolation.tsx'), 'utf-8');
  const mainSource = readFileSync(resolve(__dirname, 'main.tsx'), 'utf-8');

  it('recognizes both in-shell modal overlay types', () => {
    expect(isolationSource).toContain("'.sheet-backdrop, .fire-delete-backdrop'");
    expect(isolationSource).toContain('child.matches(MODAL_OVERLAY_SELECTOR)');
  });

  it('hides and inerts only the background siblings while preserving the overlay', () => {
    expect(isolationSource).toContain('if (child === overlay || savedStates.has(child)) continue');
    expect(isolationSource).toContain("child.setAttribute('inert', '')");
    expect(isolationSource).toContain("child.setAttribute('aria-hidden', 'true')");
  });

  it('restores pre-existing accessibility state when the modal disappears', () => {
    expect(isolationSource).toContain('ariaHidden: child.getAttribute(\'aria-hidden\')');
    expect(isolationSource).toContain("inert: child.hasAttribute('inert')");
    expect(isolationSource).toContain('restoreBackground()');
    expect(isolationSource).toContain('savedStates.clear()');
  });

  it('watches shell child changes so dynamically mounted overlays are isolated', () => {
    expect(isolationSource).toContain('const observer = new MutationObserver(syncIsolation)');
    expect(isolationSource).toContain('observer.observe(shell, { childList: true })');
    expect(isolationSource).toContain('observer.disconnect()');
  });

  it('mounts the isolation controller outside App alongside the screen announcer', () => {
    const appIndex = mainSource.indexOf('<App />');
    const isolationIndex = mainSource.indexOf('<AppModalIsolation />');
    const announcerIndex = mainSource.indexOf('<AppScreenAnnouncer />');

    expect(appIndex).toBeGreaterThanOrEqual(0);
    expect(isolationIndex).toBeGreaterThan(appIndex);
    expect(announcerIndex).toBeGreaterThan(isolationIndex);
  });
});
