import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('progressive task capture contracts', () => {
  const formSource = readFileSync(resolve(__dirname, 'components/FireForm.tsx'), 'utf-8');
  const cssSource = readFileSync(resolve(__dirname, 'capturePolish.css'), 'utf-8');
  const mainSource = readFileSync(resolve(__dirname, 'main.tsx'), 'utf-8');

  it('keeps the fast path to title, optional first step, and submit', () => {
    const titleIndex = formSource.indexOf('id="seed-title"');
    const nextActionIndex = formSource.indexOf('id="seed-next-action"');
    const tuningIndex = formSource.indexOf('className="task-tuning-fields"');
    const submitIndex = formSource.indexOf('type="submit"');

    expect(titleIndex).toBeGreaterThan(-1);
    expect(nextActionIndex).toBeGreaterThan(titleIndex);
    expect(tuningIndex).toBeGreaterThan(nextActionIndex);
    expect(submitIndex).toBeGreaterThan(tuningIndex);
    expect(formSource).toContain('名前だけで追加できます。');
  });

  it('keeps priority and difficulty available behind one native disclosure', () => {
    expect(formSource).toContain('<details');
    expect(formSource).toContain('className="task-tuning-fields"');
    expect(formSource).toContain('open={isTuningOpen}');
    expect(formSource).toContain('<strong>優先度と重さ</strong>');
    expect(formSource).toContain('必要なら調整');
    expect(formSource).toContain('fieldset className="choice-section choice-fieldset"');
    expect(formSource).toContain('difficulty-fieldset');
    expect(formSource).toContain('matrix-result-card');
  });

  it('removes redundant readiness copy from the sticky action area', () => {
    expect(formSource).not.toContain('この内容で追加できます');
    expect(formSource).not.toContain('タスク名を入れると追加できます');
    expect(cssSource).toContain('.form-sticky-submit');
    expect(cssSource).toContain('gap: 0;');
  });

  it('preserves complete disclosure summaries at 320px-class reflow widths', () => {
    expect(cssSource).toContain('@media (max-width: 340px)');
    expect(cssSource).toContain('.task-tuning-fields > summary,\n  .advanced-fields-summary');
    expect(cssSource).toContain('flex-wrap: wrap');
    expect(cssSource).toContain('text-overflow: clip');
    expect(cssSource).toContain('white-space: normal');
    expect(cssSource).toContain('overflow-wrap: anywhere');
  });

  it('keeps capture polish ahead of the final accessibility layer', () => {
    expect(mainSource.indexOf("import './capturePolish.css';"))
      .toBeLessThan(mainSource.indexOf("import './accessibilityPolish.css';"));
  });
});
