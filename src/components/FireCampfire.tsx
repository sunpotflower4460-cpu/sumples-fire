import { useCallback, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useMilestone } from '../hooks/useMilestone';
import { FireCanvas } from './FireCanvas';
import { campfireLook } from '../lib/fireIntensity';
import { playCampfirePoke } from '../lib/fireSoundEngine';
import { isFireSoundEnabled } from '../lib/fireSoundSettings';
import type { FireStreakData } from '../lib/fireStreak';
import {
  getCampfireNextThreshold,
  getCampfireStage,
  getCampfireStageLabel,
  getDailyCravingCopy,
  getStreakState,
} from '../lib/fireStreak';
import { jp } from '../lib/japanesePhraseWrap';

type FireCampfireProps = {
  ashPoints: number;
  streakData: FireStreakData;
  hasPendingTasks: boolean;
};

function StreakFlameGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13.5 3c.6 3.2-2.2 4.2-1 6.5.5 1 1.5 1.4 2.3 1.1 1.1-.5 1.4-1.9 1.1-3.4 2.3 1.8 3.6 4 3.6 6.5A7.5 7.5 0 1 1 4.5 14c0-3.4 2-5.9 5.2-8.2-.1 2 .2 3.3 1.1 4 .2-2.6.9-4.7 2.7-6.8Z" />
      <path d="M12 13.2c1.8 1.5 2.7 2.8 2.7 4a2.7 2.7 0 0 1-5.4 0c0-1.2.9-2.5 2.7-4Z" fill="rgba(255,255,255,.5)" />
    </svg>
  );
}

/** Half width of the fuel bed (fraction of the canvas width) per campfire stage. */
const BED_HALF_BY_STAGE = [0.085, 0.095, 0.105, 0.115, 0.125, 0.14] as const;
/** Nominal flame height (fraction of the canvas) per campfire stage — the fire visibly grows. */
const FLAME_HEIGHT_BY_STAGE = [0.46, 0.52, 0.6, 0.68, 0.76, 0.84] as const;

export function FireCampfire({ ashPoints, streakData, hasPendingTasks }: FireCampfireProps) {
  const stage = getCampfireStage(ashPoints);
  const reduceMotion = useReducedMotion() ?? false;
  const [glFire, setGlFire] = useState(true);
  const [pokeKey, setPokeKey] = useState(0);
  const getLook = useCallback(() => campfireLook(stage), [stage]);
  const handlePoke = () => {
    setPokeKey((key) => key + 1);
    if (isFireSoundEnabled()) void playCampfirePoke();
  };
  const stageLabel = getCampfireStageLabel(stage);
  const streakState = getStreakState(streakData.currentStreak);
  const nextThreshold = getCampfireNextThreshold(ashPoints);
  const cravingCopy = getDailyCravingCopy();
  const streakMomentumLabel = streakState === 'blazing'
    ? '業火'
    : streakState === 'momentum'
      ? '勢い'
      : streakState === 'warm'
        ? '加熱中'
        : '';

  const emberCount = [2, 4, 6, 8, 10, 14][stage];
  const isStageUp = useMilestone(stage);
  const isStreakUp = useMilestone(streakData.currentStreak);

  return (
    <section
      className={`fire-campfire campfire-stage-${stage} streak-${streakState} ${hasPendingTasks ? 'has-pending' : ''} ${isStageUp ? 'is-stage-up' : ''} ${glFire ? 'has-gl-fire' : ''}`}
      aria-label="あなたの焚き火"
    >
      <div className="campfire-bg-glow" aria-hidden="true" />

      <div className="campfire-visual" aria-hidden="true">
        <div className="campfire-logs">
          <div className="campfire-log log-left" />
          <div className="campfire-log log-right" />
          <div className="campfire-log log-base" />
        </div>

        <div className="campfire-flames">
          <i className="campfire-flame cf-1" />
          <i className="campfire-flame cf-2" />
          <i className="campfire-flame cf-3" />
          {stage >= 2 ? <i className="campfire-flame cf-4" /> : null}
          {stage >= 3 ? <i className="campfire-flame cf-5" /> : null}
          {stage >= 4 ? <><i className="campfire-flame cf-6" /><i className="campfire-flame cf-7" /></> : null}
          {stage >= 5 ? <><i className="campfire-flame cf-8" /><i className="campfire-flame cf-9" /></> : null}
        </div>

        <div className="campfire-embers">
          {Array.from({ length: emberCount }, (_, index) => (
            <i key={index} className={`campfire-ember ce-${index + 1}`} />
          ))}
        </div>

        {glFire ? (
          <FireCanvas
            className="campfire-fire"
            getLook={getLook}
            height={FLAME_HEIGHT_BY_STAGE[Math.min(5, stage)]}
            base={0.075}
            bedHalf={BED_HALF_BY_STAGE[Math.min(5, stage)]}
            resolution={0.8}
            fps={30}
            still={reduceMotion}
            maxEmbers={48}
            pokeKey={pokeKey}
            onUnsupported={() => setGlFire(false)}
          />
        ) : null}

        {stage >= 3 ? <div className="campfire-outer-glow" /> : null}
      </div>

      <button
        type="button"
        className="campfire-poke"
        onClick={handlePoke}
        aria-label="焚き火をつつく"
      />

      <div className="campfire-info">
        <div className={`campfire-stage-badge ${isStageUp ? 'is-stage-up' : ''}`}>
          <span className="campfire-stage-name">{stageLabel}</span>
          {nextThreshold ? (
            <span className="campfire-next-hint">{jp(`あと ${nextThreshold - ashPoints} 炭で次の段階へ`)}</span>
          ) : (
            <span className="campfire-next-hint">{jp('最高段階に到達')}</span>
          )}
        </div>

        {streakData.currentStreak > 0 ? (
          <div className={`campfire-streak streak-state-${streakState} ${isStreakUp ? 'is-streak-up' : ''}`}>
            <span className="sr-only">
              連続燃焼{streakData.currentStreak}日{streakMomentumLabel ? `、${streakMomentumLabel}` : ''}
            </span>
            <span className="streak-flame-icon" aria-hidden="true"><StreakFlameGlyph /></span>
            <span className="streak-count" aria-hidden="true">{streakData.currentStreak}</span>
            <span className="streak-label" aria-hidden="true">日連続</span>
            {streakState !== 'cold' ? (
              <span className="streak-momentum-badge" aria-hidden="true">
                {streakMomentumLabel}
              </span>
            ) : null}
          </div>
        ) : null}

        {hasPendingTasks ? (
          <p className="campfire-craving-copy">{jp(cravingCopy)}</p>
        ) : (
          <p className="campfire-craving-copy">{jp('今日も、よく燃やした。')}</p>
        )}
      </div>
    </section>
  );
}
