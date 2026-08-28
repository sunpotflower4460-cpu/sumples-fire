import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('durable mutation failure context continuity', () => {
  const appSource = readFileSync(resolve(__dirname, 'App.tsx'), 'utf-8');

  it('preserves the previous Undo origin when a new task fails before persistence', () => {
    const addHandlerStart = appSource.indexOf('const handleAddSeed = (input: NewFireSeedInput) => {');
    const addCallIndex = appSource.indexOf('const id = addSeed(input);', addHandlerStart);
    const originClearIndex = appSource.indexOf('lastCompletedBurnOriginRef.current = null;', addHandlerStart);

    expect(addHandlerStart).toBeGreaterThan(-1);
    expect(addCallIndex).toBeGreaterThan(addHandlerStart);
    expect(originClearIndex).toBeGreaterThan(addCallIndex);
  });

  it('keeps focus and completion origin in the Undo snackbar when durable Undo fails', () => {
    expect(appSource).toContain('const didUndo = undoLastBurn();');
    expect(appSource).toContain('if (!didUndo) return;');

    const undoHandlerStart = appSource.indexOf('const handleUndoBurn = () => {');
    const failedUndoGuard = appSource.indexOf('if (!didUndo) return;', undoHandlerStart);
    const originClearIndex = appSource.indexOf('lastCompletedBurnOriginRef.current = null;', failedUndoGuard);

    expect(failedUndoGuard).toBeGreaterThan(undoHandlerStart);
    expect(originClearIndex).toBeGreaterThan(failedUndoGuard);
  });

  it('closes the delete modal to expose the failure notice but only clears Undo origin after durable deletion', () => {
    expect(appSource).toContain('const didDelete = deleteSeed(id);');
    expect(appSource).toContain('setPendingDeleteSeed(null);');
    expect(appSource).toContain('if (didDelete) {');

    const deleteHandlerStart = appSource.indexOf('const handleConfirmDelete = () => {');
    const deleteCallIndex = appSource.indexOf('const didDelete = deleteSeed(id);', deleteHandlerStart);
    const modalCloseIndex = appSource.indexOf('setPendingDeleteSeed(null);', deleteCallIndex);
    const successGuardIndex = appSource.indexOf('if (didDelete) {', modalCloseIndex);
    const originClearIndex = appSource.indexOf('lastCompletedBurnOriginRef.current = null;', successGuardIndex);

    expect(deleteCallIndex).toBeGreaterThan(deleteHandlerStart);
    expect(modalCloseIndex).toBeGreaterThan(deleteCallIndex);
    expect(successGuardIndex).toBeGreaterThan(modalCloseIndex);
    expect(originClearIndex).toBeGreaterThan(successGuardIndex);
  });
});
