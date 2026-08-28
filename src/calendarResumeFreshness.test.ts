import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('calendar freshness after long-lived app sessions', () => {
  const hookSource = readFileSync(resolve(__dirname, 'hooks/useFireSeeds.ts'), 'utf-8');
  const streakSource = readFileSync(resolve(__dirname, 'lib/fireStreak.ts'), 'utf-8');

  it('revalidates streak state when the app resumes or regains focus', () => {
    expect(hookSource).toContain('getEffectiveFireStreak(current)');
    expect(hookSource).toContain("window.addEventListener('focus', refreshCalendarState)");
    expect(hookSource).toContain("document.addEventListener('visibilitychange', handleVisibilityChange)");
    expect(hookSource).toContain("document.visibilityState === 'visible'");
  });

  it('schedules the next refresh from local midnight instead of a fixed 24-hour interval', () => {
    expect(hookSource).toContain('nextLocalDay.setHours(24, 0, 0, 50)');
    expect(hookSource).toContain('nextLocalDay.getTime() - now.getTime()');
    expect(hookSource).toContain('scheduleNextLocalDayRefresh();');
  });

  it('forces day-dependent UI to refresh even when the streak remains valid', () => {
    expect(hookSource).toContain('return { ...effective };');
  });

  it('derives daily copy from local calendar components without Date.now elapsed-day drift', () => {
    expect(streakSource).toContain('Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())');
    expect(streakSource).toContain('Date.UTC(date.getFullYear(), 0, 1)');
    expect(streakSource).not.toContain('Date.now() - yearStart');
  });
});
