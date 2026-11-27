import { useId } from 'react';
import type { CSSProperties } from 'react';
import type { BurnSpectacle } from '../lib/fireBurnSpectacle';
import { flameIllustrations } from './flameIllustrations';
import './flameArtwork.css';

type FlameArtworkProps = {
  spectacle: BurnSpectacle;
  size?: number;
  motion?: 'still' | 'glimpse' | 'burn';
};

export function FlameArtwork({ spectacle, size = 56, motion = 'still' }: FlameArtworkProps) {
  const id = useId();
  const { accent, period, layers } = flameIllustrations[spectacle.type];
  const { flameColorA: base, flameColorB: body, flameColorC: tip } = spectacle;
  const paint = (name: string) => `url(#${id}-${name})`;

  return (
    <svg className="flame-art" data-flame={spectacle.type} data-motion={motion} viewBox="0 0 96 96"
      width={size} height={size} aria-hidden="true" focusable="false"
      style={{ '--flame-period': `${period}s` } as CSSProperties}>
      <defs>
        <linearGradient id={`${id}-shell`} x1="12%" y1="4%" x2="75%" y2="100%">
          <stop stopColor={tip} /><stop offset=".3" stopColor={body} />
          <stop offset=".67" stopColor={accent} /><stop offset="1" stopColor={base} />
        </linearGradient>
        <linearGradient id={`${id}-facet`} x1="85%" y1="0%" x2="23%" y2="100%">
          <stop stopColor={accent} /><stop offset=".52" stopColor={body} stopOpacity=".84" />
          <stop offset="1" stopColor={base} />
        </linearGradient>
        <linearGradient id={`${id}-heart`} x1="40%" y1="100%" x2="60%" y2="0%">
          <stop stopColor={body} /><stop offset=".52" stopColor={tip} /><stop offset="1" stopColor="#fff9eb" />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="20%" y1="0%" x2="75%" y2="100%">
          <stop stopColor={tip} stopOpacity=".88" /><stop offset=".55" stopColor={body} stopOpacity=".3" />
          <stop offset="1" stopColor={accent} stopOpacity=".74" />
        </linearGradient>
      </defs>
      {layers.map((layer, index) => (
        <g key={index} data-action={layer.motion}
          style={{
            '--layer-motion': layer.motion && `flame-${layer.motion}`,
            '--layer-delay': `${-index * period * 0.11}s`,
            transformOrigin: layer.pivot ?? '48px 51px',
          } as CSSProperties} strokeLinejoin="round" strokeLinecap="round">
          {layer.shell && <path d={layer.shell} fill={paint('shell')} stroke={paint('rim')} strokeWidth=".9" />}
          {layer.facet && <path d={layer.facet} fill={paint('facet')} />}
          {layer.heart && <path d={layer.heart} fill={paint('heart')} />}
          {layer.gleam && <path d={layer.gleam} fill="#fff7e6" />}
          {layer.etch && <path d={layer.etch} fill="none" stroke={base} strokeWidth="1.6" opacity=".84" />}
          {layer.line && <path className="flame-hairline" d={layer.line} fill="none" stroke={tip}
            strokeWidth="1.25" pathLength="1" />}
        </g>
      ))}
    </svg>
  );
}
