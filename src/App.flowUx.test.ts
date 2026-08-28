import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('app flow UX contracts', () => {
  const appSource = readFileSync(resolve(__dirname, 'App.tsx'), 'utf-8');

  it('preserves per-tab scroll positions and supports current-tab scroll to top', () => {
    expect(appSource).toContain('scrollPositionsRef');
    expect(appSource).toContain('scrollPositionsRef.current[activeTab] = window.scrollY');
    expect(appSource).toContain("onClick={() => navigateToTab(tab.id)}");
  });

  it('removes the app shell from keyboard interaction during the Fire ritual', () => {
    expect(appSource).toContain("shell.setAttribute('inert', '')");
    expect(appSource).toContain("shell.removeAttribute('inert')");
    expect(appSource).toContain('burningTask !== null');
  });

  it('keeps all-clear and next-fire states mutually exclusive', () => {
    expect(appSource).toContain('hasTasks && !hasPendingTasks');
    expect(appSource).toContain("{hasPendingTasks ? (\n              <section className=\"panel app-panel compact-panel\">");
  });

  it('lets the matrix filter toggle off and removes hidden recommendation noise', () => {
    expect(appSource).toContain('current === key ? null : key');
    expect(appSource).not.toContain('おすすめ:');
    expect(appSource).not.toContain('openRecordWithTitle');
  });
});
