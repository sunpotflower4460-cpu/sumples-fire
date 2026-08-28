import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Fire ritual feedback contracts', () => {
  const ritualSource = readFileSync(resolve(__dirname, 'components/BurningRitual.tsx'), 'utf-8');
  const sequenceSource = readFileSync(resolve(__dirname, 'hooks/useBurnSequence.ts'), 'utf-8');
  const variantsSource = readFileSync(resolve(__dirname, 'lib/specialVariants.ts'), 'utf-8');
  const mainSource = readFileSync(resolve(__dirname, 'main.tsx'), 'utf-8');

  it('announces Fire state politely through one concise semantic channel', () => {
    expect(ritualSource).toContain('aria-live="polite"');
    expect(ritualSource).toContain('aria-atomic="true"');
    expect(ritualSource).toContain('className="ritual-live-copy"');
    expect(ritualSource).toContain('className="ritual-stage" aria-hidden="true"');
    expect(ritualSource).not.toContain('aria-live="assertive"');
  });

  it('keeps completion particles inside the reward phase', () => {
    expect(sequenceSource).toContain('Math.random() * PARTICLE_BURST_MAX_DELAY_MS');
    expect(sequenceSource).toContain('PARTICLE_BURST_CLEAR_MS');
    expect(sequenceSource).not.toContain('delay: i * 15');
    expect(ritualSource).toContain('duration: PARTICLE_BURST_DURATION_S');
    expect(ritualSource).not.toContain('0.95 + p.size * 0.05');
  });

  it('keeps the special spectacle burst on the same completion clock', () => {
    expect(variantsSource).toContain('SPECTACLE_BURST_DURATION_S');
    expect(variantsSource).not.toContain('duration: 1.4');
  });

  it('honors reduced-motion preferences across Framer Motion and spectacle effects', () => {
    expect(mainSource).toContain('MotionConfig reducedMotion="user"');
    expect(ritualSource).toContain('isSpecial && !shouldReduceMotion');
    expect(ritualSource).toContain('duration: shouldReduceMotion ? 0 : 0.28');
  });

  it('loads ritual feedback polish before the final accessibility layer', () => {
    expect(mainSource.indexOf("import './ritualFeedbackPolish.css';"))
      .toBeLessThan(mainSource.indexOf("import './accessibilityPolish.css';"));
  });
});
