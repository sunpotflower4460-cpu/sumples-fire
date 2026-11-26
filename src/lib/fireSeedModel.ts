import { difficultyAshPoints } from '../types/fireSeed';
import type { FireDifficulty, FireLevel, FireMatrixQuadrant, FirePriority, FireSeed } from '../types/fireSeed';

export const nowIso = () => new Date().toISOString();

const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The device-local calendar day of a moment, as YYYY-MM-DD. */
export const toLocalDateKey = (date: Date): string => (
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
);

/** True for a real calendar day written as YYYY-MM-DD. */
export const isValidLocalDateKey = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  const match = LOCAL_DATE_PATTERN.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

/** A burnedAt we can trust as a real moment. Never inferred from other fields. */
export const parseBurnedAt = (value: unknown): Date | null => {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};

export const getQuadrant = (urgency: FireLevel, importance: FireLevel): FireMatrixQuadrant => {
  if (urgency === 'high' && importance === 'high') return 'doNow';
  if (urgency === 'low' && importance === 'high') return 'schedule';
  if (urgency === 'high' && importance === 'low') return 'quickBurn';
  return 'backlog';
};

export const derivePriority = (urgency: FireLevel, importance: FireLevel): FirePriority => {
  if (urgency === 'high') return 'high';
  if (importance === 'high') return 'medium';
  return 'low';
};

const quadrantScore: Record<FireMatrixQuadrant, number> = {
  doNow: 4,
  schedule: 3,
  quickBurn: 2,
  backlog: 1,
};

const fireRanks = [
  { min: 0, label: '火掻き棒' },
  { min: 15, label: '火吹き' },
  { min: 50, label: '炎の弟子' },
  { min: 120, label: '焚火の番人' },
  { min: 250, label: '火神の末裔' },
  { min: 500, label: '業火の主' },
] as const;

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

type StarterTemplate = Pick<FireSeed, 'title' | 'nextAction' | 'category' | 'difficulty' | 'urgency' | 'importance'>;

const starterTemplates: StarterTemplate[] = [
  { title: '先延ばししていた返信をする', nextAction: '2分だけ文面を書く', category: 'task', difficulty: 'normal', urgency: 'high', importance: 'high' },
  { title: '部屋の一角を片付ける', nextAction: 'いらない紙を3枚捨てる', category: 'life', difficulty: 'heavy', urgency: 'low', importance: 'high' },
  { title: '5分で終わる用事をひとつ済ませる', nextAction: '', category: 'task', difficulty: 'small', urgency: 'high', importance: 'low' },
];

/**
 * Optional first-launch templates the user can choose to start from.
 * All are unburned: choosing them must never fabricate ash points, history
 * or streaks. Ids are fresh so they behave exactly like user-written tasks.
 */
export const createStarterSeeds = (createId: () => string, timestamp = nowIso()): FireSeed[] => (
  starterTemplates.map((template) => ({
    ...template,
    id: createId(),
    body: '',
    priority: derivePriority(template.urgency, template.importance),
    stage: 'spark',
    quadrant: getQuadrant(template.urgency, template.importance),
    ashPoints: difficultyAshPoints[template.difficulty],
    burned: false,
    isBurning: false,
    completed: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  }))
);

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

/** Index of the rank a score sits in — lets the UI notice a rank-up. */
export const getFireRankLevel = (ashPoints: number) => {
  const index = [...fireRanks].reverse().findIndex((rank) => ashPoints >= rank.min);
  return index === -1 ? 0 : fireRanks.length - 1 - index;
};

export const getFireRank = (ashPoints: number) => {
  return [...fireRanks].reverse().find((rank) => ashPoints >= rank.min)?.label ?? fireRanks[0].label;
};

export const getNextFireRank = (ashPoints: number) => {
  let currentIndex = 0;
  for (let index = fireRanks.length - 1; index >= 0; index -= 1) {
    if (ashPoints >= fireRanks[index].min) {
      currentIndex = index;
      break;
    }
  }

  const currentRank = fireRanks[currentIndex];
  const nextRank = fireRanks[currentIndex + 1];

  if (!nextRank) {
    return {
      current: currentRank.label,
      next: '最高称号',
      remaining: 0,
      progress: 100,
    };
  }

  const span = nextRank.min - currentRank.min;
  const gained = Math.max(0, ashPoints - currentRank.min);
  const progress = Math.min(100, Math.round((gained / span) * 100));

  return {
    current: currentRank.label,
    next: nextRank.label,
    remaining: Math.max(0, nextRank.min - ashPoints),
    progress,
  };
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
    priority: seed.priority ?? derivePriority(urgency, importance),
    stage,
    difficulty,
    urgency,
    importance,
    quadrant,
    ashPoints: seed.ashPoints ?? difficultyAshPoints[difficulty],
    burned,
    burnedAt: seed.burnedAt,
    // Only a burned task has a completion day, and only a well-formed one is kept.
    burnedLocalDate: burned && isValidLocalDateKey(seed.burnedLocalDate) ? seed.burnedLocalDate : undefined,
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
  const nextRank = getNextFireRank(totalAshPoints);

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
    nextRank: nextRank.next,
    nextRankRemaining: nextRank.remaining,
    rankProgress: nextRank.progress,
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
  // Frozen now, in the device's time zone at the moment of completion.
  burnedLocalDate: toLocalDateKey(new Date(timestamp)),
  updatedAt: timestamp,
  ashPoints: seed.ashPoints || difficultyAshPoints[seed.difficulty],
});

/**
 * One-time upgrade for records saved before `burnedLocalDate` existed.
 *
 * A burned task with a valid `burnedAt` gets its local day computed here, once,
 * in the device's current time zone, and that value is then stored — so a later
 * time-zone change cannot move it. A burned task with no valid `burnedAt` is
 * left alone: its day is unknown and is never guessed from createdAt/updatedAt.
 */
export const backfillBurnedLocalDates = (seeds: FireSeed[]): { seeds: FireSeed[]; changed: boolean } => {
  let changed = false;
  const next = seeds.map((seed) => {
    if (!seed.burned || seed.burnedLocalDate) return seed;
    const burnedAt = parseBurnedAt(seed.burnedAt);
    if (!burnedAt) return seed;
    changed = true;
    return { ...seed, burnedLocalDate: toLocalDateKey(burnedAt) };
  });
  return { seeds: changed ? next : seeds, changed };
};
