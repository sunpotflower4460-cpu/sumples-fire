import { useEffect, useState, type CSSProperties } from 'react';
import type { BurnSpectacleType } from '../lib/fireBurnSpectacle';
import embers from '../assets/combustion/embers.webp';
import './combustionFlame.css';

const plates = import.meta.glob<string>('../assets/combustion/*-*.webp', {
  eager: true,
  import: 'default',
  query: '?no-inline',
});

type CombustionFlameProps = {
  flame: BurnSpectacleType;
  size?: number;
  motion?: 'still' | 'glimpse' | 'burn';
};

/** Only the selected flame needs an animated plate. The coals remain when the plume subsides. */
export function CombustionFlame({ flame, size = 56, motion = 'still' }: CombustionFlameProps) {
  const base = '../assets/combustion/' + flame;
  const live = plates[base + '-live.webp'];
  const still = plates[base + '-still.webp'];
  const [settled, setSettled] = useState<BurnSpectacleType>();
  const [failed, setFailed] = useState<string>();

  useEffect(() => {
    if (motion !== 'glimpse') return;
    const timer = window.setTimeout(() => setSettled(flame), 3200);
    return () => window.clearTimeout(timer);
  }, [motion, flame]);

  const playing = motion !== 'still' && !(motion === 'glimpse' && settled === flame) && failed !== live;
  return (
    <span className="combustion-flame" data-flame={flame} aria-hidden="true" style={{ '--flame-size': `${size}px` } as CSSProperties}>
      <picture className="combustion-plume">
        {playing && <source media="(prefers-reduced-motion: no-preference)" srcSet={live} />}
        <img src={still} alt="" width="288" height="288" draggable={false}
          onError={playing ? () => setFailed(live) : undefined} />
      </picture>
      <img className="combustion-coals" src={embers} alt="" width="288" height="288" draggable={false} />
    </span>
  );
}
