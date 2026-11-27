import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { BurnSpectacle } from '../lib/fireBurnSpectacle';
import { isPlusBurnSpectacle, spectacles } from '../lib/fireBurnSpectacle';
import { PARTICLE_BURST_DURATION_S } from '../lib/fireAnimationConstants';
import {
  difficultyVariants,
  phaseLabelVariants,
  rewardVariants,
  specialVariantConfigs,
  spectacleBurstVariants,
  titleVariants,
} from '../lib/specialVariants';
import type { FireSeed } from '../types/fireSeed';
import { useBurnSequence, useFireParticles } from '../hooks/useBurnSequence';
import { jp } from '../lib/japanesePhraseWrap';
import { CombustionFlame } from './CombustionFlame';
import { FlameArtwork } from './FlameArtwork';
import { flameIllustrations } from './flameIllustrations';
import { releaseKeyframes, releaseMarks } from '../lib/flameRelease';

type BurningRitualProps = {
  seed: FireSeed;
  spectacle?: BurnSpectacle;
  /**
   * "試し見" (Fire Task Plus): plays the same visuals for a sample sheet of
   * paper. It never shows a reward and is never connected to a real task.
   */
  preview?: boolean;
};

const phaseLabels: Record<string, string> = {
  ignite:      '着火',
  burning:     '燃焼',
  carbonizing: '収束',
  complete:    '解放',
};

export function BurningRitual({ seed, spectacle = spectacles.normal, preview = false }: BurningRitualProps) {
  const { phase, scope, triggerBurn, shouldReduceMotion } = useBurnSequence();

  const type = spectacle.type;
  const signature = isPlusBurnSpectacle(type);
  const variantConfig = signature
    ? { titleGlow: `drop-shadow(0 0 24px ${spectacle.bgGlowColor})`, particleCount: 16, burstScale: 1.25 }
    : specialVariantConfigs[type];
  const isSpecial = spectacle.isSpecial;

  const { flight, mark } = flameIllustrations[type];
  const { particles, burst } = useFireParticles(
    preview ? Math.min(8, variantConfig.particleCount) : variantConfig.particleCount,
  );

  // Start the burn sequence as soon as the overlay mounts.
  useEffect(() => {
    void triggerBurn();
    // triggerBurn is stable after mount (useCallback with no runtime-changing deps)
  }, [triggerBurn]);

  // Burst JS particles at the complete phase for all spectacle types.
  useEffect(() => {
    if (phase === 'complete' && !shouldReduceMotion) {
      burst();
    }
  }, [phase, shouldReduceMotion, burst]);

  const flameStyle = {
    '--flame-c':         spectacle.flameColorC,
    '--bg-glow':         spectacle.bgGlowColor,
    '--particle':        spectacle.particleColor,
    '--particle-shadow': spectacle.particleShadow,
  } as React.CSSProperties;

  const overlay = (
    <motion.div
      ref={scope}
      className={[
        'burning-ritual',
        `ritual-phase-${phase}`,
        `spectacle-${spectacle.type}`,
        isSpecial ? 'is-special' : '',
        signature ? 'is-signature' : '',
        preview ? 'is-preview' : '',
      ].join(' ').trim()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={flameStyle}
    >
      {preview ? (
        <span className="ritual-live-copy">{spectacle.label}の試し見です。タスクや炭の記録は変わりません。</span>
      ) : (
        <span className="ritual-live-copy">「{seed.title}」を燃やしています。</span>
      )}
      <div className="ritual-bg" aria-hidden="true" />
      <div className="ritual-artwork" aria-hidden="true">
        <CombustionFlame flame={type} size={320} motion="burn" />
        {!shouldReduceMotion && (
          <div className="ritual-cinders"><i /><i /><i /><i /></div>
        )}
        {particles.length > 0 ? (
          <svg className="ritual-release" viewBox="0 0 96 96" focusable="false" aria-hidden="true">
            <g transform="translate(48 76)">
              {particles.map((p) => (
                <motion.path
                  key={p.id}
                  d={releaseMarks[mark]}
                  fill={p.id % 3 === 0 ? spectacle.flameColorB : spectacle.particleColor}
                  initial={{ opacity: 0 }}
                  animate={{
                    ...releaseKeyframes(flight, p, variantConfig.burstScale),
                    opacity: [0, 1, .85, 0],
                    scale: [.14, .24 + p.size * .055, .12],
                  }}
                  transition={{
                    duration: PARTICLE_BURST_DURATION_S,
                    delay: p.delay / 1000,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </g>
          </svg>
        ) : null}
        {!shouldReduceMotion && phase === 'complete' && !preview && (
          <motion.div className="ritual-coal-glow" variants={spectacleBurstVariants}
            initial="hidden" animate="visible" />
        )}
      </div>
      {/* ── Central stage is visual-only; the concise live copy above owns announcements. ── */}
      <div className="ritual-stage" aria-hidden="true">
        {isSpecial ? (
          <div className="ritual-spectacle-label">
            <span className="spectacle-rarity-badge">
              {signature ? 'Plus'
                : spectacle.rarity === 'legendary'
                ? '✦ 伝説 ✦'
                : spectacle.rarity === 'rare'
                  ? '✦ レア ✦'
                  : '✦ 特別 ✦'}
            </span>
            <span className="spectacle-type-name">
              <FlameArtwork spectacle={spectacle} size={21} motion="glimpse" />{spectacle.label}
            </span>
          </div>
        ) : null}

        {/* Phase label — animates in/out on each phase change */}
        <AnimatePresence mode="wait">
          <motion.p
            key={phase}
            className="ritual-phase-label"
            variants={phaseLabelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {phaseLabels[phase] ?? phase}
          </motion.p>
        </AnimatePresence>

        <div className="ritual-title-wrapper">
          <motion.h2
            className="ritual-title"
            initial="ignite"
            animate={phase}
            variants={titleVariants}
            style={{ filter: variantConfig.titleGlow }}
          >
            {jp(seed.title)}
          </motion.h2>
        </div>

        {/* Reward badge (complete phase) or flavour text (other phases) */}
        <AnimatePresence mode="wait">
          {phase === 'complete' ? (
            <motion.div
              key="reward"
              className="ritual-reward"
              variants={rewardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {preview ? (
                <div className="ritual-ash-badge is-preview-badge">
                  <span className="ritual-ash-unit">試し見</span>
                </div>
              ) : (
                <div className="ritual-ash-badge">
                  <span className="ritual-ash-points">+{seed.ashPoints}</span>
                  <span className="ritual-ash-unit">炭</span>
                </div>
              )}
              <p className="ritual-ash-message">
                {preview ? jp('試し見では、タスクや炭の記録は変わりません。') : jp(spectacle.message)}
              </p>
            </motion.div>
          ) : (
            <motion.p
              key="difficulty"
              className="ritual-difficulty"
              variants={difficultyVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {phase === 'ignite'
                ? `${spectacle.label}が宿る…`
                : phase === 'carbonizing' ? '火が静かに収まっていく' : `${spectacle.label}で燃焼中`}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

    </motion.div>
  );

  // The sample stays in its dialog so the catalog remains reachable.
  if (preview) return overlay;
  // A real Fire takes over the screen.
  if (typeof document === 'undefined') return null;
  return createPortal(overlay, document.body);
}
