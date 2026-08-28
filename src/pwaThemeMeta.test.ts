import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('PWA browser chrome metadata', () => {
  const html = readFileSync(resolve(__dirname, '../index.html'), 'utf-8');
  const manifest = readFileSync(resolve(__dirname, '../public/manifest.webmanifest'), 'utf-8');

  it('declares light and dark color schemes with adaptive theme colors', () => {
    expect(html).toContain('<meta name="color-scheme" content="light dark">');
    expect(html).toContain('content="#faf6f0" media="(prefers-color-scheme: light)"');
    expect(html).toContain('content="#12100e" media="(prefers-color-scheme: dark)"');
  });

  it('uses the current canvas instead of the legacy launch background', () => {
    expect(manifest).toContain('"background_color": "#f7f2eb"');
    expect(manifest).not.toContain('"background_color": "#fff7ea"');
  });
});
