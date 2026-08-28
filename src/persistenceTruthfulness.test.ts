import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('persistence-truthful task creation', () => {
  const hookSource = readFileSync(resolve(__dirname, 'hooks/useFireSeeds.ts'), 'utf-8');
  const formSource = readFileSync(resolve(__dirname, 'components/FireForm.tsx'), 'utf-8');

  it('persists the exact next seed list before showing creation as successful', () => {
    expect(hookSource).toContain('const nextSeeds = sortFireTasks([nextSeed, ...seeds]);');
    expect(hookSource).toContain('if (!saveStoredSeeds(storageDriverRef.current, nextSeeds))');
    expect(hookSource).toContain("throw new Error('seed-persistence-failed')");
    expect(hookSource.indexOf('saveStoredSeeds(storageDriverRef.current, nextSeeds)'))
      .toBeLessThan(hookSource.indexOf('setSeeds(nextSeeds)'));
    expect(hookSource.indexOf('setSeeds(nextSeeds)'))
      .toBeLessThan(hookSource.indexOf("setNotice('薪を追加しました')"));
  });

  it('lets the existing form recovery path keep the draft visible when persistence fails', () => {
    expect(formSource).toContain('try {');
    expect(formSource).toContain('onAddSeed({');
    expect(formSource).toContain('} catch {');
    expect(formSource).toContain('内容は残っています。もう一度お試しください');
    expect(formSource).toContain('submitButtonRef.current?.focus()');
  });

  it('does not emit a storage failure before the user performs a mutation', () => {
    expect(hookSource).toContain('const hasCompletedInitialSeedLoadRef = useRef(false);');
    expect(hookSource).toContain('if (!hasCompletedInitialSeedLoadRef.current)');
    expect(hookSource).toContain('hasCompletedInitialSeedLoadRef.current = true;');
  });
});
