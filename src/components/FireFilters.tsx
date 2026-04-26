import type { FireFilter } from '../types/fireSeed';

type FireFiltersProps = {
  filter: FireFilter;
  onChangeFilter: (filter: FireFilter) => void;
};

const filters: { value: FireFilter; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'active', label: '未完了' },
  { value: 'completed', label: '完了' },
  { value: 'high', label: '高温' },
];

export function FireFilters({ filter, onChangeFilter }: FireFiltersProps) {
  return (
    <div className="filters" aria-label="火種フィルター">
      {filters.map((item) => (
        <button
          key={item.value}
          type="button"
          className={filter === item.value ? 'filter-button is-active' : 'filter-button'}
          onClick={() => onChangeFilter(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
