import { expect, test, type Page } from '@playwright/test';
import { addTask, fireButton, freshStart } from './helpers';

// Regression guard for "text is there but invisible": fails on any visible
// text below 2:1 against its nearest solid background. (WCAG AA is stricter;
// this threshold only catches the colour-leak class of bug without flaking on
// gradients the heuristic cannot see.)
const findInvisibleText = (page: Page) => page.evaluate(() => {
  const parse = (value: string) => {
    const match = value.match(/rgba?\(([^)]+)\)/);
    if (!match) return null;
    const [r, g, b, a = 1] = match[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r, g, b, a };
  };
  type Rgb = NonNullable<ReturnType<typeof parse>>;
  const luminance = ({ r, g, b }: Rgb) => {
    const channel = (v: number) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };
  const background = (el: Element): Rgb | null => {
    for (let node: Element | null = el; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      const solid = parse(style.backgroundColor);
      if (solid && solid.a > 0.55) return solid;
      if (style.backgroundImage.includes('gradient')) return null; // cannot judge reliably
    }
    return parse(getComputedStyle(document.body).backgroundColor);
  };

  const failures: string[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const text = walker.currentNode.textContent?.trim();
    const el = walker.currentNode.parentElement;
    if (!text || !el || el.closest('.sr-only, .burning-ritual')) continue;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;
    let hidden = false;
    for (let node: Element | null = el; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) hidden = true;
    }
    if (hidden) continue;
    const fg = parse(getComputedStyle(el).color);
    const bg = background(el);
    if (!fg || !bg || fg.a < 0.3) continue;
    const [hi, lo] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
    const ratio = (hi + 0.05) / (lo + 0.05);
    if (ratio < 2) failures.push(`${ratio.toFixed(2)} "${text.slice(0, 20)}" <${el.tagName.toLowerCase()} class="${el.className}">`);
  }
  return failures;
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`no invisible text on main screens (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await freshStart(page);
    expect(await findInvisibleText(page), 'empty home').toEqual([]);

    await page.getByRole('button', { name: '最初のタスクを書く' }).click();
    await page.locator('#seed-title').focus();
    expect(await findInvisibleText(page), 'capture sheet').toEqual([]);
    const field = await page.locator('#seed-title').evaluate((el) => {
      const style = getComputedStyle(el);
      return { color: style.color, background: style.backgroundColor };
    });
    expect(field.color, 'focused input must not match its background').not.toEqual(field.background);
    await page.keyboard.press('Escape');

    await addTask(page, '請求書を送る', '金額を確認');
    await addTask(page, '部屋を片付ける');
    expect(await findInvisibleText(page), 'home with tasks').toEqual([]);

    await fireButton(page, '請求書を送る').click();
    await expect(page.locator('.burning-ritual')).toBeHidden({ timeout: 5_000 });
    await page.getByRole('button', { name: '炭', exact: true }).click();
    expect(await findInvisibleText(page), 'ash').toEqual([]);
    await page.getByRole('button', { name: '設定', exact: true }).click();
    expect(await findInvisibleText(page), 'settings').toEqual([]);
  });
}
