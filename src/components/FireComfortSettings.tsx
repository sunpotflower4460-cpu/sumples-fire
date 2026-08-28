import { useEffect, useState } from 'react';
import { warmUpFireSound } from '../lib/fireSoundEngine';
import { isFireSoundEnabled, setFireSoundEnabled } from '../lib/fireSoundSettings';

type FireComfortSettingsProps = {
  totalTasks: number;
};

function SoundGlyph({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 10v4h3l4 3V7l-4 3H5Z" />
      {muted ? (
        <>
          <path d="m16 10 4 4" />
          <path d="m20 10-4 4" />
        </>
      ) : (
        <>
          <path d="M15.5 9.3a4 4 0 0 1 0 5.4" />
          <path d="M18 6.8a7.2 7.2 0 0 1 0 10.4" />
        </>
      )}
    </svg>
  );
}

export function FireComfortSettings({ totalTasks }: FireComfortSettingsProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    setSoundEnabled(isFireSoundEnabled());
  }, []);

  const handleToggleSound = () => {
    const nextEnabled = !soundEnabled;
    setSoundEnabled(nextEnabled);
    setFireSoundEnabled(nextEnabled);
    if (nextEnabled) {
      void warmUpFireSound();
    }
  };

  return (
    <article className="comfort-settings-card">
      <div className="comfort-setting-copy">
        <span>Fireサウンド</span>
        <p>燃焼演出の音を切り替えます。設定はこの端末に保存されます。</p>
      </div>
      <button
        className={soundEnabled ? 'sound-pill is-on' : 'sound-pill'}
        type="button"
        role="switch"
        aria-checked={soundEnabled}
        onClick={handleToggleSound}
        aria-label={soundEnabled ? 'Fireサウンドをオフにする' : 'Fireサウンドをオンにする'}
      >
        <i className="sound-pill-icon" aria-hidden="true"><SoundGlyph muted={!soundEnabled} /></i>
        {soundEnabled ? 'オン' : 'オフ'}
      </button>
      <div className="storage-note">
        <b>端末内保存</b>
        <small>{totalTasks}件のタスクを保存しています</small>
      </div>
    </article>
  );
}
