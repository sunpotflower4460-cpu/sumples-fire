import { PLUS_BURN_TYPES } from '../lib/fireBurnSpectacle';
import { AMBIENT_LAYERS } from './ambientOptions';
import { CAMPFIRE_PRESETS } from './campfireSets';
import { FLAME_IDS } from './flames';
import { CAMPFIRE_SET_SLOTS } from './plusPreferences';
import { SCENE_IDS } from './scenes';

export const COPY = {
  name: 'Fire Task Plus',
  headline: '好きな炎で、今日を終える。',
  benefitFlameTitle: '好きな炎を選ぶ',
  benefitFlameBody: `Plus専用の${PLUS_BURN_TYPES.length}種類を含む、全${FLAME_IDS.length}種類。`,
  benefitSceneTitle: '自分の焚き火をつくる',
  benefitSceneBody: `${SCENE_IDS.length}つの景色と${AMBIENT_LAYERS.length}つの環境音を組み合わせる。`,
  benefitSetsTitle: '炎と焚き火をセットで選ぶ',
  benefitSetsBody: `おすすめ${CAMPFIRE_PRESETS.length}組み合わせと、マイセット${CAMPFIRE_SET_SLOTS}枠。`,
  benefitHistoryTitle: '積み重ねを眺める',
  benefitHistoryBody: '月別・年間表示でFireの記録をふりかえる。',
  catalogSummary: `炎${FLAME_IDS.length}種類・焚き火セット・月別と年間のふりかえり`,

  tryIt: '試してみる',
  oneTime: '一度の購入。月額料金はかかりません。',
  freeRemains: 'タスクの追加・Fire・炭の記録は、これまでどおり無料です。',
  restore: '購入を復元',
  later: 'あとで',
  close: '閉じる',
  back: '戻る',
  purchased: '購入済み',
  thanks: 'Plusをご購入いただき、ありがとうございます。',
  next: 'さっそく、自分の焚き火を整えてみませんか。',
  setSelected: '選んだ設定を使う',
  finish: '今は閉じる',
  restoreScope: '購入の復元はPlusの利用権のみが対象です。端末内のタスク記録は復元されません。',

  flameTitle: '炎を選ぶ',
  flameAuto: 'おまかせ',
  flameFixed: '炎を固定',
  flameFavorites: 'お気に入り',
  flameShuffle: '全種類シャッフル',
  previewLabel: '試し見',
  previewNoRecord: '試し見では、タスクや炭の記録は変わりません。',

  sceneTitle: '焚き火を整える',
  setsTitle: '焚き火セット',
  sceneSave: 'この焚き火にする',
  soundPlay: '音を再生',
  soundStop: '音を止める',
  soundForeground: 'この画面を見ている間だけ再生します。',

  historyTitle: '月別ふりかえり',
  historyCount: 'Fireした件数',
  historyCharcoal: '炭の合計',
  historyEmpty: 'この月の記録はまだありません。',
  historySample: '表示例',
  historyAvailable: '端末に残っている記録を表示します。',
  historyStart: (date: string) => `月ごとの記録は${date}から表示されます。`,

  storeLoadingPrice: '価格を確認しています…',
  storePriceUnavailable: '現在、購入情報を取得できません。時間をおいてお試しください。',
  storePurchasing: '購入を確認しています…',
  storePending: '購入手続きの完了を待っています。確認でき次第、Plusが使えるようになります。',
  storeFailed: '購入を完了できませんでした。時間をおいて、もう一度お試しください。',
  storeUnverified: '購入情報を確認できませんでした。購入の復元をお試しください。',
  storeRetry: 'もう一度試す',
  storeRestoring: '購入履歴を確認しています…',
  storeRestored: 'Plusの購入を復元しました。',
  storeNothingToRestore: 'Plusの購入が見つかりませんでした。購入時のApple Accountをご確認ください。',
  storeRestoreUnavailable: '今は購入履歴を確認できません。通信状態を確認して、もう一度お試しください。',
  storeRestricted: 'この端末では購入できません。スクリーンタイムなどの購入設定をご確認ください。',
  storeRevoked: 'Plusの購入が取り消されたため、追加機能の利用を停止しました。タスクと炭の記録は残っています。',
  storeChecking: '購入状況を確認しています…',
  storeUnknown: '購入状況を確認できませんでした。通信状態を確認して、購入の復元をお試しください。',
  storeCheckStatus: '購入状況を確認',

  saveSaving: '保存しています…',
  saveSaved: '保存しました。',
  saveFailed: '端末に保存できませんでした。もう一度お試しください。',
} as const;

export const purchaseButtonLabel = (displayPrice: string) => `${displayPrice}でPlusを購入`;
