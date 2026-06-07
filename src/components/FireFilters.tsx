import type { FireFilter } from '../types/fireSeed';

export type TodayFireFilter = Extract<FireFilter, 'active' | 'today'>;

type FireFiltersProps = {
  filter: TodayFireFilter;
  counts: Record<TodayFireFilter, number>;
  onChangeFilter: (filter: TodayFireFilter) => void;
};

const filters: { value: TodayFireFilter; label: string }[] = [
  { value: 'active', label: '未燃焼' },
  { value: 'today', label: '今日やる' },
];

export function FireFilters({ filter, counts, onChangeFilter }: FireFiltersProps) {
  return (
    <div className="filters" role="group" aria-label="タスクの絞り込み">
      {filters.map((item) => (
        <button
          key={item.value}
          type="button"
          className={filter === item.value ? 'filter-button is-active' : 'filter-button'}
          onClick={() => onChangeFilter(item.value)}
          aria-pressed={filter === item.value}
        >
          {item.label} {counts[item.value]}
        </button>
      ))}
    </div>
  );
}
