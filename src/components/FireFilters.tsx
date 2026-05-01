import type { FireFilter } from '../types/fireSeed';

type FireFiltersProps = {
  filter: FireFilter;
  counts: Record<FireFilter, number>;
  onChangeFilter: (filter: FireFilter) => void;
};

const filters: { value: FireFilter; label: string }[] = [
  { value: 'active', label: '未燃焼' },
  { value: 'today', label: '今日やる' },
  { value: 'burned', label: '燃焼済み' },
  { value: 'all', label: 'すべて' },
];

export function FireFilters({ filter, counts, onChangeFilter }: FireFiltersProps) {
  return (
    <div className="filters" aria-label="タスクの絞り込み">
      {filters.map((item) => (
        <button
          key={item.value}
          type="button"
          className={filter === item.value ? 'filter-button is-active' : 'filter-button'}
          onClick={() => onChangeFilter(item.value)}
        >
          {item.label} {counts[item.value]}
        </button>
      ))}
    </div>
  );
}
