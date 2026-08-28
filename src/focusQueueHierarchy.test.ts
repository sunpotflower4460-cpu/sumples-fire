import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('focus and queue hierarchy', () => {
  const source = readFileSync(resolve(__dirname, 'App.tsx'), 'utf-8');

  it('removes the current focus task from the up-next queue', () => {
    expect(source).toContain("pendingTasks.filter((seed) => seed.id !== focusSeed?.id)");
    expect(source).toContain('const hasQueueTasks = queueTasks.length > 0');
    expect(source).toContain("quadrantFilter ? queueTasks.filter((seed) => seed.quadrant === quadrantFilter) : queueTasks");
  });

  it('builds matrix counts from the queue it actually controls', () => {
    expect(source).toContain("queueTasks.filter((seed) => seed.quadrant === 'doNow').length");
    expect(source).toContain("queueTasks.filter((seed) => seed.quadrant === 'schedule').length");
    expect(source).toContain('aria-label="次のタスクを4象限で絞り込む"');
  });

  it('presents actions before reward/progress surfaces', () => {
    const focusIndex = source.indexOf('className="focus-seed"');
    const queueIndex = source.indexOf('className="panel app-panel compact-panel task-queue-panel"');
    const campfireIndex = source.indexOf('<FireCampfire');
    const progressIndex = source.indexOf('className="progress-disclosure"');

    expect(focusIndex).toBeGreaterThan(-1);
    expect(queueIndex).toBeGreaterThan(focusIndex);
    expect(campfireIndex).toBeGreaterThan(queueIndex);
    expect(progressIndex).toBeGreaterThan(campfireIndex);
  });

  it('does not render queue chrome when there is nothing beyond the focus task', () => {
    expect(source).toContain('{hasQueueTasks ? (');
    expect(source).toContain('<p className="eyebrow">UP NEXT</p>');
    expect(source).toContain('<h2 id="up-next-heading">その次のタスク</h2>');
  });
});
