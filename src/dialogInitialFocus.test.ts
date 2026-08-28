import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('dialog initial focus', () => {
  const formSource = readFileSync(resolve(__dirname, 'components/FireForm.tsx'), 'utf-8');
  const trapSource = readFileSync(resolve(__dirname, 'hooks/useFocusTrap.ts'), 'utf-8');

  it('marks the task title as the intentional capture autofocus target', () => {
    expect(formSource).toContain('id="seed-title"');
    expect(formSource).toContain('autoFocus');
  });

  it('preserves an already focused control inside the trap', () => {
    expect(trapSource).toContain('const activeElement = document.activeElement');
    expect(trapSource).toContain('container.contains(activeElement)');
    expect(trapSource).toContain('activeElement.matches(FOCUSABLE_SELECTORS)');
    expect(trapSource).toContain('const hasIntentionalFocusInside =');
  });

  it('falls back to the first control only when nothing intentional is focused', () => {
    const guardIndex = trapSource.indexOf('if (!hasIntentionalFocusInside)');
    const fallbackIndex = trapSource.indexOf('initialFocusable[0]?.focus()');

    expect(guardIndex).toBeGreaterThanOrEqual(0);
    expect(fallbackIndex).toBeGreaterThan(guardIndex);
  });

  it('keeps dynamic Tab trapping after the initial-focus decision', () => {
    expect(trapSource).toContain("if (event.key !== 'Tab') return");
    expect(trapSource).toContain('container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)');
    expect(trapSource).toContain('document.addEventListener(\'keydown\', handleKeyDown)');
  });
});
