import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('support page contact guidance', () => {
  const supportHtml = readFileSync(resolve(__dirname, '../public/support.html'), 'utf-8');

  it('lists multiple contact options for general users', () => {
    expect(supportHtml).toContain('GitHub Issues');
    expect(supportHtml).toContain('App Store レビュー');
    expect(supportHtml).toContain('いずれかの方法でお知らせください');
  });
});
