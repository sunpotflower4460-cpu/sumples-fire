import { useEffect, useState } from 'react';
import type { BurnSpectacle } from '../lib/fireBurnSpectacle';
import { spectacles } from '../lib/fireBurnSpectacle';
import type { FireSeed } from '../types/fireSeed';

type BurningPhase = 'ignition' | 'burning' | 'ash';

const phaseLabels: Record<BurningPhase, string> = {
  ignition: '着火',
  burning: '燃焼中',
  ash: '炭化完了',
};

type BurningRitualProps = {
  seed: FireSeed;
  spectacle?: BurnSpectacle;
};

export function BurningRitual({ seed, spectacle = spectacles.normal }: BurningRitualProps) {
  const [phase, setPhase] = useState<BurningPhase>('ignition');

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase('burning'), 350);
    const t2 = window.setTimeout(() => setPhase('ash'), 1100);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  const flameStyle = {
    '--flame-a': spectacle.flameColorA,
    '--flame-b': spectacle.flameColorB,
    '--flame-c': spectacle.flameColorC,
    '--bg-glow': spectacle.bgGlowColor,
    '--particle': spectacle.particleColor,
    '--particle-shadow': spectacle.particleShadow,
  } as React.CSSProperties;

  const isSpecial = spectacle.isSpecial;

  return (
    <div
      className={`burning-ritual ritual-phase-${phase} spectacle-${spectacle.type} ${isSpecial ? 'is-special' : ''}`}
      role="status"
      aria-live="assertive"
      aria-label="タスクを燃やしています"
      style={flameStyle}
    >
      <div className="ritual-bg" aria-hidden="true" />

      <div className="ritual-embers" aria-hidden="true">
        <i /><i /><i /><i /><i />
        <i /><i /><i /><i /><i />
        <i /><i /><i /><i /><i />
        <i /><i /><i /><i /><i />
      </div>

      {isSpecial ? (
        <div className="ritual-spectacle-burst" aria-hidden="true">
          <i /><i /><i /><i /><i /><i /><i /><i />
        </div>
      ) : null}

      <div className="ritual-stage">
        {isSpecial ? (
          <div className="ritual-spectacle-label">
            <span className="spectacle-rarity-badge">{spectacle.rarity === 'legendary' ? '✦ 伝説 ✦' : spectacle.rarity === 'rare' ? '✦ レア ✦' : '✦ 特別 ✦'}</span>
            <span className="spectacle-type-name">{spectacle.label}</span>
          </div>
        ) : null}

        <p className="ritual-phase-label">{phaseLabels[phase]}</p>
        <h2 className="ritual-title">{seed.title}</h2>

        {phase === 'ash' ? (
          <div className="ritual-reward">
            <div className="ritual-ash-badge">
              <span className="ritual-ash-points">+{seed.ashPoints}</span>
              <span className="ritual-ash-unit">炭</span>
            </div>
            <p className="ritual-ash-message">{spectacle.message}</p>
          </div>
        ) : (
          <p className="ritual-difficulty">{phase === 'ignition' ? `${spectacle.label}が宿る…` : `${spectacle.label}で燃焼中`}</p>
        )}
      </div>

      <div className="ritual-flames" aria-hidden="true">
        <i /><i /><i /><i /><i /><i />
        <i /><i /><i /><i /><i /><i />
      </div>
    </div>
  );
}

