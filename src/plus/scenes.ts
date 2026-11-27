import { makeAmbientMix } from './ambientOptions';
import type { AmbientMix } from './ambientOptions';
import aurora from './artwork/aurora.webp';
import brook from './artwork/brook.webp';
import canyon from './artwork/canyon.webp';
import coast from './artwork/coast.webp';
import forest from './artwork/forest.webp';
import lake from './artwork/lake.webp';
import meadow from './artwork/meadow.webp';
import summit from './artwork/summit.webp';

export const SCENE_IDS = ['night', 'lake', 'forest', 'aurora', 'summit', 'coast', 'brook', 'meadow', 'canyon'] as const;
export type SceneId = (typeof SCENE_IDS)[number];

type SceneInfo = {
  label: string;
  description: string;
  artwork?: string;
  preset: AmbientMix;
};

export const SCENES: Record<SceneId, SceneInfo> = {
  night: {
    label: '夜の焚き火',
    description: '闇の中に、薪と火の明かりだけが残る。',
    preset: makeAmbientMix(),
  },
  lake: {
    label: '星明かりの湖',
    description: '星と月明かりが、静かな水面に映る。',
    artwork: lake,
    preset: makeAmbientMix({ fire: 35, wind: 15 }),
  },
  forest: {
    label: '雨あがりの森',
    description: '木立の間に霧が残り、葉先から雨が落ちる。',
    artwork: forest,
    preset: makeAmbientMix({ fire: 35, rain: 20 }),
  },
  aurora: {
    label: '雪原のオーロラ',
    description: '雪の稜線の上を、青緑の光がたなびく。',
    artwork: aurora,
    preset: makeAmbientMix({ fire: 42, wind: 45 }),
  },
  summit: {
    label: '朝焼けの峰',
    description: '山の向こうから、雲海にあかね色が差す。',
    artwork: summit,
    preset: makeAmbientMix({ fire: 34, wind: 35 }),
  },
  coast: {
    label: '夕凪の入り江',
    description: '薄紫の空の下、白い波が入っては引く。',
    artwork: coast,
    preset: makeAmbientMix({ waves: 65, wind: 20, fire: 28 }),
  },
  brook: {
    label: '木漏れ日の渓流',
    description: '木漏れ日が、丸い石と流れる水を照らす。',
    artwork: brook,
    preset: makeAmbientMix({ stream: 60, fire: 25 }),
  },
  meadow: {
    label: '月夜の草原',
    description: '月明かりを受けたススキが、夜風に揺れる。',
    artwork: meadow,
    preset: makeAmbientMix({ insects: 52, wind: 25, fire: 35 }),
  },
  canyon: {
    label: '夕映えの岩稜',
    description: '霧の奥で、夕日を浴びた岩肌がかすかに赤く染まる。',
    artwork: canyon,
    preset: makeAmbientMix({ wind: 56, fire: 38 }),
  },
};

export const isSceneId = (value: unknown): value is SceneId => (
  typeof value === 'string' && (SCENE_IDS as readonly string[]).includes(value)
);
