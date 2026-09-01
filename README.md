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
- Web Audio APIによるFire SE
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

## Phase 17: Fire SE

- 外部音源なしでWeb Audio APIによりSEを合成
- Fire操作時に着火音、パチパチ音、炭化音、報酬音を鳴らす
- iPhone/スマホ制約を考慮し、ユーザー操作起点のFireボタンから再生
- 音量は控えめにし、耳に痛くない短い音に調整
- APIキー、外部音源、外部通信は使わない

## UI/UX強化: 立体的な質感とアニメーションの追加

- タスクカード・ボタン・下部ナビ・下からのシートに3Dの傾き/奥行きを追加
- カード出現やシート表示を、紙が持ち上がるような立体的な動きに変更
- 背景にごく控えめな熾火の粒子アニメーションを追加
- 炎アイコンにゆらぎ、Fireボタンにアンバー色の光沢アニメーションを追加
- `prefers-reduced-motion` 設定時は、これらの演出をすべて静的な表示に戻す

## UI/UX強化: 指に追従するモーションと画面遷移

- カードとフォームの選択肢が、カーソル位置に合わせてリアルタイムに3D傾斜（光沢も追従）
- 今日 / 炭 / 設定 のタブ切り替えを、奥行きのあるクロスフェードに（スクロール位置は保持）
- 入力シートを指で下げると、その分だけ実際に動いて離すと戻る
- スクロール量に連動してヘッダーが引き締まり、熾火の背景が視差で動く
- ご褒美の瞬間だけ華やかに: 称号アップ、焚き火のステージアップ、連続日数の更新、炭ポイントのカウントアップ
- 燃焼演出は構造とタイミングを変えず、周辺減光と奥行きの仕上げのみ追加

### 同時に直したもの

- ヘッダー / タブバー / 追加ボタン / シートの背景が `position: relative` に上書きされ、画面に固定されていなかった問題を修正
- 追加ボタンの「＋」アイコンが「−」に見えていた問題を修正（擬似要素の衝突）

## UI/UX強化: 見やすさ・わかりやすさの磨き込み

- 大きな見出し（ホームの導入文、燃え尽き後のメッセージ、炭アーカイブの空表示、今日の火種の見出し）で、日本語の複合語やことばの途中で改行されていた問題を修正
  - 固定文言は自然な切れ目（読点など）で明示的に改行するように変更
  - タスクのタイトルなど内容が読めない見出しでは、行の長さを揃えようとして単語を分断する `text-wrap: balance` を外し、単語が分断されにくい標準の折り返しに変更
- 設定画面で「Fireサウンドを切り替えられます」という同じ内容が3箇所で繰り返されていたのを1箇所に整理
- 保存先の説明（この端末に保存されます）が2箇所に分かれていたのを整理し、サウンド設定欄には保存件数のみを残す形に変更
- タスクの初期値（優先度・重さ）を説明する文言が折りたたみの見出しと本文で二重に書かれていたのを、本文側は「自動判定ではない」という新しい情報だけに絞る形に整理

## 保存仕様

- タスクはこの端末内に保存されます
- アカウント登録は不要です
- アプリを閉じて開き直してもタスクは残ります
- 保存データは `sumples-fire-seeds-v2` キーで管理します
- 旧キー `sumples-fire-seeds-v1` からの読み込みにも対応します
- 保存データが壊れている場合は安全に空配列へ戻します
- 端末内ストレージが利用できない場合は保存失敗の通知を表示します
- 内部的には端末内ストレージ（localStorage）を使用します

注意: アプリ削除や端末データ削除時に、端末内保存データも消える場合があります。

## PWA / iOS化準備で追加したこと

- manifest.webmanifest を追加
- theme-color / apple-mobile-web-app 系メタ情報を追加
- viewport-fit=cover と safe-area 対応を追加
- App Store 用を含む PNG アイコンセットを追加（`public/icons/`）
- プライバシーポリシー公開ページを追加（`/privacy.html`）
- サポート公開ページを追加（`/support.html`）
- Capacitor / iOS化の次ステップ文書を追加
- App Store提出前チェックリストを追加
- PRテンプレートを追加
- lint / test / typecheck / build の品質ゲートを追加

## 使用技術

- Vite
- React
- TypeScript
- CSS
- Web Audio API
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

詳しくは `docs/CAPACITOR_NEXT_STEPS.md` と `docs/APP_STORE_READINESS_CHECKLIST.md` を参照してください。

## 安全方針

今回のMVPでは、外部API、認証、DB接続、課金、APIキー、token、.env は使っていません。

保存は端末内ストレージのみです。外部送信・アカウント不要・端末内保存の方針です。

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
- Phase 17: Web Audio APIによるFire SE

## 次の候補

- Phase 18: 炭ポイント体験と達成感の磨き込み
- Phase 19: Capacitor依存関係の追加とiOSプロジェクト生成
