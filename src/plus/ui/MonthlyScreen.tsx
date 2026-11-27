import { useId, useMemo, useRef, useState } from 'react';
import type { FireSeed } from '../../types/fireSeed';
import {
  WEEKDAY_HEADERS,
  buildCalendarWeeks,
  canGoToNextMonth,
  canGoToPreviousMonth,
  collectBurnRecords,
  createSampleYearRecords,
  describeDay,
  getFirstRecordDateKey,
  getFirstRecordMonth,
  getMonthStatus,
  monthOf,
  shiftMonth,
  summarizeMonth,
  summarizeYear,
  weekdayLabel,
} from '../monthlySummary';
import type { MonthRef } from '../monthlySummary';
import { COPY } from '../plusCopy';
import { plusStore } from '../plusStore';
import { usePlus } from '../usePlus';
import { PlusDialog } from './PlusDialog';
import { YearOverview } from './YearOverview';

/** Event the app listens for to open a record in the free ash history. */
export const SHOW_ASH_RECORD_EVENT = 'fire:show-ash-record';

function Arrow({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={direction === 'left' ? 'm14.5 6-6 6 6 6' : 'm9.5 6 6 6-6 6'} />
    </svg>
  );
}

const formatStart = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return `${year}年${month}月${day}日`;
};

function SummaryStats({ count, ash, days }: { count: number; ash: number; days: number }) {
  return (
    <div className="plus-month-stats">
      <div>
        <p><strong>{count}</strong><span>件</span></p>
        <small>{COPY.historyCount}</small>
      </div>
      <div>
        <p><strong>{ash}</strong><span>炭</span></p>
        <small>{COPY.historyCharcoal}</small>
      </div>
      <div>
        <p><strong>{days}</strong><span>日</span></p>
        <small>Fireした日数</small>
      </div>
    </div>
  );
}

export function MonthlyScreen({ seeds }: { seeds: readonly FireSeed[] }) {
  const { state, entitled } = usePlus();
  const headingId = useId();
  const periodHeading = useRef<HTMLHeadingElement>(null);
  const today = useMemo(() => new Date(), []);
  const currentMonth = monthOf(today);
  const [viewed, setViewed] = useState<MonthRef>(currentMonth);
  const [year, setYear] = useState(currentMonth.year);
  const [selectedDay, setSelectedDay] = useState<number | null | undefined>(undefined);
  const [view, setView] = useState<'calendar' | 'days' | 'year'>('calendar');

  // Owners see their own device's records; everyone else sees a labelled example.
  const real = useMemo(() => collectBurnRecords(seeds), [seeds]);
  const records = useMemo(
    () => (entitled ? real.records : createSampleYearRecords(today)),
    [entitled, real.records, today],
  );
  const month = entitled || viewed.year === currentMonth.year ? viewed : currentMonth;
  const shownYear = entitled ? year : currentMonth.year;
  const summary = useMemo(() => summarizeMonth(records, month.year, month.month), [records, month.year, month.month]);
  const annual = useMemo(() => summarizeYear(
    records.filter((record) => record.year !== currentMonth.year || record.month <= currentMonth.month),
    shownYear,
  ), [records, shownYear, currentMonth.year, currentMonth.month]);
  const status = getMonthStatus(records, month, summary);
  const weeks = useMemo(() => buildCalendarWeeks(month.year, month.month), [month.year, month.month]);
  const firstDateKey = entitled ? getFirstRecordDateKey(real.records) : null;
  const firstMonth = entitled ? getFirstRecordMonth(real.records) ?? currentMonth
    : { year: currentMonth.year, month: 1 };
  const isFirstMonth = firstDateKey !== null && firstDateKey.startsWith(`${month.year}-${String(month.month).padStart(2, '0')}`);

  // Default to the latest day that has records; an explicit pick (or "none") sticks.
  const latestDay = summary.days.size > 0 ? Math.max(...summary.days.keys()) : null;
  const activeDay = selectedDay === undefined ? latestDay : selectedDay;
  const dayDetail = activeDay !== null && activeDay !== undefined ? summary.days.get(activeDay) ?? null : null;
  const dayList = [...summary.days.values()].sort((a, b) => b.day - a.day);

  const goTo = (delta: number) => {
    if (view === 'year') setYear((current) => current + delta);
    else setViewed((current) => shiftMonth(current, delta));
    setSelectedDay(undefined);
  };

  const openMonth = (next: MonthRef) => {
    setViewed(next);
    setSelectedDay(undefined);
    setView('calendar');
    periodHeading.current?.focus();
  };

  const showRecord = (id: string) => {
    plusStore.closeAll();
    window.dispatchEvent(new CustomEvent(SHOW_ASH_RECORD_EVENT, { detail: { id } }));
  };

  const canGoBack = state.routeStack.length > 1;
  const annualView = view === 'year';
  const title = annualView ? `${shownYear}年` : `${month.year}年${month.month}月`;

  return (
    <PlusDialog
      titleId={headingId}
      title={COPY.historyTitle}
      screen="monthly"
      canGoBack={canGoBack}
      onBack={() => plusStore.closeScreen()}
      onClose={() => plusStore.closeAll()}
    >
      {!entitled ? (
        <div className="plus-sample-banner" role="note">
          <span className="plus-badge">{COPY.historySample}</span>
          <span>例の記録です。あなたの記録ではありません。</span>
        </div>
      ) : null}

      <div className="plus-month-nav">
        <button
          type="button"
          className="plus-icon-button"
          aria-label={annualView ? '前年' : '前の月'}
          onClick={() => goTo(-1)}
          disabled={!entitled || !(annualView ? shownYear > firstMonth.year : canGoToPreviousMonth(records, month))}
        >
          <Arrow direction="left" />
        </button>
        <h3 ref={periodHeading} tabIndex={-1} aria-live="polite">{title}</h3>
        <button
          type="button"
          className="plus-icon-button"
          aria-label={annualView ? '翌年' : '次の月'}
          onClick={() => goTo(1)}
          disabled={!entitled || !(annualView ? shownYear < currentMonth.year : canGoToNextMonth(month, today))}
        >
          <Arrow direction="right" />
        </button>
      </div>

      {annualView ? <SummaryStats count={annual.count} ash={annual.ash} days={annual.activeDays} />
        : <SummaryStats count={summary.count} ash={summary.ash} days={summary.days.size} />}

      <fieldset className="plus-segmented">
        <legend className="sr-only">ふりかえりの表示</legend>
        <label className={view === 'calendar' ? 'is-active' : undefined}>
          <input type="radio" name="plus-review-view" checked={view === 'calendar'} onChange={() => setView('calendar')} />
          <span>カレンダー</span>
        </label>
        <label className={view === 'days' ? 'is-active' : undefined}>
          <input type="radio" name="plus-review-view" checked={view === 'days'} onChange={() => setView('days')} />
          <span>日別一覧</span>
        </label>
        <label className={annualView ? 'is-active' : undefined}>
          <input
            type="radio"
            name="plus-review-view"
            checked={annualView}
            onChange={() => {
              setYear(month.year);
              setView('year');
            }}
          />
          <span>年間</span>
        </label>
      </fieldset>

      {annualView ? (
        <YearOverview
          year={shownYear}
          summary={annual}
          firstMonth={firstMonth}
          currentMonth={currentMonth}
          openMonth={openMonth}
        />
      ) : view === 'calendar' ? <table className="plus-calendar" aria-label={`${title}のカレンダー`}>
        <thead>
          <tr>
            {WEEKDAY_HEADERS.map((weekday) => <th key={weekday} scope="col">{weekday}</th>)}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, index) => (
            <tr key={index}>
              {week.map((day, column) => {
                if (day === null) return <td key={column} className="is-blank" />;
                const entry = summary.days.get(day);
                const isToday = today.getFullYear() === month.year && today.getMonth() + 1 === month.month && today.getDate() === day;
                const current = isToday ? 'date' : undefined;
                return (
                  <td key={column} className={isToday ? 'is-today' : undefined}>
                    {entry ? (
                      <button
                        type="button"
                        className={activeDay === day ? 'plus-day is-recorded is-selected' : 'plus-day is-recorded'}
                        data-activity={Math.min(3, entry.count)}
                        aria-label={describeDay(entry)}
                        aria-pressed={activeDay === day}
                        aria-current={current}
                        onClick={() => setSelectedDay(day)}
                      >
                        <span>{day}</span>
                        <i aria-hidden="true" />
                      </button>
                    ) : (
                      <span className="plus-day" aria-current={current}>{day}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      : dayList.length > 0 ? (
        <ul className="plus-review-days" aria-label={`${title}にFireした日`}>
          {dayList.map((entry) => (
            <li key={entry.day}>
              <button
                type="button"
                className={activeDay === entry.day ? 'plus-entry is-selected' : 'plus-entry'}
                aria-pressed={activeDay === entry.day}
                onClick={() => setSelectedDay(entry.day)}
              >
                <span>{entry.day}日（{weekdayLabel(month.year, month.month, entry.day)}）</span>
                <span className="plus-entry-detail">{entry.count}件・炭{entry.ash}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {annualView ? null : status === 'recorded' && view === 'calendar' ? (
        <p className="plus-help">印のある日を選ぶと、終えたことが見られます。</p>
      ) : status === 'beforeStart' ? (
        <p className="plus-help">記録開始前の月です。</p>
      ) : status !== 'recorded' ? (
        <p className="plus-help">{COPY.historyEmpty}</p>
      ) : null}

      {!annualView && dayDetail ? (
        <section className="plus-day-detail" aria-labelledby={`${headingId}-day`}>
          <h4 id={`${headingId}-day`}>
            {month.month}月{dayDetail.day}日（{weekdayLabel(month.year, month.month, dayDetail.day)}）
            <span>{dayDetail.count}件・炭{dayDetail.ash}</span>
          </h4>
          <ul>
            {dayDetail.records.map((record) => (
              <li key={record.id}>
                <span className="plus-day-title">{record.title}</span>
                <span className="plus-day-ash">+{record.ashPoints}炭</span>
                {entitled ? (
                  <button
                    type="button"
                    className="plus-link plus-day-open"
                    onClick={() => showRecord(record.id)}
                    aria-label={`「${record.title}」を炭の記録で見る`}
                  >
                    炭の記録で見る
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {entitled && !annualView && isFirstMonth && firstDateKey ? (
        <p className="plus-help">{COPY.historyStart(formatStart(firstDateKey))}</p>
      ) : null}
      {entitled && real.undatedCount > 0 ? (
        <p className="plus-help">
          日付のない記録が{real.undatedCount}件あります。月別には含まれませんが、炭の記録から見られます。
        </p>
      ) : null}

      {!entitled ? (
        <div className="plus-actions">
          <p className="plus-help">{COPY.historyAvailable}</p>
          <button type="button" className="plus-primary" onClick={() => plusStore.openScreen('intro')}>
            Plusで、自分の記録を見る
          </button>
        </div>
      ) : null}
    </PlusDialog>
  );
}
