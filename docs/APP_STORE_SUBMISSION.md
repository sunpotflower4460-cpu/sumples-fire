# Fire Task 1.1 の App Store 提出情報

現行の Fire Task Plus を含む iPhone 版の入力原稿です。Apple アカウントの情報、価格と配信地域は App Store Connect で確認してください。

更新日 2026年11月28日

## アプリ情報

| 項目 | 入力内容 |
| --- | --- |
| アプリ名 | Fire Task。名称の空き状況は App Store Connect で確認 |
| サブタイトル | やりたくないタスクを、燃やして終わらせる |
| Bundle ID | com.sunpotflower.sumplesfire |
| SKU | sumplesfire-ios（新規登録時の候補） |
| バージョンとビルド | 1.1 (1)。登録済みのビルド番号と重複する場合は番号を上げて再 Archive |
| 主言語 | 日本語 |
| 対応端末 | iPhone、縦画面、iOS 15.0 以降 |
| 価格 | アプリ本体は無料 |
| アプリ内購入 | Fire Task Plus（非消耗型の買い切り） |
| プライマリカテゴリ | 仕事効率化 |
| 著作権 | 2026 に続けて、Apple Developer アカウントで使う権利者名を入力 |

### プロモーションテキスト

> 先延ばししていること、気が重いこと。書いておいて、終わったら「Fire」。燃やした分だけ炭が積み上がり、焚き火が育ちます。アカウント登録不要。基本機能は無料です。

### 説明文

    Fire Task は、やりたくないタスクを「燃やして終わらせる」ためのタスクアプリです。

    ■ 書く
    先延ばししていることや気が重いことを、名前だけでさっと追加。
    「最初の一歩」を書いて、次にすることを決めておけます。

    ■ 今日の火種を選ぶ
    緊急度と重要度でタスクを4象限に分類します。今日取りかかるタスクは「今日の火種」で確認できます。

    ■ 終わったら Fire
    「完了したら Fire」を押すと、燃焼の演出とともにタスクが炭ポイントになります。直後なら「元に戻す」で取り消せます。

    ■ 炭の記録を振り返る
    燃やしたタスク、炭ポイント、称号、連続日数を「炭」画面で確認できます。

    ■ Fire Task Plus（アプリ内購入・買い切り）
    22種類の炎から選び、固定、お気に入り、全種類シャッフルを使えます。
    9つの景色と6種類の環境音を組み合わせ、焚き火セットを使ったり、マイセットを4枠まで保存したりできます。
    端末に保存された記録は、月別・年間表示で振り返れます。購入前に炎や景色、セット、ふりかえりの表示例を試せます。
    タスクの追加、Fire、炭の記録は無料です。

    アカウント登録は不要です。タスクや設定は端末に保存されます。
    ライト／ダークモードに対応。効果音は設定からオフにできます。

### キーワード

    タスク管理,ToDo,先延ばし,やること,焚き火,優先順位,チェックリスト

### アップデートの内容

すでに App Store で旧版を配信している場合に入力します。

> 買い切りの Fire Task Plus を追加しました。炎の選択やシャッフル、景色と環境音を組み合わせた焚き火セット、月別と年間のふりかえりを使えます。設定から購入前に試すことができます。

[Apple の掲載情報と文字数の仕様](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information)

## 公開 URL とプライバシー

| 項目 | URL |
| --- | --- |
| プライバシーポリシー | https://sumples-fire.vercel.app/privacy.html |
| サポート | https://sumples-fire.vercel.app/support.html |

両 URL とサポート先の GitHub Issues は 2026年11月28日に HTTP 200 を確認しました。現行版の説明はリポジトリの HTML に反映済みです。Web 版への反映後に公開ページの内容を再確認してください。配信地域で連絡先の開示が求められる場合は、公開できる窓口をサポートページに掲載してください。

| App Privacy | 入力案と根拠 |
| --- | --- |
| データの収集 | なし。タスク、完了履歴、設定は端末内に保存 |
| トラッキング | なし。広告・広告識別子・アクセス解析 SDK は同梱なし |
| 購入 | Apple の StoreKit が処理。アプリは端末上で商品情報と検証済みの利用権を扱う。入力したタスク、Apple Account の認証情報、支払い情報を開発者へ送信する実装はない |
| 輸出コンプライアンス | Info.plist の ITSAppUsesNonExemptEncryption は false。アプリ独自の暗号実装はなく、StoreKit など OS 標準機能を使用 |

[Apple の App Privacy 申告ガイド](https://developer.apple.com/app-store/app-privacy-details/) ・ [輸出コンプライアンスの説明](https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance/)

## 年齢制限の回答資料

- 暴力、性的表現、薬物、ホラー、ギャンブル、コンテストはありません。炎はタスクの完了を表す演出です。
- 入力したタスクは私的な記録です。公開や共有、メッセージ、ユーザー間の交流機能はありません。
- 無制限の Web ブラウズ機能、広告、位置情報共有、デート・恋愛機能、年齢確認はありません。
- Apple の買い切りアプリ内購入があります。最終的な年齢区分は App Store Connect が回答に基づき算出します。

[Apple の年齢制限の定義](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/)

## In-App Purchase の登録情報

| 項目 | 入力内容 |
| --- | --- |
| 種類 | Non-Consumable（非消耗型） |
| Product ID | com.sunpotflower.sumplesfire.plus |
| 管理用参照名 | Fire Task Plus Lifetime Unlock |
| 日本語の表示名 | Fire Task Plus |
| 日本語の説明 | 22種の炎、焚き火セット、月別・年間ふりかえりを買い切りで。 |
| 価格候補 | 日本を基準ストアに 800円。選べる価格ポイントと配信先は App Store Connect で確認 |
| ファミリー共有 | オフ（現行設計） |
| 審査用画像 | 提出素材の In-App Purchase 用画像。設定から開いた購入画面と購入ボタンを表示 |
| 審査メモ | 下記の App Review メモの「In-app purchase」部分を使用 |

初回の非消耗型商品は、アプリのバージョンと同じ審査提出に含めます。商品登録・Sandbox 検証には明示的な App ID、Paid Apps 契約、税務と銀行情報の有効化が必要です。

[Apple の商品情報の仕様](https://developer.apple.com/help/app-store-connect/reference/in-app-purchases-and-subscriptions/in-app-purchase-information) ・ [初回のアプリ内購入の提出手順](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-in-app-purchase/)

## App Review メモ

アプリのサインインは不要です。審査連絡先の氏名、国際形式の電話番号、メールアドレスを App Store Connect に登録してください。

    Fire Task is a Japanese-language task app. No app account or sign-in is required.

    Free task flow
    1. In Today (今日), tap 最初のタスクを書く or the plus button. Enter a title, then tap タスクを薪にする.
    2. Tap 完了したら Fire to complete the task. The animation is followed by a charcoal reward. Tap 元に戻す in the completion banner to undo it.
    3. Open 炭 to view completed tasks and Settings (設定) for sound preferences, privacy policy, and support.

    In-app purchase
    Fire Task Plus is a one-time non-consumable purchase with product ID com.sunpotflower.sumplesfire.plus.
    Open Settings (設定), then Fire Task Plus > くわしく見る. Scroll down within the Plus screen for the localized price, purchase button, and 購入を復元 (Restore Purchase).
    Before purchasing, you can preview the 22 flames, 9 campfire landscapes, 6 ambient sounds, 6 presets, and sample monthly and yearly reviews.
    The purchase unlocks flame selection, favorites and shuffle, saved scene audio mixes, campfire presets and four custom slots, and reviews of completion records on the device. Restore Purchase restores the Plus entitlement. Task records are stored on the device.

## スクリーンショット

Release アプリを iPhone シミュレータで起動して撮影し、PNG の寸法と表示内容を確認しました。iPhone 向けの設定であるため iPad 掲載画像は不要です。

- iPhone 17 Pro（Dynamic Island、中サイズ）。1206 × 2622 px、下表の順に6枚。[iPhone 17 Pro の掲載画像](app-store-screenshots/1.1/iphone-17-pro/)
- iPhone 17 Pro Max（Dynamic Island、大サイズ）。1320 × 2868 px、今日、入力、設定、Plus の順に4枚。[iPhone 17 Pro Max の掲載画像](app-store-screenshots/1.1/iphone-17-pro-max/)

| 掲載順 | 画像名 | 内容 |
| --- | --- | --- |
| 1 | 01-home | 今日の火種と優先度 |
| 2 | 02-fire-ritual | 完了時の燃焼演出 |
| 3 | 03-ash-archive | 炭ポイントと完了記録 |
| 4 | 04-capture | 名前でタスクを追加 |
| 5 | 05-settings | 設定と Fire Task Plus への入口 |
| 6 | 06-plus | Fire Task Plus の炎を購入前に試す画面 |

商品審査には、Plus の購入ボタンを表示した画像を App Review Screenshot に添付します。[iap-review.png](app-store-screenshots/1.1/iap-review.png)

[Apple のスクリーンショット仕様](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/)

## App Store Connect で確認する項目

1. Apple Developer のチームと明示的な App ID、配布署名
2. App の登録状況、ビルド番号、権利者名、審査連絡先、価格と配信地域
3. Paid Apps 契約、Fire Task Plus の商品登録、実機の Sandbox 購入・復元
4. 更新した公開のプライバシーポリシーとサポートページ、App Privacy と年齢制限の回答
5. 署名付き Archive の検証、アップロード、TestFlight の確認
6. アプリバージョン、最初の Fire Task Plus 商品、審査メモとスクリーンショットの提出

[Apple の App Review 提出手順](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app/)
