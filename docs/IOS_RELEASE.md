# iOS リリース手順と設定の根拠 — Fire Task

Web（Vite + React）を Capacitor 8 で iOS アプリとして配布します。
このドキュメントは「どうビルドするか」「なぜこの設定なのか」「提出までに何が残っているか」をまとめたものです。

最終更新: 2026-09-24（Xcode 26.2 / iOS 26.2 SDK で検証）

---

## 1. ビルドと同期

```bash
npm ci
npm run ios:sync   # vite build --mode capacitor → npx cap sync ios
npm run ios:open   # Xcode で開く
```

- `--mode capacitor` は Cloudflare 用 Vite プラグインを外します。外さないと `wrangler.json`（開発機の絶対パス入り）がアプリに同梱されます。
- `ios/App/App/public` と `capacitor.config.json` は生成物で Git 管理外です。`CapApp-SPM/Package.swift` と `Package.resolved` は Git 管理します。

コマンドラインでの検証（署名なし）:

```bash
# Simulator 向け Release
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  CODE_SIGNING_ALLOWED=NO build

# 実機向け Archive（署名なし・コンパイル確認用）
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -archivePath build/App.xcarchive \
  CODE_SIGNING_ALLOWED=NO archive
```

どちらも警告は `appintentsmetadataprocessor: Metadata extraction skipped. No AppIntents.framework dependency found.`（App Intents 未使用の情報表示）のみ。

## 2. 品質ゲート

| コマンド | 内容 |
|---|---|
| `npm run lint` | ESLint |
| `npm run test` | Vitest（ユニット） |
| `npm run typecheck` | tsc |
| `npm run build` | Web 本番ビルド（Vercel 用） |
| `npm run test:e2e` | Playwright WebKit・iPhone サイズで主要導線とコントラストを検証。初回は `npx playwright install webkit` |

GitHub Actions は `quality`（上4つ）と `e2e` の2ジョブ。

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
| `IPHONEOS_DEPLOYMENT_TARGET` | 15.0 | Capacitor 8 の最小要件。Apple の「iOS 13 以上」要件を満たす |
| `UIRequiredDeviceCapabilities` | arm64 | テンプレートの armv7 は廃止済みアーキテクチャ |
| `ITSAppUsesNonExemptEncryption` | false | 通信も独自暗号もない |
| `CFBundleDevelopmentRegion` | ja | UI は日本語のみ |
| 署名 | Automatic、Team 未設定 | Team は人間が Xcode で選択 |
| Release の `CAPACITOR_DEBUG` | 空（= false） | `debug.xcconfig` は Debug 構成にのみ適用 |
| 権限（カメラ・位置情報など） | なし | 使用していないため Usage Description も不要 |
| App Transport Security | 既定 | 外部通信なし |

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

- Xcode 26 のランタイムログに「UIScene lifecycle will soon be required」が出ます。現行 SDK では警告のみ。Capacitor が UIScene 対応テンプレートを出した時点で追従してください
- 起動直後、WebView がバンドルを読み込むまでの間は HTML の背景色（ライト: クリーム / ダーク: 黒）が表示されます
- Web 版（Vercel）の privacy / support ページが App Store Connect に登録する公開 URL です。main にマージすると更新されます

## 8. 提出までの手順

1. ✅ 自動監査（lint / unit / typecheck / build / audit）
2. ✅ E2E（Playwright WebKit）
3. ✅ Capacitor sync
4. ✅ Simulator（Release）で起動・操作・永続化・移行
5. ✅ `xcodebuild` Release ビルド / 署名なし Archive
6. ⬜ このブランチを main にマージ（Vercel の privacy / support が更新される）
7. ⬜ Xcode で Signing & Capabilities → Team を選択
8. ⬜ iPhone 実機で `docs/RELEASE_MANUAL_TEST.md`
9. ⬜ Product → Archive
10. ⬜ Organizer → Validate App
11. ⬜ Distribute App → App Store Connect → Upload
12. ⬜ TestFlight で内部テスト
13. ⬜ TestFlight 版で `docs/RELEASE_MANUAL_TEST.md` の C・E を再確認
14. ⬜ App Store Connect に `docs/APP_STORE_SUBMISSION.md` の内容を入力
15. ⬜ 審査へ提出
