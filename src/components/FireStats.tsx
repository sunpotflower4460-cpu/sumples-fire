type FireStatsProps = {
  stats: {
    total: number;
    active: number;
    completed: number;
    high: number;
    flame: number;
  };
};

const statItems = [
  { key: 'total', label: '合計' },
  { key: 'active', label: '進行中' },
  { key: 'completed', label: '完了' },
  { key: 'high', label: '今日やる' },
] as const;

export function FireStats({ stats }: FireStatsProps) {
  return (
    <section className="stats-grid" aria-label="メモの統計">
      {statItems.map((item) => (
        <div className="stat-card" key={item.key}>
          <span>{item.label}</span>
          <strong>{stats[item.key]}</strong>
        </div>
      ))}
    </section>
  );
}
