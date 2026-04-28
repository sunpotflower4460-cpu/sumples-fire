const SOUND_STORAGE_KEY = 'fire-task-sound-enabled-v1';

const getStorage = () => (typeof window === 'undefined' ? undefined : window.localStorage);

export const isFireSoundEnabled = () => {
  const storage = getStorage();
  if (!storage) return true;
  return storage.getItem(SOUND_STORAGE_KEY) !== 'false';
};

export const setFireSoundEnabled = (enabled: boolean) => {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(SOUND_STORAGE_KEY, String(enabled));
};
