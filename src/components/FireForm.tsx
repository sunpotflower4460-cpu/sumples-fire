import { FormEvent, useEffect, useRef, useState } from 'react';
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
import { clearFireFormDraft, loadFireFormDraft, saveFireFormDraft } from '../lib/fireFormDraft';

type FireFormProps = {
  onAddSeed: (input: NewFireSeedInput) => void;
};

const titleMaxLength = 60;
const titleCounterThreshold = 45;
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

export function FireForm({ onAddSeed }: FireFormProps) {
  const [initialDraft] = useState(loadFireFormDraft);
  const [title, setTitle] = useState(initialDraft.title);
  const [body, setBody] = useState(initialDraft.body);
  const [nextAction, setNextAction] = useState(initialDraft.nextAction);
  const [category, setCategory] = useState<FireCategory>(initialDraft.category);
  const [difficulty, setDifficulty] = useState<FireDifficulty>(initialDraft.difficulty);
  const [urgency, setUrgency] = useState<FireLevel>(initialDraft.urgency);
  const [importance, setImportance] = useState<FireLevel>(initialDraft.importance);
  const [hasAdjustedTuning, setHasAdjustedTuning] = useState(initialDraft.hasAdjustedTuning);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const submitLockRef = useRef(false);

  const quadrant = getQuadrant(urgency, importance);
  const canSubmit = title.trim().length > 0 && !isSubmitting;
  const titleRemaining = titleMaxLength - title.length;
  const showTitleCounter = title.length >= titleCounterThreshold;
  const titleDescribedBy = error ? `${titleHelperId} ${titleErrorId}` : titleHelperId;
  const tuningSummary = `${quadrantLabels[quadrant]} ・ ${difficultyLabels[difficulty]}`;

  useEffect(() => {
    saveFireFormDraft({
      title,
      body,
      nextAction,
      category,
      difficulty,
      urgency,
      importance,
      hasAdjustedTuning,
    });
  }, [title, body, nextAction, category, difficulty, urgency, importance, hasAdjustedTuning]);

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
      clearFireFormDraft();
      setTitle('');
      setBody('');
      setNextAction('');
      setCategory('task');
      setDifficulty('normal');
      setUrgency('high');
      setImportance('high');
      setHasAdjustedTuning(false);
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
        <p id={titleHelperId} className="form-helper">名前だけで追加できます。閉じても、このセッション中は書きかけを保持します。</p>
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
        {showTitleCounter ? (
          <div className="field-meta form-primary-meta">
            <span
              className={`char-count${titleRemaining <= 5 ? ' is-near-limit' : ''}`}
              aria-label={`残り${titleRemaining}文字`}
            >
              あと{titleRemaining}文字
            </span>
          </div>
        ) : null}
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
            <small>{hasAdjustedTuning ? '設定' : '初期値'}: {tuningSummary}</small>
          </span>
          <span className="task-tuning-summary-action">必要なら調整</span>
        </summary>

        <div className="task-tuning-body">
          <p className="task-tuning-default-note">
            初期値は「緊急 高・重要 高・普通」です。タイトルから自動判定しているわけではありません。
          </p>

          <section className="fast-matrix-picker" aria-label="タスクの優先度">
            <fieldset className="choice-section choice-fieldset">
              <legend>緊急度</legend>
              <div className="choice-grid two-choice">
                {levelOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={urgency === option.value ? 'choice-button is-selected' : 'choice-button'}
                    onClick={() => {
                      setUrgency(option.value);
                      setHasAdjustedTuning(true);
                    }}
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
                    onClick={() => {
                      setImportance(option.value);
                      setHasAdjustedTuning(true);
                    }}
                    aria-pressed={importance === option.value}
                  >
                    <b>{levelLabels[option.value]}</b>
                    <small>{option.value === 'high' ? '大事・放置したくない' : '軽め・今は小さい'}</small>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className={`matrix-result-card matrix-result-${quadrant}`} aria-live="polite" aria-atomic="true">
              <span>4象限の結果</span>
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
                  onClick={() => {
                    setDifficulty(option.value);
                    setHasAdjustedTuning(true);
                  }}
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
