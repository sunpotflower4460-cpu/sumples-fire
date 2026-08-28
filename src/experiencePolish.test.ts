import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('experience polish contracts', () => {
  const ashSource = readFileSync(resolve(__dirname, 'components/AshLegacy.tsx'), 'utf-8');
  const settingsSource = readFileSync(resolve(__dirname, 'components/FireSettingsPanel.tsx'), 'utf-8');
  const comfortSource = readFileSync(resolve(__dirname, 'components/FireComfortSettings.tsx'), 'utf-8');
  const cssSource = readFileSync(resolve(__dirname, 'experiencePolish.css'), 'utf-8');
  const mainSource = readFileSync(resolve(__dirname, 'main.tsx'), 'utf-8');

  it('treats an empty ash archive as a beginning rather than a zero dashboard', () => {
    expect(ashSource).toContain('if (seeds.length === 0)');
    expect(ashSource).toContain('className="ash-empty-state"');
    expect(ashSource).toContain('最初の炭は、まだありません。');
    expect(ashSource).not.toContain('ash-mosaic-empty');
  });

  it('uses user-facing settings copy instead of design rationale', () => {
    expect(settingsSource).toContain('Fireの演出音を、好みに合わせて切り替えられます。');
    expect(settingsSource).not.toContain('すぐ触れる場所に置いています');
    expect(comfortSource).toContain('Fireするときの効果音です。');
    expect(cssSource).toContain('.settings-screen-intro');
    expect(cssSource).toContain('display: none;');
  });

  it('keeps the three navigation destinations visually balanced and floats creation above the dock', () => {
    expect(cssSource).toContain('padding-right: 7px;');
    expect(cssSource).toContain('bottom: max(88px, calc(env(safe-area-inset-bottom) + 88px));');
    expect(cssSource).toContain('.tab-button.is-active::before');
    expect(cssSource).toContain('transform: none;');
  });

  it('loads experience polish before the final accessibility layer', () => {
    expect(mainSource.indexOf("import './experiencePolish.css';"))
      .toBeLessThan(mainSource.indexOf("import './accessibilityPolish.css';"));
  });
});
