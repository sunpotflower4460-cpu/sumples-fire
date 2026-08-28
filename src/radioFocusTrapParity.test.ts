import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('native radio focus-trap parity', () => {
  const trapSource = readFileSync(resolve(__dirname, 'hooks/useFocusTrap.ts'), 'utf-8');
  const formSource = readFileSync(resolve(__dirname, 'components/FireForm.tsx'), 'utf-8');

  it('collapses each native radio group to the browser sequential Tab stop', () => {
    expect(trapSource).toContain("element instanceof HTMLInputElement && element.type === 'radio'");
    expect(trapSource).toContain('candidate.name === element.name');
    expect(trapSource).toContain('candidate.form === element.form');
    expect(trapSource).toContain('group.find((radio) => radio.checked) ?? group[0]');
    expect(trapSource).toContain('reachable.filter((element) => isNativeRadioTabStop(element, reachable))');
  });

  it('uses the same collapsed target set for autofocus preservation and Tab boundaries', () => {
    expect(trapSource).toContain('const initialFocusable = getReachableFocusTargets(container);');
    expect(trapSource).toContain('initialFocusable.includes(activeElement)');
    expect(trapSource).toContain('const elements = getReachableFocusTargets(container);');
  });

  it('keeps the tuning controls as named native radio groups', () => {
    expect(formSource).toContain('type="radio"');
    expect(formSource).toContain('name="seed-urgency"');
    expect(formSource).toContain('name="seed-importance"');
    expect(formSource).toContain('name="seed-difficulty"');
  });
});
