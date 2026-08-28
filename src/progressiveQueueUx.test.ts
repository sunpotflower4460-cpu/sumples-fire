import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('progressive Up Next queue', () => {
  const appSource = readFileSync(resolve(__dirname, 'App.tsx'), 'utf-8');
  const cssSource = readFileSync(resolve(__dirname, 'focusQueuePolish.css'), 'utf-8');

  it('renders only a bounded first page of queue tasks', () => {
    expect(appSource).toContain('const QUEUE_PAGE_SIZE = 5');
    expect(appSource).toContain('filteredQueueTasks.slice(0, queueVisibleCount)');
    expect(appSource).toContain('visibleQueueTasks.map((seed) => <FireCard');
    expect(appSource).not.toContain('visibleTasks.map((seed) => <FireCard');
  });

  it('resets the page when the matrix scope changes', () => {
    expect(appSource).toContain('setQueueVisibleCount(QUEUE_PAGE_SIZE);');
    expect(appSource).toContain('const resetQueueView = () =>');
    expect(appSource).toContain('onClick={resetQueueView}');
  });

  it('communicates visible position and remaining work without dumping the whole list', () => {
    expect(appSource).toContain('`${visibleQueueTasks.length} / ${filteredQueueTasks.length}件`');
    expect(appSource).toContain('`次の${nextQueuePageCount}件を見る（残り${hiddenQueueCount}件）`');
    expect(appSource).toContain('`最初の${QUEUE_PAGE_SIZE}件に戻す`');
    expect(appSource).toContain('aria-controls="up-next-list"');
  });

  it('keeps paging control usable across input modes', () => {
    expect(cssSource).toContain('.task-queue-more');
    expect(cssSource).toContain('min-height: 48px');
    expect(cssSource).toContain('@media (hover: none), (pointer: coarse)');
    expect(cssSource).toContain('@media (prefers-reduced-motion: reduce)');
    expect(cssSource).toContain('@media (forced-colors: active)');
  });
});
