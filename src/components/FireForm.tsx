import { FormEvent, useState } from 'react';
import type { FireCategory, FireDifficulty, FirePriority, FireStage } from '../types/fireSeed';
import { categoryLabels, difficultyAshPoints, difficultyLabels, priorityLabels, stageLabels } from '../types/fireSeed';

type FireFormProps = {
  onAddSeed: (input: {
    title: string;
    body: string;
    nextAction: string;
    category: FireCategory;
    priority: FirePriority;
    stage: FireStage;
    difficulty: FireDifficulty;
  }) => void;
};

export function FireForm({ onAddSeed }: FireFormProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [category, setCategory] = useState<FireCategory>('task');
  const [priority, setPriority] = useState<FirePriority>('medium');
  const [stage, setStage] = useState<FireStage>('spark');
  const [difficulty, setDifficulty] = useState<FireDifficulty>('normal');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim()) {
      setError('燃やしたいタスクを入力してください');
      return;
    }

    onAddSeed({ title, body, nextAction, category, priority, stage, difficulty });
    setTitle('');
    setBody('');
    setNextAction('');
    setCategory('task');
    setPriority('medium');
    setStage('spark');
    setDifficulty('normal');
    setError('');
  };

  return (
    <form className="fire-form" onSubmit={handleSubmit}>
      <div className="field-group">
        <label htmlFor="seed-title">燃やしたいタスク</label>
        <input
          id="seed-title"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setError('');
          }}
          placeholder="例：先延ばししていた返信をする"
          maxLength={60}
          autoFocus
        />
      </div>

      <div className="field-group compact-field">
        <label htmlFor="seed-next-action">最初の一歩</label>
        <input
          id="seed-next-action"
          value={nextAction}
          onChange={(event) => setNextAction(event.target.value)}
          placeholder="例：2分だけ文面を書く"
          maxLength={90}
        />
      </div>

      <div className="field-group compact-field">
        <label htmlFor="seed-difficulty">重さ</label>
        <select id="seed-difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value as FireDifficulty)}>
          {Object.entries(difficultyLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label} / +{difficultyAshPoints[value as FireDifficulty]} 炭
            </option>
          ))}
        </select>
      </div>

      <details className="advanced-fields">
        <summary>詳しく書く</summary>

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

        <div className="form-grid form-grid-three">
          <div className="field-group">
            <label htmlFor="seed-category">カテゴリ</label>
            <select
              id="seed-category"
              value={category}
              onChange={(event) => setCategory(event.target.value as FireCategory)}
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="seed-priority">優先度</label>
            <select
              id="seed-priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value as FirePriority)}
            >
              {Object.entries(priorityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="seed-stage">状態</label>
            <select id="seed-stage" value={stage} onChange={(event) => setStage(event.target.value as FireStage)}>
              {Object.entries(stageLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </details>

      {error ? <p className="form-error">{error}</p> : null}

      <button className="primary-button" type="submit">
        薪にする
      </button>
    </form>
  );
}
