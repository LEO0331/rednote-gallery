const { test, expect } = require('@playwright/test');

test.describe('RedNote gallery e2e', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('rednote_lang', 'en');
      localStorage.setItem('rednote_theme', 'light');
    });
    await page.goto('/');
  });

  test('renders gallery and cards', async ({ page }) => {
    await expect(page.locator('#page-title')).toBeVisible();
    await expect(page.locator('.card')).toHaveCount(12);
  });

  test('switches language to Traditional Chinese', async ({ page }) => {
    await page.getByRole('button', { name: '繁中' }).click();
    await expect(page.locator('#page-title')).toHaveText('小紅書里程碑作品集');
    await expect(page.locator('.filter-btn').first()).toHaveText('全部');
  });

  test('toggles theme', async ({ page }) => {
    const html = page.locator('html');
    const before = await html.getAttribute('data-theme');
    await page.locator('#theme-toggle').click();
    const after = await html.getAttribute('data-theme');
    expect(after).not.toBe(before);
  });

  test('filters by Badge and opens/closes lightbox', async ({ page }) => {
    await page.getByRole('button', { name: 'Badge' }).click();
    const cards = page.locator('.card');
    await expect(cards).toHaveCount(3);

    await cards.first().locator('.card-thumb').click();
    await expect(page.locator('#lightbox')).toBeVisible();
    await expect(page.locator('#lightbox-title')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('#lightbox')).toBeHidden();
  });
});
