type FireStatsProps = {
  stats: {
    total: number;
    active: number;
    completed: number;
    high: number;
  };
};

const statItems = [
  { key: 'total', label: '全部' },
  { key: 'active', label: '未完了' },
  { key: 'completed', label: '完了' },
  { key: 'high', label: '高温' },
] as const;

export function FireStats({ stats }: FireStatsProps) {
  return (
    <section className="stats-grid" aria-label="火種の統計">
      {statItems.map((item) => (
        <div className="stat-card" key={item.key}>
          <span>{item.label}</span>
          <strong>{stats[item.key]}</strong>
        </div>
      ))}
    </section>
  );
}
