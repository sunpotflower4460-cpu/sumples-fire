import type { CSSProperties } from 'react';
import type { BurnSpectacleType } from '../lib/fireBurnSpectacle';
import { CombustionFlame } from './CombustionFlame';

export const CAMPFIRE_EMBER_COUNTS = [2, 4, 6, 8, 10, 14] as const;
const FLAME_SCALES = [.30, .47, .65, .80, .97, 1.12] as const;

/** Grow the fire from one bed of coals as the person's ash total increases. */
export function CampfireVisual({
  stage, flame = 'normal',
}: {
  stage: 0 | 1 | 2 | 3 | 4 | 5;
  flame?: BurnSpectacleType;
}) {
  return (
    <div className="campfire-visual" aria-hidden="true">
      <div className="campfire-firebed" style={{ '--campfire-scale': FLAME_SCALES[stage] } as CSSProperties}>
        <CombustionFlame flame={flame} motion="burn" size={144} />
      </div>
      <div className="campfire-embers">
        {Array.from({ length: CAMPFIRE_EMBER_COUNTS[stage] }, (_, index) => (
          <i key={index} className={`campfire-ember ce-${index + 1}`} />
        ))}
      </div>
    </div>
  );
}
