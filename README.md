# Sumples Fire

小さなアイデアやタスクを火種として記録し、次の一歩まで育てるミニWebアプリです。

このリポジトリは、GitHub / Vercel を使った安全ゲート付き開発フローのテスト用に作成しています。

## アプリ概要

Sumples Fire は、まだ形になっていない思いつき、タスク、音楽の断片、暮らしのメモを保存する小さなWebアプリです。

ただ記録するだけではなく、火種の温度、育成状態、次の一歩を一緒に残すことで、アイデアを行動へ近づけます。

## 主な機能

- メモの追加
- メモの一覧表示
- カテゴリ選択
- 重要度選択
- 育成状態の選択
- 次の一歩の記録
- 今日の火種表示
- 完了 / 未完了の切り替え
- 削除前の確認
- 保存 / 更新 / 削除のフィードバック
- フィルター
- 統計表示
- localStorage保存
- スマホ対応UI

## App Store品質化で追加したこと

- ヒーローコピーをアプリらしく調整
- 今日の火種パネルを追加
- 火種の育成ステータスを追加
- 温度とステータスの視覚表現を追加
- 次の一歩フィールドを追加
- 削除前確認を追加
- 保存通知を追加
- iPhone幅の余白とタップ領域を改善
- 旧localStorageデータからの簡易移行を追加

## PWA / iOS化準備で追加したこと

- manifest.webmanifest を追加
- theme-color / apple-mobile-web-app 系メタ情報を追加
- viewport-fit=cover と safe-area 対応を追加
- 仮アイコン public/icon.svg を追加
- Capacitor / iOS化の次ステップ文書を追加
- App Store提出前チェックリストを追加
- PRテンプレートを追加
- lint / test / typecheck / build の品質ゲートを追加

## 使用技術

- Vite
- React
- TypeScript
- CSS
- localStorage
- GitHub Actions
- Vercel
- ESLint
- Vitest

## ローカル起動

1. npm install
2. npm run dev

## 品質チェック

npm run lint
npm run test
npm run typecheck
npm run build

GitHub Actions CI でも同じ品質チェックを実行します。

## Vercel設定

- Framework Preset: Vite
- Build Command: npm run build
- Output Directory: dist

## 手動ゲート

以下は勝手に進めません。

- Apple Developer Program へのログイン
- Bundle ID作成
- 証明書 / 署名設定
- Xcode Archive
- TestFlightアップロード
- App Store Connectでの新規アプリ作成
- App Store審査提出
- 正式アプリアイコンの最終差し替え

詳しくは `docs/CAPACITOR_NEXT_STEPS.md` と `docs/APP_STORE_READINESS_CHECKLIST.md` を参照してください。

## 安全方針

今回のMVPでは、外部API、認証、DB接続、課金、APIキー、token、.env は使っていません。

保存はブラウザ内の localStorage のみです。

## Phase

- Phase 0.5: 空リポジトリ初期化
- Phase 1: アプリの器を作成
- Phase 2: モック版として完成
- Phase 2.5: 保存とコンポーネント分割
- Phase 3: CI / Vercel準備
- Phase 4: PRレビューと安全確認
- Phase 5: App Store品質UI polish
- Phase 6: 体験の深さを追加
- Phase 7: 安心感と完成度を改善
- Phase 8: PWA / Capacitor前提の準備
- Phase 9: lint / test / PRテンプレート追加
- Phase 10: App Store提出前チェックリスト作成

## 次の候補

- Phase 11: Capacitor依存関係の追加とiOSプロジェクト生成
- Phase 12: Xcode / TestFlight手動ゲートの実行
- Phase 13: スクリーンショット、説明文、プライバシー情報の提出準備
