import { test, expect } from '@playwright/test';

test('oscillator motion and method experiments keep physical time and iteration distinct', async ({ page }) => {
  await page.goto('/?system=oscillator');
  await page.locator('[data-lang="en"]').click();
  await expect(page.locator('#experiment-select option')).toHaveCount(2);
  await expect(page.locator('h1')).toContainText('Coherent state');
  await expect(page.locator('#osc-time')).toHaveCount(1);
  await page.locator('#osc-alpha-re').fill('0.7');
  await page.locator('[data-action="osc-calculate-motion"]').click();
  await page.locator('#osc-time').fill('1.2');
  await expect(page.locator('#osc-motion-density .panel-binding')).toContainText('t=1.2000');

  await page.locator('#experiment-select').selectOption('methods');
  await expect(page.locator('h1')).toContainText('Anharmonic');
  await expect(page.locator('#osc-iteration')).toHaveCount(1);
  await page.locator('#osc-coupling').fill('0.3');
  await page.locator('[data-action="osc-calculate-methods"]').click();
  await expect(page.locator('#osc-method-comparison')).toContainText('Rayleigh');
  await expect(page.locator('#osc-method-comparison')).toContainText('Separate refined reference');
});

test('oscillator workspace save and restore retains calculated method history', async ({ page }) => {
  await page.goto('/?system=oscillator');
  await page.locator('[data-lang="en"]').click();
  await page.locator('#experiment-select').selectOption('methods');
  await page.locator('#osc-coupling').fill('0.4');
  await page.locator('#osc-iterations').fill('25');
  await page.locator('[data-action="osc-calculate-methods"]').click();
  await page.locator('[data-action="osc-save-workspace"]').first().click();
  await page.locator('#osc-coupling').fill('0.1');
  await page.locator('[data-action="osc-calculate-methods"]').click();
  await page.locator('[data-action="osc-restore-workspace"]').click();
  await expect(page.locator('#osc-coupling')).toHaveValue('0.4');
  await expect(page.locator('#osc-iteration')).toHaveAttribute('max','25');
});

test('oscillator CSV export labels the active coordinate correctly', async ({ page }) => {
  await page.goto('/?system=oscillator');
  await page.locator('[data-lang="en"]').click();
  const download=page.waitForEvent('download');
  await page.locator('[data-action="export-data"]').click();
  const item=await download;
  const text=await (await import('node:fs/promises')).readFile((await item.path())!,'utf8');
  expect(text).toContain('physical time');
  expect(text).toContain('mean_x');
  await page.locator('#experiment-select').selectOption('methods');
  const download2=page.waitForEvent('download');
  await page.locator('[data-action="export-data"]').click();
  const item2=await download2;
  const text2=await (await import('node:fs/promises')).readFile((await item2.path())!,'utf8');
  expect(text2).toContain('algorithm iteration');
  expect(text2).toContain('rr_energy');
});
