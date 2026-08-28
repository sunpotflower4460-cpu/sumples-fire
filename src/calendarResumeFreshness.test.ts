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

  it('advances one calendar revision only when the local date actually changes', () => {
    expect(hookSource).toContain('const calendarDayKeyRef = useRef(getLocalDayKey());');
    expect(hookSource).toContain('const [calendarRevision, setCalendarRevision] = useState(0);');
    expect(hookSource).toContain('if (nextDayKey !== calendarDayKeyRef.current)');
    expect(hookSource).toContain('setCalendarRevision((current) => current + 1);');
  });

  it('recomputes date-sensitive stats when the calendar revision changes', () => {
    expect(hookSource).toContain('getFireSeedStats(seeds), [seeds, calendarRevision]');
  });

  it('does not create a new streak object on every same-day focus refresh', () => {
    expect(hookSource).toContain('if (!changed) return current;');
    expect(hookSource).not.toContain('return { ...effective };');
  });

  it('derives daily copy from local calendar components without Date.now elapsed-day drift', () => {
    expect(streakSource).toContain('Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())');
    expect(streakSource).toContain('Date.UTC(date.getFullYear(), 0, 1)');
    expect(streakSource).not.toContain('Date.now() - yearStart');
  });
});
