import type { FireSeed } from '../types/fireSeed';
import { categoryLabels, difficultyLabels, priorityLabels, stageDescriptions, stageLabels } from '../types/fireSeed';

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

export function FireCard({ seed, onFire, onDelete }: FireCardProps) {
  const createdAt = dateFormatter.format(new Date(seed.burnedAt ?? seed.createdAt));

  return (
    <article className={`fire-card ${seed.burned ? 'is-burned' : ''}`}>
      <div className="card-header">
        <div>
          <p className="eyebrow">{seed.burned ? '炭になったタスク' : categoryLabels[seed.category]}</p>
          <h3>{seed.title}</h3>
        </div>
        <span className={`priority priority-${seed.priority}`}>{seed.burned ? `+${seed.ashPoints} 炭` : priorityLabels[seed.priority]}</span>
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

      <div className="card-footer">
        <span>{seed.burned ? `燃やした日 ${createdAt}` : `追加 ${createdAt}`}</span>
        <div className="card-actions">
          {!seed.burned ? (
            <button type="button" className="fire-button" onClick={() => onFire(seed.id)}>
              Fire
            </button>
          ) : null}
          <button type="button" className="danger-button" onClick={() => onDelete(seed.id)}>
            削除
          </button>
        </div>
      </div>
    </article>
  );
}
