import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Fire sound switch semantics', () => {
  const source = readFileSync(resolve(__dirname, 'components/FireComfortSettings.tsx'), 'utf-8');

  it('keeps the switch identity stable across on and off states', () => {
    expect(source).toContain("const soundLabelId = 'fire-sound-label';");
    expect(source).toContain('id={soundLabelId}>Fireサウンド</span>');
    expect(source).toContain('aria-labelledby={soundLabelId}');
    expect(source).not.toContain("aria-label={soundEnabled ? 'Fireサウンドをオフにする'");
    expect(source).not.toContain('Fireサウンドをオンにする');
  });

  it('uses switch state for on/off and links the visible explanation', () => {
    expect(source).toContain('role="switch"');
    expect(source).toContain('aria-checked={soundEnabled}');
    expect(source).toContain("const soundDescriptionId = 'fire-sound-description';");
    expect(source).toContain('id={soundDescriptionId}>Fireするときの効果音です。</p>');
    expect(source).toContain('aria-describedby={soundDescriptionId}');
  });

  it('keeps the settings card out of article navigation because it is not standalone content', () => {
    expect(source).toContain('<div className="comfort-settings-card">');
    expect(source).not.toContain('<article className="comfort-settings-card">');
  });

  it('keeps the visible state text and sound glyph for sighted users', () => {
    expect(source).toContain("{soundEnabled ? 'オン' : 'オフ'}");
    expect(source).toContain('<SoundGlyph muted={!soundEnabled} />');
  });
});
