import type { Variants } from 'framer-motion';
import {
  SCREEN_ENTER_DURATION,
  SCREEN_EXIT_DURATION,
  SHELL_EASE,
  SHELL_EXIT_EASE,
  TOAST_ENTER_DURATION,
  TOAST_EXIT_DURATION,
} from './motionTokens';

/**
 * Screen transition variants.
 *
 * `depth` is the signed distance between the outgoing and incoming tab in the
 * bottom navigation, so moving right pushes the old screen left and vice versa.
 * The incoming screen also starts slightly closer to the viewer, which reads as
 * a card being brought forward rather than a plain cross-fade.
 */
export const screenVariants: Variants = {
  enter: (depth: number) => ({
    opacity: 0,
    scale: 1.015,
    y: 10,
    x: depth * 12,
  }),
  center: {
    opacity: 1,
    scale: 1,
    y: 0,
    x: 0,
    pointerEvents: 'auto',
    transition: { duration: SCREEN_ENTER_DURATION, ease: SHELL_EASE },
  },
  exit: (depth: number) => ({
    opacity: 0,
    scale: 0.985,
    y: -6,
    x: depth * -10,
    pointerEvents: 'none',
    transition: { duration: SCREEN_EXIT_DURATION, ease: SHELL_EXIT_EASE },
  }),
};

/** Toasts drop in from above with a slight tilt, then leave straight up. */
export const toastVariants: Variants = {
  hidden: { opacity: 0, y: -18, scale: 0.94, rotateX: -14, transformPerspective: 800 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transformPerspective: 800,
    transition: { duration: TOAST_ENTER_DURATION, ease: SHELL_EASE },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.96,
    rotateX: -8,
    transformPerspective: 800,
    transition: { duration: TOAST_EXIT_DURATION, ease: SHELL_EXIT_EASE },
  },
};
