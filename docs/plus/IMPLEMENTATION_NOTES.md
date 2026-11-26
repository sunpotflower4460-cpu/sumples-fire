# Fire Task Plus — 実装メモと検証結果

更新日：2026年11月26日 / ブランチ `claude/plus-v1.1-pufig7`

設計は [DESIGN.md](DESIGN.md)、実装順は [IMPLEMENTATION_HANDOFF.md](IMPLEMENTATION_HANDOFF.md) を参照。本書は「何をどこに実装したか」と「実際に何を検証し、何を検証していないか」の記録です。

## 1. ブランチと依存関係

- 土台は PR [#122](https://github.com/sunpotflower4460-cpu/sumples-fire/pull/122)（`release/app-store-finalize`、未統合）＋ main の設計資料（883b6c1）。
- **PR #122 が先にマージされる必要があります。** #122 のネイティブ保存（`NativePreferencesDriver`）・移行・UIScene・E2E基盤の上に作っています。
- v1.0 の提出用ブランチには Plus を一切入れていません。v1.0 は完全無料のままです。
- 別ブランチ `claude/sleepy-carson-pufig7`（以前の未統合作業）は含めていません。#122 のライトテーマ修正と競合するためです。

## 2. 構成

| 領域 | 場所 |
| --- | --- |
| 購入状態の純粋な状態遷移（DESIGN §10.2） | `src/plus/storeState.ts` |
| ストア本体（`useSyncExternalStore`、保存の直列化、画面ルート） | `src/plus/plusStore.ts`, `usePlus.ts` |
| 購入サービス（native / 開発用mock / 非対応） | `src/plus/purchaseService.ts`, `nativePurchaseService.ts`, `mockPurchaseService.ts`, `selectPurchaseService.ts` |
| 設定の保存形式・正規化 | `src/plus/plusPreferences.ts`（キー `fire-task-plus-preferences-v1`、`DURABLE_STORAGE_KEYS` に追加済み） |
| 炎の選択（おまかせ／固定／お気に入り） | `src/plus/flames.ts`, `flameChoice.ts`、`useFireSeeds.burnTask` が `resolveBurnSpectacle` を呼ぶ |
| 試し見（実績に触れない） | `BurningRitual` の `preview` prop、`src/plus/ui/useFlamePreview.tsx` |
| 情景・環境音 | `src/plus/ambientSynth.ts`（合成）, `ambientPlayer.ts`（再生・停止）, `ui/SceneBackdrop.tsx`, `ScenePanel.tsx`, `SceneEditorScreen.tsx` |
| 月別ふりかえり | `src/plus/monthlySummary.ts`, `ui/MonthlyScreen.tsx` |
| 画面 | `src/plus/ui/*`, `src/plus/plus.css` |
| ネイティブ StoreKit 2 | `ios/App/App/PlusStorePlugin.swift`, `FireBridgeViewController.swift`, `ios/App/Configuration.storekit` |
| リリースへの混入防止 | `scripts/check-release-bundle.mjs`（`build` / `build:ios` の最後に自動実行） |

## 3. 設計上の判断

- **権利は保存した真偽値から読まない。** 起動のたびに StoreKit の `Transaction.currentEntitlements` で確認します。確認できない（通信失敗・タイムアウト）ときは「未購入」ではなく「不明」とし、Plus の追加機能は適用せず無料の挙動に戻します。以前に検証済みの購入は、確認失敗で取り消しません。
- **保存済みの設定は権利と独立。** 返金・取消でも設定は消さず、適用だけ止めます（炎はおまかせ、情景は夜の焚き火）。再購入・復元で戻ります。
- **保存は端末への書き込み完了後にだけ成功と表示。** `writeConfirmed` はネイティブ書き込みが実際に終わってから解決し、失敗時はキャッシュとミラーを巻き戻します。受付や `flush()` だけでは成功扱いにしません。
- **月別ふりかえりは燃焼済みタスクから導出**（二重の記録なし）。完了時にローカル日付 `burnedLocalDate`（YYYY-MM-DD）を固定するため、タイムゾーンや日付変更後も同じ日に残ります。旧データは一度だけ `burnedAt` から補完し、有効な日時のない記録は推測せず「日付のない記録」として注記します。Undo で `burnedLocalDate` を消し、削除は集計から外れます。
- **音は本人が「音を再生」を押したときだけ。** 画面を閉じる・バックグラウンド・音声中断・購入画面への移動で停止し、自動再開しません。AudioContext は再生ごとに作って停止時に閉じます。
- **購入案内は割り込まない。** Fire・Undo・成長直後を含め、Plus 画面は人が開いたときだけ表示します（購入がバックグラウンドで承認されても画面は出ません）。
- **開発用mockは本番に入らない。** `VITE_PLUS_STORE_MOCK=1` のビルド（`dist-e2e`）だけに存在し、通常ビルドでは定数分岐で除去されます。ネイティブ上ではmock自体が動作を拒否します。`check-release-bundle.mjs` は mock の目印を検出したらビルドを失敗させ、StoreKit ブリッジが無い場合も失敗させます。

## 4. 実際に行った検証（この環境：Linux コンテナ）

詳細な結果は PR の本文を参照してください。ここでは種類のみ。

| 種別 | 内容 |
| --- | --- |
| 単体テスト（Vitest） | 状態遷移、ストア（保存失敗・直列化・割り込みなし）、設定正規化、炎選択（お気に入りで直前を除外）、月別集計（タイムゾーン含む）、音の合成と再生器の停止条件、試し見の隔離（import境界）、確認付き書き込み、購入サービス選択 |
| 静的検証 | `typecheck`、`lint`、`build`、`build:ios`（バンドル検査込み）。mock入りビルドを検査に通すと**失敗する**ことも確認済み |
| E2E（Playwright WebKit、mock購入） | 無料体験の非回帰、購入の各結果（キャンセル・保留・失敗・検証不能・成功・二度押し）、復元3種、価格取得不能・購入制限、返金で追加機能のみ停止、試し見で記録が変わらない、購入後の炎が実Fireに適用され再起動後も保持、保存失敗の表示と再試行、情景と音量の保存、音の停止（画面退出・非表示・中断・購入画面移動）、月別集計とUndo・削除・日付なし記録 |
| 画面確認 | Chromium でスクリーンショット確認（設定カード、紹介、炎選択、情景編集、炭、月別サンプル） |

## 5. 検証していないこと（実機・Apple 側が必要）

- **Swift（`PlusStorePlugin.swift` 等）は一度もコンパイルしていません。** この環境に Swift ツールチェーンがなく、Xcode ビルドができません。API の形は `node_modules` 内の Capacitor ソースと照合しただけです。
- `ios/App/Configuration.storekit` は手書きで、Xcode で開いて読み込めることを確認していません。
- 実際の StoreKit での購入・キャンセル・保留（承認待ち）・復元・返金・`Transaction.updates` は未確認です。E2E の購入は mock であり、**StoreKit との接続を確認したことにはなりません。**
- Sandbox / TestFlight、実機での音（消音スイッチ・音声中断・AirPods等）、GPU描画性能、VoiceOver／文字拡大の実機確認は未実施です。
- App Store Connect の商品登録、Paid Apps 契約、Small Business Program、プライバシー表示の確定は未実施です。

手順は [STOREKIT_TESTING.md](STOREKIT_TESTING.md) と [RELEASE_MANUAL_TEST.md](../RELEASE_MANUAL_TEST.md) の Plus 節を参照。
