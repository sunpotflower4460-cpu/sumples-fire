import { expect, test } from '@playwright/test';
import { SEEDS_KEY, addTask, fireButton, freshStart, readTotalAsh, storedSeeds } from './helpers';

test.beforeEach(async ({ page }) => {
  await freshStart(page);
});

test('first launch shows the empty state and a single clear action', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /嫌なタスクを/ })).toBeVisible();
  await expect(page.getByRole('button', { name: '最初のタスクを書く' })).toBeVisible();
  for (const tab of ['今日', '炭', '設定']) {
    await expect(page.getByRole('button', { name: tab, exact: true })).toBeVisible();
  }
});

test('adding a task persists it and makes it today\'s focus', async ({ page }) => {
  await addTask(page, '請求書を送る', '金額だけ確認する');

  const focus = page.getByRole('region', { name: '今日の火種' });
  await expect(focus.getByRole('heading', { name: '請求書を送る' })).toBeVisible();
  await expect(focus).toContainText('金額だけ確認する');
  expect((await storedSeeds(page)).map((seed) => seed.title)).toEqual(['請求書を送る']);
});

test('empty title is rejected without closing the sheet', async ({ page }) => {
  await page.getByRole('button', { name: '最初のタスクを書く' }).click();
  const dialog = page.getByRole('dialog', { name: '燃やしたいタスクを書く' });
  await dialog.getByRole('button', { name: 'タスクを薪にする' }).click();
  await expect(dialog.getByText('タスク名を入力してください')).toBeVisible();
  await expect(dialog).toBeVisible();
  expect(await storedSeeds(page)).toEqual([]);
});

test('cancelling input keeps nothing saved but keeps the draft for this session', async ({ page }) => {
  await page.getByRole('button', { name: '最初のタスクを書く' }).click();
  const dialog = page.getByRole('dialog', { name: '燃やしたいタスクを書く' });
  await dialog.locator('#seed-title').fill('書きかけのタスク');
  await dialog.getByRole('button', { name: '閉じる' }).click();
  await expect(dialog).toBeHidden();
  expect(await storedSeeds(page)).toEqual([]);

  await page.getByRole('button', { name: '最初のタスクを書く' }).click();
  await expect(dialog.locator('#seed-title')).toHaveValue('書きかけのタスク');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('Fire burns the task, adds ash, and Undo restores it', async ({ page }) => {
  await addTask(page, '歯医者を予約する');
  await fireButton(page, '歯医者を予約する').click();

  const ritual = page.locator('.burning-ritual');
  await expect(ritual).toBeVisible();
  await expect(ritual).toBeHidden({ timeout: 5_000 });

  const toast = page.getByRole('group', { name: '直前のFire' });
  await expect(toast).toContainText('Fire完了！ +5炭');
  expect((await storedSeeds(page))[0].burned).toBe(true);
  await expect(page.getByRole('heading', { name: /きれいに燃え尽きました/ })).toBeVisible();

  await toast.getByRole('button', { name: '「歯医者を予約する」のFireを元に戻す' }).click();
  await expect(fireButton(page, '歯医者を予約する')).toBeVisible();
  expect((await storedSeeds(page))[0].burned).toBe(false);
  expect(await readTotalAsh(page)).toBe(0);
});

test('rapid double tap on Fire burns exactly once', async ({ page }) => {
  await addTask(page, 'メールを返す');
  await addTask(page, '本を返却する');
  await fireButton(page, 'メールを返す').dblclick();
  await expect(page.locator('.burning-ritual')).toBeHidden({ timeout: 5_000 });

  const seeds = await storedSeeds(page);
  expect(seeds.filter((seed) => seed.burned).map((seed) => seed.title)).toEqual(['メールを返す']);
  expect(await readTotalAsh(page)).toBe(5);
});

test('the app shell is inert while the ritual runs', async ({ page }) => {
  await addTask(page, '書類を出す');
  await fireButton(page, '書類を出す').click();
  await expect(page.locator('main.mobile-app-shell')).toHaveAttribute('inert', '');
  await expect(page.locator('.burning-ritual')).toBeHidden({ timeout: 5_000 });
  await expect(page.locator('main.mobile-app-shell')).not.toHaveAttribute('inert', '');
});

test('delete asks for confirmation and can be cancelled', async ({ page }) => {
  await addTask(page, '残すタスク');
  await addTask(page, '消すタスク');

  await page.getByRole('button', { name: '「消すタスク」を削除' }).click();
  const modal = page.getByRole('alertdialog').or(page.getByRole('dialog'));
  await modal.getByRole('button', { name: '残しておく' }).click();
  expect((await storedSeeds(page)).map((seed) => seed.title).sort()).toEqual(['残すタスク', '消すタスク']);

  await page.getByRole('button', { name: '「消すタスク」を削除' }).click();
  await modal.getByRole('button', { name: '削除する' }).click();
  await expect(page.getByText('削除しました')).toBeVisible();
  expect((await storedSeeds(page)).map((seed) => seed.title)).toEqual(['残すタスク']);
});

test('tabs switch between today, ash history and settings', async ({ page }) => {
  await addTask(page, '部屋を片付ける');
  await fireButton(page, '部屋を片付ける').click();
  await expect(page.locator('.burning-ritual')).toBeHidden({ timeout: 5_000 });

  await page.getByRole('button', { name: '炭', exact: true }).click();
  await expect(page.locator('#app-screen-title')).toHaveText('炭');
  await expect(page.getByRole('list', { name: '燃やしたタスクの一覧' })).toContainText('部屋を片付ける');

  await page.getByRole('button', { name: '設定', exact: true }).click();
  await expect(page.getByRole('heading', { name: '体験とアプリ設定' })).toBeVisible();

  await page.getByRole('button', { name: '今日', exact: true }).click();
  await expect(page.locator('#app-screen-title')).toHaveText('今日燃やす');
});

test('sound setting toggles and survives a restart', async ({ page }) => {
  await page.getByRole('button', { name: '設定', exact: true }).click();
  const sound = page.getByRole('switch', { name: 'Fireサウンド' });
  await expect(sound).toHaveAttribute('aria-checked', 'true');
  await sound.click();
  await expect(sound).toHaveAttribute('aria-checked', 'false');

  await page.reload();
  await page.getByRole('button', { name: '設定', exact: true }).click();
  await expect(page.getByRole('switch', { name: 'Fireサウンド' })).toHaveAttribute('aria-checked', 'false');
});

test('tasks, ash and streak survive a restart', async ({ page }) => {
  await addTask(page, '確定申告の書類を集める');
  await addTask(page, 'メールを返す');
  await fireButton(page, 'メールを返す').click();
  await expect(page.locator('.burning-ritual')).toBeHidden({ timeout: 5_000 });

  await page.reload();
  await expect(fireButton(page, '確定申告の書類を集める')).toBeVisible();
  expect(await readTotalAsh(page)).toBe(5);
  const streak = await page.evaluate(() => JSON.parse(localStorage.getItem('sumples-fire-streak-v1') ?? '{}'));
  expect(streak.currentStreak).toBe(1);
});

test('corrupted storage falls back to an empty, usable app', async ({ page }) => {
  await page.evaluate((key) => localStorage.setItem(key, '{not json'), SEEDS_KEY);
  await page.reload();
  await expect(page.getByRole('button', { name: '最初のタスクを書く' })).toBeVisible();
  await addTask(page, '復旧後のタスク');
  expect((await storedSeeds(page)).map((seed) => seed.title)).toEqual(['復旧後のタスク']);
});

test('privacy and support pages open and lead back to the app', async ({ page }) => {
  await page.getByRole('button', { name: '設定', exact: true }).click();
  await page.getByRole('link', { name: /プライバシーポリシー/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('プライバシーポリシー');
  await expect(page.getByText('トラッキング')).toBeTruthy();
  await page.getByRole('link', { name: '← アプリに戻る' }).click();
  await expect(page.locator('#app-screen-title')).toBeVisible();

  await page.goto('/support.html');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('サポート');
  await expect(page.getByRole('link', { name: /github\.com/ })).toBeVisible();
  await page.getByRole('link', { name: '← アプリに戻る' }).click();
  await expect(page.locator('#app-screen-title')).toBeVisible();
});

test('long titles never cause horizontal scrolling on a small iPhone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  const long = '確定申告の書類を集めて税理士さんに送るところまで今日中に必ず終わらせる';
  await addTask(page, long);
  await addTask(page, '短い');
  await addTask(page, 'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  const footerButton = page.locator('#up-next-list .fire-card .fire-button').first();
  const box = await footerButton.boundingBox();
  expect(box?.height ?? 0).toBeLessThan(60);
});

test('full-motion ritual also completes and unlocks the app', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 393, height: 852 }, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  await freshStart(page);
  await addTask(page, '演出確認');
  await fireButton(page, '演出確認').click();
  await expect(page.locator('.burning-ritual')).toBeVisible();
  await expect(page.locator('.burning-ritual')).toBeHidden({ timeout: 8_000 });
  await expect(page.getByRole('group', { name: '直前のFire' })).toBeVisible();
  await context.close();
});
