import { describe, expect, it } from 'vitest';
import type { FireSeed } from '../types/fireSeed';
import { sortAshRecordsNewestFirst, sortAshRecordsOldestFirst } from './ashHistory';

const makeSeed = (id: string, burnedAt: string | undefined, updatedAt: string): FireSeed => ({
  id,
  title: id,
  body: '',
  nextAction: '',
  category: 'task',
  priority: 'medium',
  stage: 'flame',
  difficulty: 'normal',
  urgency: 'high',
  importance: 'high',
  quadrant: 'doNow',
  ashPoints: 5,
  burned: true,
  burnedAt,
  completed: true,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt,
});

describe('ash history chronology', () => {
  it('orders records by burn time instead of incoming task priority order', () => {
    const newest = makeSeed('newest', '2026-08-28T09:00:00.000Z', '2026-08-28T09:00:00.000Z');
    const oldest = makeSeed('oldest', '2026-08-20T09:00:00.000Z', '2026-08-20T09:00:00.000Z');
    const middle = makeSeed('middle', '2026-08-25T09:00:00.000Z', '2026-08-25T09:00:00.000Z');

    expect(sortAshRecordsOldestFirst([newest, oldest, middle]).map((seed) => seed.id)).toEqual([
      'oldest',
      'middle',
      'newest',
    ]);
    expect(sortAshRecordsNewestFirst([oldest, middle, newest]).map((seed) => seed.id)).toEqual([
      'newest',
      'middle',
      'oldest',
    ]);
  });

  it('falls back to updatedAt when imported burned data has no burnedAt', () => {
    const imported = makeSeed('imported', undefined, '2026-08-27T09:00:00.000Z');
    const older = makeSeed('older', '2026-08-26T09:00:00.000Z', '2026-08-26T09:00:00.000Z');

    expect(sortAshRecordsNewestFirst([older, imported]).map((seed) => seed.id)).toEqual(['imported', 'older']);
  });
});
