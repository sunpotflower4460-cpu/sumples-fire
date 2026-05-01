import type { FireStreakData } from '../lib/fireStreak';
import { getCampfireNextThreshold, getCampfireStage, getCampfireStageLabel, getDailyCravingCopy, getStreakState } from '../lib/fireStreak';

type FireCampfireProps = {
  ashPoints: number;
  streakData: FireStreakData;
  hasPendingTasks: boolean;
};

export function FireCampfire({ ashPoints, streakData, hasPendingTasks }: FireCampfireProps) {
  const stage = getCampfireStage(ashPoints);
  const stageLabel = getCampfireStageLabel(stage);
  const streakState = getStreakState(streakData.currentStreak);
  const nextThreshold = getCampfireNextThreshold(ashPoints);
  const cravingCopy = getDailyCravingCopy();

  const emberCount = [2, 4, 6, 8, 10, 14][stage];

  return (
    <section
      className={`fire-campfire campfire-stage-${stage} streak-${streakState} ${hasPendingTasks ? 'has-pending' : ''}`}
      aria-label="あなたの焚き火"
    >
      <div className="campfire-bg-glow" aria-hidden="true" />

      <div className="campfire-visual" aria-hidden="true">
        <div className="campfire-logs">
          <div className="campfire-log log-left" />
          <div className="campfire-log log-right" />
          <div className="campfire-log log-base" />
        </div>

        <div className="campfire-flames">
          <i className="campfire-flame cf-1" />
          <i className="campfire-flame cf-2" />
          <i className="campfire-flame cf-3" />
          {stage >= 2 ? <i className="campfire-flame cf-4" /> : null}
          {stage >= 3 ? <i className="campfire-flame cf-5" /> : null}
          {stage >= 4 ? <><i className="campfire-flame cf-6" /><i className="campfire-flame cf-7" /></> : null}
          {stage >= 5 ? <><i className="campfire-flame cf-8" /><i className="campfire-flame cf-9" /></> : null}
        </div>

        <div className="campfire-embers">
          {Array.from({ length: emberCount }, (_, i) => (
            <i key={i} className={`campfire-ember ce-${i + 1}`} />
          ))}
        </div>

        {stage >= 3 ? <div className="campfire-outer-glow" /> : null}
      </div>

      <div className="campfire-info">
        <div className="campfire-stage-badge">
          <span className="campfire-stage-name">{stageLabel}</span>
          {nextThreshold ? (
            <span className="campfire-next-hint">あと {nextThreshold - ashPoints} 炭で次の段階へ</span>
          ) : (
            <span className="campfire-next-hint">最高段階に到達</span>
          )}
        </div>

        {streakData.currentStreak > 0 ? (
          <div className={`campfire-streak streak-state-${streakState}`} aria-label={`連続燃焼${streakData.currentStreak}日`}>
            <span className="streak-flame-icon" aria-hidden="true">🔥</span>
            <span className="streak-count">{streakData.currentStreak}</span>
            <span className="streak-label">日連続</span>
            {streakState !== 'cold' ? (
              <span className="streak-momentum-badge">
                {streakState === 'blazing' ? '業火' : streakState === 'momentum' ? '勢い' : '加熱中'}
              </span>
            ) : null}
          </div>
        ) : null}

        {hasPendingTasks ? (
          <p className="campfire-craving-copy" aria-live="polite">{cravingCopy}</p>
        ) : (
          <p className="campfire-craving-copy">今日も、よく燃やした。</p>
        )}
      </div>
    </section>
  );
}
