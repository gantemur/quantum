import { test, expect, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import type { Lab } from '../src/lab.ts';

type Mode = 'state' | 'time' | 'family';
interface Snapshot {
  lab: Lab;
  mode: Mode;
  lang: 'mn' | 'en';
  timeIndex: number;
  familyIndex: number;
  branch: 'lower' | 'upper';
  panels: Record<Mode, { id: number; tool: string; pinned: Record<string, unknown> | null }[]>;
  draft: Record<string, string | number>;
}

const errors = new WeakMap<Page, string[]>();
const state = (page: Page): Promise<Snapshot> => page.evaluate(() =>
  (window as unknown as { __quantumLab: () => Snapshot }).__quantumLab());
const action = (page: Page, name: string) => page.locator(`button[data-action="${name}"]`);
const panel = (page: Page, id: number) => page.locator(`[data-panel="${id}"]`);

async function open(page: Page, id: string): Promise<void> {
  const details = page.locator(`#${id}`);
  if (!(await details.evaluate(element => (element as HTMLDetailsElement).open))) {
    await details.locator(':scope > summary').click();
  }
}

async function range(page: Page, selector: string, value: number): Promise<void> {
  // Dispatch the same DOM events as a native range change, without touching app state.
  await page.locator(selector).evaluate((element, value) => {
    const input = element as HTMLInputElement;
    input.value = String(value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function english(page: Page): Promise<void> {
  await page.locator('[data-action="language"][data-lang="en"]').click();
}

async function mode(page: Page, selected: Mode): Promise<void> {
  await page.locator('#experiment-select').selectOption(selected);
  if (selected === 'time') await open(page, 'time-controls-section');
}

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on('pageerror', error => errors.get(page)!.push(error.message));
  await page.goto('/');
  await expect(page.locator('#method-code pre')).toHaveCount(1);
});

test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});

test('Mongolian first, useful static panels, bottom learning, and a bounded viewport', async ({ page }, info) => {
  await expect(page.locator('html')).toHaveAttribute('lang', 'mn');
  await expect(page.locator('.panel')).toHaveCount(3);
  await expect(page.locator('svg[data-chart="bloch"]')).toBeVisible();
  const initial = await state(page);
  expect(initial.lab.operationCount).toBe(0);
  expect(initial.lab.batch).toBeNull();
  expect(initial.lab.current[0]).toBeCloseTo(1, 12);
  for (const section of ['math-section', 'method-section', 'exercises-section', 'project-section']) {
    await expect(page.locator(`#${section} > summary`)).toBeVisible();
  }
  const width = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth }));
  expect(width.content).toBeLessThanOrEqual(width.viewport + 1);
  await page.screenshot({ path: info.outputPath('workspace-mn.png'), fullPage: true });
});

test('view, language, draft, panel, and exercise disclosures preserve science and RNG', async ({ page }) => {
  const before = await state(page);
  await open(page, 'prepare-section');
  await range(page, '#phi', 67);
  expect((await state(page)).lab).toEqual(before.lab);
  await english(page);
  expect((await state(page)).draft.phi).toBe(67);
  const densityId = (await state(page)).panels.state.find(p => p.tool === 'density')!.id;
  await page.locator(`#basis-${densityId}`).selectOption('y');
  await action(page, 'add-panel').click();
  await panel(page, densityId).locator('[data-action="pin-panel"]').click();
  await panel(page, densityId).locator('[data-action="feature-panel"]').click();
  await panel(page, densityId).locator('[data-action="collapse-panel"]').click();
  await panel(page, densityId).locator('[data-action="collapse-panel"]').click();
  await open(page, 'exercises-section');
  await open(page, 'hint-E01');
  await open(page, 'project-section');
  await page.locator('[data-action="language"][data-lang="mn"]').click();
  expect((await state(page)).lab).toEqual(before.lab);
  expect((await state(page)).draft.phi).toBe(67);
});

test('a measurement is explicit and repeated same-axis outcomes are conditional', async ({ page }) => {
  const before = await state(page);
  await open(page, 'operations-section');
  await page.locator('#measurement-axis').selectOption('z');
  await action(page, 'measure').click();
  const first = await state(page);
  expect(first.lab.operationCount).toBe(before.lab.operationCount + 1);
  expect(first.lab.seed).not.toBe(before.lab.seed);
  const event = first.lab.operations.at(-1)!;
  expect(event.before).toEqual(before.lab.current);
  expect(event.seedBefore).toBe(before.lab.seed);
  expect(event.seedAfter).toBe(first.lab.seed);
  expect(event.probability).toBeCloseTo(0.5, 12);
  expect(first.lab.current[2]).toBe(event.outcome);
  await action(page, 'measure').click();
  const second = await state(page);
  expect(second.lab.operations.at(-1)!.outcome).toBe(event.outcome);
  expect(second.lab.operations.at(-1)!.probability).toBe(1);
  expect(second.lab.time).toEqual(before.lab.time);
});

test('repeated protocols retain their input and pin both counts and operation history', async ({ page }) => {
  await english(page);
  await open(page, 'prepare-section');
  await open(page, 'operations-section');
  await page.locator('#preset').selectOption('plusZ');
  await action(page, 'prepare').click();
  await open(page, 'sampling-section');
  await page.locator('#protocol').selectOption('zxz');
  await page.locator('#trials').fill('100');
  const before = await state(page);
  await action(page, 'sample').click();
  const sampled = await state(page);
  expect(sampled.lab.current).toEqual(before.lab.current);
  expect(sampled.lab.batch!.initial).toEqual(before.lab.current);
  expect(sampled.lab.batch!.sample.axes).toEqual(['z', 'x', 'z']);
  expect(sampled.lab.batch!.sample.initialSeed).toBe(before.lab.seed);
  for (const path of sampled.lab.batch!.sample.distribution) {
    expect(path.probability).toBe(path.path.startsWith('+') ? 0.25 : 0);
    if (path.path.startsWith('-')) expect(path.count).toBe(0);
  }
  const recordId = sampled.panels.state.find(p => p.tool === 'outcomes')!.id;
  await panel(page, recordId).locator('[data-action="pin-panel"]').click();
  const pinnedText = await panel(page, recordId).innerText();
  const pinned = (await state(page)).panels.state.find(p => p.id === recordId)!.pinned;
  await page.locator('#protocol').selectOption('x');
  expect((await state(page)).lab.batch).toEqual(sampled.lab.batch);
  await page.locator('#measurement-axis').selectOption('x');
  await action(page, 'measure').click();
  await action(page, 'sample').click();
  const changed = await state(page);
  expect(changed.lab.batch!.sample.axes).toEqual(['x']);
  expect(changed.panels.state.find(p => p.id === recordId)!.pinned).toEqual(pinned);
  expect(await panel(page, recordId).innerText()).toBe(pinnedText);
});

test('global phase is a display choice and mixtures never acquire a unique ket', async ({ page }) => {
  await english(page);
  await open(page, 'exercises-section');
  await page.locator('#E01 [data-action="exercise"]').click();
  const before = await state(page);
  const amplitudeId = before.panels.state.find(p => p.tool === 'amplitudes')!.id;
  const probabilityId = before.panels.state.find(p => p.tool === 'probabilities')!.id;
  const amplitudes = await panel(page, amplitudeId).locator('.amplitude-row code').allTextContents();
  const probabilities = await panel(page, probabilityId).locator('.probability-item strong').allTextContents();
  await range(page, `#gamma-${amplitudeId}`, 180);
  expect((await state(page)).lab).toEqual(before.lab);
  expect(await panel(page, probabilityId).locator('.probability-item strong').allTextContents()).toEqual(probabilities);
  expect(await panel(page, amplitudeId).locator('.amplitude-row code').allTextContents()).not.toEqual(amplitudes);
  await range(page, '#length', 0);
  expect((await state(page)).lab).toEqual(before.lab);
  await action(page, 'prepare').click();
  await expect(panel(page, amplitudeId)).toContainText('A mixed state has no single state vector');
  await expect(panel(page, amplitudeId).locator('.amplitude-row')).toHaveCount(0);
  expect((await state(page)).lab.current.every(x => x === 0)).toBe(true);
});

test('time and parameter selections are independent and retain pinned snapshots', async ({ page }, info) => {
  await english(page);
  const before = await state(page);
  await mode(page, 'time');
  await range(page, '#coordinate', 130);
  const blochId = (await state(page)).panels.time.find(p => p.tool === 'bloch')!.id;
  await panel(page, blochId).locator('[data-action="pin-panel"]').click();
  const pinned = (await state(page)).panels.time.find(p => p.id === blochId)!.pinned;
  await range(page, '#coordinate', 70);
  expect((await state(page)).panels.time.find(p => p.id === blochId)!.pinned).toEqual(pinned);
  await mode(page, 'family');
  await range(page, '#coordinate', 40);
  let selected = await state(page);
  expect(selected.timeIndex).toBe(70);
  expect(selected.familyIndex).toBe(40);
  await mode(page, 'time');
  selected = await state(page);
  expect(selected.timeIndex).toBe(70);
  expect(selected.lab).toEqual(before.lab);
  await page.locator('#workspace').screenshot({ path: info.outputPath('time-results-en.png') });
});

test('fast evolution is resolved and zero Hamiltonian degeneracy is honest', async ({ page }) => {
  await english(page);
  await mode(page, 'time');
  await page.locator('#hz').fill('5');
  await page.locator('#end').fill('100');
  await action(page, 'calculate-time').click();
  const calculated = await state(page);
  const points = calculated.lab.time.points;
  expect(points.length).toBeGreaterThanOrEqual(Math.ceil(32 * 5 * 100 / Math.PI) + 1);
  expect((points[1].t - points[0].t) * 10).toBeLessThanOrEqual(2 * Math.PI / 32 + 1e-12);
  await range(page, '#coordinate', 200);
  await expect(page.locator('#coordinate-output')).toContainText('100.00');
  expect((await state(page)).lab.current).toEqual(calculated.lab.current);
  await mode(page, 'family');
  await page.locator('#delta').fill('0');
  await action(page, 'calculate-family').click();
  await range(page, '#coordinate', 100);
  const degenerate = await state(page);
  expect(degenerate.lab.family.points[100].data.lower).toBeNull();
  await expect(page.locator('.panel-body').filter({ hasText: 'Degenerate eigenspace' }).first()).toBeVisible();
  const yRange = await page.locator('svg[data-chart="line"]').getAttribute('data-y-max');
  await page.locator('#delta').fill('3');
  await action(page, 'calculate-family').click();
  expect(await page.locator('svg[data-chart="line"]').getAttribute('data-y-max')).toBe(yRange);
});

test('keyboard actions retain focus and the displayed code matches the executing source', async ({ page }) => {
  const language = page.locator('[data-action="language"][data-lang="en"]');
  await language.focus();
  await page.keyboard.press('Enter');
  await expect(language).toBeFocused();
  const densityId = (await state(page)).panels.state.find(p => p.tool === 'density')!.id;
  const collapse = panel(page, densityId).locator('[data-action="collapse-panel"]');
  await collapse.focus();
  await page.keyboard.press('Enter');
  await expect(collapse).toBeFocused();
  await expect(collapse).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('Enter');
  await expect(collapse).toHaveAttribute('aria-expanded', 'true');
  await open(page, 'method-section');
  const metadata = await (await page.request.get('/source.json')).json();
  const source = await readFile(new URL('../src/quantum.ts', import.meta.url), 'utf8');
  expect(metadata.sourceHash).toBe(createHash('sha256').update(source).digest('hex'));
  const expected = metadata.snippets.probabilities.code;
  expect(expected).toBe(source.split('\n').slice(metadata.snippets.probabilities.startLine - 1, metadata.snippets.probabilities.endLine).join('\n'));
  expect(await page.locator('#method-code pre code').textContent()).toBe(expected);
  expect(metadata.sourceHash).toMatch(/^[a-f0-9]{64}$/);
  await page.locator('#code-fragment').selectOption('spectral');
  expect(await page.locator('#method-code pre code').textContent()).toBe(metadata.snippets.spectral.code);
  const width = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth }));
  expect(width.content).toBeLessThanOrEqual(width.viewport + 1);
});
