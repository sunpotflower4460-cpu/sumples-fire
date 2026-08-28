import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('one-tap Fire UX contract', () => {
  const appSource = readFileSync(resolve(__dirname, 'App.tsx'), 'utf-8');
  const hookSource = readFileSync(resolve(__dirname, 'hooks/useFireSeeds.ts'), 'utf-8');

  it('starts Fire directly without a confirmation dialog', () => {
    expect(appSource).not.toContain('FireConfirmModal');
    expect(appSource).not.toContain('pendingBurnSeed');
    expect(appSource).toContain('onClick={() => burnTask(focusSeed.id)}');
    expect(appSource).toContain('onFire={burnTask}');
  });

  it('offers a reversible completion action without a short expiry timer', () => {
    expect(appSource).toContain('undoBurnCandidate');
    expect(appSource).toContain('onClick={handleUndoBurn}');
    expect(appSource).toContain('onClick={handleDismissUndo}');
    expect(appSource).toContain('undoLastBurn();');
    expect(appSource).toContain('dismissUndoBurn();');
    expect(appSource).toContain('元に戻す');
    expect(hookSource).not.toContain('FIRE_UNDO_WINDOW_MS');
    expect(hookSource).not.toContain('undoTimerRef');
    expect(hookSource).toContain('createFireBurnUndoSnapshot(target, streakData)');
    expect(hookSource).toContain('saveFireStreak(undoBurnSnapshot.streakBefore)');
  });

  it('keeps destructive deletion behind explicit confirmation', () => {
    expect(appSource).toContain('FireDeleteModal');
    expect(appSource).toContain('pendingDeleteSeed');
  });
});
