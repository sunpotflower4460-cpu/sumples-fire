import { describe, expect, it } from 'vitest';
import { JP_SOFT_WRAP, insertJapaneseSoftWraps, jp } from './japanesePhraseWrap';

describe('japanese phrase wrapping', () => {
  it('wraps after particles so compound nouns stay intact', () => {
    const wrapped = insertJapaneseSoftWraps('確定申告の書類をまとめる');
    expect(wrapped).toBe(`確定申告の${JP_SOFT_WRAP}書類を${JP_SOFT_WRAP}まとめる`);
    expect(wrapped).not.toContain(`確定申${JP_SOFT_WRAP}`);
    expect(wrapped).not.toContain(`たたき${JP_SOFT_WRAP}台`);
  });

  it('keeps short verb phrases like 燃やしたい together', () => {
    expect(insertJapaneseSoftWraps('燃やしたい')).toBe('燃やしたい');
    expect(insertJapaneseSoftWraps('まとめる')).toBe('まとめる');
    expect(insertJapaneseSoftWraps('たたき台')).toBe('たたき台');
  });

  it('splits quadrant labels at the natural particle, not mid-word', () => {
    expect(insertJapaneseSoftWraps('大事に進める')).toBe(`大事に${JP_SOFT_WRAP}進める`);
    expect(insertJapaneseSoftWraps('先に片付ける')).toBe(`先に${JP_SOFT_WRAP}片付ける`);
    expect(insertJapaneseSoftWraps('あとで燃やす')).toBe(`あとで${JP_SOFT_WRAP}燃やす`);
    expect(insertJapaneseSoftWraps('今すぐ燃やす')).toBe('今すぐ燃やす');
  });

  it('wraps after punctuation and never before small kana or ー', () => {
    const wrapped = insertJapaneseSoftWraps('終わったら、ちょっと休もう。');
    expect(wrapped).toContain(`、${JP_SOFT_WRAP}`);
    expect(insertJapaneseSoftWraps('ちょっと')).toBe('ちょっと');
    expect(insertJapaneseSoftWraps('コーヒー')).toBe('コーヒー');
  });

  it('keeps latin tokens together and offers a wrap after them', () => {
    expect(insertJapaneseSoftWraps('Fireした')).toBe(`Fire${JP_SOFT_WRAP}した`);
    expect(insertJapaneseSoftWraps('ALL CLEAR')).toBe('ALL CLEAR');
  });

  it('is idempotent and ignores existing soft wraps', () => {
    const once = insertJapaneseSoftWraps('体験とアプリ設定');
    expect(once).toBe(`体験と${JP_SOFT_WRAP}アプリ設定`);
    expect(insertJapaneseSoftWraps(once)).toBe(once);
    expect(jp).toBe(insertJapaneseSoftWraps);
  });
});
