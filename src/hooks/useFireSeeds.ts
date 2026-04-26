import { useEffect, useMemo, useState } from 'react';
import {
  createSampleSeeds,
  getFireSeedStats,
  getFocusSeed,
  normalizeSeed,
  nowIso,
} from '../lib/fireSeedModel';
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

const sampleSeeds = createSampleSeeds();

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `seed-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const readStoredSeeds = (key: string): FireSeed[] | null => {
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;

  const parsed = JSON.parse(raw) as Partial<FireSeed>[];
  if (!Array.isArray(parsed)) return null;

  return parsed.map((seed, index) => normalizeSeed(seed, index));
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
    const timestamp = nowIso();
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
              updatedAt: nowIso(),
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

    setSeeds(createSampleSeeds());
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

  const focusSeed = useMemo(() => getFocusSeed(seeds), [seeds]);
  const stats = useMemo(() => getFireSeedStats(seeds), [seeds]);

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
