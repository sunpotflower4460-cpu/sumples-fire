import { useEffect, useState } from 'react';
import { isFireSoundEnabled, setFireSoundEnabled } from '../lib/fireSoundSettings';

type FireComfortSettingsProps = {
  totalTasks: number;
};

export function FireComfortSettings({ totalTasks }: FireComfortSettingsProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    setSoundEnabled(isFireSoundEnabled());
  }, []);

  const handleToggleSound = () => {
    const nextEnabled = !soundEnabled;
    setSoundEnabled(nextEnabled);
    setFireSoundEnabled(nextEnabled);
  };

  return (
    <article className="comfort-settings-card">
      <div>
        <span>Fireの気持ちよさ</span>
        <p>音はこの端末に保存されます。静かな場所ではOFFにできます。</p>
      </div>
      <button
        className={soundEnabled ? 'sound-pill is-on' : 'sound-pill'}
        type="button"
        onClick={handleToggleSound}
        aria-pressed={soundEnabled}
        aria-label={soundEnabled ? 'Fireの音をOFFにする' : 'Fireの音をONにする'}
      >
        {soundEnabled ? '🔊 音あり' : '🔇 消音'}
      </button>
      <div className="storage-note">
        <b>保存</b>
        <small>{totalTasks}件のタスクをこの端末に保存中</small>
      </div>
    </article>
  );
}
