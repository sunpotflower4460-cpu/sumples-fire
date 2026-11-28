import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('support page contact guidance', () => {
  const supportHtml = readFileSync(resolve(__dirname, '../public/support.html'), 'utf-8');

  it('links to the public support channel and explains that posts are public', () => {
    expect(supportHtml).toContain('https://github.com/sunpotflower4460-cpu/sumples-fire/issues');
    expect(supportHtml).toContain('投稿は公開される');
  });

  it('explains the one-time purchase, entitlement restoration, and Apple billing support', () => {
    expect(supportHtml).toContain('Plus は買い切り');
    expect(supportHtml).toContain('購入を復元');
    expect(supportHtml).toContain('https://support.apple.com/ja-jp/billing');
  });
});
