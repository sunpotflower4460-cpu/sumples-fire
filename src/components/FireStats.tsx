type FireStatsProps = {
  stats: {
    total: number;
    active: number;
    completed: number;
    high: number;
    flame: number;
    burned: number;
    totalAshPoints: number;
    todayBurned: number;
    rank: string;
  };
};

const statItems = [
  { key: 'active', label: '未燃焼' },
  { key: 'todayBurned', label: '今日Fire' },
  { key: 'burned', label: '燃焼済み' },
  { key: 'totalAshPoints', label: '炭' },
] as const;

export function FireStats({ stats }: FireStatsProps) {
  return (
    <section className="stats-grid" aria-label="Fireタスクの統計">
      {statItems.map((item) => (
        <div className="stat-card" key={item.key}>
          <span>{item.label}</span>
          <strong>{stats[item.key]}</strong>
        </div>
      ))}
      <div className="stat-card rank-stat-card">
        <span>称号</span>
        <strong>{stats.rank}</strong>
      </div>
    </section>
  );
}
