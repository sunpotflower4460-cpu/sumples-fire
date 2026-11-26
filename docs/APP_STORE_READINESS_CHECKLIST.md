# App Store 提出前チェックリスト

Sumples Fire を App Store に提出する前に確認する項目です。

このチェックリストは、提出ボタンを押す前の安全ゲートとして使います。

## 1. アプリ本体

- [ ] 起動直後にクラッシュしない
- [ ] iPhoneの縦画面で主要操作ができる
- [x] メモの追加ができる
- [ ] メモの完了切り替えができる
- [ ] メモの削除前確認が出る
- [x] 端末内保存が期待通り動く
- [x] 空状態が不自然ではない
- [x] 仮テキストや開発中の文言が残っていない
- [x] App Storeスクリーンショットに使える画面になっている

## 2. 品質チェック

- [x] npm run lint が成功する
- [x] npm run test が成功する
- [x] npm run typecheck が成功する
- [x] npm run build が成功する
- [ ] GitHub Actions CI が成功する
- [ ] CodeRabbitなどでブロック指摘がない
- [ ] Issue群反映チェック（品質整理）
  - [x] `font-weight: 1000` が残っていない（`900` に統一）
  - [x] `.gitignore` に `*.tsbuildinfo` が追加されている
  - [x] `tsconfig.tsbuildinfo` がGit管理対象から外れている
  - [x] CIの依存インストールが `npm ci` になっている
  - [x] `docs/ui-ux-audit.md` と実装状態が一致している

## 3. アイコン / 表示

- [x] 正式なApp IconをPNGセットで用意する
- [x] Launch Screenを整える
- [x] アプリ名が意図通り表示される
- [x] iPhoneのノッチや下部バーにUIが被らない
- [x] ダークモードで読みにくくならないか確認する

## 4. App Store Connect

ここは手動ゲートです。

- [ ] Bundle IDを作成する
- [ ] App Store Connectで新規アプリを作成する
- [ ] アプリ名を登録する
- [ ] カテゴリを選ぶ
- [ ] 年齢制限を設定する
- [ ] プライバシー情報を入力する
- [ ] スクリーンショットを登録する
- [ ] 説明文、キーワード、サポートURLを登録する
- [ ] 審査メモを必要に応じて書く

補足:
- プライバシーポリシーURL候補: `/privacy.html`
- サポートURL候補: `/support.html`

## 5. 署名 / 配布

ここは手動ゲートです。

- [ ] Apple Developer Teamが正しい
- [ ] Signingが成功している
- [ ] 実機ビルドが成功する
- [ ] Archiveが成功する
- [ ] TestFlightへアップロードできる
- [ ] TestFlightで実機確認する

## 6. 提出前の最終判断

- [ ] これは未完成のデモではなく、ユーザーが使えるアプリになっている
- [ ] 説明文と実際の機能が一致している
- [x] 個人情報や外部送信がないことを確認した
- [ ] もし将来APIやDBを入れる場合、プライバシー表示を更新する
- [ ] 最終提出してよいと判断した

## 追加で対応済みの項目（最終ブラッシュアップ）

- [x] OS がライト設定でも主要テキストが読めるよう、配色をダークに統一
- [x] iOS の App Icon / Launch 画像を Capacitor 既定（青い X）から Fire Task のロゴへ差し替え
- [x] Info.plist 整備（`arm64`、暗号化申告、縦画面固定、ダーク固定、表示名 Fire Task）
- [x] `PrivacyInfo.xcprivacy` を追加しプロジェクトに登録
- [x] iPhone のみ対象に設定
- [x] プライバシー/サポートページに「アプリに戻る」導線を追加
- [x] App Store 用の文言・審査メモ・スクリーンショットを用意（`docs/APP_STORE_SUBMISSION.md`）

提出手順とコピペ用メタデータは `docs/APP_STORE_SUBMISSION.md` を参照してください。

## 現時点の注意

PNG アイコンセットは `public/icons/` に、iOS 用 1024px アイコンと Launch 画像は `ios/App/App/Assets.xcassets/` に反映済みです。
