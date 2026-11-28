# iOS リリース手順と設定の根拠 — Fire Task

Web（Vite + React）を Capacitor 8.5 で iOS アプリとして配布します。
このドキュメントは「どうビルドするか」「なぜこの設定なのか」「提出までに何が残っているか」をまとめたものです。

更新日 2026年11月28日（Xcode 26.2 / iOS 26.2 SDK）

現行の提出候補は Fire Task Plus を含む 1.1 (3) です。掲載文と審査メモは [App Store 提出情報](APP_STORE_SUBMISSION.md) にあります。Xcode 26.2 / iOS 26.2 SDK は確認時点の提出要件を満たします。

[Apple の SDK 要件](https://developer.apple.com/news/upcoming-requirements/)

### 今回のローカル検証

- ビルド 3 は lint、型検査、Web 本番ビルド、iOS 向けバンドルの監査、単体テスト 434 件、WebKit E2E 50 件を通過しました。npm 監査の検出は 0 件です。
- iPhone 17 Pro のローカル StoreKit テストで、価格取得、購入、再起動後の利用権、復元、返金を確認しました。StoreKit の通知が購入・復元と重なった場合は利用権を再確認し、アプリを再表示したときも最新の利用権を取得します。
- iPhone SE（第3世代）のシミュレータで、ソフトウェアキーボードを開いたままの保存、再起動後の保存、Fire と取り消しを確認しました。
- 専用の開発プロファイルで署名したビルド 3 の arm64 Archive で、プライバシーマニフェスト 3 件、配布する依存ライブラリのライセンス、テスト用 StoreKit ファイル・模擬購入コードの除外を照合しました。iPhone SE（第3世代）の実機で上書きインストールと起動を確認しました。実機での Apple Sandbox の購入・復元はテスターの作成とサインイン後に確認します。

---

## 1. ビルドと同期

```bash
npm ci
npm run ios:sync   # vite build --mode capacitor → npx cap sync ios
npm run ios:open   # Xcode で開く
```

- `--mode capacitor` は Cloudflare 用 Vite プラグインを外します。外さないと `wrangler.json`（開発機の絶対パス入り）がアプリに同梱されます。
- `ios/App/App/public` と `capacitor.config.json` は生成物で Git 管理外です。`CapApp-SPM/Package.swift` と `Package.resolved` は Git 管理します。
- 配布する依存ライブラリのライセンスは `public/third-party-notices.txt` にまとめ、iOS と Web の両方に同梱します。

コマンドラインでの検証（署名なし）:

```bash
# Simulator 向け Release
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  CODE_SIGNING_ALLOWED=NO build

# 実機向け Archive（署名なし・コンパイル確認用）
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -archivePath build/app-store/FireTask-1.1-3-unsigned.xcarchive \
  CODE_SIGNING_ALLOWED=NO archive
```

Archive したアプリ内の Web バンドルも `node scripts/check-release-bundle.mjs <App.app>/public` で監査できます。

## 2. 品質ゲート

| コマンド | 内容 |
|---|---|
| `npm run lint` | ESLint |
| `npm run test` | Vitest（ユニット） |
| `npm run typecheck` | tsc |
| `npm run build` | Web 本番ビルド（Vercel 用） |
| `npm audit` | npm 依存関係の監査 |
| `npm run test:e2e` | Playwright WebKit・iPhone サイズで主要導線とコントラストを検証。初回は `npx playwright install webkit` |

GitHub Actions は Node.js 24 の `quality`（lint、unit、typecheck、build）と `e2e` の2ジョブ。

## 3. データ保存（重要）

| 環境 | 保存先 | 実装 |
|---|---|---|
| iOS アプリ | UserDefaults（`@capacitor/preferences`、キー接頭辞 `CapacitorStorage.`） | `src/lib/nativePreferencesDriver.ts` |
| Web / PWA | localStorage | `src/lib/webLocalStorageDriver.ts` |

なぜ移行したか: Capacitor 公式ドキュメントは WebView の localStorage を「一時的なものと見なすべき（端末容量が逼迫すると OS が回収する）」としています。タスクはユーザーの唯一のデータなので、iOS ではネイティブ保存を正とします。

- 起動前に全キーをメモリへ読み込み（`initializeAppStorage()`）、以降の読み書きは同期のまま
- 旧バージョン（localStorage 保存）からの移行: ネイティブ側に値がないキーだけ localStorage からコピー。ネイティブ書き込み成功後にのみ使用し、localStorage 側は消さない
- 書き込みは順序を保ってネイティブへ送り、localStorage にも控えを書く。ネイティブ書き込みが失敗したら画面に通知
- 対象キー: `sumples-fire-seeds-v2`（タスク）、`sumples-fire-seeds-v1`（旧形式）、`sumples-fire-streak-v1`（連続日数）、`fire-task-sound-enabled-v1`（効果音）

Simulator での実証（Release ビルド）:
1. 旧 main ビルドでタスク作成 → 新ビルドを上書きインストール → タスクが残り、UserDefaults に移行済み
2. アプリ強制終了 → 再起動 → 残る
3. `Library/WebKit` と `Library/Caches` を削除（OS による WebView データ回収を模擬）→ 再起動 → タスク・連続日数とも復元

## 4. iOS 設定の根拠

| 設定 | 値 | 理由 |
|---|---|---|
| `PRODUCT_BUNDLE_IDENTIFIER` | `com.sunpotflower.sumplesfire` | 既定値を維持 |
| `CFBundleDisplayName` | Fire Task | アプリ内・公開ページの名称と統一 |
| `TARGETED_DEVICE_FAMILY` | 1（iPhone のみ） | UI はスマホ幅専用。iPad では未検証のため対象外（iPad でも iPhone アプリとして動作する） |
| `UISupportedInterfaceOrientations` | Portrait のみ | 横画面レイアウトは未設計 |
| ライフサイクル | UIScene（`SceneDelegate`） | iOS 27 SDK で必須（Apple TN3187） |
| `IPHONEOS_DEPLOYMENT_TARGET` | 15.0 | Capacitor 8 の最小要件。Apple の「iOS 13 以上」要件を満たす |
| `UIRequiredDeviceCapabilities` | arm64 | テンプレートの armv7 は廃止済みアーキテクチャ |
| `ITSAppUsesNonExemptEncryption` | false | 独自の暗号化は使わず、購入通信には Apple の StoreKit を利用 |
| `CFBundleDevelopmentRegion` | ja | UI は日本語のみ |
| 署名 | Automatic、Team 未設定 | 配布に使う Apple Developer チームを Xcode で選択 |
| Release の `CAPACITOR_DEBUG` | 空（= false） | `debug.xcconfig` は Debug 構成にのみ適用 |
| In-App Purchase | 有効 | StoreKit 2 の非消耗型商品。配布には明示的な App ID を使用 |
| 権限（カメラ・位置情報など） | なし | 使用していないため Usage Description も不要 |
| App Transport Security | 既定 | アプリ独自の通信先や例外設定はなし |

## 5. Privacy Manifest（`ios/App/App/PrivacyInfo.xcprivacy`）

調査結果:
- 同梱 SDK: Capacitor.framework / Cordova.framework はそれぞれ自前の PrivacyInfo.xcprivacy を持ち、収集なし・トラッキングなし・Required Reason API なしを宣言
- `@capacitor/preferences` は PrivacyInfo を持たず、SPM で App 実行ファイルに静的リンクされる。`UserDefaults.standard` を使うため、App 側の manifest で申告が必要（ビルド成果物の App バイナリに `_OBJC_CLASS_$_NSUserDefaults` 参照を確認）
- 自前コード（AppDelegate）と Capacitor/Cordova のバイナリに、ファイルタイムスタンプ・ディスク容量・起動時間・キーボード系の Required Reason API 参照なし（`nm` / `strings` で確認）
- WebView 内の JavaScript（localStorage 等）は Required Reason API の対象外

宣言内容:
- `NSPrivacyTracking = false`、`NSPrivacyTrackingDomains = []`
- `NSPrivacyCollectedDataTypes = []`
- `NSPrivacyAccessedAPICategoryUserDefaults` / `CA92.1`（アプリ自身だけが読み書きする情報）

## 6. アイコン・起動画面

- AppIcon: `public/icon.svg` から生成した 1024 × 1024、不透明、角丸なしのフルブリード（iOS がマスク）。以前は Capacitor のプレースホルダーロゴのままだった
- 起動画面: `LaunchScreen.storyboard` + `Splash` 画像（ライト/ダーク別）
- Web 用 PNG アイコン（`public/icons/`）も同じ原本から再生成

## 7. 既知の注意点（提出は阻害しない）

- UIScene ライフサイクル対応済み（Capacitor 8.5 + `npx cap migrate`、`SceneDelegate.swift`）。Apple TN3187 により、iOS 27 SDK（Xcode 27）でビルドする UIScene 未対応アプリは起動しないため。Xcode 26.2 / 27 のどちらでもビルド可能
- `Package.swift` は Preferences プラグインを `node_modules` から参照します。Xcode で Archive する前に必ず `npm ci` と `npm run ios:sync` を実行してください
- 起動直後、WebView がバンドルを読み込むまでの間は HTML の背景色（ライト: クリーム / ダーク: 黒）が表示されます
- Web 版（Vercel）の privacy / support ページが App Store Connect に登録する公開 URL です。main にマージすると更新されます

## 8. ネイティブ確認と撮影

`AppStoreQA` は Release アプリをシミュレータで開くスキームです。タスクを追加して再起動した後、Fire と取り消しを確認します。StoreKit Test では、テスト用商品の価格表示、購入、再起動後の利用権、復元、返金を確認します。

```bash
npm ci
npm run ios:sync
# simulator_id には新規の QA シミュレータの UDID を指定
xcodebuild -project ios/App/App.xcodeproj -scheme AppStoreQA \
  -destination "platform=iOS Simulator,id=$simulator_id" \
  -derivedDataPath build/app-store/DerivedData -parallel-testing-enabled NO \
  -skip-testing:AppStoreUITests/AppStoreUITests/testCaptureStoreScreenshots \
  CODE_SIGN_IDENTITY=- test
```

シミュレータではローカルのアドホック署名を使います。商品ファイルと UI テストはテストターゲットだけに入ります。配布用 Archive には `App` スキームを使います。

スクリーンショットの撮影には、Fire Task の保存データがない専用シミュレータを使います。`scripts/app-store-screenshots.sh "$simulator_id" <App.app>` を実行し、上記の `-skip-testing` を `-only-testing:AppStoreUITests/AppStoreUITests/testCaptureStoreScreenshots` に置き換えます。`-resultBundlePath build/app-store/screenshots.xcresult` を指定すると、次のコマンドで添付画像を取り出せます。

```bash
xcrun xcresulttool export attachments --path build/app-store/screenshots.xcresult \
  --output-path build/app-store/screenshot-attachments
```

商品審査用の画像は、StoreKit テストの `iap-review` 添付から取得します。

## 9. 配布と提出

1. Web 版に更新したプライバシーポリシーとサポートページを反映し、公開 URL を照合します。
2. Apple Developer の明示的な App ID、配布署名、App Store Connect のアプリレコードと Paid Apps 契約を確認します。
3. 署名した Release を実機で確認し、App Store Connect の商品を Sandbox で購入・復元します。[実機確認項目](RELEASE_MANUAL_TEST.md)
4. `App` スキームから配布用 Archive を作成し、Organizer で Validate App を実行して TestFlight にアップロードします。
5. TestFlight の実機確認後、審査メモ、スクリーンショットと初回の Plus 商品を該当バージョンの審査提出に添付します。[提出情報](APP_STORE_SUBMISSION.md)
