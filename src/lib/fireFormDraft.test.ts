import { afterEach, describe, expect, it } from 'vitest';
import {
  clearFireFormDraft,
  FIRE_FORM_DRAFT_KEY,
  loadFireFormDraft,
  saveFireFormDraft,
} from './fireFormDraft';

const originalWindow = globalThis.window;

const createStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
    key: (index: number) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    },
  } satisfies Storage;
};

afterEach(() => {
  if (originalWindow === undefined) {
    // @ts-expect-error test cleanup for optional window
    delete globalThis.window;
    return;
  }
  Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true });
});

describe('fireFormDraft', () => {
  it('restores a meaningful draft from session storage', () => {
    const sessionStorage = createStorage();
    Object.defineProperty(globalThis, 'window', { value: { sessionStorage }, configurable: true });

    saveFireFormDraft({
      title: '返信する',
      body: '短く返す',
      nextAction: '宛先を開く',
      category: 'task',
      difficulty: 'heavy',
      urgency: 'low',
      importance: 'high',
      hasAdjustedTuning: true,
    });

    expect(loadFireFormDraft()).toEqual({
      title: '返信する',
      body: '短く返す',
      nextAction: '宛先を開く',
      category: 'task',
      difficulty: 'heavy',
      urgency: 'low',
      importance: 'high',
      hasAdjustedTuning: true,
    });
  });

  it('does not leave an empty default draft behind', () => {
    const sessionStorage = createStorage();
    sessionStorage.setItem(FIRE_FORM_DRAFT_KEY, 'stale');
    Object.defineProperty(globalThis, 'window', { value: { sessionStorage }, configurable: true });

    saveFireFormDraft({
      title: '',
      body: '',
      nextAction: '',
      category: 'task',
      difficulty: 'normal',
      urgency: 'high',
      importance: 'high',
      hasAdjustedTuning: false,
    });

    expect(sessionStorage.getItem(FIRE_FORM_DRAFT_KEY)).toBeNull();
  });

  it('normalizes malformed draft values and tolerates invalid JSON', () => {
    const sessionStorage = createStorage();
    Object.defineProperty(globalThis, 'window', { value: { sessionStorage }, configurable: true });
    sessionStorage.setItem(FIRE_FORM_DRAFT_KEY, JSON.stringify({ category: 'bad', difficulty: 'bad', urgency: 'bad' }));

    expect(loadFireFormDraft()).toMatchObject({
      category: 'task',
      difficulty: 'normal',
      urgency: 'high',
      importance: 'high',
    });

    sessionStorage.setItem(FIRE_FORM_DRAFT_KEY, '{');
    expect(loadFireFormDraft().title).toBe('');
  });

  it('clears the stored draft explicitly after successful capture', () => {
    const sessionStorage = createStorage();
    sessionStorage.setItem(FIRE_FORM_DRAFT_KEY, JSON.stringify({ title: 'draft' }));
    Object.defineProperty(globalThis, 'window', { value: { sessionStorage }, configurable: true });

    clearFireFormDraft();
    expect(sessionStorage.getItem(FIRE_FORM_DRAFT_KEY)).toBeNull();
  });
});
