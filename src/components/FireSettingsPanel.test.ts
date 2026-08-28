import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('FireSettingsPanel information hierarchy', () => {
  const source = readFileSync(resolve(__dirname, 'FireSettingsPanel.tsx'), 'utf-8');

  it('keeps daily comfort controls visible and moves explanatory content into disclosures', () => {
    expect(source).toContain('<FireComfortSettings totalTasks={totalTasks} />');
    expect(source).toContain('className="settings-disclosure settings-guide"');
    expect(source).toContain('className="settings-disclosure settings-data"');
    expect(source).toContain('3ステップだけ確認する');
  });

  it('keeps public privacy and support destinations directly reachable', () => {
    expect(source).toContain('aria-label="公開情報"');
    expect(source).toContain('href="/privacy.html"');
    expect(source).toContain('href="/support.html"');
  });
});
