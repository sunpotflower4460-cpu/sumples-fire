import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('native tuning choice semantics', () => {
  const formSource = readFileSync(resolve(__dirname, 'components/FireForm.tsx'), 'utf-8');
  const cssSource = readFileSync(resolve(__dirname, 'choiceSemanticsPolish.css'), 'utf-8');
  const mainSource = readFileSync(resolve(__dirname, 'main.tsx'), 'utf-8');

  it('uses native mutually-exclusive radio groups for all tuning dimensions', () => {
    expect(formSource).toContain('type="radio"');
    expect(formSource).toContain('name="seed-urgency"');
    expect(formSource).toContain('name="seed-importance"');
    expect(formSource).toContain('name="seed-difficulty"');
    expect(formSource).toContain('checked={urgency === option.value}');
    expect(formSource).toContain('checked={importance === option.value}');
    expect(formSource).toContain('checked={difficulty === option.value}');
  });

  it('removes toggle-button semantics from mutually-exclusive choices', () => {
    const tuningStart = formSource.indexOf('className="task-tuning-body"');
    const advancedStart = formSource.indexOf('className="advanced-fields"');
    const tuningSource = formSource.slice(tuningStart, advancedStart);

    expect(tuningStart).toBeGreaterThan(-1);
    expect(advancedStart).toBeGreaterThan(tuningStart);
    expect(tuningSource).not.toContain('aria-pressed');
    expect(tuningSource).not.toContain('type="button"');
  });

  it('keeps the full visual card clickable while exposing native focus', () => {
    expect(formSource).toContain('className="choice-radio"');
    expect(cssSource).toContain('.choice-button:has(.choice-radio:focus-visible)');
    expect(cssSource).toContain('clip-path: inset(50%)');
    expect(cssSource).toContain('cursor: pointer');
  });

  it('covers forced colors and keeps final accessibility overrides last', () => {
    expect(cssSource).toContain('@media (forced-colors: active)');
    expect(cssSource).toContain('border-color: Highlight');
    expect(mainSource).toContain("import './choiceSemanticsPolish.css';");
    expect(mainSource.indexOf("import './choiceSemanticsPolish.css';"))
      .toBeLessThan(mainSource.indexOf("import './accessibilityPolish.css';"));
  });
});
