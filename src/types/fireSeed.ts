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

export const stageLabels: Record<FireStage, string> = {
  spark: '未着火',
  kindling: '育成中',
  flame: '炎になった',
};

export const stageDescriptions: Record<FireStage, string> = {
  spark: 'まだ小さな断片。まずは消えないように残す段階です。',
  kindling: '少しずつ形にしている途中。次の一歩を決める段階です。',
  flame: '行動や作品に近づいた状態。あとで振り返る価値があります。',
};
