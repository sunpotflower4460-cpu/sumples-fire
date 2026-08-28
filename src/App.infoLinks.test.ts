import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('info tab public links', () => {
  const settingsSource = readFileSync(resolve(__dirname, 'components/FireSettingsPanel.tsx'), 'utf-8');

  it('does not use target _blank for privacy/support links', () => {
    expect(settingsSource).toContain('<a href="/privacy.html">');
    expect(settingsSource).toContain('<a href="/support.html">');
    expect(settingsSource).not.toContain('href="/privacy.html" target="_blank"');
    expect(settingsSource).not.toContain('href="/support.html" target="_blank"');
  });

  it('keeps the privacy summary in the settings surface', () => {
    expect(settingsSource).toContain('データとプライバシー');
    expect(settingsSource).toContain('運営者のサーバーへ送信する機能はありません');
  });
});
