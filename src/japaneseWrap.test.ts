import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Japanese phrase wrapping contracts', () => {
  const cssSource = readFileSync(resolve(__dirname, 'japaneseWrap.css'), 'utf-8');
  const mainSource = readFileSync(resolve(__dirname, 'main.tsx'), 'utf-8');
  const appSource = readFileSync(resolve(__dirname, 'App.tsx'), 'utf-8');
  const cardSource = readFileSync(resolve(__dirname, 'components/FireCard.tsx'), 'utf-8');
  const ritualSource = readFileSync(resolve(__dirname, 'components/BurningRitual.tsx'), 'utf-8');

  it('loads wrapping after text-scale resilience so keep-all can override mid-word breaks', () => {
    expect(mainSource).toContain("import './japaneseWrap.css';");
    expect(mainSource.indexOf("import './textScaleResilience.css';"))
      .toBeLessThan(mainSource.indexOf("import './japaneseWrap.css';"));
  });

  it('keeps CJK together and only uses anywhere as an overflow valve', () => {
    expect(cssSource).toContain('line-break: strict');
    expect(cssSource).toContain('word-break: keep-all');
    expect(cssSource).toContain('overflow-wrap: anywhere');
    expect(cssSource).not.toContain('word-break: auto-phrase');
  });

  it('unwraps headline balance so explicit <br> is the only wrap for fixed copy', () => {
    expect(cssSource).toContain('text-wrap: unset');
    expect(appSource).toContain('嫌なタスクを、<br />燃やして<br />終わらせる。');
    expect(appSource).toContain("今日の薪は、<br />{jp('きれいに燃え尽きました。')}");
  });

  it('inserts phrase wraps into user-generated titles instead of splitting compounds', () => {
    expect(appSource).toContain('jp(focusSeed.title)');
    expect(cardSource).toContain('jp(seed.title)');
    expect(ritualSource).toContain('jp(seed.title)');
  });
});
