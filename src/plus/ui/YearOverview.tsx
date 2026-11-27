import type { CSSProperties } from 'react';
import { compareMonths } from '../monthlySummary';
import type { MonthRef, YearSummary } from '../monthlySummary';

export function YearOverview({
  year,
  summary,
  firstMonth,
  currentMonth,
  openMonth,
}: {
  year: number;
  summary: YearSummary;
  firstMonth: MonthRef;
  currentMonth: MonthRef;
  openMonth: (month: MonthRef) => void;
}) {
  const mostFire = Math.max(1, ...summary.months.map((month) => month.count));

  return (
    <>
      <ul className="plus-year-grid" aria-label={`${year}年の月別件数`}>
        {summary.months.map((entry) => {
          const available = compareMonths(entry, firstMonth) >= 0 && compareMonths(entry, currentMonth) <= 0;
          const activeDays = entry.days.size;
          return (
            <li key={entry.month}>
              <button
                type="button"
                className="plus-year-month"
                disabled={!available}
                aria-current={compareMonths(entry, currentMonth) === 0 ? 'date' : undefined}
                aria-label={available
                  ? `${entry.month}月、${entry.count}件、炭${entry.ash}、${activeDays}日`
                  : `${entry.month}月、表示できる記録なし`}
                onClick={() => openMonth({ year, month: entry.month })}
                style={{ '--month-fill': `${entry.count / mostFire * 100}%` } as CSSProperties}
              >
                <strong>{entry.month}月</strong>
                <span>{available ? `${entry.count}件` : '—'}</span>
                <i aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
      <p className="plus-help">
        {summary.count > 0 ? '月を選ぶと、カレンダーと日別の記録を開けます。' : 'この年の記録はまだありません。'}
      </p>
    </>
  );
}
