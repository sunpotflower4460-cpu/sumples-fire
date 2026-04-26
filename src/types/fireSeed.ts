export type FireCategory = 'idea' | 'task' | 'music' | 'life' | 'other';

export type FirePriority = 'low' | 'medium' | 'high';

export type FireFilter = 'all' | 'active' | 'completed' | 'high';

export type FireSeed = {
  id: string;
  title: string;
  body: string;
  category: FireCategory;
  priority: FirePriority;
  completed: boolean;
  createdAt: string;
};

export const categoryLabels: Record<FireCategory, string> = {
  idea: 'アイデア',
  task: 'タスク',
  music: '音楽',
  life: '暮らし',
  other: 'その他',
};

export const priorityLabels: Record<FirePriority, string> = {
  low: '小さな火種',
  medium: '育てたい火種',
  high: '今すぐ燃やしたい',
};
