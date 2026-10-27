# App Store 提出前チェックリスト

Sumples Fire を App Store に提出する前に確認する項目です。

このチェックリストは、提出ボタンを押す前の安全ゲートとして使います。

## 1. アプリ本体

- [ ] 起動直後にクラッシュしない
- [ ] iPhoneの縦画面で主要操作ができる
- [ ] メモの追加ができる
- [ ] メモの完了切り替えができる
- [ ] メモの削除前確認が出る
- [ ] 端末内保存が期待通り動く
- [ ] 空状態が不自然ではない
- [ ] 仮テキストや開発中の文言が残っていない
- [ ] App Storeスクリーンショットに使える画面になっている

## 2. 品質チェック

- [ ] npm run lint が成功する
- [ ] npm run test が成功する
- [ ] npm run typecheck が成功する
- [ ] npm run build が成功する
- [ ] GitHub Actions CI が成功する
- [ ] CodeRabbitなどでブロック指摘がない
- [ ] Issue群反映チェック（品質整理）
  - [ ] `font-weight: 1000` が残っていない（`900` に統一）
  - [ ] `.gitignore` に `*.tsbuildinfo` が追加されている
  - [ ] `tsconfig.tsbuildinfo` がGit管理対象から外れている
  - [ ] CIの依存インストールが `npm ci` になっている
  - [ ] `docs/ui-ux-audit.md` と実装状態が一致している

## 3. アイコン / 表示

- [ ] 正式なApp IconをPNGセットで用意する
- [ ] Launch Screenを整える
- [ ] アプリ名が意図通り表示される
- [ ] iPhoneのノッチや下部バーにUIが被らない
- [ ] ダークモードで読みにくくならないか確認する

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

## 5.5 広告 / アプリ内課金（広告解除）

自動でできる範囲は反映済み、残りは広告アカウント・App Store Connect が必要な手動ゲートです。

反映済み:
- [x] `PrivacyInfo.xcprivacy` を追加（現状は「トラッキングなし・収集なし」。SDK追加時に更新が必要）
- [x] `ITSAppUsesNonExemptEncryption = false` を Info.plist に追加（暗号化の輸出コンプライアンス質問を省略）
- [x] `UIRequiredDeviceCapabilities` を `armv7` から `arm64` に修正
- [x] プライバシーポリシー（`/privacy.html`）に広告・課金の記述を追加

手動 / 未実装:
- [ ] 広告SDKを選んで導入する（例: AdMob）。導入時に `GADApplicationIdentifier`、`SKAdNetworkItems`、`NSUserTrackingUsageDescription` を Info.plist に追加
- [ ] ATT（トラッキング許可）ダイアログと、必要なら同意フォーム（UMP）の実装
- [ ] `PrivacyInfo.xcprivacy` と App Store Connect の「Appのプライバシー」を広告SDKの実態に合わせる（広告データ・識別子・トラッキング）
- [ ] 非消耗型の課金「広告を非表示」を App Store Connect で作成（Paid Apps 契約・銀行/税務情報の登録が必要）
- [ ] 課金実装（購入・**購入の復元ボタン必須**・購入済みなら広告を出さない）
- [ ] 審査メモに、広告の表示位置とテスト方法、課金のテスト手順を書く
- [ ] 広告がタスク操作や Fire ボタンの誤タップを誘発しない配置か確認する（審査で指摘されやすい）
- [ ] 本番広告IDではなくテスト広告IDで確認してから、提出ビルドで本番IDに切り替える

## 6. 提出前の最終判断

- [ ] これは未完成のデモではなく、ユーザーが使えるアプリになっている
- [ ] 説明文と実際の機能が一致している
- [ ] 外部送信が広告SDK以外にないことを確認し、プライバシー情報と一致している
- [ ] もし将来APIやDBを入れる場合、プライバシー表示を更新する
- [ ] 最終提出してよいと判断した

## 現時点の注意

PNG アイコンセットは `public/icons/` に追加済みです。  
App Store 提出時は、Capacitor / Xcode 側の AppIcon Asset Catalog に同等サイズを反映してください。
