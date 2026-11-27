import { useId } from 'react';
import { isPlusBurnSpectacle } from '../lib/fireBurnSpectacle';
import type { BurnSpectacle, PlusBurnSpectacleType } from '../lib/fireBurnSpectacle';

type Motif = { silhouette: string; detail: string };

const MOTIFS: Record<PlusBurnSpectacleType, Motif> = {
  aurora: {
    silhouette: 'M7 82C14 73 26 75 34 63S37 38 31 28c15 7 17 19 15 29C57 47 64 25 60 8c15 14 16 36 4 51C78 55 84 44 89 33c1 29-22 54-53 54-11 0-22-2-29-5Z',
    detail: 'M17 82c17-1 28-6 37-19C69 43 69 25 60 8M46 70c14 2 27-8 34-17M29 21l2 5m-4-2 6-1M80 17v8m-4-4h8',
  },
  moonFrost: {
    silhouette: 'M48 8 64 36 60 48 77 37 81 64 64 83H33L16 65l5-28 15 12-4-12Z',
    detail: 'M48 8v75m-32-18 32 9 33-10M32 37l16 16 16-17M33 83l15-30 16 30M20 20v10m-5-5h10M76 14v12m-6-6h12',
  },
  firefly: {
    silhouette: 'M27 68a6 6 0 1 0 0 .01ZM45 50a8 8 0 1 0 0 .01ZM68 63a7 7 0 1 0 0 .01ZM67 28a5 5 0 1 0 0 .01ZM85 42a3 3 0 1 0 0 .01ZM39 22a4 4 0 1 0 0 .01ZM61 82a8 8 0 1 0 0 .01ZM48 9a3 3 0 1 0 0 .01Z',
    detail: 'M19 72c0-19 11-29 24-34m11 38c15-5 25-16 27-28M54 21c5-5 12-6 18-6M34 79l4 2 5 1',
  },
  maple: {
    silhouette: 'm49 8 9 28 12-10-1 16 21-4-10 15 8 5-29 15 2 7-12-4-11 5 2-9L9 59l10-6-11-15 22 5-2-16 13 9Z',
    detail: 'M49 89V18m0 51L18 49m31 19 28-20M49 56l-12-16m12 13 13-18M68 11l4 7 6-3-5 9m-60-9 6 10',
  },
  lotus: {
    silhouette: 'M48 86C22 86 8 72 4 53c15 0 24 3 30 10C20 47 24 39 23 31c9 2 15 8 19 15-1-12 3-27 6-35 6 8 11 22 10 35 6-8 11-13 20-15 1 11-4 27-14 32 8-7 15-10 28-10-4 19-19 33-44 33Z',
    detail: 'M48 85C31 57 37 34 48 11m0 74c-7-20-15-25-25-54m25 54c2-20 15-29 30-54M6 55c12 17 27 28 42 30 13-2 28-12 42-30',
  },
  daybreak: {
    silhouette: 'M18 65c0-17 13-31 30-31s30 14 30 31ZM10 72h76l-9 6H19Zm15 12h46l-13 6H38Z',
    detail: 'M9 65a39 39 0 0 1 78 0M48 12v8M20 22l5 7m51-7-5 7M8 42l7 4m73-4-7 4M31 60a18 18 0 0 1 34 0',
  },
  thunder: {
    silhouette: 'M54 5 20 54h24L30 90l49-49H55L73 5Z',
    detail: 'M19 23 9 43h12L10 61m70 0-9 14h11L69 91M56 14 31 48h22l-15 28',
  },
  comet: {
    silhouette: 'M92 8C60 25 36 31 18 52 5 68 10 81 26 86c26 8 44-25 66-78Z',
    detail: 'M83 13C57 33 35 45 25 59c-10 14 2 22 14 15 11-6 25-33 44-61ZM13 54l14-18L65 17M35 91c15-3 22-19 33-36M5 70l3-9',
  },
  magma: {
    silhouette: 'M6 84 20 71l10-28 14 6 9-27 12 32 13 10 12 20-21 6H28Z',
    detail: 'm30 43 8 15-7 9 9 4-8 15m9-16 18-6-5 15 15 11M60 64l5-10 13 10-8 10 10 3M38 26l3-8m30 26 6-7M55 10l-1 6',
  },
};

export function FlameArtwork({ spectacle, size = 56 }: { spectacle: BurnSpectacle; size?: number }) {
  const gradientId = useId();
  const motif = isPlusBurnSpectacle(spectacle.type) ? MOTIFS[spectacle.type] : null;

  if (!motif) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
        <path
          d="M13.4 2.8c.7 3.6-2.5 4.7-1.2 7.2.6 1.1 1.7 1.6 2.6 1.2 1.2-.5 1.5-2.1 1.2-3.8 2.6 2 4.1 4.5 4.1 7.2A8.1 8.1 0 0 1 12 22a8.1 8.1 0 0 1-8.1-7.4c0-3.8 2.2-6.5 5.8-9.1-.1 2.2.2 3.7 1.2 4.4.2-2.8 1-5.1 2.5-7.1Z"
          fill={spectacle.flameColorB}
          stroke={spectacle.flameColorA}
          strokeWidth="0.6"
        />
        <path
          d="M12.2 13.1c2 1.7 2.9 3.1 2.9 4.4a3.1 3.1 0 0 1-6.2 0c0-1.3 1.1-2.7 3.3-4.4Z"
          fill={spectacle.flameColorC}
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 96 96" width={size} height={size} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradientId} x1="5%" x2="95%" y1="100%" y2="0%">
          <stop stopColor={spectacle.flameColorA} />
          <stop offset="56%" stopColor={spectacle.flameColorB} />
          <stop offset="100%" stopColor={spectacle.flameColorC} />
        </linearGradient>
      </defs>
      <path className="flame-artwork-body" d={motif.silhouette} fill={`url(#${gradientId})`} />
      <path className="flame-artwork-trace" d={motif.detail} fill="none" stroke={spectacle.flameColorC} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
