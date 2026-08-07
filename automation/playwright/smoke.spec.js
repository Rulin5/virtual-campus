const { test, expect } = require('@playwright/test');

const target = process.env.CLONE_URL || 'http://127.0.0.1:4173/';

test('loads the game and opens a portfolio modal', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(target);
  await page.getByRole('button', { name: 'Play' }).click();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('#game-hud')).toBeVisible();
  await page.locator('.hud-nav button').first().click({ force: true });
  await expect(page.locator('#modal-about')).toHaveClass(/is-visible/);
  expect(errors).toEqual([]);
});

test('contains no externally hosted runtime dependencies', async ({ page }) => {
  await page.goto(target);
  await expect(page.locator('script[src^="http"], link[href^="http"]')).toHaveCount(0);
});
