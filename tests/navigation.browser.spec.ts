import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

type Snapshot = {
  mode: 'state' | 'time' | 'family'; system: 'qubit' | 'box';
  lab: { current: number[]; seed: number; time: { id: number; initial: number[]; h: number[]; end: number }; family: { delta: number } };
  draft: Record<string, number | string>;
  sessions: Record<string, { lab: unknown; draft: unknown }>;
  panels: Record<string, { id: number; tool: string; pinned: unknown }[]>;
  box: unknown;
};
const snapshot = (page: Page): Promise<Snapshot> => page.evaluate(() => (window as unknown as { __quantumLab(): Snapshot }).__quantumLab());
const action = (page: Page, name: string) => page.locator(`[data-action="${name}"]`);
async function open(page: Page, id: string) {
  const el = page.locator(`#${id}`);
  if (!await el.evaluate(e => (e as HTMLDetailsElement).open)) await el.locator(':scope > summary').click();
}
async function download(page: Page, name: string): Promise<string> {
  const pending = page.waitForEvent('download');
  await action(page, name).click();
  const item = await pending;
  return readFile((await item.path())!, 'utf8');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#method-code pre')).toHaveCount(1);
  await page.locator('[data-lang="en"]').click();
});

test('system and experiment navigation retain isolated states, drafts, panels, and results', async ({ page }) => {
  await expect(page.locator('#system-select option')).toHaveCount(2);
  await expect(page.locator('#experiment-select option')).toHaveCount(3);
  await open(page, 'prepare-section');
  await page.locator('#preset').selectOption('plusZ');
  await action(page, 'prepare').click();
  const prepared = await snapshot(page);
  await page.locator('#phi').evaluate(e => { const input = e as HTMLInputElement; input.value = '37'; input.dispatchEvent(new Event('input', { bubbles: true })); });
  const stateBefore = await snapshot(page);
  await page.locator('#experiment-select').selectOption('time');
  const timeBefore = await snapshot(page);
  expect(timeBefore.lab.current[0]).toBeCloseTo(1, 12);
  expect(timeBefore.lab.current).not.toEqual(prepared.lab.current);
  await open(page, 'time-controls-section');
  await page.locator('#hz').fill('0.7');
  await expect(page.locator('#result-status')).toContainText('Inputs changed');
  expect((await snapshot(page)).lab.time).toEqual(timeBefore.lab.time);
  await page.locator('#system-select').selectOption('box');
  await expect(page.locator('#experiment-select option')).toHaveCount(2);
  await page.locator('#system-select').selectOption('qubit');
  expect((await snapshot(page)).draft.hz).toBe(0.7);
  expect((await snapshot(page)).lab).toEqual(timeBefore.lab);
  await page.locator('#experiment-select').selectOption('state');
  const restored = await snapshot(page);
  expect(restored.lab).toEqual(stateBefore.lab);
  expect(restored.draft).toEqual(stateBefore.draft);
  expect(restored.panels.state).toEqual(stateBefore.panels.state);
});

test('explicit transfers copy actual states and Hamiltonians, retaining the old time result', async ({ page }) => {
  await open(page, 'prepare-section');
  await page.locator('#preset').selectOption('plusY');
  await action(page, 'prepare').click();
  const origin = await snapshot(page);
  await action(page, 'transfer-to-time').click();
  const transferred = await snapshot(page);
  expect(transferred.mode).toBe('time');
  transferred.lab.current.forEach((value, i) => expect(value).toBeCloseTo(origin.lab.current[i], 12));
  expect(transferred.lab.time.initial[0]).toBeCloseTo(1, 12);
  await expect(page.locator('#result-status')).toContainText('Inputs changed');
  await action(page, 'calculate-time').click();
  const calculated = await snapshot(page);
  expect(calculated.lab.time.initial).toEqual(calculated.lab.current);
  expect(calculated.lab.seed).toBe(transferred.lab.seed);
  await page.locator('#experiment-select').selectOption('state');
  expect((await snapshot(page)).lab).toEqual(origin.lab);
  await page.locator('#experiment-select').selectOption('family');
  await page.locator('#delta').fill('0');
  await action(page, 'calculate-family').click();
  await expect(action(page, 'transfer-family-to-time')).toBeDisabled();
  await page.locator('#delta').fill('0.8');
  await action(page, 'calculate-family').click();
  await page.locator('#delta').fill('1.2'); // Draft must not replace the selected result's H.
  await action(page, 'transfer-family-to-time').click();
  const selected = await snapshot(page);
  expect(selected.draft.hx).toBe(0.8);
  expect(selected.draft.hz).toBe(0);
  expect(selected.lab.current[0]).toBeCloseTo(-1, 12);
  expect(selected.lab.time).toEqual(calculated.lab.time);
});

test('downloaded setup, applied-result CSV, and pinned SVG retain distinct provenance', async ({ page }) => {
  await page.locator('#experiment-select').selectOption('time');
  await open(page, 'time-controls-section');
  const before = await snapshot(page);
  const id = before.panels.time[0].id;
  await page.locator(`[data-panel="${id}"] [data-action="pin-panel"]`).click();
  await page.locator('#hz').fill('0.9');
  const setup = JSON.parse(await download(page, 'export-setup'));
  expect(setup.schemaVersion).toBe(1);
  expect(setup.setup.draft.hz).toBe(0.9);
  expect(setup.setup.actualResult.h[2]).toBe(0.5);
  const csv = await download(page, 'export-data');
  expect(csv).toContain('# h: [0,0,0.5]');
  expect(csv).toContain('t,rx,ry,rz,mean_energy');
  expect(csv).toContain('physical time');
  await action(page, 'calculate-time').click();
  const svg = await download(page, 'export-figure');
  expect(svg).toContain('<svg');
  expect(svg).toContain('Pinned');
  const metadata = await page.evaluate(text => {
    const xml = new DOMParser().parseFromString(text, 'image/svg+xml');
    if (xml.querySelector('parsererror')) throw new Error('Invalid SVG');
    return JSON.parse(xml.querySelector('metadata')!.textContent!);
  }, svg);
  expect(metadata.h[2]).toBe(0.5);
  expect(metadata.panel.pinned).toBe(true);
  expect(metadata.provenance.numericalSourceHashes['src/box.ts']).toMatch(/^[a-f0-9]{64}$/);
  expect((await snapshot(page)).lab.seed).toBe(before.lab.seed);
});
