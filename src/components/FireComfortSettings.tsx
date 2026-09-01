import { useState } from 'react';
import { playSoundPreview } from '../lib/fireSoundEngine';
import { isFireSoundEnabled, setFireSoundEnabled } from '../lib/fireSoundSettings';

type FireComfortSettingsProps = {
  totalTasks: number;
};

const soundLabelId = 'fire-sound-label';
const soundDescriptionId = 'fire-sound-description';

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
  const [soundEnabled, setSoundEnabled] = useState(isFireSoundEnabled);

  const handleToggleSound = () => {
    const nextEnabled = !soundEnabled;
    setSoundEnabled(nextEnabled);
    setFireSoundEnabled(nextEnabled);
    if (nextEnabled) {
      void playSoundPreview();
    }
  };

  return (
    <div className="comfort-settings-card">
      <div className="comfort-setting-copy">
        <span id={soundLabelId}>Fireサウンド</span>
        <p id={soundDescriptionId}>Fireするときの効果音です。</p>
      </div>
      <button
        className={soundEnabled ? 'sound-pill is-on' : 'sound-pill'}
        type="button"
        role="switch"
        aria-checked={soundEnabled}
        aria-labelledby={soundLabelId}
        aria-describedby={soundDescriptionId}
        onClick={handleToggleSound}
      >
        <i className="sound-pill-icon" aria-hidden="true"><SoundGlyph muted={!soundEnabled} /></i>
        {soundEnabled ? 'オン' : 'オフ'}
      </button>
      {/* Not "端末内保存" here again — Settings > データとプライバシー already
          explains local storage. This is only the live count, so the same fact
          (your tasks stay on this device) is stated once, not twice. */}
      <p className="storage-note">
        <small>現在{totalTasks}件のタスクを保存中</small>
      </p>
    </div>
  );
}
