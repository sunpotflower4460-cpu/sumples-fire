import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('capture noise reduction', () => {
  const appSource = readFileSync(resolve(__dirname, 'App.tsx'), 'utf-8');
  const formSource = readFileSync(resolve(__dirname, 'components/FireForm.tsx'), 'utf-8');
  const cssSource = readFileSync(resolve(__dirname, 'capturePolish.css'), 'utf-8');

  it('uses the session draft as the only title recovery path', () => {
    expect(appSource).not.toContain('draftTitle');
    expect(appSource).not.toContain('setDraftTitle');
    expect(appSource).toContain('<FireForm onAddSeed={handleAddSeed} />');
    expect(formSource).not.toContain('defaultTitle');
    expect(formSource).not.toContain('onClearDefaultTitle');
    expect(formSource).toContain('useState(loadFireFormDraft)');
  });

  it('does not show a character counter until it becomes decision-relevant', () => {
    expect(formSource).toContain('const titleCounterThreshold = 45');
    expect(formSource).toContain('const showTitleCounter = title.length >= titleCounterThreshold');
    expect(formSource).toContain('{showTitleCounter ? (');
    expect(formSource).toContain('あと{titleRemaining}文字');
    expect(formSource).not.toContain('{title.length} / {titleMaxLength}');
  });

  it('visually escalates only when the title is very close to its limit', () => {
    expect(formSource).toContain("titleRemaining <= 5 ? ' is-near-limit' : ''");
    expect(cssSource).toContain('.char-count.is-near-limit');
    expect(cssSource).toContain('@media (prefers-color-scheme: dark)');
    expect(cssSource).toContain('@media (forced-colors: active)');
  });
});
