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
      <div className="stat-card rank-stat-card">
        <span>現在の称号</span>
        <strong>{stats.rank}</strong>
        <small>{rankMessage}</small>
        <div
          className="rank-progress"
          role="progressbar"
          aria-label="称号の進捗"
          aria-valuenow={Math.round(stats.rankProgress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="rank-progress-track" aria-hidden="true">
            <div className="rank-progress-fill" style={{ width: `${stats.rankProgress}%` }} />
          </div>
          <span className="rank-progress-value" aria-hidden="true">{Math.round(stats.rankProgress)}%</span>
        </div>
      </div>

      {statItems.map((item) => (
        <div className={`stat-card ${item.key === 'totalAshPoints' ? 'is-highlight' : ''}`} key={item.key}>
          <span>{item.label}</span>
          <strong>{stats[item.key]}</strong>
        </div>
      ))}
    </section>
  );
}
