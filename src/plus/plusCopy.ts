/**
 * All Fire Task Plus wording, taken from docs/plus/DESIGN.md §9. One place so
 * the purchase screen, the settings card, the App Store text and the review
 * notes cannot drift apart.
 */
export const COPY = {
  name: 'Fire Task Plus',
  headline: '好きな炎で、今日を終える。',
  description: '炎を選び、焚き火を整え、終えたことを眺める。いつものFireを、あなた好みに。',

  benefitFlameTitle: '好きな炎を選ぶ',
  benefitFlameBody: '9種類から、いつもの炎を。お気に入りだけで楽しむこともできます。',
  benefitSceneTitle: '自分の焚き火をつくる',
  benefitSceneBody: '星明かりの湖や、雨あがりの森へ。景色と音を、好きな組み合わせに。',
  benefitHistoryTitle: '積み重ねを眺める',
  benefitHistoryBody: '月ごとのカレンダーで、終えたことと炭の記録をふりかえれます。',

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
  flameFixed: 'この炎を使う',
  flameFavorites: 'お気に入りから',
  flameFavoritesEmpty: '1つ以上選んでください。',
  previewLabel: '試し見',
  previewNoRecord: '試し見では、タスクや炭の記録は変わりません。',
  previewPlusSave: 'Plusで、この設定を使えます。',
  freeAutoStillShowsAll: '無料のおまかせでも、9種類が現れます。',

  sceneTitle: '焚き火を整える',
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
