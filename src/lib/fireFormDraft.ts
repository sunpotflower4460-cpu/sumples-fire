import type { FireCategory, FireDifficulty, FireLevel } from '../types/fireSeed';

export const FIRE_FORM_DRAFT_KEY = 'sumples-fire-form-draft-v1';

export type FireFormDraft = {
  title: string;
  body: string;
  nextAction: string;
  category: FireCategory;
  difficulty: FireDifficulty;
  urgency: FireLevel;
  importance: FireLevel;
  hasAdjustedTuning: boolean;
};

const defaultDraft = (): FireFormDraft => ({
  title: '',
  body: '',
  nextAction: '',
  category: 'task',
  difficulty: 'normal',
  urgency: 'high',
  importance: 'high',
  hasAdjustedTuning: false,
});

const categoryValues: FireCategory[] = ['idea', 'task', 'music', 'life', 'other'];
const difficultyValues: FireDifficulty[] = ['small', 'normal', 'heavy', 'boss'];
const levelValues: FireLevel[] = ['low', 'high'];

const isCategory = (value: unknown): value is FireCategory => categoryValues.includes(value as FireCategory);
const isDifficulty = (value: unknown): value is FireDifficulty => difficultyValues.includes(value as FireDifficulty);
const isLevel = (value: unknown): value is FireLevel => levelValues.includes(value as FireLevel);

const getSessionStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

export const loadFireFormDraft = (): FireFormDraft => {
  const storage = getSessionStorage();
  if (!storage) return defaultDraft();

  try {
    const raw = storage.getItem(FIRE_FORM_DRAFT_KEY);
    if (!raw) return defaultDraft();
    const value = JSON.parse(raw) as Partial<FireFormDraft>;
    return {
      title: typeof value.title === 'string' ? value.title.slice(0, 60) : '',
      body: typeof value.body === 'string' ? value.body.slice(0, 260) : '',
      nextAction: typeof value.nextAction === 'string' ? value.nextAction.slice(0, 90) : '',
      category: isCategory(value.category) ? value.category : 'task',
      difficulty: isDifficulty(value.difficulty) ? value.difficulty : 'normal',
      urgency: isLevel(value.urgency) ? value.urgency : 'high',
      importance: isLevel(value.importance) ? value.importance : 'high',
      hasAdjustedTuning: value.hasAdjustedTuning === true,
    };
  } catch {
    return defaultDraft();
  }
};

const hasMeaningfulDraft = (draft: FireFormDraft) => (
  draft.title.trim().length > 0
  || draft.body.trim().length > 0
  || draft.nextAction.trim().length > 0
  || draft.category !== 'task'
  || draft.difficulty !== 'normal'
  || draft.urgency !== 'high'
  || draft.importance !== 'high'
  || draft.hasAdjustedTuning
);

export const saveFireFormDraft = (draft: FireFormDraft): void => {
  const storage = getSessionStorage();
  if (!storage) return;

  try {
    if (!hasMeaningfulDraft(draft)) {
      storage.removeItem(FIRE_FORM_DRAFT_KEY);
      return;
    }
    storage.setItem(FIRE_FORM_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Draft preservation is best-effort; capture must remain usable if storage is blocked.
  }
};

export const clearFireFormDraft = (): void => {
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    storage.removeItem(FIRE_FORM_DRAFT_KEY);
  } catch {
    // Ignore blocked storage and keep the primary capture flow available.
  }
};
