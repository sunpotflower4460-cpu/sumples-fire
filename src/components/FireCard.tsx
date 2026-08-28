import type { FireSeed } from '../types/fireSeed';
import { categoryLabels, difficultyLabels, levelLabels, priorityLabels, quadrantLabels, stageLabels } from '../types/fireSeed';

type FireCardProps = {
  seed: FireSeed;
  onFire: (id: string) => void;
  onDelete: (id: string) => void;
  isNew?: boolean;
};

const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const burnMessages = {
  small: '小さく燃えた。いい一歩。',
  normal: 'よく燃えた。前に進んだ。',
  heavy: '重いタスクを燃やした。強い。',
  boss: 'ラスボス撃破。これは大きい。',
};

function DeleteGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7h14" />
      <path d="M9 7V4.8h6V7" />
      <path d="M7.5 7l.7 12h7.6l.7-12" />
      <path d="M10 10.5v5" />
      <path d="M14 10.5v5" />
    </svg>
  );
}

export function FireCard({ seed, onFire, onDelete, isNew }: FireCardProps) {
  const createdAt = dateFormatter.format(new Date(seed.burnedAt ?? seed.createdAt));

  return (
    <article className={`fire-card ${seed.burned ? 'is-burned' : ''} ${seed.isBurning ? 'is-burning' : ''} ${isNew ? 'is-new' : ''}`}>
      <div className="card-header">
        <div>
          <p className="eyebrow">{seed.burned ? '炭になったタスク' : categoryLabels[seed.category]}</p>
          <h3>{seed.title}</h3>
        </div>
        <span className={`priority priority-${seed.priority}`}>{seed.burned ? `+${seed.ashPoints} 炭` : priorityLabels[seed.priority]}</span>
      </div>

      {seed.nextAction && !seed.burned ? (
        <div className="next-action" aria-label="まずこれだけ">
          <span>まずこれだけ</span>
          <p>{seed.nextAction}</p>
        </div>
      ) : null}

      {!seed.burned ? (
        <div className="card-quick-meta" aria-label="タスク概要">
          <span>{quadrantLabels[seed.quadrant]}</span>
          <span>{difficultyLabels[seed.difficulty]}</span>
          <span>+{seed.ashPoints}炭</span>
        </div>
      ) : null}

      {(seed.body || !seed.burned) ? (
        <details className="card-details">
          <summary>{seed.body ? 'メモと詳細' : '詳細'}</summary>
          <div className="card-details-body">
            {seed.body ? <p className="card-body">{seed.body}</p> : null}
            {!seed.burned ? (
              <dl className="card-detail-list">
                <div><dt>緊急度</dt><dd>{levelLabels[seed.urgency]}</dd></div>
                <div><dt>重要度</dt><dd>{levelLabels[seed.importance]}</dd></div>
                <div><dt>状態</dt><dd>{stageLabels[seed.stage]}</dd></div>
                <div><dt>優先度</dt><dd>{priorityLabels[seed.priority]}</dd></div>
              </dl>
            ) : null}
          </div>
        </details>
      ) : null}

      {seed.burned ? (
        <div className="ash-log">
          <span className="ash-reward">+{seed.ashPoints}炭</span>
          <p className="ash-message">{burnMessages[seed.difficulty]}</p>
        </div>
      ) : null}

      {seed.isBurning ? (
        <>
          <div className="burn-glow" aria-hidden="true" />
          <div className="burn-flames" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
          <div className="burn-embers" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
          <div className="ash-reward-pop" aria-hidden="true">+{seed.ashPoints} 炭</div>
          <p className="burn-message" aria-live="polite">{burnMessages[seed.difficulty]}</p>
        </>
      ) : null}

      <div className="card-footer">
        <span>{seed.burned ? `燃やした日 ${createdAt}` : `追加 ${createdAt}`}</span>
        <div className="card-actions">
          {!seed.burned ? (
            <button
              type="button"
              className="fire-button"
              onClick={() => onFire(seed.id)}
              disabled={seed.isBurning}
              aria-label={`「${seed.title}」を完了してFire`}
            >
              {seed.isBurning ? '燃焼中' : '完了してFire'}
            </button>
          ) : null}
          <button
            type="button"
            className="danger-button subtle-danger card-delete-button"
            onClick={() => onDelete(seed.id)}
            disabled={seed.isBurning}
            aria-label={`「${seed.title}」を削除`}
          >
            <DeleteGlyph />
          </button>
        </div>
      </div>
    </article>
  );
}
