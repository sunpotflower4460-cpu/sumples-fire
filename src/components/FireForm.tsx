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
const submitErrorId = 'seed-submit-error';
const draftRestoredStatusId = 'seed-draft-restored-status';

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
  const restoredTuningDisclosure = initialDraft.hasAdjustedTuning
    || initialDraft.difficulty !== 'normal'
    || initialDraft.urgency !== 'high'
    || initialDraft.importance !== 'high';
  const restoredAdvancedDisclosure = initialDraft.body.trim().length > 0 || initialDraft.category !== 'task';
  const restoredDraft = initialDraft.title.trim().length > 0
    || initialDraft.nextAction.trim().length > 0
    || restoredTuningDisclosure
    || restoredAdvancedDisclosure;
  const [title, setTitle] = useState(initialDraft.title);
  const [body, setBody] = useState(initialDraft.body);
  const [nextAction, setNextAction] = useState(initialDraft.nextAction);
  const [category, setCategory] = useState<FireCategory>(initialDraft.category);
  const [difficulty, setDifficulty] = useState<FireDifficulty>(initialDraft.difficulty);
  const [urgency, setUrgency] = useState<FireLevel>(initialDraft.urgency);
  const [importance, setImportance] = useState<FireLevel>(initialDraft.importance);
  const [hasAdjustedTuning, setHasAdjustedTuning] = useState(initialDraft.hasAdjustedTuning);
  const [isTuningOpen, setIsTuningOpen] = useState(restoredTuningDisclosure);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(restoredAdvancedDisclosure);
  const [showRestoredCue, setShowRestoredCue] = useState(restoredDraft);
  const [titleError, setTitleError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const submitButtonRef = useRef<HTMLButtonElement | null>(null);
  const submitLockRef = useRef(false);

  const quadrant = getQuadrant(urgency, importance);
  const titleRemaining = titleMaxLength - title.length;
  const showTitleCounter = title.length >= titleCounterThreshold;
  const tuningSummary = `${quadrantLabels[quadrant]} ・ ${difficultyLabels[difficulty]}`;
  const hasAdvancedContent = body.trim().length > 0 || category !== 'task';
  const advancedSummary = body.trim().length > 0
    ? category !== 'task' ? `メモあり ・ ${categoryLabels[category]}` : 'メモあり'
    : category !== 'task' ? categoryLabels[category] : '任意';
  const titleDescribedBy = [
    titleHelperId,
    showRestoredCue ? draftRestoredStatusId : '',
    titleError ? titleErrorId : '',
  ].filter(Boolean).join(' ');

  const markDraftAsEdited = () => {
    if (showRestoredCue) setShowRestoredCue(false);
  };

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
    setSubmitError('');

    if (!title.trim()) {
      setTitleError('タスク名を入力してください');
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
      setTitleError('');
      setSubmitError('');
    } catch {
      submitLockRef.current = false;
      setIsSubmitting(false);
      setSubmitError('追加できませんでした。内容は残っています。もう一度お試しください');
      window.setTimeout(() => submitButtonRef.current?.focus(), 0);
    }
  };

  return (
    <form className="fire-form fire-form-fast" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting || undefined}>
      <div className="field-group form-primary-field">
        <label htmlFor="seed-title">燃やしたいタスク</label>
        <p id={titleHelperId} className="form-helper">名前だけで追加できます。閉じても、このセッション中は書きかけを保持します。</p>
        {showRestoredCue ? <p id={draftRestoredStatusId} className="draft-restored-status">書きかけを復元しました</p> : null}
        <input
          id="seed-title"
          ref={titleInputRef}
          value={title}
          onChange={(event) => {
            markDraftAsEdited();
            setTitle(event.target.value);
            setTitleError('');
          }}
          placeholder="例：先延ばししていた返信をする"
          maxLength={titleMaxLength}
          enterKeyHint="done"
          autoFocus
          required
          aria-invalid={titleError ? 'true' : undefined}
          aria-describedby={titleDescribedBy}
        />
        {titleError ? <p id={titleErrorId} className="form-error">{titleError}</p> : null}
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
          onChange={(event) => {
            markDraftAsEdited();
            setNextAction(event.target.value);
          }}
          placeholder="例：2分だけ文面を書く"
          maxLength={90}
        />
      </div>

      <details
        className="task-tuning-fields"
        open={isTuningOpen}
        onToggle={(event) => setIsTuningOpen(event.currentTarget.open)}
      >
        <summary>
          <span className="task-tuning-summary-copy">
            <strong>優先度と重さ</strong>
            <small>{hasAdjustedTuning ? '設定' : '初期値'}: {tuningSummary}</small>
          </span>
          <span className="task-tuning-summary-action">{hasAdjustedTuning ? '調整済み' : '必要なら調整'}</span>
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
                  <label
                    key={option.value}
                    className={urgency === option.value ? 'choice-button is-selected' : 'choice-button'}
                  >
                    <input
                      className="choice-radio"
                      type="radio"
                      name="seed-urgency"
                      value={option.value}
                      checked={urgency === option.value}
                      onChange={() => {
                        markDraftAsEdited();
                        setUrgency(option.value);
                        setHasAdjustedTuning(true);
                      }}
                    />
                    <b>{levelLabels[option.value]}</b>
                    <small>{option.hint}</small>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="choice-section choice-fieldset">
              <legend>重要度</legend>
              <div className="choice-grid two-choice">
                {levelOptions.map((option) => (
                  <label
                    key={option.value}
                    className={importance === option.value ? 'choice-button is-selected' : 'choice-button'}
                  >
                    <input
                      className="choice-radio"
                      type="radio"
                      name="seed-importance"
                      value={option.value}
                      checked={importance === option.value}
                      onChange={() => {
                        markDraftAsEdited();
                        setImportance(option.value);
                        setHasAdjustedTuning(true);
                      }}
                    />
                    <b>{levelLabels[option.value]}</b>
                    <small>{option.value === 'high' ? '大事・放置したくない' : '軽め・今は小さい'}</small>
                  </label>
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
                <label
                  key={option.value}
                  className={difficulty === option.value ? 'choice-button is-selected' : 'choice-button'}
                >
                  <input
                    className="choice-radio"
                    type="radio"
                    name="seed-difficulty"
                    value={option.value}
                    checked={difficulty === option.value}
                    onChange={() => {
                      markDraftAsEdited();
                      setDifficulty(option.value);
                      setHasAdjustedTuning(true);
                    }}
                  />
                  <b>{difficultyLabels[option.value]}</b>
                  <small>{option.hint} / +{difficultyAshPoints[option.value]}炭</small>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </details>

      <details
        className="advanced-fields"
        open={isAdvancedOpen}
        onToggle={(event) => setIsAdvancedOpen(event.currentTarget.open)}
      >
        <summary className="advanced-fields-summary">
          <span>メモ・カテゴリ</span>
          <small className={hasAdvancedContent ? 'has-content' : undefined}>{advancedSummary}</small>
        </summary>

        <div className="field-group">
          <label htmlFor="seed-body">メモ</label>
          <textarea
            id="seed-body"
            value={body}
            onChange={(event) => {
              markDraftAsEdited();
              setBody(event.target.value);
            }}
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
            onChange={(event) => {
              markDraftAsEdited();
              setCategory(event.target.value as FireCategory);
            }}
          >
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </details>

      {submitError ? <p id={submitErrorId} className="form-error form-submit-error">{submitError}</p> : null}

      <div className="submit-row form-sticky-submit">
        <button ref={submitButtonRef} className="primary-button" type="submit" disabled={isSubmitting} aria-describedby={submitError ? submitErrorId : undefined}>
          {isSubmitting ? '追加中…' : 'タスクを薪にする'}
        </button>
      </div>
    </form>
  );
}
