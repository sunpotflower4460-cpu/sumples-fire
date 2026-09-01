import { useEffect, useRef, useState } from 'react';
import { COUNT_UP_DURATION_MS } from '../lib/motionTokens';

const easeOut = (progress: number) => 1 - (1 - progress) ** 3;

/**
 * Roll a number up to its new value instead of snapping.
 *
 * The first value is shown immediately — a freshly opened archive should not
 * animate from zero every launch — and reduced-motion users always get the
 * final number straight away.
 */
export function useCountUp(value: number, durationMs = COUNT_UP_DURATION_MS) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousRef = useRef(value);

  useEffect(() => {
    const from = previousRef.current;
    previousRef.current = value;

    if (from === value) return;

    const reduceMotion = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

    if (reduceMotion || typeof window === 'undefined') {
      setDisplayValue(value);
      return;
    }

    let frame = 0;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      setDisplayValue(Math.round(from + (value - from) * easeOut(progress)));
      if (progress < 1) frame = window.requestAnimationFrame(step);
    };

    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return displayValue;
}
