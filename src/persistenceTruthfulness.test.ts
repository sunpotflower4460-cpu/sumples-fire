import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('persistence-truthful seed mutations', () => {
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

  it('treats the burn animation as transient until the completed list is durable', () => {
    expect(hookSource).toContain('const burningSeeds = seeds.map');
    expect(hookSource).toContain('const completedSeeds = sortFireTasks(');
    expect(hookSource).toContain('if (!saveStoredSeeds(storageDriverRef.current, completedSeeds))');
    expect(hookSource).toContain('setSeeds(seeds);');
    expect(hookSource).toContain('Fireを完了できませんでした。タスクは残しています');
    expect(hookSource.indexOf('saveStoredSeeds(storageDriverRef.current, completedSeeds)'))
      .toBeLessThan(hookSource.indexOf('const newStreakData = recordBurnForStreak(streakData)'));
  });

  it('does not change undo or delete state when their durable write fails', () => {
    expect(hookSource).toContain('if (!saveStoredSeeds(storageDriverRef.current, restoredSeeds))');
    expect(hookSource).toContain('Fireを元に戻せませんでした');
    expect(hookSource).toContain('if (!saveStoredSeeds(storageDriverRef.current, remainingSeeds))');
    expect(hookSource).toContain('削除できませんでした。タスクは残しています');
    expect(hookSource).toContain('return false;');
  });

  it('has no generic seed-save effect that can persist transient UI states or write on mount', () => {
    expect(hookSource).not.toContain('hasCompletedInitialSeedLoadRef');
    expect(hookSource).not.toContain('const persistedSeeds = seeds.map');
    expect(hookSource).not.toContain("setNotice('この端末では保存できませんでした')");
  });
});
