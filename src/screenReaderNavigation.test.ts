import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('screen-reader navigation continuity', () => {
  const announcerSource = readFileSync(resolve(__dirname, 'components/AppScreenAnnouncer.tsx'), 'utf-8');
  const mainSource = readFileSync(resolve(__dirname, 'main.tsx'), 'utf-8');
  const cssSource = readFileSync(resolve(__dirname, 'screenReaderPolish.css'), 'utf-8');

  it('announces actual screen-title changes without announcing the initial mount', () => {
    expect(announcerSource).toContain('previousTitleRef.current = document.title;');
    expect(announcerSource).toContain('new MutationObserver(announceScreenChange)');
    expect(announcerSource).toContain("setAnnouncement(`${screenNameFromTitle(nextTitle)}画面を表示しました`)");
    expect(announcerSource).toContain('nextTitle === previousTitleRef.current');
  });

  it('uses one quiet atomic polite live region', () => {
    expect(announcerSource).toContain('role="status"');
    expect(announcerSource).toContain('aria-live="polite"');
    expect(announcerSource).toContain('aria-atomic="true"');
    expect(announcerSource).toContain('className="sr-only app-screen-announcement"');
  });

  it('mounts the announcer outside the app shell so Fire inert does not silence it', () => {
    const appIndex = mainSource.indexOf('<App />');
    const announcerIndex = mainSource.indexOf('<AppScreenAnnouncer />');
    expect(appIndex).toBeGreaterThan(-1);
    expect(announcerIndex).toBeGreaterThan(appIndex);
    expect(mainSource).toContain("import './screenReaderPolish.css';");
    expect(mainSource.indexOf("import './screenReaderPolish.css';"))
      .toBeLessThan(mainSource.indexOf("import './accessibilityPolish.css';"));
  });

  it('keeps assistive text visually clipped without display none', () => {
    expect(cssSource).toContain('.sr-only');
    expect(cssSource).toContain('clip: rect(0, 0, 0, 0)');
    expect(cssSource).toContain('white-space: nowrap');
    expect(cssSource).not.toContain('display: none');
    expect(cssSource).not.toContain('visibility: hidden');
  });
});
