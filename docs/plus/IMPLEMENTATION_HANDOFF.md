# Fire Task Plus v1.1 実装引き継ぎ

更新日：2026年11月26日

対象：[sunpotflower4460-cpu/sumples-fire](https://github.com/sunpotflower4460-cpu/sumples-fire)

仕様の本体は [DESIGN.md](DESIGN.md)。画面は [SCREEN_DESIGN.pdf](SCREEN_DESIGN.pdf) と [SCREEN_OVERVIEW.png](SCREEN_OVERVIEW.png)。この文書は、設計を既存コードに接続するための補足です。今回行ったのは文書追加のみです。

## 1. 実装を始める前に、先行PRを確認する

| 対象 | 確認した状態 |
| --- | --- |
| main | `bdd871ba174bc8cbc46798e508e0fc5ccabe7476` |
| 提出準備 | PR [#122](https://github.com/sunpotflower4460-cpu/sumples-fire/pull/122)、確認時点で未統合 |
| release branch | `release/app-store-finalize` |
| release head | `1447dc4686beb291a86ea8e5c20a56eae5b60b28` |
| v1.0の方針 | 完全無料。実機確認、署名、TestFlight、審査等は別工程 |
| v1.1の方針 | 既存無料機能を維持し、Plusの3機能を追加 |

依頼書の提出準備・iPhone縦画面・保存方式の前提は、PR #122側に対応しています。mainだけを基準に課金を実装すると、古い保存・ビルド設定へつなぐおそれがあります。

実装時の進め方：

1. ローカル変更を確認し、`origin/main` とPR #122の最新状態を取得する。既存の未コミット作業を上書きしない。
2. PR #122が統合済みなら、その変更を含む最新mainからv1.1専用の作業ブランチを作る。
3. 未統合なら、先行releaseの最新headを含む独立ブランチを作り、main側のこの設計資料も取り込む。mainやreleaseブランチ自体をPlus実装の作業場所にしない。
4. PR #122の未完了作業を確認し、Plusが先行リリースの提出を妨げないように依存関係を実装報告へ書く。無関係なPRのマージやv1.0への課金混入を行わない。
5. 設計追加後も他の更新があり得るため、以下の対応表を着手時のコードで再確認する。

## 2. 先行releaseにある構成を引き継ぐ

確認したreleaseはReact 19、Capacitor 8.5.2、`@capacitor/preferences` 8.0.1。iOSプロジェクトは存在し、Bundle IDは **`com.sunpotflower.sumplesfire`** です。

- `cap init` や `cap add ios` をやり直さず、既存iOSプロジェクトへStoreKit 2の連携を追加する。
- Bundle IDを勝手に変更しない。Plusの商品ID候補は `com.sunpotflower.sumplesfire.plus`。実登録の有無は別に確認する。
- `SceneDelegate`、Privacy Manifest、iPhone縦画面、正式なアイコン／起動画面を維持する。
- iOS専用の `build:ios` と `ios:sync` の経路を維持する。通常のWebビルドをそのままネイティブへ同期しない。
- releaseで修正されたライトテーマのコントラストも維持する。今回のダーク版モックアップだけを理由にライト表示を壊さない。

先行releaseの資料：

- [IOS_RELEASE.md](https://github.com/sunpotflower4460-cpu/sumples-fire/blob/release/app-store-finalize/docs/IOS_RELEASE.md)
- [APP_STORE_SUBMISSION.md](https://github.com/sunpotflower4460-cpu/sumples-fire/blob/release/app-store-finalize/docs/APP_STORE_SUBMISSION.md)
- [RELEASE_MANUAL_TEST.md](https://github.com/sunpotflower4460-cpu/sumples-fire/blob/release/app-store-finalize/docs/RELEASE_MANUAL_TEST.md)

これらは確認時点ではmainにないため、上記はreleaseへのリンクです。統合後は最新版のリポジトリ内資料を読みます。古い `CAPACITOR_NEXT_STEPS.md` や `APP_STORE_READINESS_CHECKLIST.md` はreleaseで置き換えられており、未実施の初期化手順として再実行しません。

## 3. 現行コードとの対応

| 目的 | 主な既存箇所 | 実装上の要点 |
| --- | --- | --- |
| 9種類の炎 | `src/lib/fireBurnSpectacle.ts` | カタログと無料抽選の重みを再利用 |
| Fire開始と報酬 | `src/hooks/useFireSeeds.ts` | `burnTask`で選んだ演出を映像・SEで共有 |
| 燃焼の描画 | `src/components/BurningRitual.tsx`、`src/lib/specialVariants.ts` | CSS・SVG・Framer Motionを再利用。WebGL導入を前提にしない |
| 演出時間 | `src/lib/fireAnimationConstants.ts`、`src/hooks/useBurnSequence.ts` | 通常3000ms、省モーション倍率0.35を共有 |
| Fireサウンド | `src/lib/fireSoundEngine.ts`、`fireSoundSettings.ts` | 選択された演出のsoundProfileと同期 |
| 今日の焚き火 | `src/components/FireCampfire.tsx`、`src/App.tsx` | 今日の無料表示を維持。Plusのために移動・削除しない |
| 炭の既存履歴 | `src/components/AshLegacy.tsx`、`src/lib/ashHistory.ts` | 12件ずつ追加表示して全件に到達する無料導線を維持 |
| 月別集計の元データ | `src/types/fireSeed.ts`、`src/lib/fireSeedModel.ts` | 有効なburnedAtを持つ燃焼済みseedから導出 |
| 正規化・移行 | `normalizeSeed`、`fireSeedStorage.ts` | 新フィールドを再読込で落とさない。既存v1/v2の読込を維持 |
| Undo | `src/lib/fireBurnUndo.ts`、`useFireSeeds.ts` | タスク・炭・連続日数・月集計を整合させる |
| 永続化（release） | `src/lib/appStorage.ts`、`nativePreferencesDriver.ts` | ネイティブ初期化、キー追加、書込失敗を扱う |
| 設定入口 | `src/components/FireSettingsPanel.tsx`、`src/App.tsx` | 第3タブの内部IDはinfo、表示は設定 |
| モーダル・読み上げ | `AppModalIsolation.tsx`、`AppScreenAnnouncer.tsx`、`useFocusTrap.ts` | 背景操作の隔離・フォーカス復帰・読み上げを再利用 |

旧 `docs/ANIMATION_SPEC.md` の4200ms／倍率0.25は現行コードと異なります。Plusのために昔の値へ戻さず、現行定数と映像・音の同期を保ってください。

### 炎の表示名とID

| 表示名 | 既存ID |
| --- | --- |
| 炎 | `normal` |
| 鬼火 | `blueGhost` |
| 黄金の炎 | `golden` |
| 爆炎 | `explosion` |
| 龍の炎 | `dragon` |
| 桜の火 | `cherry` |
| 鉄の火 | `ironFire` |
| 希望の灯 | `voidFire` |
| フェニックス | `phoenixRise` |

固定・お気に入りの選択はこのカタログを使います。無料の `selectBurnSpectacle(difficulty, currentStreak)` は元の挙動を維持します。確認範囲では炎とポイントは分離済みで、難易度の炭は3／5／10／20、称号と成長は累積炭に基づきます。

プレビューでは本物の `burnTask` を呼ばないこと。選んだ炎の見た目と音をサンプル上で描画し、タスク、炭、連続日数、称号、直前の本番演出履歴を変更しないこと。

## 4. 記録と保存を壊さない実装

### 月別表示は既存seedを正にする

現在の `FireSeed` には `title`、`burned`、`burnedAt`、`ashPoints` があります。独立した完了イベントログを新設しなくても月別表示は導出できます。不要な二重保存は増やさず、既存記録の更新・Undo・削除と同じデータを参照します。

- `burned === true` かつ有効な `burnedAt` の記録を集計する。
- 日時のない古い記録を `createdAt` や `updatedAt` から推測しない。日付不明として既存履歴に残す。
- 現地日付・タイムゾーン等のフィールドを追加するときは `normalizeSeed` と移行・Undoも更新する。
- 旧データの日時を現地日付へ変換する基準は一度決めて保持し、端末のタイムゾーン変更で過去実績が移動しないようにする。
- Undo後はその完了を月集計から除外する。再度Fireした場合は有効な完了1件として扱う。
- 炭記録の削除時は月集計も更新し、削除済みタイトルを別ログに残さない。
- `AshLegacy`の80件上限は装飾モザイクだけ。無料履歴の件数制限として解釈しない。
- releaseの `createStarterSeeds` は未燃焼の例タスクを追加する機能。例の追加だけで実績を作らない。

### 新しい設定は共通の保存経路へ

releaseの `getAppStorageDriver()` を使い、iOSだけPlus設定をlocalStorageへ直接書く実装にしません。炎モード、固定ID、お気に入り、情景、各音量等を保存する新キーを `src/lib/appStorage.ts` の **`DURABLE_STORAGE_KEYS` に追加**してください。追加しないと、ネイティブ保存しても次回起動のプリロードに含まれません。

`src/main.tsx` の `initializeAppStorage()` が終わってから初回描画する構造を維持します。旧localStorageからの移行と、移行時に原本を削除しない方針も維持します。

### 保存の受付と完了を区別する

`NativePreferencesDriver.setItem()` はメモリのキャッシュを更新し、実書込を非同期キューへ追加します。`saveStoredSeeds() === true` だけではネイティブ保存が完了したと断定できません。また `flush()` はキューの処理完了を待ちますが、書込失敗を内部でcatchしているため、resolveしただけで成功とも言えません。

Plusの「保存しました」を確定表示する経路では、書込結果と対象を追跡できるようにするか、失敗状態・再試行を明確に扱ってください。既存の `onAppStorageWriteFailure` を見落とさず、データ保存に失敗したのに成功と報告しないこと。大規模な保存方式の入替えは、Plus追加の必須条件にしません。

購入権の根拠はStoreKitの検証結果です。PreferencesやlocalStorageに保存した真偽値で有料機能を恒久解放しないでください。

## 5. 実装する範囲と順番

### Step 1: 基盤の確認と無料の回帰保護

先行releaseの状態を含めて既存テストを確認し、追加→Fire→Undo→記録保存→再起動が維持されることを把握する。火の演出と報酬の既存分離を利用し、購入状態を判断する部分と表示設定を独立させる。

### Step 2: 炎の選択と試し見

9種類、固定、お気に入り、おまかせを実装する。お気に入りは2種類以上なら直前の本番炎を除いて選び、1種類は固定と同じ。0種類は保存不可。映像とSEに同じ選択結果を渡す。

### Step 3: 焚き火の情景と環境音

「今日」の `FireCampfire` を維持し、「炭」に情景領域を追加する。無料の夜の焚き火と、Plusの「星明かりの湖」「雨あがりの森」を用意する。既存の成長を共有し、各情景を新しい成長ゲームとして独立制作しない。

火・雨だれ・夜の風の音量を保存する。音の初期状態は停止。本人が再生を押したときだけ開始し、画面退出・バックグラウンド・中断で止める。再生中フラグは次回起動へ持ち越さない。

### Step 4: 月別ふりかえり

月選択、Fire件数、炭合計、カレンダー、日付ごとの記録を実装する。空白日を失敗として扱わない。無料の既存履歴を制限しない。過去月でも見出しが「今月」のままにならないようにする。

### Step 5: Plus紹介と購入・復元

買い切り1商品、設計価格800円。実際の価格表示は `Product.displayPrice`。設定から紹介・試し見・購入・復元へ進めるようにする。Fire中、Undo中、成長直後、起動直後の自動課金ポップアップは付けない。

StoreKit 2の検証済み購入のみで権利を付与する。起動時の `currentEntitlements`、アプリ外や後から完了する `updates`、本人操作による `AppStore.sync()` を接続する。

キャンセル、保留、購入失敗、価格取得失敗、検証不能、復元で権利なし、既購入オフライン、返金・取消を区別する。通信不能を未購入とみなさない。保留フラグだけで購入を永久に禁止しない。購入の復元が戻すのはPlusの権利で、端末のタスクデータではないことを明記する。

### Step 6: 品質・資料・提出前の残作業

新機能の受入条件を検証し、購入画面の内容とApp Storeの商品説明を一致させる。releaseの「課金なし」「通信を一切行わない」はv1.0の説明なので、v1.1実装後の資料ではApple経由の決済と、タスクを外へ送らないことを区別して更新する。「データ収集なし」と「一切通信しない」を同義にしない。

商品登録前でも、UI・ネイティブ連携のコード・ローカルStoreKitテストの準備を進めてよい。本番登録と実機Sandbox確認が残っていれば、未完了として明確に残す。

## 6. 今回含めない機能

投げ銭、iCloud同期、ウィジェット、別アイコン、日記入力、AI解析、広告・追跡・解析SDK、環境音のバックグラウンド再生はv1.1の範囲外です。販売画面に未実装の将来特典を約束しません。

タスク数・Fire回数・履歴期間の新たな課金制限、炭倍率、成長速度の課金は行いません。購入前の無料試し見は、実タスクと記録から隔離したサンプルにします。

## 7. 実装時の検証

先行releaseの `package.json` に基づくコマンド：

```bash
npm ci
npm run lint
npm run test
npm run typecheck
npm run build
npm run build:ios
npm run test:e2e
```

E2EにはPlaywright WebKitの実行環境が必要です。環境にブラウザがなければ、その準備と実行可否を明示します。iOS同期は適切な環境で `npm run ios:sync` を使います。今回の文書追加で上記アプリ試験を実行したわけではありません。

Plus追加の重点確認：

- 無料のFire、Undo、全履歴への到達、既存9炎の自動出現に回帰がない。
- 炎の選択とプレビューで報酬・実績が増えない。選択した映像とSEが一致する。
- 情景・音量・炎設定が実際のネイティブ再起動後も残る。新キーのプリロードと保存失敗を確認する。
- 月別集計がUndo・削除・旧データ・月末・日付変更と整合する。日付不明を捏造しない。
- 全音声が画面退出とバックグラウンドで停止し、勝手に再開しない。
- 購入成功、キャンセル、保留後成功、検証不能、復元、オフライン、返金・取消を確認する。
- VoiceOver、文字拡大、省モーション、Safe Area、ダーク／ライト、iPhone SE相当の幅で操作できる。
- 既存のシート、モーダル隔離、フォーカス復帰、タブのスクロール位置を壊さない。

テストは挙動の保証に使います。既存にソース文字列を確認するテストがあっても、新しい購入処理や保存整合を文字列一致だけで検証済みにしないでください。

## 8. 手動工程と報告

既存資料にある、Appleアカウントへのログイン、証明書・署名、Archive、TestFlight、App Store Connect操作、審査提出の進行条件を尊重します。今回の設計追加は、それらを実施したことや、公開の承認を意味しません。セッションですでに認められている操作は、その許可の範囲で進めます。

本人操作や実機が必要な工程があっても、実装・自動検証・審査メモ・手順書まで先に完成させます。止める必要がある最後の工程について、画面名、必要な操作、未検証事項を具体的に示します。

最終報告は、変更した機能、実行した検証と結果、実機／Sandboxで確認したこと、未実施事項、コミットとPRを区別して記載します。テスト用の模擬購入を本番の購入接続済みと報告せず、実機で確認していない挙動を実機確認済みとしません。

## 9. この文書の確認範囲

mainとPR #122の上記SHAを読取確認して作成しました。PR #122の説明にあるSimulator・Archive・E2E等の過去の結果は、今回は再実行していません。商品登録、Apple契約、小規模事業者プログラムの申請・承認、実機購入は未確認です。

今回の設計資料をmainへ追加する変更に、アプリコード、依存関係、iOS設定、課金接続、PR #122のマージを含めていません。
