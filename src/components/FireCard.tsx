import type { FireSeed } from '../types/fireSeed';
import { categoryLabels, priorityLabels, stageDescriptions, stageLabels } from '../types/fireSeed';

type FireCardProps = {
  seed: FireSeed;
  onToggle: (id: string) => void;
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

export function FireCard({ seed, onToggle, onDelete }: FireCardProps) {
  const createdAt = dateFormatter.format(new Date(seed.createdAt));

  return (
    <article className={`fire-card ${seed.completed ? 'is-completed' : ''}`}>
      <div className="card-header">
        <div>
          <p className="eyebrow">{categoryLabels[seed.category]}</p>
          <h3>{seed.title}</h3>
        </div>
        <span className={`priority priority-${seed.priority}`}>{priorityLabels[seed.priority]}</span>
      </div>

      <div className="stage-row" title={stageDescriptions[seed.stage]}>
        <span>{stageLabels[seed.stage]}</span>
        <div className="stage-track" aria-hidden="true">
          <div className={`stage-fill stage-${seed.stage}`} style={{ width: `${stageProgress[seed.stage]}%` }} />
        </div>
      </div>

      {seed.body ? <p className="card-body">{seed.body}</p> : <p className="card-body muted">本文はまだ空です。</p>}

      {seed.nextAction ? (
        <div className="next-action">
          <span>次の一歩</span>
          <p>{seed.nextAction}</p>
        </div>
      ) : null}

      <div className="card-footer">
        <span>{createdAt}</span>
        <div className="card-actions">
          <button type="button" className="ghost-button" onClick={() => onToggle(seed.id)}>
            {seed.completed ? '未完了に戻す' : '炎にする'}
          </button>
          <button type="button" className="danger-button" onClick={() => onDelete(seed.id)}>
            削除
          </button>
        </div>
      </div>
    </article>
  );
}
