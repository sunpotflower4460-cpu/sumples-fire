import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Fire form error recovery', () => {
  const source = readFileSync(resolve(__dirname, 'components/FireForm.tsx'), 'utf-8');

  it('keeps the submit action available so an empty form can explain what is missing', () => {
    expect(source).toContain('disabled={isSubmitting}');
    expect(source).not.toContain('disabled={!canSubmit}');
    expect(source).not.toContain('const canSubmit =');
    expect(source).toContain("setTitleError(jp('タスク名を入力してください'))");
    expect(source).toContain('titleInputRef.current?.focus()');
  });

  it('links title validation to the focused title control without a duplicate alert channel', () => {
    expect(source).toContain("const [titleError, setTitleError] = useState('')");
    expect(source).toContain('aria-invalid={titleError ? \'true\' : undefined}');
    expect(source).toContain('aria-describedby={titleDescribedBy}');
    expect(source).toContain('id={titleErrorId} className="form-error"');
    expect(source).not.toContain('id={titleErrorId} className="form-error" role="alert"');
  });

  it('separates submission failure from title validity and describes the focused retry action once', () => {
    expect(source).toContain("const [submitError, setSubmitError] = useState('')");
    expect(source).toContain('submitButtonRef.current?.focus()');
    expect(source).toContain('内容は残っています。もう一度お試しください');
    expect(source).toContain('aria-describedby={submitError ? submitErrorId : undefined}');
    expect(source).toContain('id={submitErrorId} className="form-error form-submit-error"');
    expect(source).not.toContain('id={submitErrorId} className="form-error form-submit-error" role="alert"');
  });
});
