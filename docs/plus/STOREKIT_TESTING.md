# Fire Task Plus — StoreKit テスト手順

商品ID：`com.sunpotflower.sumplesfire.plus`（非消耗型、設計価格 800円）。Bundle ID は変更しません。**以下は本人の Mac / Apple Developer アカウントで行う作業です。**

## 1. ローカル StoreKit テスト（App Store Connect 登録前でも可）

1. `npm run build:ios && npm run ios:sync` の後、`ios/App/App.xcodeproj` を Xcode で開く。
2. `ios/App/Configuration.storekit` が正しく読み込めることを確認（読み込めない場合は Xcode の StoreKit Configuration で同じ商品を作り直す）。
   - 参照ID `com.sunpotflower.sumplesfire.plus`、種類 Non-Consumable、日本のストア、800円。
3. Scheme → Run → Options → StoreKit Configuration で `Configuration.storekit` を選ぶ（**提出用の Archive では外す／本番ビルドに影響しない設定にする**）。
4. Simulator で実行し、下の確認を行う。Xcode の Debug → StoreKit → Manage Transactions で、承認待ち・返金・購入削除・エラー注入ができる。

## 2. Sandbox（実機）

App Store Connect に商品を登録し（Paid Apps 契約・税務／銀行情報・商品のメタデータ）、Sandbox テスターで確認。

## 3. 確認項目

| 項目 | 期待 |
| --- | --- |
| 価格表示 | ボタンに StoreKit の `displayPrice`（800円と決め打ちしていない） |
| 購入成功 | 御礼画面 → 「選んだ設定を使う」で保存、実Fireに反映 |
| キャンセル | 何も表示せずボタンが戻る |
| 保留（家族の承認待ち等） | 待機メッセージ。承認後、画面を割り込ませずに解放 |
| 検証不能 | 解放しない。「購入の復元をお試しください」 |
| 通信なし起動 | 購入済みなら Plus が使える。未確認の場合は無料の挙動で、タスクは通常どおり |
| 復元 | 設定・紹介画面の「購入を復元」。見つかった／見つからない／確認不能の3種。タスクデータは復元されない旨の表示 |
| 返金／取消 | 追加機能のみ停止し、タスク・炭・保存済み設定は残る |
| 再インストール | 復元後に設定は端末の保存状態に従う（タスクは復元されない） |
| 購入制限（スクリーンタイム） | 購入ボタンなし、理由の表示 |
| Fire / Undo 中 | 購入案内が出ない |

## 4. 審査・提出前の本人作業

- Apple Developer へのログイン、署名・プロビジョニング、Paid Apps 契約
- App Store Connect で非消耗型商品の登録（参照名、商品ID、価格、ローカライズ、審査用スクリーンショット）
- App Store 説明文・審査メモ（DESIGN §9.5）・プライバシー回答の更新（「アプリ内購入あり、Apple決済」。タスクデータは送信しない。**「データ収集なし」と「通信なし」は別**）
- TestFlight で Sandbox 購入・復元を実機確認
- 審査に商品を添付して提出
