const SOUND_STORAGE_KEY = 'fire-task-sound-enabled-v1';

const getStorage = () => {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
};

export const isFireSoundEnabled = () => {
  const storage = getStorage();
  if (!storage) return true;
  try {
    return storage.getItem(SOUND_STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
};

export const setFireSoundEnabled = (enabled: boolean) => {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(SOUND_STORAGE_KEY, String(enabled));
  } catch {
    // ignore
  }
};
