import { useEffect, useMemo, useState } from 'react';
import { burnSeed, getFireSeedStats, getFocusSeed, getQuadrant, markSeedBurning, nowIso, sortFireTasks } from '../lib/fireSeedModel';
import { loadStoredSeeds, saveStoredSeeds } from '../lib/fireSeedStorage';
import { playFireSequence } from '../lib/fireSoundEngine';
import { isFireSoundEnabled } from '../lib/fireSoundSettings';
import type { FireCategory, FireDifficulty, FireFilter, FireLevel, FirePriority, FireSeed, FireStage } from '../types/fireSeed';
import { difficultyAshPoints } from '../types/fireSeed';

type NewFireSeedInput = {
  title: string;
  body: string;
  nextAction: string;
  category: FireCategory;
  priority: FirePriority;
  stage: FireStage;
  difficulty: FireDifficulty;
  urgency: FireLevel;
  importance: FireLevel;
};

const getBrowserStorage = () => (typeof window === 'undefined' ? undefined : window.localStorage);

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `seed-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function useFireSeeds() {
  const [seeds, setSeeds] = useState<FireSeed[]>(() => sortFireTasks(loadStoredSeeds(getBrowserStorage())));
  const [filter, setFilter] = useState<FireFilter>('active');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const persistedSeeds = seeds.map((seed) => ({ ...seed, isBurning: false }));
    const saved = saveStoredSeeds(getBrowserStorage(), persistedSeeds);
    if (!saved) {
      setNotice('この端末では保存できませんでした');
    }
  }, [seeds]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const addSeed = (input: NewFireSeedInput) => {
    const timestamp = nowIso();
    const quadrant = getQuadrant(input.urgency, input.importance);
    const id = createId();
    const nextSeed: FireSeed = {
      id,
      title: input.title.trim(),
      body: input.body.trim(),
      nextAction: input.nextAction.trim(),
      category: input.category,
      priority: input.priority,
      stage: input.stage,
      difficulty: input.difficulty,
      urgency: input.urgency,
      importance: input.importance,
      quadrant,
      ashPoints: difficultyAshPoints[input.difficulty],
      burned: false,
      isBurning: false,
      completed: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setSeeds((current) => sortFireTasks([nextSeed, ...current]));
    setNotice('薪を追加しました');
    return id;
  };

  const burnTask = (id: string) => {
    const target = seeds.find((seed) => seed.id === id);
    if (!target || target.burned || target.isBurning) return;

    if (isFireSoundEnabled()) {
      void playFireSequence();
    }
    setSeeds((current) => current.map((seed) => (seed.id === id ? markSeedBurning(seed) : seed)));
    window.setTimeout(() => {
      setSeeds((current) => sortFireTasks(current.map((seed) => (seed.id === id ? burnSeed(seed) : seed))));
      const base = `Fire完了！ +${target.ashPoints}炭になりました`;
      const decorated = target.difficulty === 'boss'
        ? `ラスボス撃破！ +${target.ashPoints}炭になりました`
        : target.difficulty === 'heavy'
          ? `大仕事完了！ +${target.ashPoints}炭になりました`
          : base;
      setNotice(decorated);
    }, 1600);
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
    const sorted = sortFireTasks(seeds);
    switch (filter) {
      case 'active':
        return sorted.filter((seed) => !seed.burned);
      case 'burned':
        return sorted.filter((seed) => seed.burned);
      case 'today':
        return sorted.filter((seed) => !seed.burned && seed.quadrant === 'doNow');
      default:
        return sorted;
    }
  }, [filter, seeds]);

  const focusSeed = useMemo(() => getFocusSeed(seeds), [seeds]);
  const stats = useMemo(() => getFireSeedStats(seeds), [seeds]);

  return {
    allSeeds: sortFireTasks(seeds),
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
