import { getWebStorageDriver } from './webLocalStorageDriver';

export const STREAK_STORAGE_KEY = 'sumples-fire-streak-v1';

export type FireStreakData = {
  currentStreak: number;
  lastBurnDate: string | null;
  longestStreak: number;
};

export type FireStreakState = 'cold' | 'warm' | 'momentum' | 'blazing';

const getLocalDateString = (date = new Date()): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const getPreviousLocalDateString = (date = new Date()): string => {
  const previous = new Date(date);
  previous.setDate(previous.getDate() - 1);
  return getLocalDateString(previous);
};

const defaultStreak = (): FireStreakData => ({
  currentStreak: 0,
  lastBurnDate: null,
  longestStreak: 0,
});

const normalizeStreak = (value: unknown): FireStreakData => {
  if (!value || typeof value !== 'object') return defaultStreak();
  const candidate = value as Partial<FireStreakData>;
  const currentStreakRaw = typeof candidate.currentStreak === 'number' ? candidate.currentStreak : NaN;
  const longestStreakRaw = typeof candidate.longestStreak === 'number' ? candidate.longestStreak : NaN;
  const currentStreak = Number.isFinite(currentStreakRaw) ? Math.max(0, Math.floor(currentStreakRaw)) : 0;
  const longestStreak = Number.isFinite(longestStreakRaw) ? Math.max(0, Math.floor(longestStreakRaw)) : 0;
  const safeLongestStreak = Math.max(longestStreak, currentStreak);
  const lastBurnDate = typeof candidate.lastBurnDate === 'string' ? candidate.lastBurnDate : null;

  return {
    currentStreak,
    longestStreak: safeLongestStreak,
    lastBurnDate,
  };
};

export const getEffectiveFireStreak = (streakData: FireStreakData, date = new Date()): FireStreakData => {
  if (streakData.currentStreak === 0 || !streakData.lastBurnDate) return streakData;

  const today = getLocalDateString(date);
  const yesterday = getPreviousLocalDateString(date);
  if (streakData.lastBurnDate === today || streakData.lastBurnDate === yesterday) return streakData;

  return {
    ...streakData,
    currentStreak: 0,
  };
};

export const loadFireStreak = (): FireStreakData => {
  const driver = getWebStorageDriver();
  if (!driver) return defaultStreak();
  try {
    const raw = driver.getItem(STREAK_STORAGE_KEY);
    if (!raw) return defaultStreak();
    return getEffectiveFireStreak(normalizeStreak(JSON.parse(raw)));
  } catch {
    return defaultStreak();
  }
};

export const saveFireStreak = (data: FireStreakData): void => {
  const driver = getWebStorageDriver();
  if (!driver) return;
  try {
    driver.setItem(STREAK_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
};

export const recordBurnForStreak = (streakData: FireStreakData, date = new Date()): FireStreakData => {
  const effectiveStreak = getEffectiveFireStreak(streakData, date);
  const today = getLocalDateString(date);
  const yesterday = getPreviousLocalDateString(date);

  if (effectiveStreak.lastBurnDate === today) {
    return effectiveStreak;
  }

  const isConsecutive = effectiveStreak.lastBurnDate === yesterday;
  const newStreak = isConsecutive ? effectiveStreak.currentStreak + 1 : 1;
  const newLongest = Math.max(effectiveStreak.longestStreak, newStreak);

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
  'ひとつだけ、終わらせよう。',
  '今できる、小さな一歩から。',
  '軽い薪からでも大丈夫。',
  '急がなくていい。ひとつ選ぼう。',
  '終わらせたいものから、静かに。',
  '2分だけ着手でも十分。',
  '今日の火は、自分のペースで。',
  '焚き火は静かに待っている。',
  'ひとつ片づけば、それで前進。',
  '昨日の灰の上に、今日の小さな火を。',
  '一つだけ、燃やせばいい。',
  '小さくていい。火を灯そう。',
  '余力がある分だけ、進めよう。',
  '未燃焼の中から、今できるものをひとつ。',
];

export const getDailyCravingCopy = (): string => {
  const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();
  const dayOfYear = Math.floor((Date.now() - yearStart) / 86_400_000);
  return cravingCopies[dayOfYear % cravingCopies.length];
};
