export const releaseMarks = {
  ember: 'M0-2.8C.6-1.5 1.6-.8 1.6.4A1.6 1.6 0 1 1-1.6.4C-1.6-.7-.8-1.6 0-2.8Z',
  petal: 'M-2-2.2-.5-1.8 0-2.8C2.8-1.4 2.5.6 0 2.6-1.8 2-2.8.2-2-2.2Z',
  shard: 'm.6-3 1.4 2-1.5 3.8-1.7-1.5Z',
  star: 'M0-3 .7-.7 3 0 .7.7 0 3-.7.7-3 0-.7-.7Z',
  pearl: 'M0-1.8a1.8 1.8 0 1 0 .01 0Z',
  feather: 'M1.8-3c.7 2.7-.2 4.7-3.6 6 0-2.3.7-4.5 3.6-6Z',
  leaf: 'm0-3.1.8 1.6 1.2-.7-.3 1.6 1.1.2-1.5 1.6-1-.1-.6 1.7-.4-1.8-2-1.2 1.4-.2-.5-1.8 1.1.8Z',
  streak: 'M-.55-3.8 .65-3.8 .36 3.4 0 4.4-.36 3.4Z',
} as const;

export type ReleaseMark = keyof typeof releaseMarks;
export type ReleaseFlight = 'updraft' | 'flutter' | 'outward' | 'inward' | 'shower' | 'ripples';

/** Offsets in the same 96-unit viewBox as the flame, independent of screen size. */
export function releaseKeyframes(flight: ReleaseFlight, particle: { x: number; angle: number; size: number }, strength: number) {
  const side = (particle.x - 50) / 45;
  const turn = particle.angle;
  const radius = (11 + particle.size * 1.6) * strength;
  const angle = (turn + 70) * Math.PI / 70;
  const dx = Math.cos(angle) * radius;
  const dy = Math.sin(angle) * radius;

  switch (flight) {
    case 'inward':
      return {
        x: [dx * 1.25, dx * .56 - dy * .25, dx * .1],
        y: [dy * 1.25, dy * .56 + dx * .25, dy * .1],
        rotate: [turn, turn + 48, turn + 100],
      };
    case 'outward':
      return {
        x: [dx * .2, dx * .78, dx * 1.3],
        y: [dy * .2, dy * .78, dy * 1.3],
        rotate: [turn, turn + 14, turn + 28],
      };
    case 'shower':
      return {
        x: [side * 23 + 8, side * 23, side * 23 - radius * .8],
        y: [-radius, -radius * .35, radius * .65],
        rotate: [32, 35, 37],
      };
    case 'flutter':
      return {
        x: [side * 12, side * 24 + turn * .09, side * 18 - turn * .11],
        y: [-radius * .42, -radius * .04, radius * .9],
        rotate: [turn - 20, turn + 28, turn + 68],
      };
    case 'ripples':
      return {
        x: [side * 5, side * (9 + radius * .5), side * (14 + radius)],
        y: [9, 6 + dy * .1, 11 + dy * .12],
        rotate: [turn * .15, turn * .3, turn * .45],
      };
    case 'updraft':
      return {
        x: [side * 11, side * 13 - turn * .08, side * 18 + turn * .1],
        y: [8, -radius * .32, -radius * 1.14],
        rotate: [turn * .1, turn * .4, turn * .65],
      };
  }
}
