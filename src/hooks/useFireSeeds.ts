import { useEffect, useMemo, useState } from 'react';
import type { FireCategory, FireFilter, FirePriority, FireSeed, FireStage } from '../types/fireSeed';

const STORAGE_KEY = 'sumples-fire-seeds-v2';
const LEGACY_STORAGE_KEY = 'sumples-fire-seeds-v1';

type NewFireSeedInput = {
  title: string;
  body: string;
  nextAction: string;
  category: FireCategory;
  priority: FirePriority;
  stage: FireStage;
};

const now = () => new Date().toISOString();

const sampleSeeds: FireSeed[] = [
  {
    id: 'sample-1',
    title: '最初の火種を書く',
    body: '小さな思いつきでも、置いておくと未来の自分が拾ってくれる。',
    nextAction: '今日のうちに1行だけ追記する',
    category: 'idea',
    priority: 'medium',
    stage: 'kindling',
    completed: false,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'sample-2',
    title: 'スマホで使いやすいか確認する',
    body: 'App Store品質に近づけるには、片手操作、余白、文字サイズの確認が大切。',
    nextAction: 'iPhone幅で追加、完了、削除を試す',
    category: 'task',
    priority: 'high',
    stage: 'spark',
    completed: false,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'sample-3',
    title: '曲の断片を育てる',
    body: '鼻歌、言葉、コード進行。まだ曖昧なものを消える前に置いておく。',
    nextAction: '30秒だけ録音してメモに残す',
    category: 'music',
    priority: 'medium',
    stage: 'flame',
    completed: true,
    createdAt: now(),
    updatedAt: now(),
  },
];

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `seed-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const normalizeSeed = (seed: Partial<FireSeed>, index: number): FireSeed => {
  const createdAt = seed.createdAt ?? now();

  return {
    id: seed.id ?? `imported-${index}-${Date.now()}`,
    title: seed.title?.trim() || '名前のない火種',
    body: seed.body?.trim() ?? '',
    nextAction: seed.nextAction?.trim() ?? '',
    category: seed.category ?? 'idea',
    priority: seed.priority ?? 'medium',
    stage: seed.stage ?? (seed.completed ? 'flame' : 'spark'),
    completed: seed.completed ?? false,
    createdAt,
    updatedAt: seed.updatedAt ?? createdAt,
  };
};

const readStoredSeeds = (key: string): FireSeed[] | null => {
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;

  const parsed = JSON.parse(raw) as Partial<FireSeed>[];
  if (!Array.isArray(parsed)) return null;

  return parsed.map(normalizeSeed);
};

const loadSeeds = (): FireSeed[] => {
  if (typeof window === 'undefined') {
    return sampleSeeds;
  }

  try {
    return readStoredSeeds(STORAGE_KEY) ?? readStoredSeeds(LEGACY_STORAGE_KEY) ?? sampleSeeds;
  } catch {
    return sampleSeeds;
  }
};

export function useFireSeeds() {
  const [seeds, setSeeds] = useState<FireSeed[]>(loadSeeds);
  const [filter, setFilter] = useState<FireFilter>('all');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds));
  }, [seeds]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const addSeed = (input: NewFireSeedInput) => {
    const timestamp = now();
    const nextSeed: FireSeed = {
      id: createId(),
      title: input.title.trim(),
      body: input.body.trim(),
      nextAction: input.nextAction.trim(),
      category: input.category,
      priority: input.priority,
      stage: input.stage,
      completed: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setSeeds((current) => [nextSeed, ...current]);
    setNotice('火種を保存しました');
  };

  const toggleSeed = (id: string) => {
    setSeeds((current) =>
      current.map((seed) =>
        seed.id === id
          ? {
              ...seed,
              completed: !seed.completed,
              stage: !seed.completed ? 'flame' : seed.stage,
              updatedAt: now(),
            }
          : seed,
      ),
    );
    setNotice('状態を更新しました');
  };

  const deleteSeed = (id: string) => {
    const target = seeds.find((seed) => seed.id === id);
    if (!target) return;

    const confirmed = window.confirm(`「${target.title}」を削除しますか？`);
    if (!confirmed) return;

    setSeeds((current) => current.filter((seed) => seed.id !== id));
    setNotice('削除しました');
  };

  const resetSamples = () => {
    const confirmed = window.confirm('現在のメモをサンプルに戻しますか？');
    if (!confirmed) return;

    setSeeds(sampleSeeds);
    setFilter('all');
    setNotice('サンプルに戻しました');
  };

  const filteredSeeds = useMemo(() => {
    switch (filter) {
      case 'active':
        return seeds.filter((seed) => !seed.completed);
      case 'completed':
        return seeds.filter((seed) => seed.completed);
      case 'high':
        return seeds.filter((seed) => seed.priority === 'high');
      default:
        return seeds;
    }
  }, [filter, seeds]);

  const focusSeed = useMemo(() => {
    return seeds
      .filter((seed) => !seed.completed)
      .sort((a, b) => {
        const priorityScore = { high: 3, medium: 2, low: 1 };
        return priorityScore[b.priority] - priorityScore[a.priority];
      })[0];
  }, [seeds]);

  const stats = useMemo(
    () => ({
      total: seeds.length,
      active: seeds.filter((seed) => !seed.completed).length,
      completed: seeds.filter((seed) => seed.completed).length,
      high: seeds.filter((seed) => seed.priority === 'high').length,
      flame: seeds.filter((seed) => seed.stage === 'flame').length,
    }),
    [seeds],
  );

  return {
    filteredSeeds,
    filter,
    focusSeed,
    notice,
    stats,
    addSeed,
    deleteSeed,
    resetSamples,
    setFilter,
    toggleSeed,
  };
}
