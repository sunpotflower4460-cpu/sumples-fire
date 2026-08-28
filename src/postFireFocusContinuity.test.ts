import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('post-Fire focus continuity', () => {
  const appSource = readFileSync(resolve(__dirname, 'App.tsx'), 'utf-8');
  const cardSource = readFileSync(resolve(__dirname, 'components/FireCard.tsx'), 'utf-8');

  it('records whether Fire started from the focus hero or the queue', () => {
    expect(appSource).toContain("type BurnOrigin =");
    expect(appSource).toContain("{ kind: 'focus' }");
    expect(appSource).toContain("{ kind: 'queue'; index: number }");
    expect(appSource).toContain('if (burnOriginRef.current !== null) return;');
    expect(appSource).toContain('visibleQueueTasks.findIndex((seed) => seed.id === id)');
  });

  it('keeps queue completion in queue context instead of jumping to the hero', () => {
    expect(cardSource).toContain('data-fire-task-id={seed.id}');
    expect(appSource).toContain("'#up-next-list .fire-button[data-fire-task-id]'");
    expect(appSource).toContain('queueButtons[Math.min(burnOrigin.index');
    expect(appSource).toContain("'.queue-empty-state .primary-button'");
    expect(appSource).toContain("'.matrix-reset-button'");
    expect(appSource).toContain("queueTarget.scrollIntoView({ block: 'nearest', behavior: 'auto' });");
  });

  it('routes both hero and queue Fire through the same one-tap origin-aware handler', () => {
    expect(appSource).toContain('onClick={() => handleFireTask(focusSeed.id)}');
    expect(appSource).toContain('onFire={handleFireTask}');
    expect(appSource).toContain('burnTask(id);');
  });

  it('keeps hero completion connected to the next primary action', () => {
    expect(appSource).toContain('focusFireButtonRef.current ?? allClearActionRef.current ?? floatingActionRef.current');
    expect(appSource).toContain("behavior: prefersReducedMotion() ? 'auto' : 'smooth'");
  });
});
