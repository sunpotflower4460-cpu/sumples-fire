import { getAppStorageDriver } from './appStorage';

const SOUND_STORAGE_KEY = 'fire-task-sound-enabled-v1';

export const isFireSoundEnabled = () => {
  const driver = getAppStorageDriver();
  if (!driver) return true;
  try {
    return driver.getItem(SOUND_STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
};

export const setFireSoundEnabled = (enabled: boolean) => {
  const driver = getAppStorageDriver();
  if (!driver) return;
  try {
    driver.setItem(SOUND_STORAGE_KEY, String(enabled));
  } catch {
    // ignore
  }
};
