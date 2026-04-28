export type FireCategory = 'idea' | 'task' | 'music' | 'life' | 'other';

export type FirePriority = 'low' | 'medium' | 'high';

export type FireStage = 'spark' | 'kindling' | 'flame';

export type FireFilter = 'all' | 'active' | 'completed' | 'high';

export type FireSeed = {
  id: string;
  title: string;
  body: string;
  nextAction: string;
  category: FireCategory;
  priority: FirePriority;
  stage: FireStage;
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
  spark: 'メモ',
  kindling: '進行中',
  flame: '完了',
};

export const stageDescriptions: Record<FireStage, string> = {
  spark: 'まずは忘れないように残した状態です。',
  kindling: '少しずつ形にしている途中です。',
  flame: '行動や作品につながった状態です。',
};
