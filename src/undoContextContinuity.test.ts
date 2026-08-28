import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Undo and notification context continuity', () => {
  const appSource = readFileSync(resolve(__dirname, 'App.tsx'), 'utf-8');
  const cssSource = readFileSync(resolve(__dirname, 'undoActionPolish.css'), 'utf-8');

  it('remembers the completed Fire origin while Undo remains available', () => {
    expect(appSource).toContain('const lastCompletedBurnOriginRef = useRef<BurnOrigin | null>(null);');
    expect(appSource).toContain('lastCompletedBurnOriginRef.current = burnOrigin;');
    expect(appSource).toContain('lastCompletedBurnOriginRef.current = null;');
  });

  it('returns Undo to the restored task itself when it came from the queue', () => {
    expect(appSource).toContain('const restoredTaskId = undoBurnCandidate?.id;');
    expect(appSource).toContain('focusTaskButtonById(restoredTaskId)');
    expect(appSource).toContain("'.fire-button[data-fire-task-id]'");
    expect(appSource).toContain('data-fire-task-id={focusSeed.id}');
  });

  it('returns dismiss to the same queue position before falling back to the primary action', () => {
    expect(appSource).toContain("if (completedOrigin?.kind === 'queue')");
    expect(appSource).toContain('focusQueuePosition(completedOrigin.index)');
    expect(appSource).toContain('focusPrimaryAction();');
  });

  it('uses a vector close icon while preserving the 44px target', () => {
    expect(appSource).toContain('function CloseGlyph()');
    expect(appSource).toContain('<CloseGlyph />');
    expect(appSource).not.toContain('>\n            ×\n          </button>');
    expect(cssSource).toContain('.toast-dismiss-icon');
    expect(cssSource).toContain('min-width: 44px');
  });
});
