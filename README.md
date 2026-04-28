# Fire Task

やりたくないタスクを、終わったらFireして炭に変えるタスクアプリです。

このリポジトリは、GitHub / Vercel を使った安全ゲート付き開発フローのテスト用に作成しています。

## アプリ概要

Fire Task は、先延ばししていること、面倒なこと、やりたくないことを短く書いておき、終わったら `Fire` ボタンで燃やすタスクアプリです。

タスクは緊急度と重要度で自動分類され、燃やしたタスクは炭になり、炭ポイントとして残ります。

## 主な機能

- 燃やしたいタスクの追加
- 緊急度 / 重要度の設定
- 緊急度重要度マトリクスによる自動分類
- 自動並び替え
- 最初の一歩の記録
- タスクの重さ選択
- Fireボタンで燃焼中演出を挟んで燃焼済みにする
- 炭ポイントの加算
- 炭履歴の表示
- 未燃焼 / 今日やる / 燃焼済みの絞り込み
- 削除前の確認
- 保存 / 燃焼 / 削除のフィードバック
- localStorage保存
- スマホ対応UI

## Phase 15: Fireコンセプト導入

- メモ帳アプリからFireタスクアプリへコンセプトを変更
- `burned`, `burnedAt`, `ashPoints`, `difficulty` をデータ構造に追加
- 既存メモは未燃焼タスクまたは燃焼済みタスクとして安全に読み込み
- `Fire` ボタンでタスクを燃焼済みに変更
- タスクの重さに応じて炭ポイントを付与
- 炭ポイント合計と燃やした履歴を表示

## Phase 16: 緊急度重要度マトリクスと燃焼アニメーション土台

- アプリ名を `Fire Task` に変更
- `urgency`, `importance`, `quadrant` をデータ構造に追加
- 緊急度と重要度から4象限を自動判定
- 未燃焼タスクをマトリクス順に自動並び替え
- ホームに4象限サマリーを表示
- カードに分類ラベルを表示
- Fireボタン押下時に短い燃焼中状態を挟む
- CSSベースの燃焼アニメーション土台を追加
- 本格SEは次フェーズで実装予定

## 保存仕様

- タスクは端末内の `localStorage` に保存します
- アプリやブラウザを閉じて開き直してもタスクは残ります
- 保存データは `sumples-fire-seeds-v2` キーで管理します
- 旧キー `sumples-fire-seeds-v1` からの読み込みにも対応します
- 保存データが壊れている場合は安全に空配列へ戻します
- localStorageが利用できない端末では保存失敗の通知を表示します

注意: アプリ自体をアンインストールした場合や、ブラウザのサイトデータを削除した場合は、端末内保存データも消える可能性があります。

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
- Phase 11: Mobile App Shell化
- Phase 12: Global Usability Polish
- Phase 13: App Store提出前 UI/UX自然化
- Phase 14: 起動タイトルと保存信頼性の強化
- Phase 15: Fireコンセプト導入
- Phase 16: 緊急度重要度マトリクスと燃焼アニメーション土台

## 次の候補

- Phase 17: Web Audio APIによるFire SE
- Phase 18: 炭ポイント体験と達成感の磨き込み
- Phase 19: Capacitor依存関係の追加とiOSプロジェクト生成
