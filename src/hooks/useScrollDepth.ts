import { useEffect } from 'react';
import { computeScrollDepth } from '../lib/motionTokens';

/**
 * Publish normalised scroll progress as `--scroll-depth` on the document root.
 *
 * The top bar, the ambient ember layer and the sticky submit dock all read this
 * one variable, so the whole shell reacts to scrolling as a single material
 * instead of each surface installing its own listener.
 */
export function useScrollDepth() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const root = document.documentElement;
    let frame = 0;
    let lastDepth = -1;

    const applyDepth = () => {
      frame = 0;
      const depth = computeScrollDepth(window.scrollY);
      if (depth === lastDepth) return;
      lastDepth = depth;
      root.style.setProperty('--scroll-depth', `${depth}`);
    };

    const handleScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(applyDepth);
    };

    applyDepth();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
      root.style.removeProperty('--scroll-depth');
    };
  }, []);
}
