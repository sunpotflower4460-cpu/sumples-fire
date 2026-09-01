/**
 * Shared motion tokens for the everyday app shell.
 *
 * The burning ritual keeps its own timing contract in `fireAnimationConstants.ts`
 * because those numbers are synchronised with the Web Audio cues. These tokens
 * cover the surfaces around it — screens, cards, sheets, toasts and rewards —
 * so the whole app moves with one vocabulary instead of per-file guesses.
 */

/** Smooth deceleration used by anything entering the screen. */
export const SHELL_EASE = [0.22, 1, 0.36, 1] as const;

/** Quick acceleration used by anything leaving the screen. */
export const SHELL_EXIT_EASE = [0.4, 0, 1, 1] as const;

/** Screen transitions: enter is unhurried, exit gets out of the way fast. */
export const SCREEN_ENTER_DURATION = 0.26;
export const SCREEN_EXIT_DURATION = 0.14;

/** Toast entrance/exit — short enough to never delay a follow-up action. */
export const TOAST_ENTER_DURATION = 0.28;
export const TOAST_EXIT_DURATION = 0.16;

/** Maximum tilt applied by pointer tracking, in degrees per axis. */
export const TILT_MAX_DEGREES = 4.5;

/** How far a tilted surface lifts toward the viewer. */
export const TILT_LIFT_PX = 10;

/** Downward drag on the capture sheet follows the finger at this ratio. */
export const SHEET_DRAG_RESISTANCE = 0.55;

/** Upward drag is much stiffer, so the sheet reads as anchored at the top. */
export const SHEET_DRAG_UP_RESISTANCE = 0.16;

/** Scroll distance over which the top bar finishes condensing. */
export const SCROLL_DEPTH_RANGE_PX = 96;

/** Reward counters roll up over this window. */
export const COUNT_UP_DURATION_MS = 720;

/** How long a milestone celebration stays flagged before it resets. */
export const MILESTONE_DURATION_MS = 1600;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export type PointerTilt = {
  rotateX: number;
  rotateY: number;
  glareX: number;
  glareY: number;
};

/**
 * Map a pointer position inside a box to a tilt and a glare hotspot.
 *
 * Pointer above the centre tips the top of the card away from the viewer, which
 * is what makes a flat rectangle read as a physical card rather than a sticker.
 */
export function computePointerTilt(
  offsetX: number,
  offsetY: number,
  width: number,
  height: number,
): PointerTilt {
  if (width <= 0 || height <= 0) {
    return { rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 };
  }

  const ratioX = clamp01(offsetX / width);
  const ratioY = clamp01(offsetY / height);

  return {
    rotateX: Number(((0.5 - ratioY) * 2 * TILT_MAX_DEGREES).toFixed(2)),
    rotateY: Number(((ratioX - 0.5) * 2 * TILT_MAX_DEGREES).toFixed(2)),
    glareX: Number((ratioX * 100).toFixed(1)),
    glareY: Number((ratioY * 100).toFixed(1)),
  };
}

/** Rubber-band the raw drag distance so the sheet resists instead of sliding. */
export function computeSheetDragOffset(deltaY: number) {
  const resistance = deltaY >= 0 ? SHEET_DRAG_RESISTANCE : SHEET_DRAG_UP_RESISTANCE;
  return Number((deltaY * resistance).toFixed(2));
}

/** Normalised 0–1 scroll progress used to condense the top bar. */
export function computeScrollDepth(scrollY: number) {
  return Number(clamp01(scrollY / SCROLL_DEPTH_RANGE_PX).toFixed(3));
}
