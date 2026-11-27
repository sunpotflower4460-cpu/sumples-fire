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
    description: '翡翠色の炎が薄い膜のように流れ、重なったところが淡く光る。',
    message: 'ゆらめく光が、今日の一歩を照らした。',
    colors: ['#164968', '#42de9d', '#d7ffcb'],
    sound: 'glimmer',
  },
  moonFrost: {
    label: '月霜の炎',
    description: '青白い火が細く伸び、霜色の先が静かにほどける。',
    message: '月明かりの中に、ひとつの区切りを。',
    colors: ['#334aa0', '#a7d9f8', '#f5fbff'],
    sound: 'metallic',
  },
  firefly: {
    label: '蛍火',
    description: '小さな黄緑の炎が炭の上に灯り、光の粒がふわりと昇る。',
    message: '小さな光が、確かな一歩を残した。',
    colors: ['#4c6022', '#c8e967', '#fff9c0'],
    sound: 'soft',
  },
  maple: {
    label: '紅葉の火',
    description: '朱と橙の炎が風に返り、終わりに小さな紅葉が舞い落ちる。',
    message: '舞い落ちる葉のように、手放した。',
    colors: ['#852322', '#f39840', '#ffe19d'],
    sound: 'normal',
  },
  lotus: {
    label: '蓮の灯',
    description: '薄桃色の火が二筋に分かれ、花弁のようにひらいて沈む。',
    message: '静かにひらいて、今日を閉じた。',
    colors: ['#642763', '#f78bb4', '#fff0d9'],
    sound: 'bloom',
  },
  daybreak: {
    label: '朝焼けの炎',
    description: '淡いあかね色の縁から、朝日のような琥珀の芯がのぞく。',
    message: '今日の仕事から、次の光へ。',
    colors: ['#a34330', '#ffbe70', '#fff4c7'],
    sound: 'golden',
  },
  thunder: {
    label: '雷光の炎',
    description: '青紫の炎がすばやく身を返し、鋭い光を散らす。',
    message: 'ひとすじの雷光が、迷いを断った。',
    colors: ['#38388e', '#9591ff', '#ecdcff'],
    sound: 'surge',
  },
  comet: {
    label: '彗星の炎',
    description: '青緑の火が斜めに伸び、薄い尾が風にほどける。',
    message: '光の尾を引いて、ひとつ前へ。',
    colors: ['#135286', '#5adef5', '#ebffff'],
    sound: 'ethereal',
  },
  magma: {
    label: '熔岩の火',
    description: '炭に沿って低い深紅の火が広がり、割れ目に橙の熱が残る。',
    message: '赤く残る熱が、やり遂げた証になった。',
    colors: ['#60171d', '#ff6543', '#fff0a5'],
    sound: 'dragon',
  },
  lantern: {
    label: '灯籠の火',
    description: '細い金色の芯が静かに揺れ、火元には朱の明かりが残る。',
    message: '灯をともして、今日の仕事を閉じた。',
    colors: ['#6c2023', '#ff8050', '#fff0ad'],
    sound: 'soft',
  },
  seaGlass: {
    label: '海硝子の炎',
    description: '透き通った青緑の火が重なり、波のように押し寄せて引く。',
    message: '波が引くように、ひとつ手を離れた。',
    colors: ['#155466', '#62cfc4', '#e6fff2'],
    sound: 'ethereal',
  },
  starRain: {
    label: '星雨の炎',
    description: '赤紫の縁が金色の火を包み、細い光が斜めに流れ落ちる。',
    message: '流れ星の跡のように、今日の一歩が残った。',
    colors: ['#49366d', '#e2ab78', '#ffffdd'],
    sound: 'glimmer',
  },
  iris: {
    label: '菖蒲の火',
    description: 'すみれ色の火が高さを変えて重なり、先だけが淡くほどける。',
    message: '花がほころぶように、仕事がひとつ片づいた。',
    colors: ['#432879', '#ae98ec', '#eee4ff'],
    sound: 'bloom',
  },
};

const AUTO_DESCRIPTIONS: Record<AutoBurnSpectacleType, string> = {
  normal: '炭の間から橙色の火が伸び、金色の先がちぎれて消える。',
  blueGhost: '細い青の火が静かに傾き、芯の白い光が透ける。',
  golden: '黄金色の火が重なり合い、奥から明るい芯がのぞく。',
  explosion: '幅のある朱色の火が一気にふくらみ、端からほぐれる。',
  dragon: '紫がかった朱の炎が、横風を受けて長くうねる。',
  cherry: '桜色の火が左になびき、最後に花びらが舞い落ちる。',
  ironFire: '鋼色の細い炎が高く立ち、切れた先だけ白く光る。',
  voidFire: '紫の火が寄り添って立ち上がり、その間に淡い金の芯が光る。',
  phoenixRise: '紅と金の火が左右で別々に立ち上がり、羽根の火の粉が昇る。',
};

/** Short silhouettes for comparing two flames at the same scale. */
export const FLAME_TRAITS: Record<FlameId, string> = {
  normal: '橙の一筋、揺れる火先',
  blueGhost: '細く漂う青い尾',
  golden: 'ふっくら重なる金の火',
  explosion: '大きく弾ける朱の火',
  dragon: '長くうねる朱紫の火',
  cherry: '左になびく桜色の火',
  ironFire: '刃のような銀白の芯',
  voidFire: '寄り添う紫と淡い金の芯',
  phoenixRise: '左右にひらく二筋の火',
  aurora: '幾重にも揺れる翡翠の膜',
  moonFrost: '細く澄んだ霜色の火先',
  firefly: '炭のそばの小さな黄緑',
  maple: '風に返る朱色の火先',
  lotus: '花弁のように重なる薄桃',
  daybreak: '横に広がる琥珀の光',
  thunder: '折れ曲がる青紫の火先',
  comet: '斜めに伸びる青緑の尾',
  magma: '炭を横にはう深紅の火',
  lantern: 'まっすぐ灯る金色の細芯',
  seaGlass: '低く波打つ青緑',
  starRain: '斜めに降る金の火の粉',
  iris: '高さの違うすみれ色の火',
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
