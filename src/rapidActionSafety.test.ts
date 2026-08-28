import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('rapid action safety', () => {
  const hookSource = readFileSync(resolve(__dirname, 'hooks/useFireSeeds.ts'), 'utf-8');
  const formSource = readFileSync(resolve(__dirname, 'components/FireForm.tsx'), 'utf-8');

  it('locks Fire synchronously before React state can re-render', () => {
    expect(hookSource).toContain('const activeBurnIdRef = useRef<string | null>(null)');
    expect(hookSource).toContain('if (activeBurnIdRef.current !== null) return');
    expect(hookSource).toContain('activeBurnIdRef.current = id');
    expect(hookSource).toContain('activeBurnIdRef.current = null');
    expect(hookSource).toContain('completionTimerRef.current = window.setTimeout');
  });

  it('locks add-task submission synchronously and exposes a busy state', () => {
    expect(formSource).toContain('const submitLockRef = useRef(false)');
    expect(formSource).toContain('if (submitLockRef.current) return');
    expect(formSource).toContain('submitLockRef.current = true');
    expect(formSource).toContain('aria-busy={isSubmitting || undefined}');
    expect(formSource).toContain("isSubmitting ? '追加中…' : 'タスクを薪にする'");
    expect(formSource).toContain('disabled={isSubmitting}');
  });

  it('unlocks the form if the add callback throws and preserves retry context', () => {
    expect(formSource).toContain('submitLockRef.current = false');
    expect(formSource).toContain('setIsSubmitting(false)');
    expect(formSource).toContain('内容は残っています。もう一度お試しください');
    expect(formSource).toContain('submitButtonRef.current?.focus()');
  });
});
