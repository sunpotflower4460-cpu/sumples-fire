import { useEffect, useRef, useState } from 'react';
import { MILESTONE_DURATION_MS } from '../lib/motionTokens';

/**
 * Flag the moment a tracked value crosses upward, then clear itself.
 *
 * Rank ups, campfire stage ups and streak extensions all want the same shape:
 * stay quiet while the number holds, celebrate once when it grows, and never
 * celebrate on first paint (which would fire on every app launch).
 */
export function useMilestone(value: number, durationMs = MILESTONE_DURATION_MS) {
  const previousRef = useRef<number | null>(null);
  const [isCelebrating, setIsCelebrating] = useState(false);

  useEffect(() => {
    const previous = previousRef.current;
    previousRef.current = value;

    if (previous === null || value <= previous) return;

    setIsCelebrating(true);
    const timer = window.setTimeout(() => setIsCelebrating(false), durationMs);
    return () => window.clearTimeout(timer);
  }, [value, durationMs]);

  return isCelebrating;
}
