# Fire Task Plus — StoreKit テスト手順

商品 ID は `com.sunpotflower.sumplesfire.plus` です。App Store Connect の提出準備中の商品は、非消耗型の買い切りで、日本向けに800円です。

## 1. ローカル StoreKit テスト

[ネイティブ確認のコマンド](../IOS_RELEASE.md#8-ネイティブ確認と撮影)で `AppStoreQA` スキームを専用の iPhone シミュレータに対して実行します。`testLocalStoreKitPurchaseRestoreAndRefund` は Release の WebView からネイティブの StoreKit 2 ブリッジを通って、商品の表示価格、購入、再起動後の利用権、購入の復元、返金を確認します。

Xcode の Run で操作する場合も `AppStoreQA` を選びます。スキームの Run に `Configuration.storekit` を設定してあります。StoreKit Transaction Manager で承認待ち、返金、エラーをシミュレートできます。配布用の `App` スキームは通常の StoreKit を使います。

## 2. Sandbox（実機）

1. `App` スキームの Release を、明示的な App ID `com.sunpotflower.sumplesfire` の開発プロファイルで署名して iPhone にインストールします。
2. 設定の Fire Task Plus から「くわしく見る」を開き、日本のストアで800円が表示されることを確認します。商品設定の反映には最大1時間かかる場合があります。
3. Sandbox Apple Account でサインインし、購入シートに `[Environment: Sandbox]` と表示された状態でテスト購入します。通常の Apple Account からサインアウトする必要はありません。
4. アプリの再起動後に Plus が使えることを確認し、「購入を復元」を実行します。

[Apple の実機 Sandbox テスト手順](https://developer.apple.com/documentation/storekit/testing-in-app-purchases-with-sandbox)

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

## 4. App Store Connect と配布

- Apple Developer へのログイン、署名・プロビジョニング、Paid Apps 契約
- App Store Connect で非消耗型商品の登録（参照名、商品ID、価格、ローカライズ、審査用スクリーンショット）
- [現行版の掲載文、プライバシー回答、審査メモ](../APP_STORE_SUBMISSION.md)の登録
- TestFlight で Sandbox 購入・復元を実機確認
- 審査に商品を添付して提出
