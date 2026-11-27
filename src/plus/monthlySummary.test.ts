import { afterEach, describe, expect, it } from 'vitest';
import { burnSeed, backfillBurnedLocalDates, normalizeSeed } from '../lib/fireSeedModel';
import { createFireBurnUndoSnapshot, restoreFireSeedFromUndo } from '../lib/fireBurnUndo';
import type { FireSeed } from '../types/fireSeed';
import {
  buildCalendarWeeks,
  canGoToNextMonth,
  canGoToPreviousMonth,
  collectBurnRecords,
  createSampleRecords,
  createSampleYearRecords,
  describeDay,
  getFirstRecordDateKey,
  getMonthStatus,
  shiftMonth,
  summarizeMonth,
  summarizeYear,
} from './monthlySummary';

const originalTz = process.env.TZ;
afterEach(() => {
  if (originalTz === undefined) delete process.env.TZ;
  else process.env.TZ = originalTz;
});

const seed = (extra: Partial<FireSeed> = {}): FireSeed => normalizeSeed({
  id: extra.id ?? `s-${Math.random()}`,
  title: 'タスク',
  difficulty: 'normal',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...extra,
}, 0);

const burned = (id: string, burnedAt: string, ashPoints = 5, extra: Partial<FireSeed> = {}) => (
  seed({ id, title: `タスク${id}`, burned: true, completed: true, stage: 'flame', burnedAt, ashPoints, ...extra })
);

describe('yearly overview', () => {
  it('totals only the selected calendar year and counts each active day once', () => {
    process.env.TZ = 'Asia/Tokyo';
    const { records } = collectBurnRecords([
      burned('old', '2025-12-30T03:00:00.000Z', 20),
      burned('a', '2026-01-10T03:00:00.000Z', 3),
      burned('b', '2026-01-10T07:00:00.000Z', 5),
      burned('c', '2026-11-12T03:00:00.000Z', 10),
    ]);
    const summary = summarizeYear(records, 2026);
    expect(summary).toMatchObject({ count: 3, ash: 18, activeDays: 2 });
    expect(summary.months).toHaveLength(12);
    expect(summary.months[0]).toMatchObject({ count: 2, ash: 8 });
    expect(summary.months[10]).toMatchObject({ count: 1, ash: 10 });
    expect(summary.months[11]).toMatchObject({ count: 0, ash: 0 });
  });

  it('keeps the demo months within the selected year with unique sample IDs', () => {
    expect(createSampleYearRecords(new Date(2026, 0, 1)).every((record) => record.year === 2026 && record.month === 1)).toBe(true);
    const samples = createSampleYearRecords(new Date(2026, 10, 26));
    expect(new Set(samples.map((record) => record.month))).toEqual(new Set([6, 9, 11]));
    expect(new Set(samples.map((record) => record.id)).size).toBe(samples.length);
  });
});

describe('collectBurnRecords', () => {
  it('only counts burned tasks that have a valid burnedAt', () => {
    process.env.TZ = 'Asia/Tokyo';
    const { records, undatedCount } = collectBurnRecords([
      burned('a', '2026-11-25T03:00:00.000Z'),
      seed({ id: 'b', burned: false }),
      seed({ id: 'c', burned: true, completed: true }),
      burned('d', 'not-a-date'),
    ]);
    expect(records.map((record) => record.id)).toEqual(['a']);
    expect(undatedCount).toBe(2);
  });

  it('never guesses a day from createdAt or updatedAt', () => {
    const undated = seed({ id: 'old', burned: true, completed: true, createdAt: '2026-03-03T00:00:00.000Z', updatedAt: '2026-03-04T00:00:00.000Z' });
    const { records, undatedCount } = collectBurnRecords([undated]);
    expect(records).toEqual([]);
    expect(undatedCount).toBe(1);
  });

  it('uses the point value granted at the time, not a recomputed one', () => {
    const { records } = collectBurnRecords([burned('a', '2026-11-25T03:00:00.000Z', 17, { difficulty: 'small' })]);
    expect(records[0].ashPoints).toBe(17);
  });

  it('sorts by day then time and is stable', () => {
    process.env.TZ = 'Asia/Tokyo';
    const { records } = collectBurnRecords([
      burned('late', '2026-11-26T05:00:00.000Z'),
      burned('early', '2026-11-25T01:00:00.000Z'),
      burned('mid', '2026-11-26T01:00:00.000Z'),
    ]);
    expect(records.map((record) => record.id)).toEqual(['early', 'mid', 'late']);
  });
});

describe('summarizeMonth', () => {
  it('totals the Fires and ash of one month and groups them by day', () => {
    process.env.TZ = 'Asia/Tokyo';
    const { records } = collectBurnRecords([
      burned('a', '2026-11-25T03:00:00.000Z', 10),
      burned('b', '2026-11-25T08:00:00.000Z', 5),
      burned('c', '2026-11-03T03:00:00.000Z', 3),
      burned('d', '2026-10-31T03:00:00.000Z', 20),
    ]);
    const november = summarizeMonth(records, 2026, 11);
    expect(november.count).toBe(3);
    expect(november.ash).toBe(18);
    expect(november.days.get(25)).toMatchObject({ count: 2, ash: 15 });
    expect(november.days.get(3)).toMatchObject({ count: 1, ash: 3 });
    expect(summarizeMonth(records, 2026, 10)).toMatchObject({ count: 1, ash: 20 });
    expect(summarizeMonth(records, 2026, 9)).toMatchObject({ count: 0, ash: 0 });
  });

  it('month-end and month-start boundaries land in the right month (local time)', () => {
    process.env.TZ = 'Asia/Tokyo';
    // 23:59 JST on Oct 31 and 00:00 JST on Nov 1
    const { records } = collectBurnRecords([
      burned('end', '2026-10-31T14:59:00.000Z'),
      burned('start', '2026-10-31T15:00:00.000Z'),
    ]);
    expect(summarizeMonth(records, 2026, 10).count).toBe(1);
    expect(summarizeMonth(records, 2026, 11).count).toBe(1);
  });
});

describe('Undo, re-Fire and deletion keep the calendar consistent', () => {
  it('a Fire appears; Undo removes it; firing again counts exactly once', () => {
    process.env.TZ = 'Asia/Tokyo';
    const before = seed({ id: 'x', title: '洗濯' });
    const firstFire = burnSeed(before, '2026-11-25T03:00:00.000Z');
    expect(summarizeMonth(collectBurnRecords([firstFire]).records, 2026, 11).count).toBe(1);

    const undone = restoreFireSeedFromUndo(
      createFireBurnUndoSnapshot(before, { currentStreak: 0, lastBurnDate: null, longestStreak: 0 }),
      '2026-11-25T03:01:00.000Z',
    );
    expect(undone.burnedLocalDate).toBeUndefined();
    expect(summarizeMonth(collectBurnRecords([undone]).records, 2026, 11).count).toBe(0);

    const secondFire = burnSeed(undone, '2026-11-26T03:00:00.000Z');
    const summary = summarizeMonth(collectBurnRecords([secondFire]).records, 2026, 11);
    expect(summary.count).toBe(1);
    expect(summary.days.has(25)).toBe(false);
    expect(summary.days.has(26)).toBe(true);
  });

  it('deleting a burned record removes it from the calendar with no hidden copy', () => {
    process.env.TZ = 'Asia/Tokyo';
    const keep = burnSeed(seed({ id: 'keep' }), '2026-11-25T03:00:00.000Z');
    const drop = burnSeed(seed({ id: 'drop', title: '消すタスク' }), '2026-11-25T04:00:00.000Z');
    const afterDelete = [keep, drop].filter((s) => s.id !== 'drop');
    const { records } = collectBurnRecords(afterDelete);
    expect(JSON.stringify(records)).not.toContain('消すタスク');
    expect(summarizeMonth(records, 2026, 11).count).toBe(1);
  });
});

describe('time zones and the frozen completion day', () => {
  it('new completions freeze the day in the zone they happened in', () => {
    process.env.TZ = 'Asia/Tokyo';
    const fired = burnSeed(seed({ id: 'a' }), '2026-11-25T16:30:00.000Z'); // 01:30 on the 26th in Tokyo
    expect(fired.burnedLocalDate).toBe('2026-11-26');

    process.env.TZ = 'America/Los_Angeles'; // travelling: it is the 25th there
    expect(summarizeMonth(collectBurnRecords([fired]).records, 2026, 11).days.has(26)).toBe(true);
    expect(summarizeMonth(collectBurnRecords([fired]).records, 2026, 11).days.has(25)).toBe(false);
  });

  it('legacy records are converted once, then stay put when the zone changes', () => {
    process.env.TZ = 'Asia/Tokyo';
    const legacy = burned('legacy', '2026-11-25T16:30:00.000Z');
    expect(legacy.burnedLocalDate).toBeUndefined();

    const upgraded = backfillBurnedLocalDates([legacy]);
    expect(upgraded.changed).toBe(true);
    expect(upgraded.seeds[0].burnedLocalDate).toBe('2026-11-26');

    process.env.TZ = 'America/Los_Angeles';
    const records = collectBurnRecords(upgraded.seeds).records;
    expect(records[0].dateKey).toBe('2026-11-26');
    // Re-running the upgrade does not move it either.
    expect(backfillBurnedLocalDates(upgraded.seeds).changed).toBe(false);
  });

  it('the upgrade never touches undated or unburned tasks', () => {
    const undated = seed({ id: 'u', burned: true, completed: true });
    const active = seed({ id: 'a' });
    const result = backfillBurnedLocalDates([undated, active]);
    expect(result.changed).toBe(false);
    expect(result.seeds[0].burnedLocalDate).toBeUndefined();
  });

  it('normalizeSeed keeps a valid stored day, drops garbage, and clears it on unburned tasks', () => {
    expect(burned('a', '2026-11-25T03:00:00.000Z', 5, { burnedLocalDate: '2026-11-25' }).burnedLocalDate).toBe('2026-11-25');
    expect(burned('b', '2026-11-25T03:00:00.000Z', 5, { burnedLocalDate: '2026-13-45' }).burnedLocalDate).toBeUndefined();
    expect(burned('c', '2026-11-25T03:00:00.000Z', 5, { burnedLocalDate: 'yesterday' }).burnedLocalDate).toBeUndefined();
    expect(seed({ id: 'd', burned: false, burnedLocalDate: '2026-11-25' }).burnedLocalDate).toBeUndefined();
  });

  it('survives a JSON round-trip (the day is not lost on reload)', () => {
    process.env.TZ = 'Asia/Tokyo';
    const fired = burnSeed(seed({ id: 'a' }), '2026-11-25T16:30:00.000Z');
    const reloaded = (JSON.parse(JSON.stringify([fired])) as Partial<FireSeed>[]).map((s, i) => normalizeSeed(s, i));
    expect(reloaded[0].burnedLocalDate).toBe('2026-11-26');
  });
});

describe('month navigation and status', () => {
  const records = (() => {
    process.env.TZ = 'Asia/Tokyo';
    return collectBurnRecords([
      burned('a', '2026-09-10T03:00:00.000Z'),
      burned('b', '2026-11-25T03:00:00.000Z'),
    ]).records;
  })();

  it('cannot go before the first record or past this month', () => {
    expect(canGoToPreviousMonth(records, { year: 2026, month: 9 })).toBe(false);
    expect(canGoToPreviousMonth(records, { year: 2026, month: 10 })).toBe(true);
    expect(canGoToPreviousMonth([], { year: 2026, month: 11 })).toBe(false);
    expect(canGoToNextMonth({ year: 2026, month: 11 }, new Date(2026, 10, 26))).toBe(false);
    expect(canGoToNextMonth({ year: 2026, month: 10 }, new Date(2026, 10, 26))).toBe(true);
  });

  it('distinguishes "before records began" from "nothing happened that month"', () => {
    const month = (m: number) => ({ year: 2026, month: m });
    const status = (m: number) => getMonthStatus(records, month(m), summarizeMonth(records, 2026, m));
    expect(status(8)).toBe('beforeStart');
    expect(status(10)).toBe('empty');
    expect(status(11)).toBe('recorded');
    expect(getFirstRecordDateKey(records)).toBe('2026-09-10');
  });

  it('shifts months across year boundaries', () => {
    expect(shiftMonth({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
  });
});

describe('calendar', () => {
  it('lays out November 2026 Sunday-first with padding', () => {
    const weeks = buildCalendarWeeks(2026, 11);
    expect(weeks[0]).toEqual([1, 2, 3, 4, 5, 6, 7]);
    const lastWeek = weeks[weeks.length - 1].filter((day) => day !== null);
    expect(lastWeek[lastWeek.length - 1]).toBe(30);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
  });

  it('handles leap-year February and a month starting mid-week', () => {
    const feb = buildCalendarWeeks(2028, 2).flat().filter((day) => day !== null);
    expect(feb).toHaveLength(29);
    expect(buildCalendarWeeks(2026, 10)[0].findIndex((day) => day === 1)).toBe(4); // Thursday
  });

  it('describes a day the way VoiceOver should read it', () => {
    expect(describeDay({ day: 26, count: 3, ash: 18, records: [] })).toBe('26日、3件、炭18');
  });
});

describe('sample data', () => {
  it('is a clearly synthetic set inside the current month', () => {
    const today = new Date(2026, 1, 10); // February: no day 30/31 sample leaks past the month
    const sample = createSampleRecords(today);
    expect(sample.length).toBeGreaterThan(0);
    expect(sample.every((record) => record.id.startsWith('sample-') && record.month === 2)).toBe(true);
  });
});
