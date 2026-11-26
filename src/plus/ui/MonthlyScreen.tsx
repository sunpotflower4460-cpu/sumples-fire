import { useId, useMemo, useState } from 'react';
import type { FireSeed } from '../../types/fireSeed';
import {
  WEEKDAY_HEADERS,
  buildCalendarWeeks,
  canGoToNextMonth,
  canGoToPreviousMonth,
  collectBurnRecords,
  createSampleRecords,
  describeDay,
  getFirstRecordDateKey,
  getMonthStatus,
  monthOf,
  shiftMonth,
  summarizeMonth,
  weekdayLabel,
} from '../monthlySummary';
import type { MonthRef } from '../monthlySummary';
import { COPY } from '../plusCopy';
import { plusStore } from '../plusStore';
import { usePlus } from '../usePlus';
import { PlusDialog } from './PlusDialog';

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

export function MonthlyScreen({ seeds }: { seeds: readonly FireSeed[] }) {
  const { state, entitled } = usePlus();
  const headingId = useId();
  const today = useMemo(() => new Date(), []);
  const [viewed, setViewed] = useState<MonthRef>(() => monthOf(today));
  const [selectedDay, setSelectedDay] = useState<number | null | undefined>(undefined);

  // Owners see their own device's records; everyone else sees a labelled example.
  const real = useMemo(() => collectBurnRecords(seeds), [seeds]);
  const records = useMemo(
    () => (entitled ? real.records : createSampleRecords(today)),
    [entitled, real.records, today],
  );
  const month = entitled ? viewed : monthOf(today);
  const summary = useMemo(() => summarizeMonth(records, month.year, month.month), [records, month.year, month.month]);
  const status = getMonthStatus(records, month, summary);
  const weeks = useMemo(() => buildCalendarWeeks(month.year, month.month), [month.year, month.month]);
  const firstDateKey = entitled ? getFirstRecordDateKey(real.records) : null;
  const isFirstMonth = firstDateKey !== null && firstDateKey.startsWith(`${month.year}-${String(month.month).padStart(2, '0')}`);

  // Default to the latest day that has records; an explicit pick (or "none") sticks.
  const latestDay = summary.days.size > 0 ? Math.max(...summary.days.keys()) : null;
  const activeDay = selectedDay === undefined ? latestDay : selectedDay;
  const dayDetail = activeDay !== null && activeDay !== undefined ? summary.days.get(activeDay) ?? null : null;

  const goTo = (delta: number) => {
    setViewed((current) => shiftMonth(current, delta));
    setSelectedDay(undefined);
  };

  const showRecord = (id: string) => {
    plusStore.closeAll();
    window.dispatchEvent(new CustomEvent(SHOW_ASH_RECORD_EVENT, { detail: { id } }));
  };

  const canGoBack = state.routeStack.length > 1;
  const title = `${month.year}年${month.month}月`;

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
          aria-label="前の月"
          onClick={() => goTo(-1)}
          disabled={!entitled || !canGoToPreviousMonth(records, month)}
        >
          <Arrow direction="left" />
        </button>
        <h3 aria-live="polite">{title}</h3>
        <button
          type="button"
          className="plus-icon-button"
          aria-label="次の月"
          onClick={() => goTo(1)}
          disabled={!entitled || !canGoToNextMonth(month, today)}
        >
          <Arrow direction="right" />
        </button>
      </div>

      <div className="plus-month-stats">
        <div>
          <p><strong>{summary.count}</strong><span>件</span></p>
          <small>{COPY.historyCount}</small>
        </div>
        <div>
          <p><strong>{summary.ash}</strong><span>炭</span></p>
          <small>{COPY.historyCharcoal}</small>
        </div>
      </div>

      <table className="plus-calendar" aria-label={`${title}のカレンダー`}>
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

      {status === 'recorded' ? (
        <p className="plus-help">印のある日を選ぶと、終えたことが見られます。</p>
      ) : status === 'beforeStart' ? (
        <p className="plus-help">記録開始前の月です。</p>
      ) : (
        <p className="plus-help">{COPY.historyEmpty}</p>
      )}

      {dayDetail ? (
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

      {entitled && isFirstMonth && firstDateKey ? (
        <p className="plus-help">{COPY.historyStart(formatStart(firstDateKey))}</p>
      ) : null}
      {entitled && real.undatedCount > 0 ? (
        <p className="plus-help">
          日付のない記録が{real.undatedCount}件あります。月別には含まれませんが、炭の記録から見られます。
        </p>
      ) : null}

      {entitled ? (
        <p className="plus-help">ひとつずつ、ここに残っています。</p>
      ) : (
        <div className="plus-actions">
          <p className="plus-help">{COPY.historyAvailable}</p>
          <button type="button" className="plus-primary" onClick={() => plusStore.openScreen('intro')}>
            Plusで、自分の記録を見る
          </button>
        </div>
      )}
    </PlusDialog>
  );
}
