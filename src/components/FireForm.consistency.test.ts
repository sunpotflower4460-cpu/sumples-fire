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

  it('uses the shared creation contract instead of rebuilding derived metadata in the form', () => {
    expect(source).toContain('NewFireSeedInput');
    expect(source).not.toContain('derivePriority(urgency, importance)');
    expect(source).not.toContain("stage: 'spark'");
    expect(source).not.toContain('priority,');
    expect(source).toContain('className="advanced-fields"');
    expect(source).toContain('<span>メモ・カテゴリ</span>');
  });
});
