import type { FireSeed } from '../types/fireSeed';
import { categoryLabels, difficultyLabels, levelLabels, priorityLabels, quadrantLabels, stageDescriptions, stageLabels } from '../types/fireSeed';

type FireCardProps = {
  seed: FireSeed;
  onFire: (id: string) => void;
  onDelete: (id: string) => void;
};

const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const stageProgress = {
  spark: 34,
  kindling: 68,
  flame: 100,
};

const burnMessages = {
  small: '小さく燃えた。いい一歩。',
  normal: 'よく燃えた。前に進んだ。',
  heavy: '重いタスクを燃やした。強い。',
  boss: 'ラスボス撃破。これは大きい。',
};

export function FireCard({ seed, onFire, onDelete }: FireCardProps) {
  const createdAt = dateFormatter.format(new Date(seed.burnedAt ?? seed.createdAt));

  return (
    <article className={`fire-card ${seed.burned ? 'is-burned' : ''} ${seed.isBurning ? 'is-burning' : ''}`}>
      <div className="card-header">
        <div>
          <p className="eyebrow">{seed.burned ? '炭になったタスク' : categoryLabels[seed.category]}</p>
          <h3>{seed.title}</h3>
        </div>
        <span className={`priority priority-${seed.priority}`}>{seed.burned ? `+${seed.ashPoints} 炭` : priorityLabels[seed.priority]}</span>
      </div>

      <div className="matrix-badge" title="緊急度と重要度で自動分類しています">
        <span>{quadrantLabels[seed.quadrant]}</span>
        <small>緊急{levelLabels[seed.urgency]} / 重要{levelLabels[seed.importance]}</small>
      </div>

      <div className="stage-row" title={stageDescriptions[seed.stage]}>
        <span>{seed.burned ? `${difficultyLabels[seed.difficulty]}タスクをFire済み` : `${stageLabels[seed.stage]} / ${difficultyLabels[seed.difficulty]} +${seed.ashPoints} 炭`}</span>
        <div className="stage-track" aria-hidden="true">
          <div className={`stage-fill stage-${seed.stage}`} style={{ width: `${stageProgress[seed.stage]}%` }} />
        </div>
      </div>

      {seed.body ? <p className="card-body">{seed.body}</p> : null}

      {seed.nextAction && !seed.burned ? (
        <div className="next-action">
          <span>最初の一歩</span>
          <p>{seed.nextAction}</p>
        </div>
      ) : null}

      {seed.isBurning ? (
        <>
          <div className="burn-flame" aria-hidden="true"><i /><i /><i /></div>
          <div className="ash-reward-pop" aria-hidden="true">+{seed.ashPoints} 炭</div>
          <p className="burn-message" aria-live="polite">{burnMessages[seed.difficulty]}</p>
        </>
      ) : null}

      <div className="card-footer">
        <span>{seed.burned ? `燃やした日 ${createdAt}` : `追加 ${createdAt}`}</span>
        <div className="card-actions">
          {!seed.burned ? (
            <button type="button" className="fire-button" onClick={() => onFire(seed.id)} disabled={seed.isBurning}>
              {seed.isBurning ? '燃焼中' : 'Fire'}
            </button>
          ) : null}
          <button type="button" className="danger-button" onClick={() => onDelete(seed.id)} disabled={seed.isBurning}>
            削除
          </button>
        </div>
      </div>
    </article>
  );
}
