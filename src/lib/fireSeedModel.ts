import { difficultyAshPoints } from '../types/fireSeed';
import type { FireDifficulty, FireSeed } from '../types/fireSeed';

export const nowIso = () => new Date().toISOString();

export const createSampleSeeds = (timestamp = nowIso()): FireSeed[] => [
  {
    id: 'sample-1',
    title: '先延ばししていた返信をする',
    body: '気が重いけれど、短く返して終わらせる。',
    nextAction: '2分だけ文面を書く',
    category: 'task',
    priority: 'high',
    stage: 'spark',
    difficulty: 'normal',
    ashPoints: 5,
    burned: false,
    completed: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: 'sample-2',
    title: '部屋の一角を片付ける',
    body: '全部ではなく、机の上だけでいい。',
    nextAction: 'いらない紙を3枚捨てる',
    category: 'life',
    priority: 'medium',
    stage: 'kindling',
    difficulty: 'heavy',
    ashPoints: 10,
    burned: false,
    completed: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: 'sample-3',
    title: '面倒な書類を出す',
    body: '終わったらFireして炭にする。',
    nextAction: '必要な項目だけ確認する',
    category: 'task',
    priority: 'high',
    stage: 'flame',
    difficulty: 'boss',
    ashPoints: 20,
    burned: true,
    burnedAt: timestamp,
    completed: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
];

const inferDifficulty = (seed: Partial<FireSeed>): FireDifficulty => {
  if (seed.difficulty) return seed.difficulty;
  if (seed.priority === 'high') return 'heavy';
  if (seed.priority === 'low') return 'small';
  return 'normal';
};

export const normalizeSeed = (seed: Partial<FireSeed>, index: number, timestamp = nowIso()): FireSeed => {
  const createdAt = seed.createdAt ?? timestamp;
  const difficulty = inferDifficulty(seed);
  const burned = seed.burned ?? seed.completed ?? false;
  const stage = seed.stage ?? (burned ? 'flame' : 'spark');

  return {
    id: seed.id ?? `imported-${index}-${timestamp}`,
    title: seed.title?.trim() || '名前のないタスク',
    body: seed.body?.trim() ?? '',
    nextAction: seed.nextAction?.trim() ?? '',
    category: seed.category ?? 'task',
    priority: seed.priority ?? 'medium',
    stage,
    difficulty,
    ashPoints: seed.ashPoints ?? difficultyAshPoints[difficulty],
    burned,
    burnedAt: seed.burnedAt,
    completed: seed.completed ?? burned,
    createdAt,
    updatedAt: seed.updatedAt ?? createdAt,
  };
};

export const getFocusSeed = (seeds: FireSeed[]) => {
  const priorityScore = { high: 3, medium: 2, low: 1 };
  const difficultyScore = { boss: 4, heavy: 3, normal: 2, small: 1 };

  return [...seeds]
    .filter((seed) => !seed.burned)
    .sort((a, b) => {
      const priorityDiff = priorityScore[b.priority] - priorityScore[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return difficultyScore[b.difficulty] - difficultyScore[a.difficulty];
    })[0];
};

export const getFireSeedStats = (seeds: FireSeed[]) => ({
  total: seeds.length,
  active: seeds.filter((seed) => !seed.burned).length,
  completed: seeds.filter((seed) => seed.burned).length,
  high: seeds.filter((seed) => !seed.burned && seed.priority === 'high').length,
  flame: seeds.filter((seed) => seed.stage === 'flame').length,
  burned: seeds.filter((seed) => seed.burned).length,
  totalAshPoints: seeds.reduce((sum, seed) => (seed.burned ? sum + seed.ashPoints : sum), 0),
});

export const burnSeed = (seed: FireSeed, timestamp = nowIso()): FireSeed => ({
  ...seed,
  burned: true,
  completed: true,
  stage: 'flame',
  burnedAt: timestamp,
  updatedAt: timestamp,
  ashPoints: seed.ashPoints || difficultyAshPoints[seed.difficulty],
});
