import { useCallback, useRef } from 'react';
import { TILT_LIFT_PX, computePointerTilt } from '../lib/motionTokens';

const matches = (query: string) => (
  typeof window !== 'undefined' && window.matchMedia?.(query).matches === true
);

const supportsHoverTilt = () => matches('(hover: hover) and (pointer: fine)');
const prefersReducedMotion = () => matches('(prefers-reduced-motion: reduce)');

const TILT_PROPERTIES = ['--tilt-x', '--tilt-y', '--tilt-lift', '--glare-x', '--glare-y'];

/**
 * Track the pointer across an element and publish its tilt as CSS variables.
 *
 * Everything is written straight to the node inside a single rAF callback — no
 * React state — so a card can follow the cursor without re-rendering the list
 * it belongs to. Touch and reduced-motion users never get a listener at all.
 *
 * This is a callback ref rather than an effect because the surfaces that want a
 * tilt (today's focus card, queue cards) appear and disappear with the data;
 * an effect would only ever see whichever node existed on first render.
 */
export function usePointerTilt<T extends HTMLElement>() {
  const detachRef = useRef<(() => void) | null>(null);

  return useCallback((node: T | null) => {
    detachRef.current?.();
    detachRef.current = null;

    if (!node) return;
    if (!supportsHoverTilt() || prefersReducedMotion()) return;

    let frame = 0;
    let pending: { x: number; y: number } | null = null;

    const applyTilt = () => {
      frame = 0;
      const point = pending;
      if (!point) return;

      const rect = node.getBoundingClientRect();
      const tilt = computePointerTilt(point.x - rect.left, point.y - rect.top, rect.width, rect.height);

      node.style.setProperty('--tilt-x', `${tilt.rotateX}deg`);
      node.style.setProperty('--tilt-y', `${tilt.rotateY}deg`);
      node.style.setProperty('--tilt-lift', `${TILT_LIFT_PX}px`);
      node.style.setProperty('--glare-x', `${tilt.glareX}%`);
      node.style.setProperty('--glare-y', `${tilt.glareY}%`);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      pending = { x: event.clientX, y: event.clientY };
      node.classList.add('is-tilting');
      if (frame) return;
      frame = window.requestAnimationFrame(applyTilt);
    };

    const resetTilt = () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
      pending = null;
      node.classList.remove('is-tilting');
      TILT_PROPERTIES.forEach((property) => node.style.removeProperty(property));
    };

    node.addEventListener('pointermove', handlePointerMove);
    node.addEventListener('pointerleave', resetTilt);
    node.addEventListener('pointercancel', resetTilt);
    node.addEventListener('pointerdown', resetTilt);

    detachRef.current = () => {
      node.removeEventListener('pointermove', handlePointerMove);
      node.removeEventListener('pointerleave', resetTilt);
      node.removeEventListener('pointercancel', resetTilt);
      node.removeEventListener('pointerdown', resetTilt);
      resetTilt();
    };
  }, []);
}
