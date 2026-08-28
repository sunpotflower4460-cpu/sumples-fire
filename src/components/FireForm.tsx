import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { FireCategory, FireDifficulty, FireLevel, NewFireSeedInput } from '../types/fireSeed';
import {
  categoryLabels,
  difficultyAshPoints,
  difficultyLabels,
  levelLabels,
  quadrantLabels,
  quadrantShortDescriptions,
} from '../types/fireSeed';
import { getQuadrant } from '../lib/fireSeedModel';

type FireFormProps = {
  defaultTitle?: string;
  onClearDefaultTitle?: () => void;
  onAddSeed: (input: NewFireSeedInput) => void;
};

const titleMaxLength = 60;
const titleHelperId = 'seed-title-helper';
const titleErrorId = 'seed-title-error';

const levelOptions: { value: FireLevel; label: string; hint: string }[] = [
  { value: 'high', label: '高', hint: '今日・今週中に燃やす' },
  { value: 'low', label: '低', hint: '急ぎすぎなくていい' },
];

const difficultyOptions: { value: FireDifficulty; hint: string }[] = [
  { value: 'small', hint: '5分くらい' },
  { value: 'normal', hint: '少し面倒' },
  { value: 'heavy', hint: '腰が重い' },
  { value: 'boss', hint: '大きい達成' },
];

export function FireForm({ defaultTitle, onClearDefaultTitle, onAddSeed }: FireFormProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [category, setCategory] = useState<FireCategory>('task');
  const [difficulty, setDifficulty] = useState<FireDifficulty>('normal');
  const [urgency, setUrgency] = useState<FireLevel>('high');
  const [importance, setImportance] = useState<FireLevel>('high');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const submitLockRef = useRef(false);

  const quadrant = getQuadrant(urgency, importance);
  const canSubmit = title.trim().length > 0 && !isSubmitting;
  const titleCounter = useMemo(() => `${title.length} / ${titleMaxLength}`, [title.length]);
  const titleDescribedBy = error ? `${titleHelperId} ${titleErrorId}` : titleHelperId;

  useEffect(() => {
    if (!defaultTitle) return;
    setTitle(defaultTitle);
    onClearDefaultTitle?.();
    window.setTimeout(() => titleInputRef.current?.focus(), 0);
  }, [defaultTitle, onClearDefaultTitle]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitLockRef.current) return;

    if (!title.trim()) {
      setError('まずはタスク名だけ入力してください');
      window.setTimeout(() => titleInputRef.current?.focus(), 0);
      return;
    }

    // Lock synchronously before React can re-render the disabled button. This
    // covers double taps and repeated Enter key events on fast devices.
    submitLockRef.current = true;
    setIsSubmitting(true);

    try {
      onAddSeed({
        title,
        body,
        nextAction,
        category,
        difficulty,
        urgency,
        importance,
      });
      setTitle('');
      setBody('');
      setNextAction('');
      setCategory('task');
      setDifficulty('normal');
      setUrgency('high');
      setImportance('high');
      setError('');
    } catch {
      submitLockRef.current = false;
      setIsSubmitting(false);
      setError('追加できませんでした。もう一度お試しください');
      window.setTimeout(() => titleInputRef.current?.focus(), 0);
    }
  };

  return (
    <form className="fire-form fire-form-fast" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting || undefined}>
      <div className="field-group form-primary-field">
        <label htmlFor="seed-title">燃やしたいタスク</label>
        <p id={titleHelperId} className="form-helper">名前だけで追加できます。</p>
        <input
          id="seed-title"
          ref={titleInputRef}
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setError('');
          }}
          placeholder="例：先延ばししていた返信をする"
          maxLength={titleMaxLength}
          enterKeyHint="done"
          autoFocus
          required
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={titleDescribedBy}
        />
        <div className="field-meta form-primary-meta">
          <span className="char-count" aria-label="文字数">{titleCounter}</span>
        </div>
      </div>

      <div className="field-group compact-field">
        <label htmlFor="seed-next-action">最初の一歩 <span className="optional-label">任意</span></label>
        <input
          id="seed-next-action"
          value={nextAction}
          onChange={(event) => setNextAction(event.target.value)}
          placeholder="例：2分だけ文面を書く"
          maxLength={90}
        />
      </div>

      <details className="task-tuning-fields">
        <summary>
          <span className="task-tuning-summary-copy">
            <strong>優先度と重さ</strong>
            <small>{quadrantLabels[quadrant]} ・ {difficultyLabels[difficulty]}</small>
          </span>
          <span className="task-tuning-summary-action">必要なら調整</span>
        </summary>

        <div className="task-tuning-body">
          <section className="fast-matrix-picker" aria-label="タスクの優先度">
            <fieldset className="choice-section choice-fieldset">
              <legend>緊急度</legend>
              <div className="choice-grid two-choice">
                {levelOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={urgency === option.value ? 'choice-button is-selected' : 'choice-button'}
                    onClick={() => setUrgency(option.value)}
                    aria-pressed={urgency === option.value}
                  >
                    <b>{levelLabels[option.value]}</b>
                    <small>{option.hint}</small>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="choice-section choice-fieldset">
              <legend>重要度</legend>
              <div className="choice-grid two-choice">
                {levelOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={importance === option.value ? 'choice-button is-selected' : 'choice-button'}
                    onClick={() => setImportance(option.value)}
                    aria-pressed={importance === option.value}
                  >
                    <b>{levelLabels[option.value]}</b>
                    <small>{option.value === 'high' ? '大事・放置したくない' : '軽め・今は小さい'}</small>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className={`matrix-result-card matrix-result-${quadrant}`} aria-live="polite" aria-atomic="true">
              <span>自動分類</span>
              <strong>{quadrantLabels[quadrant]}</strong>
              <p>{quadrantShortDescriptions[quadrant]}</p>
            </div>
          </section>

          <fieldset className="choice-section choice-fieldset difficulty-fieldset">
            <legend>タスクの重さ <span className="optional-label">だいたいでOK</span></legend>
            <div className="choice-grid difficulty-choice-grid">
              {difficultyOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={difficulty === option.value ? 'choice-button is-selected' : 'choice-button'}
                  onClick={() => setDifficulty(option.value)}
                  aria-pressed={difficulty === option.value}
                >
                  <b>{difficultyLabels[option.value]}</b>
                  <small>{option.hint} / +{difficultyAshPoints[option.value]}炭</small>
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </details>

      <details className="advanced-fields">
        <summary>メモ・カテゴリ</summary>

        <div className="field-group">
          <label htmlFor="seed-body">メモ</label>
          <textarea
            id="seed-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="終わったらFireするためのメモ"
            rows={3}
            maxLength={260}
          />
        </div>

        <div className="field-group advanced-category-field">
          <label htmlFor="seed-category">カテゴリ</label>
          <select
            id="seed-category"
            value={category}
            onChange={(event) => setCategory(event.target.value as FireCategory)}
          >
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </details>

      {error ? <p id={titleErrorId} className="form-error" role="alert">{error}</p> : null}

      <div className="submit-row form-sticky-submit">
        <button className="primary-button" type="submit" disabled={!canSubmit}>
          {isSubmitting ? '追加中…' : 'タスクを薪にする'}
        </button>
      </div>
    </form>
  );
}
