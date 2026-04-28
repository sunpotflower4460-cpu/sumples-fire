import { useEffect, useMemo, useState } from 'react';
import { burnSeed, getFireSeedStats, getFocusSeed, nowIso } from '../lib/fireSeedModel';
import { loadStoredSeeds, saveStoredSeeds } from '../lib/fireSeedStorage';
import type { FireCategory, FireDifficulty, FireFilter, FirePriority, FireSeed, FireStage } from '../types/fireSeed';
import { difficultyAshPoints } from '../types/fireSeed';

type NewFireSeedInput = {
  title: string;
  body: string;
  nextAction: string;
  category: FireCategory;
  priority: FirePriority;
  stage: FireStage;
  difficulty: FireDifficulty;
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
  const [filter, setFilter] = useState<FireFilter>('active');
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
      difficulty: input.difficulty,
      ashPoints: difficultyAshPoints[input.difficulty],
      burned: false,
      completed: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setSeeds((current) => [nextSeed, ...current]);
    setNotice('薪を追加しました');
  };

  const burnTask = (id: string) => {
    const target = seeds.find((seed) => seed.id === id);
    if (!target || target.burned) return;

    setSeeds((current) => current.map((seed) => (seed.id === id ? burnSeed(seed) : seed)));
    setNotice(`Fire! +${target.ashPoints} 炭`);
  };

  const deleteSeed = (id: string) => {
    const target = seeds.find((seed) => seed.id === id);
    if (!target) return;

    const confirmed = window.confirm(`このタスクを削除しますか？\n\n「${target.title}」\n\n削除すると元に戻せません。`);
    if (!confirmed) return;

    setSeeds((current) => current.filter((seed) => seed.id !== id));
    setNotice('削除しました');
  };

  const filteredSeeds = useMemo(() => {
    switch (filter) {
      case 'active':
        return seeds.filter((seed) => !seed.burned);
      case 'burned':
        return seeds.filter((seed) => seed.burned);
      case 'today':
        return seeds.filter((seed) => !seed.burned && seed.priority === 'high');
      default:
        return seeds;
    }
  }, [filter, seeds]);

  const focusSeed = useMemo(() => getFocusSeed(seeds), [seeds]);
  const stats = useMemo(() => getFireSeedStats(seeds), [seeds]);

  return {
    allSeeds: seeds,
    filteredSeeds,
    filter,
    focusSeed,
    notice,
    stats,
    addSeed,
    burnTask,
    deleteSeed,
    setFilter,
  };
}
