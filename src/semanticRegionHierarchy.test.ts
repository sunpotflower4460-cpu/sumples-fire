import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('semantic screen region hierarchy', () => {
  const appSource = readFileSync(resolve(__dirname, 'App.tsx'), 'utf-8');

  it('names the Up Next region from its visible heading', () => {
    expect(appSource).toContain('task-queue-panel" aria-labelledby="up-next-heading"');
    expect(appSource).toContain('<h2 id="up-next-heading">その次のタスク</h2>');
  });

  it('names the ash archive region from its visible heading', () => {
    expect(appSource).toContain('className="panel app-panel" aria-labelledby="ash-screen-heading"');
    expect(appSource).toContain('<h2 id="ash-screen-heading">炭の記録</h2>');
  });

  it('gives the settings content a specific name instead of repeating the screen title', () => {
    expect(appSource).toContain('settings-panel" aria-labelledby="settings-screen-heading"');
    expect(appSource).toContain('<h2 id="settings-screen-heading">体験とアプリ設定</h2>');
    expect(appSource).not.toContain('<h2>設定</h2>');
  });

  it('keeps the screen-level h1 as the single screen name', () => {
    expect(appSource).toContain('<h1 id="app-screen-title">');
    expect(appSource).toContain('aria-labelledby="app-screen-title"');
  });
});
