import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { BurnSpectacle } from '../lib/fireBurnSpectacle';
import { spectacles } from '../lib/fireBurnSpectacle';
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

type BurningRitualProps = {
  seed: FireSeed;
  spectacle?: BurnSpectacle;
};

const phaseLabels: Record<string, string> = {
  ignite:      '着火',
  burning:     '燃焼中',
  carbonizing: '炭化中',
  complete:    '炭化完了',
};

export function BurningRitual({ seed, spectacle = spectacles.normal }: BurningRitualProps) {
  const { phase, scope, triggerBurn, shouldReduceMotion } = useBurnSequence();

  const variantConfig = specialVariantConfigs[spectacle.type];
  const isSpecial = spectacle.isSpecial;

  const { particles, burst } = useFireParticles(variantConfig.particleCount);

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
    '--flame-a':         spectacle.flameColorA,
    '--flame-b':         spectacle.flameColorB,
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
      ].join(' ').trim()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      role="status"
      aria-live="assertive"
      aria-label="タスクを燃やしています"
      style={flameStyle}
    >
      {/* ── SVG filter: turbulence displacement applied to the title wrapper ── */}
      <svg
        width="0"
        height="0"
        aria-hidden="true"
        style={{ position: 'absolute', pointerEvents: 'none' }}
      >
        <defs>
          <filter id="fm-fire-distort" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="turbulence"
              baseFrequency="0.025 0.07"
              numOctaves="3"
              seed="2"
              result="noise"
            >
              {!shouldReduceMotion ? (
                <animate
                  attributeName="baseFrequency"
                  values="0.025 0.07;0.045 0.09;0.025 0.07"
                  dur="1.8s"
                  repeatCount="indefinite"
                />
              ) : null}
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="7"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* ── Background glow layer ── */}
      <div className="ritual-bg" aria-hidden="true" />

      {/* ── Ambient ember particles (CSS-driven, lightweight) ── */}
      <div className="ritual-embers" aria-hidden="true">
        <i /><i /><i /><i /><i />
        <i /><i /><i /><i /><i />
        <i /><i /><i /><i /><i />
        <i /><i /><i /><i /><i />
      </div>

      {/* ── Spectacle burst ring (special effects only) ── */}
      {isSpecial ? (
        <AnimatePresence>
          {(phase === 'burning' || phase === 'complete') ? (
            <motion.div
              key="spectacle-burst"
              className="ritual-spectacle-burst"
              aria-hidden="true"
              style={{ '--burst-scale': variantConfig.burstScale } as React.CSSProperties}
              variants={spectacleBurstVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <i /><i /><i /><i /><i /><i /><i /><i />
            </motion.div>
          ) : null}
        </AnimatePresence>
      ) : null}

      {/* ── JS-driven particle burst (complete phase) ── */}
      {particles.length > 0 ? (
        <div
          className="ritual-particle-burst"
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 15 }}
        >
          {particles.map((p) => {
            const rad = (p.angle * Math.PI) / 180;
            const dist = (55 + p.size * 10) * variantConfig.burstScale;
            const dx = Math.sin(rad) * dist;
            const dy = -(Math.abs(Math.cos(rad)) * dist + 30);
            return (
              <motion.div
                key={p.id}
                style={{
                  position: 'absolute',
                  left: `${p.x}%`,
                  bottom: '44%',
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  borderRadius: '50%',
                  background: spectacle.particleColor,
                  boxShadow: `0 0 ${p.size * 2}px ${spectacle.particleShadow}`,
                }}
                initial={{ opacity: 0, x: 0, y: 0, scale: 1 }}
                animate={{
                  opacity: [0, 1, 0.85, 0],
                  x: [0, dx * 0.55, dx],
                  y: [0, dy * 0.55, dy],
                  scale: [1, 1.15, 0.55],
                }}
                transition={{
                  duration: 0.95 + p.size * 0.05,
                  delay: p.delay / 1000,
                  ease: 'easeOut',
                  // fast initial burst (0–40%) then slower fade-out (40–100%)
                  times: [0, 0.4, 1],
                }}
                aria-hidden="true"
              />
            );
          })}
        </div>
      ) : null}

      {/* ── Central stage ── */}
      <div className="ritual-stage">
        {isSpecial ? (
          <div className="ritual-spectacle-label">
            <span className="spectacle-rarity-badge">
              {spectacle.rarity === 'legendary'
                ? '✦ 伝説 ✦'
                : spectacle.rarity === 'rare'
                  ? '✦ レア ✦'
                  : '✦ 特別 ✦'}
            </span>
            <span className="spectacle-type-name">{spectacle.label}</span>
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

        {/* Title — wrapped in a div that carries the SVG displacement filter */}
        <div
          className="ritual-title-wrapper"
          style={
            phase === 'burning' && !shouldReduceMotion
              ? { filter: 'url(#fm-fire-distort)' }
              : undefined
          }
        >
          <motion.h2
            className="ritual-title"
            initial="ignite"
            animate={phase}
            variants={titleVariants}
            style={{ filter: variantConfig.titleGlow }}
          >
            {seed.title}
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
              <div className="ritual-ash-badge">
                <span className="ritual-ash-points">+{seed.ashPoints}</span>
                <span className="ritual-ash-unit">炭</span>
              </div>
              <p className="ritual-ash-message">{spectacle.message}</p>
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
                : `${spectacle.label}で燃焼中`}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── CSS-driven flame row ── */}
      <div className="ritual-flames" aria-hidden="true">
        <i /><i /><i /><i /><i /><i />
        <i /><i /><i /><i /><i /><i />
      </div>
    </motion.div>
  );

  // createPortal renders the overlay above all stacking contexts.
  if (typeof document === 'undefined') return null;
  return createPortal(overlay, document.body);
}

