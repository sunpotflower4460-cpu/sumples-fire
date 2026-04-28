export type FireCategory = 'idea' | 'task' | 'music' | 'life' | 'other';

export type FirePriority = 'low' | 'medium' | 'high';

export type FireStage = 'spark' | 'kindling' | 'flame';

export type FireDifficulty = 'small' | 'normal' | 'heavy' | 'boss';

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
  ashPoints: number;
  burned: boolean;
  burnedAt?: string;
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
