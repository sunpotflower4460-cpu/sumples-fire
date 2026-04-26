import { FormEvent, useState } from 'react';
import type { FireCategory, FirePriority } from '../types/fireSeed';
import { categoryLabels, priorityLabels } from '../types/fireSeed';

type FireFormProps = {
  onAddSeed: (input: {
    title: string;
    body: string;
    category: FireCategory;
    priority: FirePriority;
  }) => void;
};

export function FireForm({ onAddSeed }: FireFormProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<FireCategory>('idea');
  const [priority, setPriority] = useState<FirePriority>('medium');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim()) return;

    onAddSeed({ title, body, category, priority });
    setTitle('');
    setBody('');
    setCategory('idea');
    setPriority('medium');
  };

  return (
    <form className="fire-form" onSubmit={handleSubmit}>
      <div className="field-group">
        <label htmlFor="seed-title">火種の名前</label>
        <input
          id="seed-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
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
          placeholder="少しでも残しておきたいことを書く"
          rows={4}
          maxLength={220}
        />
      </div>

      <div className="form-grid">
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
      </div>

      <button className="primary-button" type="submit" disabled={!title.trim()}>
        火種を追加する
      </button>
    </form>
  );
}
