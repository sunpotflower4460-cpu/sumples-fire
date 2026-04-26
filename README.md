# Sumples Fire

小さなアイデアやタスクを火種として記録するミニWebアプリです。

このリポジトリは、GitHub / Vercel を使った安全ゲート付き開発フローのテスト用に作成しています。

## アプリ概要

Sumples Fire は、まだ形になっていない思いつき、タスク、音楽の断片、暮らしのメモを保存する小さなWebアプリです。

## 主な機能

- メモの追加
- メモの一覧表示
- カテゴリ選択
- 重要度選択
- 完了 / 未完了の切り替え
- 削除
- フィルター
- 統計表示
- localStorage保存
- スマホ対応UI

## 使用技術

- Vite
- React
- TypeScript
- CSS
- localStorage
- GitHub Actions
- Vercel

## ローカル起動

1. npm install
2. npm run dev

## 型チェック

npm run typecheck

## ビルド

npm run build

## Vercel設定

- Framework Preset: Vite
- Build Command: npm run build
- Output Directory: dist

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
