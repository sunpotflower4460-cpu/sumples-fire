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
    nextRank: string;
    nextRankRemaining: number;
    rankProgress: number;
  };
};

const statItems = [
  { key: 'active', label: '未燃焼' },
  { key: 'todayBurned', label: '今日Fire' },
  { key: 'burned', label: '燃焼済み' },
  { key: 'totalAshPoints', label: '炭' },
] as const;

export function FireStats({ stats }: FireStatsProps) {
  const rankMessage = stats.nextRankRemaining > 0
    ? `次の称号「${stats.nextRank}」まであと${stats.nextRankRemaining}炭`
    : '最高称号に到達しています';

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
        <div className="rank-progress-track" aria-hidden="true">
          <div className="rank-progress-fill" style={{ width: `${stats.rankProgress}%` }} />
        </div>
        <small>{rankMessage}</small>
      </div>
    </section>
  );
}
