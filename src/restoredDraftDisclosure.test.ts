import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('restored draft disclosure UX', () => {
  const formSource = readFileSync(resolve(__dirname, 'components/FireForm.tsx'), 'utf-8');
  const cssSource = readFileSync(resolve(__dirname, 'capturePolish.css'), 'utf-8');

  it('opens only disclosures that contained restored hidden content', () => {
    expect(formSource).toContain('const restoredTuningDisclosure = initialDraft.hasAdjustedTuning');
    expect(formSource).toContain("const restoredAdvancedDisclosure = initialDraft.body.trim().length > 0 || initialDraft.category !== 'task'");
    expect(formSource).toContain('useState(restoredTuningDisclosure)');
    expect(formSource).toContain('useState(restoredAdvancedDisclosure)');
  });

  it('hands disclosure control back to the user after restoration', () => {
    expect(formSource).toContain('open={isTuningOpen}');
    expect(formSource).toContain('setIsTuningOpen(event.currentTarget.open)');
    expect(formSource).toContain('open={isAdvancedOpen}');
    expect(formSource).toContain('setIsAdvancedOpen(event.currentTarget.open)');
  });

  it('keeps disclosure summaries informative even while collapsed', () => {
    expect(formSource).toContain("{hasAdjustedTuning ? '調整済み' : '必要なら調整'}");
    expect(formSource).toContain("category !== 'task' ? `メモあり ・ ${categoryLabels[category]}` : 'メモあり'");
    expect(formSource).toContain("category !== 'task' ? categoryLabels[category] : '任意'");
    expect(formSource).toContain("className={hasAdvancedContent ? 'has-content' : undefined}");
  });

  it('announces restoration only when meaningful session content was recovered', () => {
    expect(formSource).toContain('const restoredDraft = initialDraft.title.trim().length > 0');
    expect(formSource).toContain('書きかけを復元しました');
    expect(formSource).toContain('className="draft-restored-status" role="status"');
  });

  it('keeps restoration cues quiet in light, dark, and forced-color modes', () => {
    expect(cssSource).toContain('.draft-restored-status');
    expect(cssSource).toContain('.advanced-fields-summary > small.has-content');
    expect(cssSource).toContain('@media (prefers-color-scheme: dark)');
    expect(cssSource).toContain('@media (forced-colors: active)');
  });
});
