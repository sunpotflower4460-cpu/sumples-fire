import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('capture draft persistence UX', () => {
  const formSource = readFileSync(resolve(__dirname, 'components/FireForm.tsx'), 'utf-8');
  const draftSource = readFileSync(resolve(__dirname, 'lib/fireFormDraft.ts'), 'utf-8');

  it('hydrates every editable capture field from the session draft', () => {
    expect(formSource).toContain('const [initialDraft] = useState(loadFireFormDraft)');
    expect(formSource).toContain('useState(initialDraft.title)');
    expect(formSource).toContain('useState(initialDraft.nextAction)');
    expect(formSource).toContain('useState<FireDifficulty>(initialDraft.difficulty)');
    expect(formSource).toContain('useState(initialDraft.hasAdjustedTuning)');
  });

  it('saves form changes while the sheet is open and clears only after success', () => {
    expect(formSource).toContain('saveFireFormDraft({');
    expect(formSource).toContain('clearFireFormDraft();');
    expect(formSource.indexOf('onAddSeed({')).toBeLessThan(formSource.indexOf('clearFireFormDraft();'));
    expect(formSource).toContain('閉じても、このセッション中は書きかけを保持します。');
  });

  it('uses session storage rather than permanent task storage', () => {
    expect(draftSource).toContain("FIRE_FORM_DRAFT_KEY = 'sumples-fire-form-draft-v1'");
    expect(draftSource).toContain('return window.sessionStorage;');
    expect(draftSource).not.toContain('localStorage');
  });

  it('keeps draft persistence best-effort when browser storage is blocked', () => {
    expect(draftSource).toContain("if (typeof window === 'undefined') return null");
    expect(draftSource).toContain('Draft preservation is best-effort');
  });
});
