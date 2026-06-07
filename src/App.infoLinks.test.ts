import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('info tab public links', () => {
  const appSource = readFileSync(resolve(__dirname, 'App.tsx'), 'utf-8');

  it('does not use target _blank for privacy/support links', () => {
    expect(appSource).toContain('<a href="/privacy.html">');
    expect(appSource).toContain('<a href="/support.html">');
    expect(appSource).not.toContain('href="/privacy.html" target="_blank"');
    expect(appSource).not.toContain('href="/support.html" target="_blank"');
  });

  it('shows privacy summary text in info tab', () => {
    expect(appSource).toContain('プライバシーについて');
    expect(appSource).toContain('運営者のサーバーへ送信する機能はありません');
  });
});
