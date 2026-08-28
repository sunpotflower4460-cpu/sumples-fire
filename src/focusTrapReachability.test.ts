import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('focus trap reachability', () => {
  const trapSource = readFileSync(resolve(__dirname, 'hooks/useFocusTrap.ts'), 'utf-8');
  const formSource = readFileSync(resolve(__dirname, 'components/FireForm.tsx'), 'utf-8');

  it('filters closed disclosure descendants while keeping their summary reachable', () => {
    expect(trapSource).toContain("element.closest<HTMLDetailsElement>('details:not([open])')");
    expect(trapSource).toContain("closedDetails.querySelector<HTMLElement>(':scope > summary')");
    expect(trapSource).toContain('return element !== summary');
  });

  it('excludes hidden, aria-hidden, inert, and CSS-hidden candidates', () => {
    expect(trapSource).toContain("element.closest('[hidden], [aria-hidden=\"true\"], [inert]')");
    expect(trapSource).toContain("style.display === 'none' || style.visibility === 'hidden'");
    expect(trapSource).toContain('element.getClientRects().length > 0');
  });

  it('uses the same reachable-target list for initial focus and every Tab decision', () => {
    expect(trapSource).toContain('const getReachableFocusTargets =');
    expect(trapSource).toContain('const initialFocusable = getReachableFocusTargets(container)');
    expect(trapSource).toContain('const elements = getReachableFocusTargets(container)');
  });

  it('covers the real form shape where closed disclosures precede a disabled submit', () => {
    expect(formSource).toContain('className="task-tuning-fields"');
    expect(formSource).toContain('className="advanced-fields"');
    expect(formSource).toContain('type="submit" disabled={!canSubmit}');
  });
});
