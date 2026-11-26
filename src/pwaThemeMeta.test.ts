import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('PWA browser chrome metadata', () => {
  const html = readFileSync(resolve(__dirname, '../index.html'), 'utf-8');
  const manifest = readFileSync(resolve(__dirname, '../public/manifest.webmanifest'), 'utf-8');

  it('declares a single dark color scheme so system chrome matches the app canvas', () => {
    expect(html).toContain('<meta name="color-scheme" content="dark">');
    expect(html).toContain('<meta name="theme-color" content="#0a0a0a">');
    expect(html).not.toContain('prefers-color-scheme');
  });

  it('uses the dark canvas for the manifest launch colors', () => {
    expect(manifest).toContain('"background_color": "#0a0a0a"');
    expect(manifest).toContain('"theme_color": "#0a0a0a"');
  });

  it('never branches on the OS color scheme in app styles (the app is dark-only)', () => {
    const srcDir = resolve(__dirname);
    const offenders = readdirSync(srcDir)
      .filter((file) => file.endsWith('.css'))
      .filter((file) => readFileSync(resolve(srcDir, file), 'utf-8').includes('prefers-color-scheme'));
    expect(offenders).toEqual([]);
  });
});
