import type { SceneId } from '../plusPreferences';

/**
 * Painted backdrops for the campfire scenes. They sit *behind* the shared
 * CampfireVisual, so growth is drawn once and every scene shows the same
 * fire at the same stage. Pure decoration: aria-hidden, no text on top.
 */

// Fixed positions (no randomness): the same sky every time, and stable in tests.
const STARS: [number, number, number][] = [
  [18, 14, 1], [42, 30, 1.4], [66, 12, 1], [91, 38, 1.2], [118, 18, 1], [140, 8, 1.4], [165, 34, 1],
  [190, 16, 1.2], [214, 40, 1], [238, 10, 1.4], [262, 28, 1], [286, 14, 1.2], [304, 36, 1], [30, 52, 1],
  [76, 56, 1.2], [128, 50, 1], [176, 58, 1.4], [226, 54, 1], [276, 60, 1.2], [152, 24, 1],
];

function Lake() {
  return (
    <svg className="plus-scene-art" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="lake-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#070d22" />
          <stop offset="1" stopColor="#1a2c58" />
        </linearGradient>
        <linearGradient id="lake-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#152a52" />
          <stop offset="1" stopColor="#0a1530" />
        </linearGradient>
        <radialGradient id="lake-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffb066" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffb066" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill="url(#lake-sky)" />
      {STARS.map(([x, y, r], index) => (
        <circle key={index} className={index % 3 === 0 ? 'plus-star is-twinkle' : 'plus-star'} cx={x} cy={y} r={r} fill="#f6efe0" />
      ))}
      <path d="M0 118 L38 92 L70 108 L112 78 L150 104 L196 84 L238 106 L280 88 L320 110 L320 128 L0 128 Z" fill="#0a1226" />
      <rect y="124" width="320" height="76" fill="url(#lake-water)" />
      <g stroke="#a9c0f0" strokeOpacity="0.18" strokeWidth="1">
        <path d="M24 140h54M210 146h70M96 156h44M230 166h50M40 178h60" />
      </g>
      <ellipse cx="160" cy="150" rx="46" ry="44" fill="url(#lake-glow)" />
    </svg>
  );
}

function Forest() {
  return (
    <svg className="plus-scene-art" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="forest-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a2830" />
          <stop offset="1" stopColor="#33474d" />
        </linearGradient>
        <linearGradient id="forest-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a2a2c" />
          <stop offset="1" stopColor="#0b1517" />
        </linearGradient>
        <radialGradient id="forest-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffa95c" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ffa95c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill="url(#forest-sky)" />
      <g fill="#122126">
        <path d="M-10 150 L18 52 L46 150Z M30 150 L62 40 L94 150Z M226 150 L258 46 L290 150Z M270 150 L302 58 L334 150Z" />
      </g>
      <g fill="#0a1519">
        <path d="M-20 170 L10 70 L40 170Z M12 170 L48 56 L84 170Z M236 170 L274 62 L312 170Z M284 170 L320 74 L356 170Z" />
      </g>
      <rect y="150" width="320" height="50" fill="url(#forest-ground)" />
      <ellipse cx="160" cy="156" rx="70" ry="16" fill="url(#forest-glow)" />
      <g stroke="#9fc0c8" strokeOpacity="0.16" strokeWidth="1">
        <path d="M30 168h40M240 176h50M110 184h36" />
      </g>
      <g fill="#bcd6dc" fillOpacity="0.7">
        <circle className="plus-drip" cx="56" cy="64" r="1.6" />
        <circle className="plus-drip is-late" cx="272" cy="72" r="1.6" />
      </g>
      <g fill="none" stroke="#bcd6dc" strokeOpacity="0.4" strokeWidth="1">
        <ellipse className="plus-ripple" cx="60" cy="172" rx="4" ry="1.4" />
        <ellipse className="plus-ripple is-late" cx="268" cy="178" rx="4" ry="1.4" />
      </g>
    </svg>
  );
}

function Night() {
  return (
    <svg className="plus-scene-art" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="night-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d0d0e" />
          <stop offset="1" stopColor="#1b1410" />
        </linearGradient>
        <radialGradient id="night-glow" cx="0.5" cy="1" r="0.7">
          <stop offset="0" stopColor="#ff7a2a" stopOpacity="0.28" />
          <stop offset="1" stopColor="#ff7a2a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill="url(#night-sky)" />
      <rect width="320" height="200" fill="url(#night-glow)" />
    </svg>
  );
}

export function SceneBackdrop({ scene }: { scene: SceneId }) {
  if (scene === 'lake') return <Lake />;
  if (scene === 'forest') return <Forest />;
  return <Night />;
}
