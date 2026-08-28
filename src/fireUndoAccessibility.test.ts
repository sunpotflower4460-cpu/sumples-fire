import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Fire undo accessibility', () => {
  const appSource = readFileSync(resolve(__dirname, 'App.tsx'), 'utf-8');
  const hookSource = readFileSync(resolve(__dirname, 'hooks/useFireSeeds.ts'), 'utf-8');
  const ritualSource = readFileSync(resolve(__dirname, 'components/BurningRitual.tsx'), 'utf-8');
  const cssSource = readFileSync(resolve(__dirname, 'undoActionPolish.css'), 'utf-8');

  it('leaves completion announcement ownership to the actionable toast', () => {
    expect(ritualSource).toContain('<span className="ritual-live-copy">「{seed.title}」を燃やしています。</span>');
    expect(ritualSource).not.toContain('をFireしました。${seed.ashPoints}炭を獲得しました。');
    expect(appSource).toContain('className="toast-action-message" role="status" aria-live="polite"');
  });

  it('keeps actionable completion copy stable while Undo remains available', () => {
    expect(hookSource).toContain('if (!notice || undoBurnSnapshot) return;');
    expect(hookSource).toContain('}, [notice, undoBurnSnapshot]);');
    expect(hookSource).toContain('setUndoBurnSnapshot(undoSnapshot);');
    expect(hookSource).toContain('setNotice(decorated);');
  });

  it('does not expire undo on a fixed timer', () => {
    expect(hookSource).not.toContain('undoTimerRef');
    expect(hookSource).not.toContain('FIRE_UNDO_WINDOW_MS');
    expect(hookSource).toContain('const dismissUndoBurn = () =>');
    expect(hookSource).toContain('setUndoBurnSnapshot(undoSnapshot);');
  });

  it('keeps the persistent Undo snackbar above bottom chrome and safe areas', () => {
    expect(cssSource).toContain('top: auto;');
    expect(cssSource).toContain('bottom: max(154px, calc(env(safe-area-inset-bottom) + 154px));');
    expect(cssSource).toContain('@media (min-width: 760px)');
    expect(cssSource).toContain('bottom: 180px;');
  });

  it('invalidates stale undo when a different mutation happens', () => {
    expect(hookSource).toContain('const addSeed = (input: NewFireSeedInput) => {\n    clearUndoBurn();');
    expect(hookSource).toMatch(/const burnTask = \(id: string\) => \{[\s\S]*?clearUndoBurn\(\);[\s\S]*?createFireBurnUndoSnapshot/);
    expect(hookSource).toMatch(/const deleteSeed = \(id: string\) => \{[\s\S]*?clearUndoBurn\(\);/);
  });

  it('provides an explicit dismiss target and recovers focus after it disappears', () => {
    expect(appSource).toContain('aria-label="Fire通知を閉じる"');
    expect(appSource).toContain('const handleDismissUndo = () =>');
    expect(appSource).toContain('focusPrimaryAction();');
    expect(cssSource).toContain('.toast-dismiss-button');
    expect(cssSource).toContain('min-width: 44px');
  });
});
