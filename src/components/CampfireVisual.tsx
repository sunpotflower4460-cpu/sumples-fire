import { useId } from 'react';

export const CAMPFIRE_EMBER_COUNTS = [2, 4, 6, 8, 10, 14] as const;
const FLAME_SCALES = [0.39, 0.56, 0.73, 0.85, 0.99, 1.09] as const;

/** The home campfire and the Plus scenery grow from the same ash total. */
export function CampfireVisual({ stage }: { stage: 0 | 1 | 2 | 3 | 4 | 5 }) {
  const id = useId();
  const paint = (name: string) => `url(#${id}-${name})`;

  return (
    <div className="campfire-visual" aria-hidden="true">
      <svg className="campfire-firebed" viewBox="0 0 120 110" width="128" height="118"
        preserveAspectRatio="xMidYMax meet" focusable="false">
        <defs>
          <linearGradient id={`${id}-flame`} x1=".22" y1="1" x2=".7" y2="0">
            <stop stopColor="#d44728" /><stop offset=".42" stopColor="#ff8539" />
            <stop offset=".8" stopColor="#ffc464" /><stop offset="1" stopColor="#ffe4a0" />
          </linearGradient>
          <radialGradient id={`${id}-heart`} cx="48%" cy="74%" r="78%">
            <stop stopColor="#fff7cc" /><stop offset=".45" stopColor="#ffdc84" />
            <stop offset="1" stopColor="#ff9843" />
          </radialGradient>
          <radialGradient id={`${id}-coals`}>
            <stop stopColor="#ffad62" stopOpacity=".82" /><stop offset=".48" stopColor="#e86733" stopOpacity=".54" />
            <stop offset="1" stopColor="#e86733" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-bark`} x1="0" x2=".2" y1="0" y2="1">
            <stop stopColor="#ba7050" /><stop offset=".3" stopColor="#713c2a" />
            <stop offset=".6" stopColor="#3f2824" /><stop offset="1" stopColor="#25191a" />
          </linearGradient>
        </defs>
        <ellipse cx="60" cy="99" rx="48" ry="8" fill={paint('coals')} />
        <path d="M29 80c-4 0-7 4-6 7l56 16 8-6-4-4Z" fill={paint('bark')} stroke="#392425" />
        <g transform={`translate(60 90) scale(${FLAME_SCALES[stage]}) translate(-60 -90)`}>
          {stage >= 3 && (
            <g className="campfire-back-tongue" fill={paint('flame')}>
              <path d="M23 86c-9-12-7-22-4-32 2 9 7 10 11 15 2-9-1-14 1-22 10 10 8 21 15 27l7 14Zm48-5c3-14 13-20 15-39 5 8 7 15 4 25 5-4 7-8 9-14 4 18-4 32-14 38Z" />
            </g>
          )}
          <g className="campfire-main-tongue">
            <path d="M31 85c-8-14-5-24-1-33 1 10 6 15 12 17-6-17-4-29 7-43 0 11 5 15 7 19 4-12 13-18 10-37 15 13 13 27 8 40 5-3 8-9 9-14 9 17-6 27-2 38 4-1 9-7 12-14 3 18-8 34-27 35-12 1-26-1-35-8Z" fill={paint('flame')} />
          </g>
          <g className="campfire-front-tongue">
            <path d="M39 85c-5-7-6-14-4-20 3 8 6 10 12 12-6-13-3-23 2-32 1 8 5 12 8 14-1-11 10-20 10-31 8 14 1 25-1 33 6-3 9-9 10-13 7 12-3 24-3 29 5-2 8-4 12-10-1 15-11 24-29 24-7 0-13-2-17-6Z" fill={paint('heart')} />
            <path d="M52 87c-4-5-5-9-4-14 1 4 4 6 7 6-3-8 4-13 6-20 4 9 1 15 4 19l5-5c0 8-5 14-12 15Z" fill="#fff5bf" />
          </g>
        </g>
        <path d="m26 99 5-6 49-13c5-1 9 5 6 9l-54 17Z" fill={paint('bark')} stroke="#392425" />
        <path d="m34 94 15-4 3-3 12-2m-17 9 15-4 4-2 12-3m-41 11 7-1" fill="none" stroke="#ef9865" strokeWidth="1.4" strokeLinecap="round" />
        <ellipse cx="30" cy="100" rx="5.3" ry="7" transform="rotate(-28 30 100)" fill="#814c39" stroke="#46302a" />
        <path d="M28 96c4-1 6 6 3 7-2 1-4-3-3-4" fill="none" stroke="#d28b63" strokeWidth="1.2" />
        <ellipse cx="82" cy="98" rx="4.5" ry="6" transform="rotate(36 82 98)" fill="#80503b" stroke="#382828" />
        <path d="m80 99 3-4m-8-1-9-3m-35-9 10 3" fill="none" stroke="#dc8a58" strokeWidth="1.2" />
      </svg>
      <div className="campfire-embers">
        {Array.from({ length: CAMPFIRE_EMBER_COUNTS[stage] }, (_, index) => (
          <i key={index} className={`campfire-ember ce-${index + 1}`} />
        ))}
      </div>
    </div>
  );
}
