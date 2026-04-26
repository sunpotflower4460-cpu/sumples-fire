# Capacitor / iOS 化の次ステップ

このドキュメントは、Sumples Fire を将来 iOS アプリとして包むための手順メモです。

このPRでは、まだ Apple Developer / Xcode / App Store Connect の実操作は行いません。  
アカウント、証明書、署名、提出ボタンに関わる部分はすべて手動ゲートです。

## 現在できている準備

- Vite + React + TypeScript でビルド可能
- `dist` 出力に対応
- `manifest.webmanifest` 追加
- `theme-color` 追加
- `viewport-fit=cover` 追加
- safe-area をCSSで考慮
- 仮アイコン `public/icon.svg` 追加
- lint / test / typecheck / build のCI準備

## まだ自動化しないこと

以下は勝手に進めません。

- Apple Developer Program のログイン
- Bundle ID の作成
- 証明書や署名設定
- Xcode の Archive
- TestFlight アップロード
- App Store Connect の新規アプリ作成
- App Store 審査提出

## 次にCapacitor化する時の予定

### 1. 依存関係を追加

```bash
npm install @capacitor/core
npm install -D @capacitor/cli
```

### 2. Capacitor初期化

```bash
npx cap init
```

推奨値:

- App name: `Sumples Fire`
- App id: `com.sunpotflower.sumplesfire`
- Web asset directory: `dist`

### 3. iOSプロジェクト追加

```bash
npm install @capacitor/ios
npx cap add ios
```

### 4. Webビルドを同期

```bash
npm run build
npx cap sync ios
```

### 5. Xcodeで開く

```bash
npx cap open ios
```

ここから先は手動ゲートです。

## 手動ゲートで確認すること

- Bundle Identifier が正しいか
- Team が自分の Apple Developer アカウントになっているか
- Signing が通っているか
- App Icon が正式PNGに差し替わっているか
- Launch Screen が最低限整っているか
- 実機でクラッシュしないか
- ローカル保存が期待通り動くか

## 注意

現在の `public/icon.svg` は仮アイコンです。App Store提出前には、正式なPNGアイコンセットに差し替える必要があります。
