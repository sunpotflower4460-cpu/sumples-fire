import { useEffect, useState } from 'react';
import type { FireDifficulty, FireSeed } from '../types/fireSeed';
import { difficultyLabels } from '../types/fireSeed';

type BurningPhase = 'ignition' | 'burning' | 'ash';

const burnMessages: Record<FireDifficulty, string> = {
  small: '小さく燃えた。いい一歩。',
  normal: 'よく燃えた。前に進んだ。',
  heavy: '重いタスクを燃やした。強い。',
  boss: 'ラスボス撃破。これは大きい。',
};

const phaseLabels: Record<BurningPhase, string> = {
  ignition: '着火',
  burning: '燃焼中',
  ash: '炭化完了',
};

type BurningRitualProps = {
  seed: FireSeed;
};

export function BurningRitual({ seed }: BurningRitualProps) {
  const [phase, setPhase] = useState<BurningPhase>('ignition');

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase('burning'), 350);
    const t2 = window.setTimeout(() => setPhase('ash'), 1100);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  return (
    <div
      className={`burning-ritual ritual-phase-${phase}`}
      role="status"
      aria-live="assertive"
      aria-label="タスクを燃やしています"
    >
      <div className="ritual-bg" aria-hidden="true" />

      <div className="ritual-embers" aria-hidden="true">
        <i /><i /><i /><i /><i />
        <i /><i /><i /><i /><i />
        <i /><i /><i /><i /><i />
        <i /><i /><i /><i /><i />
      </div>

      <div className="ritual-stage">
        <p className="ritual-phase-label">{phaseLabels[phase]}</p>
        <h2 className="ritual-title">{seed.title}</h2>

        {phase === 'ash' ? (
          <div className="ritual-reward">
            <div className="ritual-ash-badge">
              <span className="ritual-ash-points">+{seed.ashPoints}</span>
              <span className="ritual-ash-unit">炭</span>
            </div>
            <p className="ritual-ash-message">{burnMessages[seed.difficulty]}</p>
          </div>
        ) : (
          <p className="ritual-difficulty">{difficultyLabels[seed.difficulty]}タスク</p>
        )}
      </div>

      <div className="ritual-flames" aria-hidden="true">
        <i /><i /><i /><i /><i /><i />
        <i /><i /><i /><i /><i /><i />
      </div>
    </div>
  );
}
