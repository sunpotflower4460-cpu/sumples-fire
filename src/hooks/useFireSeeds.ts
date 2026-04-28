import { useEffect, useMemo, useState } from 'react';
import { getFireSeedStats, getFocusSeed, nowIso } from '../lib/fireSeedModel';
import { loadStoredSeeds, saveStoredSeeds } from '../lib/fireSeedStorage';
import type { FireCategory, FireFilter, FirePriority, FireSeed, FireStage } from '../types/fireSeed';

type NewFireSeedInput = {
  title: string;
  body: string;
  nextAction: string;
  category: FireCategory;
  priority: FirePriority;
  stage: FireStage;
};

const getBrowserStorage = () => (typeof window === 'undefined' ? undefined : window.localStorage);

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `seed-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function useFireSeeds() {
  const [seeds, setSeeds] = useState<FireSeed[]>(() => loadStoredSeeds(getBrowserStorage()));
  const [filter, setFilter] = useState<FireFilter>('all');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const saved = saveStoredSeeds(getBrowserStorage(), seeds);
    if (!saved) {
      setNotice('この端末では保存できませんでした');
    }
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
    setNotice('保存しました');
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
    setNotice('更新しました');
  };

  const deleteSeed = (id: string) => {
    const target = seeds.find((seed) => seed.id === id);
    if (!target) return;

    const confirmed = window.confirm(`このメモを削除しますか？\n\n「${target.title}」\n\n削除すると元に戻せません。`);
    if (!confirmed) return;

    setSeeds((current) => current.filter((seed) => seed.id !== id));
    setNotice('削除しました');
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
    setFilter,
    toggleSeed,
  };
}
