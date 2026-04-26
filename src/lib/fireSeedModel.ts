import type { FireSeed } from '../types/fireSeed';

export const nowIso = () => new Date().toISOString();

export const createSampleSeeds = (timestamp = nowIso()): FireSeed[] => [
  {
    id: 'sample-1',
    title: '最初の火種を書く',
    body: '小さな思いつきでも、置いておくと未来の自分が拾ってくれる。',
    nextAction: '今日のうちに1行だけ追記する',
    category: 'idea',
    priority: 'medium',
    stage: 'kindling',
    completed: false,
    createdAt: timestamp,
    updatedAt: timestamp,
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
    createdAt: timestamp,
    updatedAt: timestamp,
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
    createdAt: timestamp,
    updatedAt: timestamp,
  },
];

export const normalizeSeed = (seed: Partial<FireSeed>, index: number, timestamp = nowIso()): FireSeed => {
  const createdAt = seed.createdAt ?? timestamp;

  return {
    id: seed.id ?? `imported-${index}-${timestamp}`,
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

export const getFocusSeed = (seeds: FireSeed[]) => {
  const priorityScore = { high: 3, medium: 2, low: 1 };

  return [...seeds]
    .filter((seed) => !seed.completed)
    .sort((a, b) => priorityScore[b.priority] - priorityScore[a.priority])[0];
};

export const getFireSeedStats = (seeds: FireSeed[]) => ({
  total: seeds.length,
  active: seeds.filter((seed) => !seed.completed).length,
  completed: seeds.filter((seed) => seed.completed).length,
  high: seeds.filter((seed) => seed.priority === 'high').length,
  flame: seeds.filter((seed) => seed.stage === 'flame').length,
});
