import { useEffect, useRef } from 'react';
import { computeSheetDragOffset } from '../lib/motionTokens';

/**
 * Make the capture sheet follow the finger while it is being dragged.
 *
 * This is deliberately visual-only: App.tsx already owns the decision of when a
 * downward swipe closes the sheet, so this hook never dismisses anything. It
 * publishes `--sheet-drag` (and an `is-dragging` class) and clears them on
 * release, letting CSS spring the sheet back when the swipe was not committed.
 */
export function useSheetDrag<T extends HTMLElement>(isOpen: boolean) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !isOpen) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const dragZone = node.querySelector<HTMLElement>('.sheet-drag-zone') ?? node;
    let startY: number | null = null;
    let offset = 0;
    let frame = 0;

    const applyOffset = () => {
      frame = 0;
      node.style.setProperty('--sheet-drag', `${offset}px`);
    };

    const releaseDrag = () => {
      startY = null;
      offset = 0;
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
      node.classList.remove('is-dragging');
      node.style.setProperty('--sheet-drag', '0px');
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        releaseDrag();
        return;
      }
      startY = event.touches[0]?.clientY ?? null;
      if (startY !== null) node.classList.add('is-dragging');
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (startY === null) return;
      const touch = event.touches[0];
      if (!touch) return;
      offset = computeSheetDragOffset(touch.clientY - startY);
      if (frame) return;
      frame = window.requestAnimationFrame(applyOffset);
    };

    dragZone.addEventListener('touchstart', handleTouchStart, { passive: true });
    dragZone.addEventListener('touchmove', handleTouchMove, { passive: true });
    dragZone.addEventListener('touchend', releaseDrag);
    dragZone.addEventListener('touchcancel', releaseDrag);

    return () => {
      dragZone.removeEventListener('touchstart', handleTouchStart);
      dragZone.removeEventListener('touchmove', handleTouchMove);
      dragZone.removeEventListener('touchend', releaseDrag);
      dragZone.removeEventListener('touchcancel', releaseDrag);
      releaseDrag();
    };
  }, [isOpen]);

  return ref;
}
