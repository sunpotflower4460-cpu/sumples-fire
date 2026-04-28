export type FireCategory = 'idea' | 'task' | 'music' | 'life' | 'other';

export type FirePriority = 'low' | 'medium' | 'high';

export type FireStage = 'spark' | 'kindling' | 'flame';

export type FireDifficulty = 'small' | 'normal' | 'heavy' | 'boss';

export type FireLevel = 'low' | 'high';

export type FireMatrixQuadrant = 'doNow' | 'schedule' | 'quickBurn' | 'backlog';

export type FireFilter = 'all' | 'active' | 'burned' | 'today';

export type FireSeed = {
  id: string;
  title: string;
  body: string;
  nextAction: string;
  category: FireCategory;
  priority: FirePriority;
  stage: FireStage;
  difficulty: FireDifficulty;
  urgency: FireLevel;
  importance: FireLevel;
  quadrant: FireMatrixQuadrant;
  ashPoints: number;
  burned: boolean;
  burnedAt?: string;
  isBurning?: boolean;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export const categoryLabels: Record<FireCategory, string> = {
  idea: 'アイデア',
  task: 'やること',
  music: '音楽',
  life: '暮らし',
  other: 'その他',
};

export const priorityLabels: Record<FirePriority, string> = {
  low: 'いつか',
  medium: '大事',
  high: '今日やる',
};

export const stageLabels: Record<FireStage, string> = {
  spark: '未燃焼',
  kindling: '準備中',
  flame: '燃焼済み',
};

export const stageDescriptions: Record<FireStage, string> = {
  spark: 'まだ燃やしていないタスクです。',
  kindling: '取りかかっている途中のタスクです。',
  flame: '完了してFireしたタスクです。',
};

export const difficultyLabels: Record<FireDifficulty, string> = {
  small: '軽い',
  normal: '普通',
  heavy: '重い',
  boss: 'ラスボス',
};

export const difficultyAshPoints: Record<FireDifficulty, number> = {
  small: 3,
  normal: 5,
  heavy: 10,
  boss: 20,
};

export const levelLabels: Record<FireLevel, string> = {
  low: '低',
  high: '高',
};

export const quadrantLabels: Record<FireMatrixQuadrant, string> = {
  doNow: '今すぐ燃やす',
  schedule: '大事に進める',
  quickBurn: 'すぐ片付ける',
  backlog: 'あとで燃やす',
};

export const quadrantDescriptions: Record<FireMatrixQuadrant, string> = {
  doNow: '緊急度も重要度も高い、最優先でFireしたいタスクです。',
  schedule: '重要だけど急ぎすぎなくていい、時間を取って進めるタスクです。',
  quickBurn: '緊急だけど軽め。短時間で片付けてFireする候補です。',
  backlog: '今すぐでなくていいタスク。余力がある時に燃やします。',
};
