import { isPlusBurnSpectacle, PLUS_BURN_TYPES, spectacles } from '../lib/fireBurnSpectacle';
import type { AutoBurnSpectacleType, BurnSpectacle, BurnSpectacleType, PlusBurnSpectacleType } from '../lib/fireBurnSpectacle';

export const AUTO_FLAME_IDS = [
  'normal',
  'blueGhost',
  'golden',
  'explosion',
  'dragon',
  'cherry',
  'ironFire',
  'voidFire',
  'phoenixRise',
] as const satisfies readonly AutoBurnSpectacleType[];

export const FLAME_IDS = [...AUTO_FLAME_IDS, ...PLUS_BURN_TYPES] as const;
export type FlameId = BurnSpectacleType;

type FlameDesign = {
  label: string;
  description: string;
  message: string;
  colors: [base: string, body: string, tip: string];
  sound: BurnSpectacle['soundProfile'];
};

const PLUS_DESIGNS: Record<PlusBurnSpectacleType, FlameDesign> = {
  aurora: {
    label: '極光の炎',
    description: '翡翠色の光が、夜空のカーテンのように揺らめく。',
    message: 'ゆらめく光が、今日の一歩を照らした。',
    colors: ['#164968', '#42de9d', '#d7ffcb'],
    sound: 'glimmer',
  },
  moonFrost: {
    label: '月霜の炎',
    description: '月白の火と、霜の結晶が立ちのぼる。',
    message: '月明かりの中に、ひとつの区切りを。',
    colors: ['#334aa0', '#a7d9f8', '#f5fbff'],
    sound: 'metallic',
  },
  firefly: {
    label: '蛍火',
    description: '金緑の小さな光が、ゆっくり浮かんでは消える。',
    message: '小さな光が、確かな一歩を残した。',
    colors: ['#4c6022', '#c8e967', '#fff9c0'],
    sound: 'soft',
  },
  maple: {
    label: '紅葉の火',
    description: '朱色の葉が舞い、銅色の火の粉へ変わる。',
    message: '舞い落ちる葉のように、手放した。',
    colors: ['#852322', '#f39840', '#ffe19d'],
    sound: 'normal',
  },
  lotus: {
    label: '蓮の灯',
    description: '薄桃とすみれ色の花弁が、火の中でひらく。',
    message: '静かにひらいて、今日を閉じた。',
    colors: ['#642763', '#f78bb4', '#fff0d9'],
    sound: 'bloom',
  },
  daybreak: {
    label: '朝焼けの炎',
    description: '白金色の弧がひろがり、琥珀の光にほどける。',
    message: '今日の仕事から、次の光へ。',
    colors: ['#a34330', '#ffbe70', '#fff4c7'],
    sound: 'golden',
  },
  thunder: {
    label: '雷光の炎',
    description: '青紫の稲妻が走り、火花が鋭く弾ける。',
    message: 'ひとすじの雷光が、迷いを断った。',
    colors: ['#38388e', '#9591ff', '#ecdcff'],
    sound: 'surge',
  },
  comet: {
    label: '彗星の炎',
    description: '青緑の尾を引く光が、斜めに空を駆ける。',
    message: '光の尾を引いて、ひとつ前へ。',
    colors: ['#135286', '#5adef5', '#ebffff'],
    sound: 'ethereal',
  },
  magma: {
    label: '熔岩の火',
    description: '深紅の火が、岩の割れ目からゆっくりせり上がる。',
    message: '赤く残る熱が、やり遂げた証になった。',
    colors: ['#60171d', '#ff6543', '#fff0a5'],
    sound: 'dragon',
  },
  lantern: {
    label: '灯籠の火',
    description: '朱色の灯籠が、内側からゆっくり明るくなる。',
    message: '灯をともして、今日の仕事を閉じた。',
    colors: ['#6c2023', '#ff8050', '#fff0ad'],
    sound: 'soft',
  },
  seaGlass: {
    label: '海硝子の炎',
    description: '波に磨かれた青緑の硝子が、光を透かして浮かぶ。',
    message: '波が引くように、ひとつ手を離れた。',
    colors: ['#155466', '#62cfc4', '#e6fff2'],
    sound: 'ethereal',
  },
  starRain: {
    label: '星雨の炎',
    description: '金色の小さな星が、斜めに流れてほどける。',
    message: '流れ星の跡のように、今日の一歩が残った。',
    colors: ['#49366d', '#e2ab78', '#ffffdd'],
    sound: 'glimmer',
  },
  iris: {
    label: '菖蒲の火',
    description: '薄紫の花弁が開き、先に青白い火が宿る。',
    message: '花がほころぶように、仕事がひとつ片づいた。',
    colors: ['#432879', '#ae98ec', '#eee4ff'],
    sound: 'bloom',
  },
};

const AUTO_DESCRIPTIONS: Record<AutoBurnSpectacleType, string> = {
  normal: '橙の火が、勢いよく燃え上がる。',
  blueGhost: '青白い火の粉が、闇に浮かび上がる。',
  golden: '金色の光が、画面いっぱいにひろがる。',
  explosion: '赤い火が一気に燃え、火花が弾ける。',
  dragon: '深い紫の光の中を、朱の炎が駆け上がる。',
  cherry: 'やわらかな桜色の火の粉が舞う。',
  ironFire: '鋼のような青が、白い火花を散らす。',
  voidFire: '濃い紫の炎が、暗闇へ吸い込まれる。',
  phoenixRise: '金と白のまばゆい火の粉が立ちのぼる。',
};

export type FlameCatalogEntry = {
  id: FlameId;
  label: string;
  description: string;
  spectacle: BurnSpectacle;
};

const createFlameEntry = (id: FlameId): FlameCatalogEntry => {
  if (!isPlusBurnSpectacle(id)) {
    return { id, label: spectacles[id].label, description: AUTO_DESCRIPTIONS[id], spectacle: spectacles[id] };
  }

  const { label, description, message, colors: [base, body, tip], sound } = PLUS_DESIGNS[id];
  return {
    id,
    label,
    description,
    spectacle: {
      type: id,
      label,
      message,
      flameColorA: base,
      flameColorB: body,
      flameColorC: tip,
      bgGlowColor: `${body}66`,
      particleColor: tip,
      particleShadow: body,
      soundProfile: sound,
      rarity: 'uncommon',
      isSpecial: true,
    },
  };
};

const entries = new Map(FLAME_IDS.map((id) => [id, createFlameEntry(id)]));
export const getFlameEntry = (id: FlameId): FlameCatalogEntry => entries.get(id)!;
export const getFlame = (id: FlameId): BurnSpectacle => getFlameEntry(id).spectacle;

export const isFlameId = (value: unknown): value is FlameId => (
  typeof value === 'string' && entries.has(value as FlameId)
);
