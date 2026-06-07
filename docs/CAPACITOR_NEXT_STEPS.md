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
- PNG アイコンセット `public/icons/` 追加（App Store 1024含む）
- lint / test / typecheck / build のCI準備
- `StorageDriver` 抽象インターフェースを定義済み（`src/lib/storageDriver.ts`）
- `WebLocalStorageDriver` 実装済み（`src/lib/webLocalStorageDriver.ts`）

## まだ自動化しないこと

以下は勝手に進めません。

- Apple Developer Program のログイン
- Bundle ID の作成
- 証明書や署名設定
- Xcode の Archive
- TestFlight アップロード
- App Store Connect の新規アプリ作成
- App Store 審査提出

## CapacitorPreferencesDriver の追加方法

Capacitor Preferences はネイティブ側の非同期 API なので、追加時は次の手順を検討してください。

### 1. ドライバを作成する

`src/lib/capacitorPreferencesDriver.ts` を新規作成し、`StorageDriver` インターフェースを実装します。

```typescript
import { Preferences } from '@capacitor/preferences';
import type { StorageDriver } from './storageDriver';

/**
 * 同期的に見せるため、アプリ起動時にすべてのキーをプリロードしておきます。
 * `initialize()` を呼び出してから利用してください。
 */
export class CapacitorPreferencesDriver implements StorageDriver {
  private cache = new Map<string, string>();

  async initialize(keys: string[]): Promise<void> {
    await Promise.all(
      keys.map(async (key) => {
        const { value } = await Preferences.get({ key });
        if (value !== null) this.cache.set(key, value);
      }),
    );
  }

  getItem(key: string): string | null {
    return this.cache.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.cache.set(key, value);
    // 非同期で書き出し（失敗はサイレントに無視）
    void Preferences.set({ key, value }).catch(() => {});
  }
}
```

### 2. ドライバを登録する

`src/hooks/useFireSeeds.ts` の `getWebStorageDriver()` 呼び出しを、起動時に初期化した `CapacitorPreferencesDriver` インスタンスに差し替えます。

### 3. 既存キーの移行

次のキーが既に存在します。`initialize()` に渡すキー一覧に含めてください。

| キー | 用途 |
|------|------|
| `sumples-fire-seeds-v2` | タスク一覧 |
| `sumples-fire-seeds-v1` | レガシーキー（読み込み専用） |
| `sumples-fire-streak-v1` | ストリーク |
| `fire-task-sound-enabled-v1` | 音設定 |

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
- App Icon が Xcode Asset Catalog に取り込まれているか（`public/icons/app-store-icon-1024.png` など）
- Launch Screen が最低限整っているか
- 実機でクラッシュしないか
- ローカル保存が期待通り動くか

## 注意

Capacitor / Xcode化時は `public/icons/` の PNG セットを iOS 側の AppIcon に反映してください。
