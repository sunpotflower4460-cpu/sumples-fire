import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('transparent task tuning defaults', () => {
  const formSource = readFileSync(resolve(__dirname, 'components/FireForm.tsx'), 'utf-8');
  const cssSource = readFileSync(resolve(__dirname, 'capturePolish.css'), 'utf-8');

  it('labels untouched tuning as an initial value rather than inferred intelligence', () => {
    expect(formSource).toContain('const [hasAdjustedTuning, setHasAdjustedTuning] = useState(initialDraft.hasAdjustedTuning)');
    expect(formSource).toContain("{hasAdjustedTuning ? '設定' : '初期値'}: {tuningSummary}");
    expect(formSource).toContain('タイトルから自動判定しているわけではありません');
    expect(formSource).not.toContain('<span>自動分類</span>');
  });

  it('names the quadrant display as a deterministic result', () => {
    expect(formSource).toContain('<span>4象限の結果</span>');
    expect(formSource).toContain('const quadrant = getQuadrant(urgency, importance)');
  });

  it('marks tuning as user-set whenever urgency, importance, or difficulty is touched', () => {
    expect(formSource.match(/setHasAdjustedTuning\(true\)/g)?.length).toBe(3);
    expect(formSource).toContain('setHasAdjustedTuning(false);');
  });

  it('keeps the disclosure note quiet and accessible in alternate contrast modes', () => {
    expect(cssSource).toContain('.task-tuning-default-note');
    expect(cssSource).toContain('@media (prefers-color-scheme: dark)');
    expect(cssSource).toContain('@media (forced-colors: active)');
  });
});
