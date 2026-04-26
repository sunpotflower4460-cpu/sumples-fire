import { useEffect, useMemo, useState } from 'react';
import type { FireCategory, FireFilter, FirePriority, FireSeed } from '../types/fireSeed';

const STORAGE_KEY = 'sumples-fire-seeds-v1';

type NewFireSeedInput = {
  title: string;
  body: string;
  category: FireCategory;
  priority: FirePriority;
};

const sampleSeeds: FireSeed[] = [
  {
    id: 'sample-1',
    title: '最初の火種を書く',
    body: '小さな思いつきでも、置いておくと未来の自分が拾ってくれる。',
    category: 'idea',
    priority: 'medium',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-2',
    title: 'スマホで見やすいか確認する',
    body: '開発フローのテストでは、Preview確認とスマホ表示チェックも大切。',
    category: 'task',
    priority: 'high',
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `seed-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const loadSeeds = (): FireSeed[] => {
  if (typeof window === 'undefined') {
    return sampleSeeds;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return sampleSeeds;

    const parsed = JSON.parse(raw) as FireSeed[];
    if (!Array.isArray(parsed)) return sampleSeeds;

    return parsed;
  } catch {
    return sampleSeeds;
  }
};

export function useFireSeeds() {
  const [seeds, setSeeds] = useState<FireSeed[]>(loadSeeds);
  const [filter, setFilter] = useState<FireFilter>('all');

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds));
  }, [seeds]);

  const addSeed = (input: NewFireSeedInput) => {
    const nextSeed: FireSeed = {
      id: createId(),
      title: input.title.trim(),
      body: input.body.trim(),
      category: input.category,
      priority: input.priority,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setSeeds((current) => [nextSeed, ...current]);
  };

  const toggleSeed = (id: string) => {
    setSeeds((current) =>
      current.map((seed) => (seed.id === id ? { ...seed, completed: !seed.completed } : seed)),
    );
  };

  const deleteSeed = (id: string) => {
    setSeeds((current) => current.filter((seed) => seed.id !== id));
  };

  const resetSamples = () => {
    setSeeds(sampleSeeds);
    setFilter('all');
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

  const stats = useMemo(
    () => ({
      total: seeds.length,
      active: seeds.filter((seed) => !seed.completed).length,
      completed: seeds.filter((seed) => seed.completed).length,
      high: seeds.filter((seed) => seed.priority === 'high').length,
    }),
    [seeds],
  );

  return {
    filteredSeeds,
    filter,
    stats,
    addSeed,
    deleteSeed,
    resetSamples,
    setFilter,
    toggleSeed,
  };
}
