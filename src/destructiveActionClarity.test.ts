import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('destructive action clarity', () => {
  const modalSource = readFileSync(resolve(__dirname, 'components/FireDeleteModal.tsx'), 'utf-8');
  const hookSource = readFileSync(resolve(__dirname, 'hooks/useFireSeeds.ts'), 'utf-8');

  it('explains the extra consequence of deleting a burned ash record', () => {
    expect(modalSource).toContain('const isAshRecord = seed.burned');
    expect(modalSource).toContain('この炭の記録を削除しますか？');
    expect(modalSource).toContain('削除すると${seed.ashPoints}炭が合計から減り');
    expect(modalSource).toContain('称号の進捗にも反映されます');
    expect(modalSource).toContain('連続Fireの記録は変わりません');
    expect(modalSource).toContain("isAshRecord ? '炭ごと削除' : '削除する'");
  });

  it('keeps the streak consequence copy aligned with delete behavior', () => {
    const deleteStart = hookSource.indexOf('const deleteSeed =');
    const focusStart = hookSource.indexOf('const focusSeed =');
    const deleteImplementation = hookSource.slice(deleteStart, focusStart);

    expect(deleteStart).toBeGreaterThanOrEqual(0);
    expect(focusStart).toBeGreaterThan(deleteStart);
    expect(deleteImplementation).not.toContain('setStreakData');
    expect(deleteImplementation).not.toContain('saveFireStreak');
  });

  it('restores focus differently for cancel and confirmed deletion', () => {
    expect(modalSource).toContain('shouldRestorePreviousFocusRef.current = false');
    expect(modalSource).toContain('previousFocusRef.current?.isConnected');
    expect(modalSource).toContain('window.setTimeout(focusAfterDelete, 0)');
    expect(modalSource).toContain('.focus-seed .fire-button');
    expect(modalSource).toContain('.all-clear-card .primary-button');
    expect(modalSource).toContain('.floating-action');
    expect(modalSource).toContain('.tab-button[aria-current="page"]');
  });
});
