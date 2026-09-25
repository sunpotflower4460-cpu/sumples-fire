import { expect, type Page } from '@playwright/test';

export const SEEDS_KEY = 'sumples-fire-seeds-v2';

/** The ritual is ~1s (reduced motion) / 3s; CI's software-rendered WebKit needs slack. */
export const RITUAL_TIMEOUT = process.env.CI ? 30_000 : 8_000;

/** Fresh first launch: no stored tasks, no draft. */
export async function freshStart(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await expect(page.locator('#app-screen-title')).toHaveText('今日燃やす');
}

export async function addTask(page: Page, title: string, nextAction = '') {
  const firstTask = page.getByRole('button', { name: '最初のタスクを書く' });
  if (await firstTask.isVisible()) {
    await firstTask.click();
  } else {
    await page.getByRole('button', { name: '燃やしたいタスクを書く' }).click();
  }
  const dialog = page.getByRole('dialog', { name: '燃やしたいタスクを書く' });
  await expect(dialog).toBeVisible();
  await dialog.locator('#seed-title').fill(title);
  if (nextAction) await dialog.locator('#seed-next-action').fill(nextAction);
  await dialog.getByRole('button', { name: 'タスクを薪にする' }).click();
  await expect(dialog).toBeHidden();
}

export const fireButton = (page: Page, title: string) => (
  page.getByRole('button', { name: `「${title}」を完了してFire` })
);

/** Total ash as announced to assistive tech on the 炭 tab. */
export async function readTotalAsh(page: Page) {
  await page.getByRole('button', { name: '炭', exact: true }).click();
  const empty = page.locator('#ash-empty-title');
  if (await empty.isVisible()) return 0;
  const text = await page.locator('.ash-legacy-total-points .sr-only').textContent();
  return Number(text?.replace(/\D/g, ''));
}

export async function storedSeeds(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '[]') as { title: string; burned: boolean }[], SEEDS_KEY);
}
