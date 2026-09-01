import { FireComfortSettings } from './FireComfortSettings';

type FireSettingsPanelProps = {
  totalTasks: number;
};

function DisclosureGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m8 10 4 4 4-4" />
    </svg>
  );
}

function LinkGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function FireSettingsPanel({ totalTasks }: FireSettingsPanelProps) {
  return (
    <div className="settings-hub">
      <section className="settings-primary-section" aria-labelledby="settings-comfort-title">
        <div className="settings-section-heading">
          <p className="eyebrow">COMFORT</p>
          <h3 id="settings-comfort-title">快適さ</h3>
        </div>
        <FireComfortSettings totalTasks={totalTasks} />
      </section>

      <details className="settings-disclosure settings-guide">
        <summary>
          <span>
            <strong>使い方</strong>
            <small>迷った時に3ステップを確認</small>
          </span>
          <i aria-hidden="true"><DisclosureGlyph /></i>
        </summary>
        <div className="settings-disclosure-body">
          <ol className="settings-steps">
            <li>
              <strong>タスクを書く</strong>
              <p>やりたくないこと、先延ばししていることを短く書きます。</p>
            </li>
            <li>
              <strong>緊急度と重要度を決める</strong>
              <p>高低を選ぶと、4象限へ自動分類されて燃やす順番が見つけやすくなります。</p>
            </li>
            <li>
              <strong>終わったらFireする</strong>
              <p>完了したタスクは炭の記録へ移り、炭ポイントとして積み上がります。</p>
            </li>
          </ol>
        </div>
      </details>

      <details className="settings-disclosure settings-data">
        <summary>
          <span>
            <strong>データとプライバシー</strong>
            <small>保存場所と取り扱い</small>
          </span>
          <i aria-hidden="true"><DisclosureGlyph /></i>
        </summary>
        <div className="settings-disclosure-body settings-data-copy">
          <div>
            <strong>この端末に保存</strong>
            <p>タスクと設定はこの端末内に保存されます。アカウント登録は不要です。</p>
          </div>
          <div>
            <strong>タスク内容を外部送信しません</strong>
            <p>入力したタスクを運営者のサーバーへ送信する機能はありません。</p>
          </div>
        </div>
      </details>

      <nav className="settings-links" aria-label="公開情報">
        <a href="/privacy.html">
          <span>
            <strong>プライバシーポリシー</strong>
            <small>データの取り扱いを確認</small>
          </span>
          <span className="settings-link-glyph" aria-hidden="true"><LinkGlyph /></span>
        </a>
        <a href="/support.html">
          <span>
            <strong>サポート情報</strong>
            <small>困った時の案内を見る</small>
          </span>
          <span className="settings-link-glyph" aria-hidden="true"><LinkGlyph /></span>
        </a>
      </nav>
    </div>
  );
}
