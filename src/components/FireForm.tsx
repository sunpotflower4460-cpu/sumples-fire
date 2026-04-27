import { FormEvent, useState } from 'react';
import type { FireCategory, FirePriority, FireStage } from '../types/fireSeed';
import { categoryLabels, priorityLabels, stageLabels } from '../types/fireSeed';

type FireFormProps = {
  onAddSeed: (input: {
    title: string;
    body: string;
    nextAction: string;
    category: FireCategory;
    priority: FirePriority;
    stage: FireStage;
  }) => void;
};

export function FireForm({ onAddSeed }: FireFormProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [category, setCategory] = useState<FireCategory>('idea');
  const [priority, setPriority] = useState<FirePriority>('medium');
  const [stage, setStage] = useState<FireStage>('spark');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim()) {
      setError('タイトルを入力してください');
      return;
    }

    onAddSeed({ title, body, nextAction, category, priority, stage });
    setTitle('');
    setBody('');
    setNextAction('');
    setCategory('idea');
    setPriority('medium');
    setStage('spark');
    setError('');
  };

  return (
    <form className="fire-form" onSubmit={handleSubmit}>
      <div className="field-group">
        <label htmlFor="seed-title">タイトル</label>
        <input
          id="seed-title"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setError('');
          }}
          placeholder="例：新しい曲のサビ案"
          maxLength={60}
        />
      </div>

      <div className="field-group">
        <label htmlFor="seed-body">メモ</label>
        <textarea
          id="seed-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="思いついたことをそのまま残す"
          rows={4}
          maxLength={260}
        />
      </div>

      <div className="field-group">
        <label htmlFor="seed-next-action">次の一歩</label>
        <input
          id="seed-next-action"
          value={nextAction}
          onChange={(event) => setNextAction(event.target.value)}
          placeholder="例：今日30秒だけ試す"
          maxLength={90}
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
          <label htmlFor="seed-priority">温度</label>
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

      {error ? <p className="form-error">{error}</p> : null}

      <button className="primary-button" type="submit">
        記録する
      </button>
    </form>
  );
}
