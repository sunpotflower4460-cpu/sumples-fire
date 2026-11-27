export const AMBIENT_LAYERS = ['fire', 'rain', 'wind', 'waves', 'stream', 'insects'] as const;

export type AmbientLayerId = (typeof AMBIENT_LAYERS)[number];
export type AmbientMix = Record<AmbientLayerId, number>;

export const AMBIENT_LABELS: Record<AmbientLayerId, string> = {
  fire: '火の音',
  rain: '雨だれ',
  wind: '夜の風',
  waves: '波音',
  stream: 'せせらぎ',
  insects: '虫の声',
};

export const makeAmbientMix = (levels: Partial<AmbientMix> = {}): AmbientMix => ({
  fire: 0, rain: 0, wind: 0, waves: 0, stream: 0, insects: 0, ...levels,
});

export const hasAmbientSound = (mix: AmbientMix) => AMBIENT_LAYERS.some((layer) => mix[layer] > 0);

export const AMBIENT_PRESETS = [
  { id: 'hearth', label: '薪のはぜる音', mix: makeAmbientMix({ fire: 70 }) },
  { id: 'rain', label: '雨の余韻', mix: makeAmbientMix({ fire: 35, rain: 58 }) },
  { id: 'shore', label: '波打ち際', mix: makeAmbientMix({ waves: 72, wind: 24 }) },
  { id: 'brook', label: '渓流のそば', mix: makeAmbientMix({ stream: 66, rain: 18 }) },
  { id: 'night', label: '夏の宵', mix: makeAmbientMix({ insects: 52, wind: 24, fire: 36 }) },
] as const;
