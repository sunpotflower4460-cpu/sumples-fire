import type { ReactNode } from 'react';
import { motion, useIsPresent } from 'framer-motion';
import { screenVariants } from '../lib/shellVariants';

type ScreenLayerProps = {
  depth: number;
  children: ReactNode;
};

/**
 * One tab screen, cross-faded in depth against the screen it replaces.
 *
 * Both screens overlap in the same grid cell while the swap runs, which keeps
 * `.app-screen` tall enough for App.tsx's synchronous scroll restoration to
 * land on the right offset. The outgoing copy is inert so assistive technology
 * and the Tab order only ever see the screen that is arriving.
 */
export function ScreenLayer({ depth, children }: ScreenLayerProps) {
  const isPresent = useIsPresent();

  return (
    <motion.div
      className="screen-layer"
      custom={depth}
      variants={screenVariants}
      initial="enter"
      animate="center"
      exit="exit"
      inert={!isPresent}
      aria-hidden={!isPresent || undefined}
    >
      {children}
    </motion.div>
  );
}
