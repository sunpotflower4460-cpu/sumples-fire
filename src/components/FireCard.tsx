import type { FireSeed } from '../types/fireSeed';
import { categoryLabels, priorityLabels } from '../types/fireSeed';

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

      {seed.body ? <p className="card-body">{seed.body}</p> : <p className="card-body muted">本文はまだ空です。</p>}

      <div className="card-footer">
        <span>{createdAt}</span>
        <div className="card-actions">
          <button type="button" className="ghost-button" onClick={() => onToggle(seed.id)}>
            {seed.completed ? '未完了に戻す' : '完了'}
          </button>
          <button type="button" className="danger-button" onClick={() => onDelete(seed.id)}>
            削除
          </button>
        </div>
      </div>
    </article>
  );
}
