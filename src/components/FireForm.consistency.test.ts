import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('FireForm creation consistency', () => {
  const source = readFileSync(resolve(__dirname, 'FireForm.tsx'), 'utf-8');

  it('does not expose priority or lifecycle stage as manual creation fields', () => {
    expect(source).not.toContain('id="seed-priority"');
    expect(source).not.toContain('id="seed-stage"');
    expect(source).not.toContain('setPriority');
    expect(source).not.toContain('setStage');
  });

  it('derives priority and always creates an unburned spark state', () => {
    expect(source).toContain('derivePriority(urgency, importance)');
    expect(source).toContain("stage: 'spark'");
    expect(source).toContain('<summary>メモ・カテゴリ</summary>');
  });
});
