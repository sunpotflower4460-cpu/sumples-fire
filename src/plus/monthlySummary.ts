import { isValidLocalDateKey, parseBurnedAt, toLocalDateKey } from '../lib/fireSeedModel';
import type { FireSeed } from '../types/fireSeed';

/** One completed Fire that can be placed on a calendar day. */
export type BurnRecord = {
  id: string;
  title: string;
  /** Ash points granted at the time — never recomputed from today's rules. */
  ashPoints: number;
  burnedAt: string;
  /** Local completion day, YYYY-MM-DD. */
  dateKey: string;
  year: number;
  month: number;
  day: number;
};

export type DaySummary = {
  day: number;
  count: number;
  ash: number;
  records: BurnRecord[];
};

export type MonthSummary = {
  year: number;
  month: number;
  count: number;
  ash: number;
  days: Map<number, DaySummary>;
};

export type MonthRef = { year: number; month: number };

/**
 * Derive monthly records from the burned tasks themselves — there is no second
 * log to drift out of sync, so Undo (burned=false) and deletion remove a record
 * from the calendar for free, and re-Firing counts once.
 *
 * A burned task without a valid `burnedAt` is *undated*: it stays in the free
 * ash history but is never placed on a calendar day. Its day is not guessed
 * from createdAt/updatedAt.
 */
export const collectBurnRecords = (seeds: readonly FireSeed[]): { records: BurnRecord[]; undatedCount: number } => {
  const records: BurnRecord[] = [];
  let undatedCount = 0;

  for (const seed of seeds) {
    if (!seed.burned) continue;

    const burnedAt = parseBurnedAt(seed.burnedAt);
    if (!burnedAt) {
      undatedCount += 1;
      continue;
    }

    // The frozen completion day wins. Computing from burnedAt is only the
    // in-memory fallback for a record not yet upgraded (see backfillBurnedLocalDates).
    const dateKey = isValidLocalDateKey(seed.burnedLocalDate) ? seed.burnedLocalDate : toLocalDateKey(burnedAt);
    const [year, month, day] = dateKey.split('-').map(Number);

    records.push({
      id: seed.id,
      title: seed.title,
      ashPoints: seed.ashPoints,
      burnedAt: seed.burnedAt as string,
      dateKey,
      year,
      month,
      day,
    });
  }

  records.sort((a, b) => (
    a.dateKey === b.dateKey
      ? new Date(a.burnedAt).getTime() - new Date(b.burnedAt).getTime() || a.id.localeCompare(b.id)
      : a.dateKey.localeCompare(b.dateKey)
  ));

  return { records, undatedCount };
};

export const summarizeMonth = (records: readonly BurnRecord[], year: number, month: number): MonthSummary => {
  const days = new Map<number, DaySummary>();
  let count = 0;
  let ash = 0;

  for (const record of records) {
    if (record.year !== year || record.month !== month) continue;
    const entry = days.get(record.day) ?? { day: record.day, count: 0, ash: 0, records: [] };
    entry.count += 1;
    entry.ash += record.ashPoints;
    entry.records.push(record);
    days.set(record.day, entry);
    count += 1;
    ash += record.ashPoints;
  }

  return { year, month, count, ash, days };
};

export const compareMonths = (a: MonthRef, b: MonthRef) => (a.year - b.year) * 12 + (a.month - b.month);

export const shiftMonth = ({ year, month }: MonthRef, delta: number): MonthRef => {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
};

export const monthOf = (date: Date): MonthRef => ({ year: date.getFullYear(), month: date.getMonth() + 1 });

/** The earliest month that has a dated record, or null when there is none. */
export const getFirstRecordMonth = (records: readonly BurnRecord[]): MonthRef | null => (
  records.length > 0 ? { year: records[0].year, month: records[0].month } : null
);

export const getFirstRecordDateKey = (records: readonly BurnRecord[]): string | null => (
  records.length > 0 ? records[0].dateKey : null
);

export type MonthStatus = 'beforeStart' | 'empty' | 'recorded';

/**
 * "記録開始前" (before the first dated record) is not the same as "no Fires this
 * month": the first says the app cannot know, the second that nothing happened.
 */
export const getMonthStatus = (records: readonly BurnRecord[], month: MonthRef, summary: MonthSummary): MonthStatus => {
  const first = getFirstRecordMonth(records);
  if (first && compareMonths(month, first) < 0) return 'beforeStart';
  return summary.count > 0 ? 'recorded' : 'empty';
};

/** Months the person may look at: from the first record's month up to this month. */
export const canGoToPreviousMonth = (records: readonly BurnRecord[], month: MonthRef): boolean => {
  const first = getFirstRecordMonth(records);
  return first !== null && compareMonths(month, first) > 0;
};

export const canGoToNextMonth = (month: MonthRef, today: Date): boolean => (
  compareMonths(month, monthOf(today)) < 0
);

/** Weeks of a month, Sunday first; null pads days outside the month. */
export const buildCalendarWeeks = (year: number, month: number): (number | null)[][] => {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
};

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const;
export const weekdayLabel = (year: number, month: number, day: number) => WEEKDAYS[new Date(year, month - 1, day).getDay()];
export const WEEKDAY_HEADERS = WEEKDAYS;

/** "26日、3件、炭18" — what VoiceOver reads for a day that has records. */
export const describeDay = (day: DaySummary) => `${day.day}日、${day.count}件、炭${day.ash}`;

/** Shown only as a clearly labelled example ("表示例"), never as the person's data. */
export const createSampleRecords = (today: Date): BurnRecord[] => {
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const sample = [
    { day: 2, title: '書類を送る', ashPoints: 10 },
    { day: 2, title: '本を返す', ashPoints: 5 },
    { day: 5, title: '机の上を片付ける', ashPoints: 5 },
    { day: 9, title: '電話をかける', ashPoints: 3 },
    { day: 14, title: '部屋の掃除', ashPoints: 10 },
    { day: 14, title: '返信を終える', ashPoints: 5 },
    { day: 14, title: '請求書を出す', ashPoints: 10 },
  ];
  const lastDay = new Date(year, month, 0).getDate();
  return sample
    .filter((entry) => entry.day <= lastDay)
    .map((entry, index) => ({
      id: `sample-${index}`,
      title: entry.title,
      ashPoints: entry.ashPoints,
      burnedAt: new Date(year, month - 1, entry.day, 12).toISOString(),
      dateKey: `${year}-${String(month).padStart(2, '0')}-${String(entry.day).padStart(2, '0')}`,
      year,
      month,
      day: entry.day,
    }));
};
