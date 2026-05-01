export const STREAK_STORAGE_KEY = 'sumples-fire-streak-v1';

export type FireStreakData = {
  currentStreak: number;
  lastBurnDate: string | null;
  longestStreak: number;
};

export type FireStreakState = 'cold' | 'warm' | 'momentum' | 'blazing';

const getLocalDateString = (date = new Date()): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const defaultStreak = (): FireStreakData => ({
  currentStreak: 0,
  lastBurnDate: null,
  longestStreak: 0,
});

export const loadFireStreak = (): FireStreakData => {
  if (typeof window === 'undefined') return defaultStreak();
  try {
    const raw = window.localStorage.getItem(STREAK_STORAGE_KEY);
    if (!raw) return defaultStreak();
    return JSON.parse(raw) as FireStreakData;
  } catch {
    return defaultStreak();
  }
};

export const saveFireStreak = (data: FireStreakData): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
};

export const recordBurnForStreak = (streakData: FireStreakData): FireStreakData => {
  const today = getLocalDateString();
  const yesterday = getLocalDateString(new Date(Date.now() - 86_400_000));

  if (streakData.lastBurnDate === today) {
    return streakData;
  }

  const isConsecutive = streakData.lastBurnDate === yesterday;
  const newStreak = isConsecutive ? streakData.currentStreak + 1 : 1;
  const newLongest = Math.max(streakData.longestStreak, newStreak);

  return {
    currentStreak: newStreak,
    lastBurnDate: today,
    longestStreak: newLongest,
  };
};

export const getStreakState = (streak: number): FireStreakState => {
  if (streak >= 14) return 'blazing';
  if (streak >= 7) return 'momentum';
  if (streak >= 3) return 'warm';
  return 'cold';
};

export const getStreakBonus = (streak: number): number =>
  Math.min(streak * 0.5, 8);

export const getCampfireStage = (ashPoints: number): 0 | 1 | 2 | 3 | 4 | 5 => {
  if (ashPoints >= 500) return 5;
  if (ashPoints >= 250) return 4;
  if (ashPoints >= 120) return 3;
  if (ashPoints >= 50) return 2;
  if (ashPoints >= 15) return 1;
  return 0;
};

export const getCampfireStageLabel = (stage: 0 | 1 | 2 | 3 | 4 | 5): string =>
  [
    '小さな火花',
    '小さな炎',
    '暖かい焚き火',
    '大きな焚き火',
    '燃え盛る炎',
    '永遠の業火',
  ][stage];

export const getCampfireNextThreshold = (ashPoints: number): number | null => {
  const thresholds = [15, 50, 120, 250, 500];
  return thresholds.find((t) => t > ashPoints) ?? null;
};

const cravingCopies = [
  '今日の火はまだ小さい…',
  '火が、呼んでいる。',
  '薪が待っている。',
  '炎は消えていない。',
  '燃やす前に、立ち止まるな。',
  'あの火を、また見たくないか？',
  '今日の自分を、燃やして証明しろ。',
  '焚き火は静かに待っている。',
  '炎の声に、耳を傾けろ。',
  '昨日の灰の上に、今日の火を。',
  '一つだけ、燃やせばいい。',
  '小さくていい。火を灯せ。',
  '今日も、焚き火の番をしよう。',
  '未燃焼のタスクが、くすぶっている。',
];

export const getDailyCravingCopy = (): string => {
  const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();
  const dayOfYear = Math.floor((Date.now() - yearStart) / 86_400_000);
  return cravingCopies[dayOfYear % cravingCopies.length];
};
