import { expect, test, type Page } from '@playwright/test';
import { RITUAL_TIMEOUT, SEEDS_KEY, addTask, fireButton, readTotalAsh, storedSeeds } from './helpers';

/*
 * Fire Task Plus — acceptance tests that can run in a browser.
 *
 * There is no App Store here, so purchases are driven by the scripted mock that
 * only exists in this build (VITE_PLUS_STORE_MOCK=1, see playwright.config.ts).
 * What these tests prove is the app's behaviour for every purchase *outcome*;
 * they do not prove StoreKit itself. That needs the local StoreKit test and a
 * Sandbox run on a device (docs/plus/STOREKIT_TESTING.md).
 */

const PREFS_KEY = 'fire-task-plus-preferences-v1';
const STREAK_KEY = 'sumples-fire-streak-v1';
const SOUND_KEY = 'fire-task-sound-enabled-v1';

type MockScript = {
  product?: 'ready' | 'unavailable' | 'restricted';
  price?: string;
  entitlement?: 'entitled' | 'notEntitled' | 'unknown';
  purchase?: 'success' | 'cancelled' | 'pending' | 'unverified' | 'failed' | 'restricted';
  restore?: 'restored' | 'nothing' | 'unavailable';
  delayMs?: number;
};

type LaunchOptions = {
  owned?: boolean;
  /** Raw localStorage entries written before the app starts. */
  storage?: Record<string, string>;
  /** Silence the Fire sound so tests that fake AudioContext stay deterministic. */
  fireSoundOff?: boolean;
};

async function launch(page: Page, script: MockScript = {}, options: LaunchOptions = {}) {
  await page.addInitScript((value) => {
    Object.assign(window, { __FIRE_PLUS_MOCK__: value });
  }, script);
  await page.goto('/');
  await page.evaluate(({ owned, storage, fireSoundOff, soundKey }) => {
    localStorage.clear();
    sessionStorage.clear();
    if (owned) sessionStorage.setItem('fire-plus-mock-owned', '1');
    if (fireSoundOff) localStorage.setItem(soundKey, 'false');
    for (const [key, value] of Object.entries(storage ?? {})) localStorage.setItem(key, value);
  }, { owned: options.owned, storage: options.storage, fireSoundOff: options.fireSoundOff, soundKey: SOUND_KEY });
  await page.reload();
  await expect(page.locator('#app-screen-title')).toHaveText('今日燃やす');
}

const goToTab = (page: Page, name: '今日' | '炭' | '設定') => page.getByRole('button', { name, exact: true }).click();
const plusDialog = (page: Page, name: string) => page.getByRole('dialog', { name, exact: true });

async function openIntro(page: Page) {
  await goToTab(page, '設定');
  await page.getByRole('button', { name: 'くわしく見る' }).click();
  const dialog = plusDialog(page, 'Fire Task Plus');
  await expect(dialog).toBeVisible();
  return dialog;
}

const stored = (page: Page, key: string) => page.evaluate((k) => localStorage.getItem(k), key);
const storedJson = async <T,>(page: Page, key: string) => JSON.parse((await stored(page, key)) ?? 'null') as T;

const control = (page: Page) => ({
  set: (patch: MockScript) => page.evaluate((value) => {
    const c = (window as unknown as { __FIRE_PLUS_MOCK_CONTROL__: { script: MockScript } }).__FIRE_PLUS_MOCK_CONTROL__;
    c.script = { ...c.script, ...value };
  }, patch),
  emit: (update: 'granted' | 'revoked') => page.evaluate((value) => {
    (window as unknown as { __FIRE_PLUS_MOCK_CONTROL__: { emit: (u: string) => void } }).__FIRE_PLUS_MOCK_CONTROL__.emit(value);
  }, update),
  calls: () => page.evaluate(() => (window as unknown as { __FIRE_PLUS_MOCK_CONTROL__: { calls: string[] } }).__FIRE_PLUS_MOCK_CONTROL__.calls),
});

async function fireAndWait(page: Page, title: string) {
  await fireButton(page, title).click();
  await expect(page.locator('.burning-ritual')).toBeHidden({ timeout: RITUAL_TIMEOUT });
}

async function buyPlus(page: Page) {
  const dialog = plusDialog(page, 'Fire Task Plus');
  await dialog.getByRole('button', { name: /でPlusを購入$/ }).click();
  await expect(dialog.getByRole('heading', { name: 'Plusをご購入いただき、ありがとうございます。' })).toBeVisible();
  return dialog;
}

test.describe('free experience is untouched', () => {
  test('Fire and Undo are never interrupted, and Plus is just a quiet card in Settings', async ({ page }) => {
    await launch(page);
    await addTask(page, '歯医者を予約する');
    await expect(page.locator('.plus-backdrop')).toHaveCount(0);

    await fireButton(page, '歯医者を予約する').click();
    await expect(page.locator('.burning-ritual')).toBeVisible();
    await expect(page.locator('.plus-backdrop')).toHaveCount(0);
    await expect(page.locator('.burning-ritual')).toBeHidden({ timeout: RITUAL_TIMEOUT });

    const toast = page.getByRole('group', { name: '直前のFire' });
    await expect(toast).toContainText('Fire完了！ +5炭');
    await expect(page.locator('.plus-backdrop')).toHaveCount(0);
    await toast.getByRole('button', { name: '「歯医者を予約する」のFireを元に戻す' }).click();
    await expect(fireButton(page, '歯医者を予約する')).toBeVisible();
    await expect(page.locator('.plus-backdrop')).toHaveCount(0);

    await goToTab(page, '設定');
    const card = page.getByRole('region', { name: 'Fire Task Plus' });
    await expect(card).toBeVisible();
    await expect(card.getByRole('button', { name: 'くわしく見る' })).toBeVisible();
    // No badge, no countdown, no pressure
    await expect(card).not.toContainText(/今だけ|残り|割引|限定/);
  });

  test('a free user still reaches every Fire record and keeps all ash', async ({ page }) => {
    await launch(page);
    for (const title of ['A', 'B', 'C']) await addTask(page, title);
    await fireAndWait(page, 'A');
    await fireAndWait(page, 'B');
    expect(await readTotalAsh(page)).toBe(10);
    await expect(page.getByRole('list', { name: '燃やしたタスクの一覧' })).toContainText('A');
    await expect(page.getByRole('list', { name: '燃やしたタスクの一覧' })).toContainText('B');
  });
});

test.describe('Plus introduction and purchase states', () => {
  test('shows the real price from the store, the one-time note, and what restore does and does not do', async ({ page }) => {
    await launch(page, { price: '¥1,000' });
    const dialog = await openIntro(page);

    await expect(dialog.getByRole('button', { name: '¥1,000でPlusを購入' })).toBeEnabled();
    await expect(dialog).toContainText('一度の購入。月額料金はかかりません。');
    await expect(dialog).toContainText('タスクの追加・Fire・炭の記録は、これまでどおり無料です。');
    await expect(dialog).toContainText('購入の復元はPlusの利用権のみが対象です。端末内のタスク記録は復元されません。');
    await expect(dialog.getByRole('button', { name: '購入を復元' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'あとで' })).toBeVisible();
    // The price is never hard-coded in the app: the same screen with the default mock says ¥800.
  });

  test('closing (Esc) returns to the Settings button that opened it, and nothing reopens it', async ({ page }) => {
    await launch(page);
    const dialog = await openIntro(page);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('button', { name: 'くわしく見る' })).toBeFocused();
    await page.waitForTimeout(500);
    await expect(page.locator('.plus-backdrop')).toHaveCount(0);
  });

  test('Plus screens trap focus and isolate the background', async ({ page }) => {
    await launch(page);
    const dialog = await openIntro(page);
    for (let i = 0; i < 14; i += 1) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(() => Boolean(document.activeElement?.closest('.plus-dialog')));
      expect(inside).toBe(true);
    }
    await expect(page.locator('.bottom-tabs')).toHaveAttribute('inert', '');
    await dialog.getByRole('button', { name: '閉じる', exact: true }).first().click();
    await expect(page.locator('.bottom-tabs')).not.toHaveAttribute('inert', '');
  });

  test('cancelling is quiet; pending, failed and unverified explain themselves and never unlock', async ({ page }) => {
    await launch(page, { purchase: 'cancelled' });
    const mock = control(page);
    const dialog = await openIntro(page);
    const buy = dialog.getByRole('button', { name: '¥800でPlusを購入' });

    await buy.click();
    await expect(buy).toBeEnabled();
    await expect(dialog.locator('.plus-status-live')).toHaveText('');

    await mock.set({ purchase: 'failed' });
    await buy.click();
    await expect(dialog).toContainText('購入を完了できませんでした。時間をおいて、もう一度お試しください。');
    await expect(dialog.getByRole('button', { name: 'もう一度試す' })).toBeEnabled();

    await mock.set({ purchase: 'unverified' });
    await dialog.getByRole('button', { name: 'もう一度試す' }).click();
    await expect(dialog).toContainText('購入情報を確認できませんでした。購入の復元をお試しください。');

    await mock.set({ purchase: 'pending' });
    await dialog.getByRole('button', { name: /でPlusを購入$|もう一度試す/ }).first().click();
    await expect(dialog).toContainText('購入手続きの完了を待っています。確認でき次第、Plusが使えるようになります。');
    await expect(dialog.getByRole('button', { name: '購入状況を確認' })).toBeVisible();

    // Nothing was unlocked by any of this.
    await page.keyboard.press('Escape');
    await goToTab(page, '設定');
    await expect(page.getByRole('button', { name: 'くわしく見る' })).toBeVisible();
  });

  test('a pending purchase that is approved later unlocks Plus without interrupting anything', async ({ page }) => {
    await launch(page, { purchase: 'pending' });
    const mock = control(page);
    const dialog = await openIntro(page);
    await dialog.getByRole('button', { name: '¥800でPlusを購入' }).click();
    await expect(dialog).toContainText('購入手続きの完了を待っています');
    await page.keyboard.press('Escape');

    await goToTab(page, '今日');
    await addTask(page, '承認待ちの間に使う');
    await mock.emit('granted');
    // Approval arrives while the person is on the main screen: no pop-up, no screen.
    await expect(page.locator('.plus-backdrop')).toHaveCount(0);

    await goToTab(page, '設定');
    await expect(page.getByRole('region', { name: 'Fire Task Plus' })).toContainText('購入済み');
  });

  test('a buy button pressed twice buys once', async ({ page }) => {
    await launch(page, { delayMs: 300 });
    const mock = control(page);
    const dialog = await openIntro(page);
    const buy = dialog.getByRole('button', { name: '¥800でPlusを購入' });
    await buy.dblclick();
    await expect(dialog.getByRole('heading', { name: 'Plusをご購入いただき、ありがとうございます。' })).toBeVisible();
    expect((await mock.calls()).filter((call) => call === 'purchase')).toHaveLength(1);
  });

  test('restore: found, nothing found, and unreachable are three different messages', async ({ page }) => {
    await launch(page, { restore: 'nothing' });
    const mock = control(page);
    const dialog = await openIntro(page);

    await dialog.getByRole('button', { name: '購入を復元' }).click();
    await expect(dialog).toContainText('Plusの購入が見つかりませんでした。購入時のApple Accountをご確認ください。');

    await mock.set({ restore: 'unavailable' });
    await dialog.getByRole('button', { name: '購入を復元' }).click();
    await expect(dialog).toContainText('今は購入履歴を確認できません。通信状態を確認して、もう一度お試しください。');
    await expect(dialog).not.toContainText('Plusの購入が見つかりませんでした');

    await mock.set({ restore: 'restored' });
    await dialog.getByRole('button', { name: '購入を復元' }).click();
    await expect(dialog).toContainText('購入済み');
  });

  test('the price being unavailable never blocks the app, and can be retried', async ({ page }) => {
    await launch(page, { product: 'unavailable' });
    const mock = control(page);
    const dialog = await openIntro(page);
    await expect(dialog).toContainText('現在、購入情報を取得できません。時間をおいてお試しください。');
    await mock.set({ product: 'ready' });
    await dialog.getByRole('button', { name: 'もう一度試す' }).click();
    await expect(dialog.getByRole('button', { name: '¥800でPlusを購入' })).toBeEnabled();
  });

  test('a restricted device says so and cannot start a purchase', async ({ page }) => {
    await launch(page, { product: 'restricted' });
    const dialog = await openIntro(page);
    await expect(dialog).toContainText('この端末では購入できません。スクリーンタイムなどの購入設定をご確認ください。');
    await expect(dialog.getByRole('button', { name: /でPlusを購入$/ })).toHaveCount(0);
  });

  test('an owner who cannot reach the store stays an owner; a refund locks only the extras', async ({ page }) => {
    await launch(page, { product: 'unavailable' }, { owned: true });
    const mock = control(page);
    await addTask(page, '残るタスク');
    await fireAndWait(page, '残るタスク');

    // Owner, price unavailable (offline): still an owner.
    await goToTab(page, '設定');
    await expect(page.getByRole('region', { name: 'Fire Task Plus' })).toContainText('購入済み');

    await mock.emit('revoked');
    const card = page.getByRole('region', { name: 'Fire Task Plus' });
    await expect(card).toContainText('Plusの購入が取り消されたため、追加機能の利用を停止しました。タスクと炭の記録は残っています。');
    await expect(card.getByRole('button', { name: 'くわしく見る' })).toBeVisible();

    // Nothing the person made is lost.
    expect(await readTotalAsh(page)).toBe(5);
    expect((await storedSeeds(page)).map((seed) => seed.title)).toEqual(['残るタスク']);
  });
});

test.describe('Fire choice', () => {
  test('each catalog flame has its own drawing and only the spotlight animates', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await launch(page, {}, { owned: true, fireSoundOff: true });
    await goToTab(page, '設定');
    await page.getByRole('button', { name: '炎を選ぶ', exact: true }).click();
    const picker = plusDialog(page, '炎を選ぶ');
    const drawings = new Set<string>();
    for (const catalog of [/Plus専用/, /おまかせの炎/]) {
      await picker.getByRole('radio', { name: catalog }).check();
      const cards = picker.getByRole('list', { name: '炎の一覧' }).getByRole('button');
      for (const card of await cards.evaluateAll((items) => items.map((item) => {
        const svg = item.querySelector('svg')!;
        return {
          id: item.getAttribute('data-flame-id'),
          artId: svg.dataset.flame,
          paths: Array.from(svg.querySelectorAll('path'), (p) => p.getAttribute('d')).join(' '),
          playing: Array.from(svg.querySelectorAll('g'), (g) => getComputedStyle(g).animationName)
            .some((name) => name !== 'none'),
        };
      }))) {
        expect(card.artId).toBe(card.id);
        expect(card.paths.length).toBeGreaterThan(0);
        expect(card.playing).toBe(false);
        drawings.add(card.paths);
      }
    }
    expect(drawings.size).toBe(22);
    await picker.locator('[data-flame-id="phoenixRise"]').click();
    const wing = picker.locator('.plus-flame-stage > svg [data-action="open-left"]');
    await expect(wing).toHaveCSS('animation-name', 'flame-open-left');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(wing).toHaveCSS('animation-name', 'none');
    await picker.getByRole('button', { name: '試し見', exact: true }).click();
    const preview = picker.locator('.ritual-artwork svg[data-flame="phoenixRise"]');
    await expect(preview).toBeVisible();
    await expect(preview.locator('[data-action="open-left"]')).toHaveCSS('animation-name', 'none');
  });

  test('試し見 changes no record: tasks, ash, streak and preferences stay byte-identical', async ({ page }) => {
    await launch(page);
    await addTask(page, '記録に残るタスク');
    await addTask(page, 'もうひとつ');
    await fireAndWait(page, '記録に残るタスク');

    const before = {
      seeds: await stored(page, SEEDS_KEY),
      streak: await stored(page, STREAK_KEY),
      prefs: await stored(page, PREFS_KEY),
    };

    const dialog = await openIntro(page);
    await dialog.getByRole('button', { name: /^好きな炎を選ぶ/ }).click();
    const picker = plusDialog(page, '炎を選ぶ');

    const grid = picker.getByRole('list', { name: '炎の一覧' });
    const ritual = picker.locator('.burning-ritual.is-preview');
    await expect(grid.getByRole('button')).toHaveCount(13);
    await picker.locator('[data-flame-id="seaGlass"]').click();
    await expect(ritual).toBeHidden(); // browsing is silent and does not start a Fire
    await picker.getByRole('button', { name: '試し見', exact: true }).click();
    await expect(ritual).toHaveClass(/spectacle-seaGlass/);
    await expect(ritual).toContainText('試し見');
    await expect(ritual).toBeHidden({ timeout: RITUAL_TIMEOUT });

    await picker.getByRole('radio', { name: /おまかせの炎/ }).check();
    await expect(grid.getByRole('button')).toHaveCount(9);
    await picker.locator('[data-flame-id="phoenixRise"]').click();
    await picker.getByRole('button', { name: '試し見', exact: true }).click();
    await expect(ritual).toHaveClass(/spectacle-phoenixRise/);
    await expect(ritual).toBeHidden({ timeout: RITUAL_TIMEOUT });

    await expect(picker.getByText('試し見では、タスクや炭の記録は変わりません。', { exact: true })).toBeVisible();
    expect(await stored(page, SEEDS_KEY)).toBe(before.seeds);
    expect(await stored(page, STREAK_KEY)).toBe(before.streak);
    expect(await stored(page, PREFS_KEY)).toBe(before.prefs);

    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    expect(await readTotalAsh(page)).toBe(5);
  });

  test('buying from the picker keeps the chosen flame; applying it makes real Fires use it, and it survives a restart', async ({ page }) => {
    await launch(page);
    await addTask(page, '蓮の灯で燃やす');
    const dialog = await openIntro(page);
    await dialog.getByRole('button', { name: /^好きな炎を選ぶ/ }).click();
    const picker = plusDialog(page, '炎を選ぶ');

    await picker.getByRole('radio', { name: '炎を固定' }).check();
    await picker.locator('[data-flame-id="lotus"]').click();
    await expect(picker.locator('[data-flame-id="lotus"]')).toHaveAttribute('aria-pressed', 'true');

    // Not owned: choosing does not save anything.
    expect(await stored(page, PREFS_KEY)).toBeNull();
    await picker.getByRole('button', { name: 'Plusで、この炎を使う' }).click();
    await buyPlus(page);

    await page.getByRole('button', { name: '選んだ設定を使う' }).click();
    await expect(page.locator('.plus-backdrop')).toHaveCount(0);
    expect(await storedJson<{ flameMode: string; fixedFlame: string }>(page, PREFS_KEY)).toMatchObject({ flameMode: 'fixed', fixedFlame: 'lotus' });

    await goToTab(page, '今日');
    await fireButton(page, '蓮の灯で燃やす').click();
    await expect(page.locator('.burning-ritual.spectacle-lotus .ritual-artwork svg[data-flame="lotus"]')).toBeVisible();
    await expect(page.locator('.burning-ritual')).toBeHidden({ timeout: RITUAL_TIMEOUT });
    expect(await readTotalAsh(page)).toBe(5); // the flame never changes the reward

    await page.reload();
    await goToTab(page, '設定');
    const card = page.getByRole('region', { name: 'Fire Task Plus' });
    await expect(card).toContainText('購入済み');
    await expect(card.getByRole('button', { name: '炎を選ぶ' })).toContainText('蓮の灯');
  });

  test('favourites need at least one flame, never repeat the last, and a failed save is not reported as saved', async ({ page }) => {
    await launch(page, {}, { owned: true });
    await goToTab(page, '設定');
    await page.getByRole('region', { name: 'Fire Task Plus' }).getByRole('button', { name: '炎を選ぶ' }).click();
    const picker = plusDialog(page, '炎を選ぶ');
    await picker.getByRole('radio', { name: 'お気に入り' }).check();

    await expect(picker.getByText('1つ以上選んでください。')).toBeVisible();
    await expect(picker.getByRole('button', { name: 'この設定にする' })).toBeDisabled();

    await picker.locator('[data-flame-id="daybreak"]').click();
    await picker.getByRole('radio', { name: /おまかせの炎/ }).check();
    await picker.locator('[data-flame-id="dragon"]').click();
    await expect(picker.getByText('お気に入りに2種類を選択中')).toBeVisible();

    // Storage refuses the write: the app must not claim success.
    await page.evaluate((key) => {
      const original = Storage.prototype.setItem;
      Object.assign(window, { __restoreSetItem: () => { Storage.prototype.setItem = original; } });
      Storage.prototype.setItem = function setItem(k: string, v: string) {
        if (k === key) throw new Error('QuotaExceededError');
        return original.call(this, k, v);
      };
    }, PREFS_KEY);
    await picker.getByRole('button', { name: 'この設定にする' }).click();
    await expect(picker.getByText('端末に保存できませんでした。もう一度お試しください。')).toBeVisible();
    await expect(picker.getByText('保存しました。')).toHaveCount(0);
    expect(await stored(page, PREFS_KEY)).toBeNull();

    // Retry once storage works again.
    await page.evaluate(() => (window as unknown as { __restoreSetItem: () => void }).__restoreSetItem());
    await picker.getByRole('button', { name: 'この設定にする' }).click();
    await expect(picker.getByText('保存しました。')).toBeVisible();
    expect(await storedJson<{ flameMode: string; favoriteFlames: string[] }>(page, PREFS_KEY))
      .toMatchObject({ flameMode: 'favorites', favoriteFlames: ['daybreak', 'dragon'] });

    // Real Fires now use only those two, and never the same one twice in a row.
    await page.keyboard.press('Escape');
    await goToTab(page, '今日');
    const used: string[] = [];
    const titles = ['一', '二'];
    for (const title of titles) {
      await addTask(page, title);
    }
    for (const title of titles) {
      await fireButton(page, title).click();
      const className = (await page.locator('.burning-ritual').first().getAttribute('class')) ?? '';
      used.push(/spectacle-(\w+)/.exec(className)?.[1] ?? '');
      await expect(page.locator('.burning-ritual')).toBeHidden({ timeout: RITUAL_TIMEOUT });
    }
    expect(used.every((id) => id === 'daybreak' || id === 'dragon')).toBe(true);
    expect(used[0]).not.toBe(used[1]);
  });
});

test.describe('scenes and ambient sound', () => {
  const FAKE_AUDIO = () => {
    const state = { created: 0, closed: 0, contexts: [] as unknown[] };
    Object.assign(window, { __audio: state });
    class FakeAudioContext {
      state = 'suspended';
      currentTime = 0;
      destination = {};
      onstatechange: (() => void) | null = null;
      constructor() {
        state.created += 1;
        state.contexts.push(this);
      }
      resume() {
        this.state = 'running';
        return Promise.resolve();
      }
      close() {
        this.state = 'closed';
        state.closed += 1;
        return Promise.resolve();
      }
      createGain() {
        return { gain: { value: 1, setTargetAtTime() {} }, connect() {} };
      }
      createBuffer(_channels: number, length: number) {
        return { length, copyToChannel() {} };
      }
      createBufferSource() {
        return { buffer: null, loop: false, connect() {}, start() {} };
      }
    }
    Object.assign(window, { AudioContext: FakeAudioContext, webkitAudioContext: FakeAudioContext });
  };
  const audio = (page: Page) => page.evaluate(() => (window as unknown as { __audio: { created: number; closed: number } }).__audio);
  const closedSoon = async (page: Page, count: number) => {
    await expect.poll(async () => (await audio(page)).closed, { timeout: 4000 }).toBe(count);
  };

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(FAKE_AUDIO);
  });

  test('sound is silent by default and only plays when the button is pressed; leaving the screen stops it for good', async ({ page }) => {
    await launch(page, {}, { owned: true, fireSoundOff: true });
    await goToTab(page, '炭');
    await page.getByRole('button', { name: '焚き火を整える' }).click();
    const editor = plusDialog(page, '焚き火を整える');
    await expect(editor).toBeVisible();
    expect((await audio(page)).created).toBe(0);

    await editor.getByRole('radio', { name: /星明かりの湖/ }).check();
    expect((await audio(page)).created).toBe(0); // picking a scene never starts sound

    await editor.getByRole('radio', { name: '環境音', exact: true }).check();
    await editor.getByRole('button', { name: '音を再生' }).click();
    await expect(editor.getByRole('button', { name: '音を止める' })).toBeVisible();
    expect((await audio(page)).created).toBe(1);

    await editor.getByRole('button', { name: '閉じる', exact: true }).first().click();
    await closedSoon(page, 1);

    // Coming back: stopped, and nothing restarted by itself.
    await page.getByRole('button', { name: '焚き火を整える' }).click();
    const reopened = plusDialog(page, '焚き火を整える');
    await reopened.getByRole('radio', { name: '環境音', exact: true }).check();
    await expect(reopened.getByRole('button', { name: '音を再生' })).toBeVisible();
    expect((await audio(page)).created).toBe(1);
  });

  test('going to the background (screen lock / app switch) and OS interruptions stop the sound', async ({ page }) => {
    await launch(page, {}, { owned: true, fireSoundOff: true });
    await goToTab(page, '炭');
    await page.getByRole('button', { name: '焚き火を整える' }).click();
    const editor = plusDialog(page, '焚き火を整える');
    await editor.getByRole('radio', { name: /雨あがりの森/ }).check();

    await editor.getByRole('radio', { name: '環境音', exact: true }).check();
    await editor.getByRole('button', { name: '音を再生' }).click();
    await expect(editor.getByRole('button', { name: '音を止める' })).toBeVisible();

    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(editor.getByRole('button', { name: '音を再生' })).toBeVisible();
    await closedSoon(page, 1);

    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(editor.getByRole('button', { name: '音を再生' })).toBeVisible(); // no auto-resume

    // A phone call interrupts audio: stop, and do not resume when it ends.
    await editor.getByRole('radio', { name: '環境音', exact: true }).check();
    await editor.getByRole('button', { name: '音を再生' }).click();
    await expect(editor.getByRole('button', { name: '音を止める' })).toBeVisible();
    await page.evaluate(() => {
      const contexts = (window as unknown as { __audio: { contexts: { state: string; onstatechange: (() => void) | null }[] } }).__audio.contexts;
      const active = contexts[contexts.length - 1];
      active.state = 'interrupted';
      active.onstatechange?.();
    });
    await expect(editor.getByRole('button', { name: '音を再生' })).toBeVisible();
    await closedSoon(page, 2);
  });

  test('moving from the sound screen to the purchase screen stops the preview sound', async ({ page }) => {
    await launch(page, {}, { fireSoundOff: true });
    await goToTab(page, '炭');
    await page.getByRole('button', { name: '焚き火を整える' }).click();
    const editor = plusDialog(page, '焚き火を整える');
    await editor.getByRole('radio', { name: /星明かりの湖/ }).check();
    await editor.getByRole('radio', { name: '環境音', exact: true }).check();
    await editor.getByRole('button', { name: '音を再生' }).click();
    await expect(editor.getByRole('button', { name: '音を止める' })).toBeVisible();

    await editor.getByRole('button', { name: 'Plusで、この焚き火を使う' }).click();
    await expect(plusDialog(page, 'Fire Task Plus')).toBeVisible();
    await closedSoon(page, 1);
  });

  test('a scene and its volumes are saved for owners and survive a restart; a failed save is reported', async ({ page }) => {
    await launch(page, {}, { owned: true, fireSoundOff: true });
    await goToTab(page, '炭');
    await page.getByRole('button', { name: '焚き火を整える' }).click();
    const editor = plusDialog(page, '焚き火を整える');
    await expect(editor.getByRole('group', { name: '景色の一覧' }).getByRole('radio')).toHaveCount(9);
    await editor.getByRole('radio', { name: '夕凪の入り江' }).check();
    await editor.getByRole('radio', { name: '環境音', exact: true }).check();
    await expect(editor.getByLabel('波音', { exact: true })).toHaveValue('65');
    await editor.getByLabel('音の組み合わせ').selectOption('brook');
    await expect(editor.getByLabel('せせらぎ', { exact: true })).toHaveValue('66');
    await editor.getByLabel('波音', { exact: true }).fill('41');
    await editor.getByLabel('火の音').fill('60');
    await editor.getByLabel('夜の風').fill('25');
    await editor.getByRole('radio', { name: '景色', exact: true }).check();
    await editor.getByRole('radio', { name: '星明かりの湖' }).check();
    await editor.getByRole('radio', { name: '夕凪の入り江' }).check();
    await editor.getByRole('radio', { name: '環境音', exact: true }).check();
    await expect(editor.getByLabel('波音', { exact: true })).toHaveValue('41');

    await page.evaluate((key) => {
      const original = Storage.prototype.setItem;
      Object.assign(window, { __restoreSetItem: () => { Storage.prototype.setItem = original; } });
      Storage.prototype.setItem = function setItem(k: string, v: string) {
        if (k === key) throw new Error('QuotaExceededError');
        return original.call(this, k, v);
      };
    }, PREFS_KEY);
    await editor.getByRole('button', { name: 'この焚き火にする' }).click();
    await expect(editor.getByText('端末に保存できませんでした。もう一度お試しください。')).toBeVisible();
    await expect(editor.getByText('保存しました。')).toHaveCount(0);
    expect(await stored(page, PREFS_KEY)).toBeNull();

    await page.evaluate(() => (window as unknown as { __restoreSetItem: () => void }).__restoreSetItem());
    await editor.getByRole('button', { name: 'この焚き火にする' }).click();
    await expect(editor.getByText('保存しました。')).toBeVisible();
    expect(await storedJson<{ scene: string; mix: Record<string, number> }>(page, PREFS_KEY))
      .toMatchObject({ scene: 'coast', mix: { fire: 60, wind: 25, waves: 41, stream: 66 } });

    await page.reload();
    await goToTab(page, '炭');
    await expect(page.locator('.plus-scene-meta')).toContainText('夕凪の入り江');
    expect((await audio(page)).created).toBe(0); // still silent after a restart
  });

  test('the scene shares the campfire\'s growth and adds no ash or progress', async ({ page }) => {
    await launch(page, {}, { owned: true, fireSoundOff: true });
    await addTask(page, '成長を見る');
    await fireAndWait(page, '成長を見る');
    const ashBefore = await readTotalAsh(page);
    const stageClass = await page.locator('.plus-scene').getAttribute('class');
    expect(stageClass).toMatch(/campfire-stage-0/);

    await page.getByRole('button', { name: '焚き火を整える' }).click();
    const editor = plusDialog(page, '焚き火を整える');
    await editor.getByRole('radio', { name: /雨あがりの森/ }).check();
    await editor.getByRole('button', { name: 'この焚き火にする' }).click();
    await expect(editor.getByText('保存しました。')).toBeVisible();
    await page.keyboard.press('Escape');

    expect(await readTotalAsh(page)).toBe(ashBefore);
    await expect(page.locator('.plus-scene')).toHaveClass(/campfire-stage-0/);
    await expect(page.locator('.plus-scene')).toHaveClass(/scene-forest/);
  });

  test('without Plus the free scene shows in 炭 and the Plus scenes are preview-only', async ({ page }) => {
    await launch(page, {}, { fireSoundOff: true });
    await goToTab(page, '炭');
    await expect(page.locator('.plus-scene-meta')).toContainText('夜の焚き火');
    await page.getByRole('button', { name: '焚き火を整える' }).click();
    const editor = plusDialog(page, '焚き火を整える');
    await editor.getByRole('radio', { name: /雨あがりの森/ }).check();
    await expect(editor.getByRole('button', { name: 'この焚き火にする' })).toHaveCount(0);
    await expect(editor.getByText('試し見では、タスクや炭の記録は変わりません。')).toBeVisible();
    await page.keyboard.press('Escape');
    expect(await stored(page, PREFS_KEY)).toBeNull();
    await expect(page.locator('.plus-scene-meta')).toContainText('夜の焚き火');
  });
});

test.describe('campfire sets', () => {
  test('previews a set before purchase and applies the selected flame, scene and mix together', async ({ page }) => {
    await launch(page, {}, { fireSoundOff: true });
    const intro = await openIntro(page);
    await intro.getByRole('button', { name: /^炎と焚き火をセットで選ぶ/ }).click();
    const sets = plusDialog(page, '焚き火セット');
    await expect(sets.getByRole('group', { name: 'おすすめの組み合わせ' }).getByRole('radio')).toHaveCount(6);
    await sets.getByRole('radio', { name: '波を待つ浜辺' }).check();
    await expect(sets.getByRole('region', { name: '波を待つ浜辺' })).toContainText('海硝子の炎');
    expect(await stored(page, PREFS_KEY)).toBeNull();

    await sets.getByRole('button', { name: 'Plusでこのセットを使う' }).click();
    await buyPlus(page);
    await page.getByRole('button', { name: '選んだ設定を使う' }).click();
    await expect(sets).toBeHidden();
    expect(await storedJson(page, PREFS_KEY)).toMatchObject({
      scene: 'coast', fixedFlame: 'seaGlass', flameMode: 'fixed', mix: { waves: 68 },
    });
  });

  test('applies a saved personal set after a restart, with the recorded selection mode and mix', async ({ page }) => {
    await launch(page, {}, { owned: true, storage: {
      [PREFS_KEY]: JSON.stringify({ scene: 'lake', mix: { fire: 32 }, flameMode: 'shuffle' }),
    } });
    await goToTab(page, '設定');
    await page.getByRole('button', { name: '焚き火セット', exact: true }).click();
    const sets = plusDialog(page, '焚き火セット');
    await sets.getByRole('radio', { name: 'マイセット', exact: true }).check();
    await sets.getByLabel('セット名').fill('夜のひと息');
    await sets.getByRole('button', { name: '現在の設定を保存' }).click();
    await expect(sets.getByText('現在の設定をセットに保存しました。')).toBeVisible();
    await sets.getByRole('radio', { name: 'おすすめ', exact: true }).check();
    await sets.getByRole('button', { name: 'このセットを使う' }).click();
    await expect(sets.getByText('このセットを適用しました。')).toBeVisible();
    expect(await storedJson(page, PREFS_KEY)).toMatchObject({ scene: 'aurora', fixedFlame: 'aurora' });

    await page.reload();
    await goToTab(page, '設定');
    await page.getByRole('button', { name: '焚き火セット', exact: true }).click();
    await sets.getByRole('radio', { name: 'マイセット', exact: true }).check();
    await expect(sets.getByRole('region', { name: '夜のひと息' })).toContainText('全種類シャッフル');
    await sets.getByRole('button', { name: 'このセットを使う' }).click();
    await expect(sets.getByText('このセットを適用しました。')).toBeVisible();
    expect(await storedJson(page, PREFS_KEY)).toMatchObject({ scene: 'lake', flameMode: 'shuffle', mix: { fire: 32 } });
  });
});

test.describe('monthly review', () => {
  const thisMonthIso = (day: number, hour = 12) => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), day, hour).toISOString();
  };
  const seed = (id: string, title: string, extra: Record<string, unknown> = {}) => ({
    id, title, body: '', nextAction: '', category: 'task', priority: 'medium', stage: 'flame',
    difficulty: 'normal', urgency: 'high', importance: 'high', quadrant: 'doNow', ashPoints: 5,
    burned: true, completed: true, createdAt: thisMonthIso(1), updatedAt: thisMonthIso(1), ...extra,
  });

  test('annual view navigates to last year and opens a recorded month', async ({ page }) => {
    const pastYear = new Date().getFullYear() - 1;
    await launch(page, {}, { owned: true, storage: {
      [SEEDS_KEY]: JSON.stringify([seed('past', '前年の記録', {
        burnedAt: `${pastYear}-06-09T12:00:00.000Z`,
        burnedLocalDate: `${pastYear}-06-09`,
        ashPoints: 12,
      })]),
    } });
    await goToTab(page, '炭');
    await page.getByRole('button', { name: /月ごとに見る/ }).click();
    const monthly = plusDialog(page, '月別ふりかえり');
    await monthly.getByRole('radio', { name: '年間', exact: true }).check();
    await monthly.getByRole('button', { name: '前年' }).click();
    await expect(monthly.locator('.plus-month-stats')).toContainText('12');
    await monthly.getByRole('button', { name: '6月、1件、炭12、1日' }).click();
    await expect(monthly.getByRole('table', { name: `${pastYear}年6月のカレンダー` })).toBeVisible();
    await expect(monthly.getByText('前年の記録', { exact: true })).toBeVisible();
  });

  test('a free user sees a clearly labelled example, never their own records dressed as one', async ({ page }) => {
    await launch(page, {}, { storage: { [SEEDS_KEY]: JSON.stringify([seed('real', '本当の記録', { burnedAt: thisMonthIso(1) })]) } });
    await goToTab(page, '炭');
    await page.getByRole('button', { name: /月ごとに見る/ }).click();
    const monthly = plusDialog(page, '月別ふりかえり');
    await expect(monthly.getByText('表示例', { exact: true })).toBeVisible();
    await expect(monthly).toContainText('例の記録です。あなたの記録ではありません。');
    await expect(monthly).not.toContainText('本当の記録');
    await expect(monthly.getByRole('button', { name: 'Plusで、自分の記録を見る' })).toBeVisible();
    // The free history is untouched
    await page.keyboard.press('Escape');
    await expect(page.getByRole('list', { name: '燃やしたタスクの一覧' })).toContainText('本当の記録');
  });

  test('owners see their own records: counts, ash, days, undated notice — and Undo and delete stay in step', async ({ page }) => {
    const day = Math.min(new Date().getDate(), 27);
    await launch(page, {}, {
      owned: true,
      storage: {
        [SEEDS_KEY]: JSON.stringify([
          seed('a', '書類を送る', { burnedAt: thisMonthIso(day), ashPoints: 10 }),
          seed('b', '本を返す', { burnedAt: thisMonthIso(day, 18), ashPoints: 5 }),
          seed('old', '日付のない記録', { burnedAt: undefined, ashPoints: 3 }),
        ]),
      },
    });

    await goToTab(page, '設定');
    await page.getByRole('region', { name: 'Fire Task Plus' }).getByRole('button', { name: '月別ふりかえり' }).click();
    const monthly = plusDialog(page, '月別ふりかえり');
    await expect(monthly.locator('.plus-month-stats')).toContainText('2');
    await expect(monthly.locator('.plus-month-stats')).toContainText('15');
    await expect(monthly.getByRole('button', { name: `${day}日、2件、炭15` })).toBeVisible();
    await expect(monthly).toContainText('日付のない記録が1件あります');
    await expect(monthly).not.toContainText('例の記録です');

    await monthly.getByRole('radio', { name: '日別一覧' }).check();
    await expect(monthly.getByRole('list', { name: /にFireした日$/ })).toContainText('2件・炭15');
    await expect(monthly.getByRole('table')).toHaveCount(0);
    await monthly.getByRole('radio', { name: 'カレンダー' }).check();
    await expect(monthly.getByRole('button', { name: `${day}日、2件、炭15` })).toHaveAttribute('aria-pressed', 'true');

    // Open a record from the calendar: lands in the free ash history, focused.
    await monthly.getByRole('button', { name: '「書類を送る」を炭の記録で見る' }).click();
    await expect(page.locator('#app-screen-title')).toHaveText('炭');
    await expect(page.locator('[data-ash-record-id="a"]')).toBeFocused();

    // Add, Fire, Undo: the calendar ends up exactly as before.
    await goToTab(page, '今日');
    await addTask(page, '取り消すタスク');
    await fireButton(page, '取り消すタスク').click();
    await expect(page.locator('.burning-ritual')).toBeHidden({ timeout: RITUAL_TIMEOUT });
    await page.getByRole('group', { name: '直前のFire' }).getByRole('button', { name: /元に戻す/ }).first().click();
    await goToTab(page, '炭');
    await page.getByRole('button', { name: /月ごとに見る/ }).click();
    await expect(plusDialog(page, '月別ふりかえり').locator('.plus-month-stats')).toContainText('2');
    await expect(plusDialog(page, '月別ふりかえり').locator('.plus-month-stats')).toContainText('15');
    await page.keyboard.press('Escape');

    // Delete one record from the free history: the calendar follows, and no copy remains.
    await page.getByRole('button', { name: '「本を返す」を削除' }).click();
    await page.getByRole('alertdialog', { name: 'この炭の記録を削除しますか？' }).getByRole('button', { name: '炭ごと削除' }).click();
    await page.getByRole('button', { name: /月ごとに見る/ }).click();
    const afterDelete = plusDialog(page, '月別ふりかえり');
    await expect(afterDelete.locator('.plus-month-stats')).toContainText('1');
    await expect(afterDelete.getByRole('button', { name: `${day}日、1件、炭10` })).toBeVisible();
    await expect(afterDelete).not.toContainText('本を返す');
  });

  test('records are stamped with a local completion day, and legacy records are upgraded once without guessing', async ({ page }) => {
    await launch(page, {}, {
      owned: true,
      storage: {
        [SEEDS_KEY]: JSON.stringify([
          seed('legacy', '昔の記録', { burnedAt: thisMonthIso(1, 10) }),
          seed('undated', '日付なし', { burnedAt: undefined }),
        ]),
      },
    });
    await addTask(page, '新しい完了');
    await fireAndWait(page, '新しい完了');

    const seeds = await storedJson<{ id: string; title: string; burnedAt?: string; burnedLocalDate?: string }[]>(page, SEEDS_KEY);
    const bySeed = Object.fromEntries(seeds.map((s) => [s.title, s]));
    expect(bySeed['昔の記録'].burnedLocalDate).toMatch(/^\d{4}-\d{2}-01$/);
    expect(bySeed['新しい完了'].burnedLocalDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(bySeed['日付なし'].burnedLocalDate).toBeUndefined(); // never guessed from createdAt
  });
});
