import { difficultyAshPoints } from '../types/fireSeed';
import type { FireDifficulty, FireLevel, FireMatrixQuadrant, FireSeed } from '../types/fireSeed';

export const nowIso = () => new Date().toISOString();

export const getQuadrant = (urgency: FireLevel, importance: FireLevel): FireMatrixQuadrant => {
  if (urgency === 'high' && importance === 'high') return 'doNow';
  if (urgency === 'low' && importance === 'high') return 'schedule';
  if (urgency === 'high' && importance === 'low') return 'quickBurn';
  return 'backlog';
};

const quadrantScore: Record<FireMatrixQuadrant, number> = {
  doNow: 4,
  schedule: 3,
  quickBurn: 2,
  backlog: 1,
};

export const sortFireTasks = (seeds: FireSeed[]) => {
  const difficultyScore = { boss: 4, heavy: 3, normal: 2, small: 1 };

  return [...seeds].sort((a, b) => {
    const quadrantDiff = quadrantScore[b.quadrant] - quadrantScore[a.quadrant];
    if (quadrantDiff !== 0) return quadrantDiff;

    const difficultyDiff = difficultyScore[b.difficulty] - difficultyScore[a.difficulty];
    if (difficultyDiff !== 0) return difficultyDiff;

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
};

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
    urgency: 'high',
    importance: 'high',
    quadrant: 'doNow',
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
    urgency: 'low',
    importance: 'high',
    quadrant: 'schedule',
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
    urgency: 'high',
    importance: 'high',
    quadrant: 'doNow',
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

const inferUrgency = (seed: Partial<FireSeed>): FireLevel => {
  if (seed.urgency) return seed.urgency;
  return seed.priority === 'high' ? 'high' : 'low';
};

const inferImportance = (seed: Partial<FireSeed>): FireLevel => {
  if (seed.importance) return seed.importance;
  return seed.difficulty === 'heavy' || seed.difficulty === 'boss' || seed.priority !== 'low' ? 'high' : 'low';
};

const isSameLocalDay = (left?: string, right = new Date()) => {
  if (!left) return false;
  const date = new Date(left);
  return (
    date.getFullYear() === right.getFullYear() &&
    date.getMonth() === right.getMonth() &&
    date.getDate() === right.getDate()
  );
};

export const getFireRank = (ashPoints: number) => {
  if (ashPoints >= 500) return '灰の王';
  if (ashPoints >= 250) return '焚火マスター';
  if (ashPoints >= 120) return '炎の職人';
  if (ashPoints >= 50) return '炭集め名人';
  if (ashPoints >= 15) return '火付け人';
  return 'はじめの火花';
};

export const normalizeSeed = (seed: Partial<FireSeed>, index: number, timestamp = nowIso()): FireSeed => {
  const createdAt = seed.createdAt ?? timestamp;
  const difficulty = inferDifficulty(seed);
  const urgency = inferUrgency(seed);
  const importance = inferImportance({ ...seed, difficulty });
  const quadrant = seed.quadrant ?? getQuadrant(urgency, importance);
  const burned = seed.burned ?? seed.completed ?? false;
  const stage = seed.stage ?? (burned ? 'flame' : 'spark');

  return {
    id: seed.id ?? `imported-${index}-${timestamp}`,
    title: seed.title?.trim() || '名前のないタスク',
    body: seed.body?.trim() ?? '',
    nextAction: seed.nextAction?.trim() ?? '',
    category: seed.category ?? 'task',
    priority: seed.priority ?? (urgency === 'high' ? 'high' : 'medium'),
    stage,
    difficulty,
    urgency,
    importance,
    quadrant,
    ashPoints: seed.ashPoints ?? difficultyAshPoints[difficulty],
    burned,
    burnedAt: seed.burnedAt,
    isBurning: seed.isBurning ?? false,
    completed: seed.completed ?? burned,
    createdAt,
    updatedAt: seed.updatedAt ?? createdAt,
  };
};

export const getFocusSeed = (seeds: FireSeed[]) => sortFireTasks(seeds.filter((seed) => !seed.burned))[0];

export const getFireSeedStats = (seeds: FireSeed[]) => {
  const totalAshPoints = seeds.reduce((sum, seed) => (seed.burned ? sum + seed.ashPoints : sum), 0);
  const todayBurned = seeds.filter((seed) => seed.burned && isSameLocalDay(seed.burnedAt)).length;

  return {
    total: seeds.length,
    active: seeds.filter((seed) => !seed.burned).length,
    completed: seeds.filter((seed) => seed.burned).length,
    high: seeds.filter((seed) => !seed.burned && seed.urgency === 'high').length,
    flame: seeds.filter((seed) => seed.stage === 'flame').length,
    burned: seeds.filter((seed) => seed.burned).length,
    totalAshPoints,
    todayBurned,
    rank: getFireRank(totalAshPoints),
    doNow: seeds.filter((seed) => !seed.burned && seed.quadrant === 'doNow').length,
    schedule: seeds.filter((seed) => !seed.burned && seed.quadrant === 'schedule').length,
    quickBurn: seeds.filter((seed) => !seed.burned && seed.quadrant === 'quickBurn').length,
    backlog: seeds.filter((seed) => !seed.burned && seed.quadrant === 'backlog').length,
  };
};

export const markSeedBurning = (seed: FireSeed, timestamp = nowIso()): FireSeed => ({
  ...seed,
  isBurning: true,
  updatedAt: timestamp,
});

export const burnSeed = (seed: FireSeed, timestamp = nowIso()): FireSeed => ({
  ...seed,
  burned: true,
  completed: true,
  isBurning: false,
  stage: 'flame',
  burnedAt: timestamp,
  updatedAt: timestamp,
  ashPoints: seed.ashPoints || difficultyAshPoints[seed.difficulty],
});
