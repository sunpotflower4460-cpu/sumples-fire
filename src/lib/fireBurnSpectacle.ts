import type { FireDifficulty } from '../types/fireSeed';

export type BurnSpectacleType =
  | 'normal'
  | 'blueGhost'
  | 'golden'
  | 'explosion'
  | 'dragon'
  | 'cherry'
  | 'ironFire'
  | 'voidFire'
  | 'phoenixRise';

export type BurnSpectacleRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type BurnSpectacleSound =
  | 'normal'
  | 'ethereal'
  | 'golden'
  | 'explosive'
  | 'dragon'
  | 'soft'
  | 'metallic'
  | 'void'
  | 'phoenix';

export type BurnSpectacle = {
  type: BurnSpectacleType;
  label: string;
  flameColorA: string;
  flameColorB: string;
  flameColorC: string;
  bgGlowColor: string;
  particleColor: string;
  particleShadow: string;
  message: string;
  soundProfile: BurnSpectacleSound;
  rarity: BurnSpectacleRarity;
  isSpecial: boolean;
};

export const spectacles: Record<BurnSpectacleType, BurnSpectacle> = {
  normal: {
    type: 'normal',
    label: '炎',
    flameColorA: 'rgba(160,35,10,0.98)',
    flameColorB: 'rgba(230,85,22,0.95)',
    flameColorC: 'rgba(255,215,75,0.72)',
    bgGlowColor: 'rgba(255,90,15,0.38)',
    particleColor: '#ffaa30',
    particleShadow: 'rgba(255,168,40,0.8)',
    message: '燃やした。前に進んだ。',
    soundProfile: 'normal',
    rarity: 'common',
    isSpecial: false,
  },
  blueGhost: {
    type: 'blueGhost',
    label: '鬼火',
    flameColorA: 'rgba(10,30,160,0.98)',
    flameColorB: 'rgba(30,120,230,0.95)',
    flameColorC: 'rgba(160,220,255,0.78)',
    bgGlowColor: 'rgba(30,80,220,0.42)',
    particleColor: '#60c8ff',
    particleShadow: 'rgba(50,160,255,0.85)',
    message: '鬼火が宿った。これは特別な燃焼だ。',
    soundProfile: 'ethereal',
    rarity: 'rare',
    isSpecial: true,
  },
  golden: {
    type: 'golden',
    label: '黄金の炎',
    flameColorA: 'rgba(140,90,5,0.98)',
    flameColorB: 'rgba(220,170,20,0.95)',
    flameColorC: 'rgba(255,248,140,0.88)',
    bgGlowColor: 'rgba(255,200,30,0.45)',
    particleColor: '#ffe060',
    particleShadow: 'rgba(255,220,50,0.9)',
    message: '黄金の炎が燃えた。輝かしい一歩だ。',
    soundProfile: 'golden',
    rarity: 'uncommon',
    isSpecial: true,
  },
  explosion: {
    type: 'explosion',
    label: '爆炎',
    flameColorA: 'rgba(150,10,10,0.98)',
    flameColorB: 'rgba(255,55,15,0.95)',
    flameColorC: 'rgba(255,190,60,0.82)',
    bgGlowColor: 'rgba(255,35,10,0.55)',
    particleColor: '#ff6030',
    particleShadow: 'rgba(255,80,20,0.9)',
    message: '爆炎一閃。見事に吹き飛ばした。',
    soundProfile: 'explosive',
    rarity: 'uncommon',
    isSpecial: true,
  },
  dragon: {
    type: 'dragon',
    label: '龍の炎',
    flameColorA: 'rgba(100,10,130,0.98)',
    flameColorB: 'rgba(200,60,20,0.95)',
    flameColorC: 'rgba(255,150,80,0.75)',
    bgGlowColor: 'rgba(160,30,200,0.38)',
    particleColor: '#e060ff',
    particleShadow: 'rgba(180,60,255,0.85)',
    message: '龍が降りた。圧倒的な意志の力だ。',
    soundProfile: 'dragon',
    rarity: 'rare',
    isSpecial: true,
  },
  cherry: {
    type: 'cherry',
    label: '桜の火',
    flameColorA: 'rgba(160,30,80,0.95)',
    flameColorB: 'rgba(230,100,150,0.9)',
    flameColorC: 'rgba(255,200,220,0.78)',
    bgGlowColor: 'rgba(220,100,160,0.35)',
    particleColor: '#ffb0d0',
    particleShadow: 'rgba(230,130,180,0.85)',
    message: '桜色の炎が舞った。美しく儚い達成だ。',
    soundProfile: 'soft',
    rarity: 'uncommon',
    isSpecial: true,
  },
  ironFire: {
    type: 'ironFire',
    label: '鉄の火',
    flameColorA: 'rgba(30,60,120,0.98)',
    flameColorB: 'rgba(100,160,230,0.92)',
    flameColorC: 'rgba(210,230,255,0.82)',
    bgGlowColor: 'rgba(60,120,220,0.4)',
    particleColor: '#a0c8ff',
    particleShadow: 'rgba(100,180,255,0.85)',
    message: '鉄の意志で燃やした。揺るぎない証明だ。',
    soundProfile: 'metallic',
    rarity: 'uncommon',
    isSpecial: true,
  },
  voidFire: {
    type: 'voidFire',
    label: '虚空の火',
    flameColorA: 'rgba(10,0,20,0.98)',
    flameColorB: 'rgba(80,20,120,0.92)',
    flameColorC: 'rgba(180,80,255,0.68)',
    bgGlowColor: 'rgba(100,20,180,0.4)',
    particleColor: '#c060ff',
    particleShadow: 'rgba(160,50,240,0.85)',
    message: '虚空に消えた。深淵からの達成感。',
    soundProfile: 'void',
    rarity: 'rare',
    isSpecial: true,
  },
  phoenixRise: {
    type: 'phoenixRise',
    label: 'フェニックス',
    flameColorA: 'rgba(160,60,0,0.98)',
    flameColorB: 'rgba(255,145,30,0.95)',
    flameColorC: 'rgba(255,255,180,0.92)',
    bgGlowColor: 'rgba(255,130,20,0.6)',
    particleColor: '#ffcc40',
    particleShadow: 'rgba(255,200,50,0.95)',
    message: '不死鳥が舞い上がった。これは伝説の達成だ。',
    soundProfile: 'phoenix',
    rarity: 'legendary',
    isSpecial: true,
  },
};

const weightedRandom = (weights: [BurnSpectacleType, number][]): BurnSpectacleType => {
  const total = weights.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [type, weight] of weights) {
    r -= weight;
    if (r <= 0) return type;
  }
  return weights[weights.length - 1][0];
};

export const selectBurnSpectacle = (difficulty: FireDifficulty, streak: number): BurnSpectacle => {
  const sb = Math.min(streak * 0.6, 9);
  const isBoss = difficulty === 'boss';
  const isHeavy = difficulty === 'heavy';

  const weights: [BurnSpectacleType, number][] = [
    ['normal',      Math.max(55 - sb, 30)],
    ['golden',      7 + sb * 0.25],
    ['cherry',      6 + sb * 0.1],
    ['blueGhost',   4 + sb * 0.35],
    ['explosion',   isHeavy || isBoss ? 10 : 3],
    ['ironFire',    3 + sb * 0.15],
    ['dragon',      2 + (isBoss ? 5 : 0) + sb * 0.2],
    ['voidFire',    1.5 + sb * 0.1],
    ['phoenixRise', isBoss ? 2 : 0.4],
  ];

  const selected = weightedRandom(weights);
  return spectacles[selected];
};
