import { test, expect, type Page, type Locator } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import type { Complex } from '../src/quantum.ts';
import type { BoxParameters, BoxMoments, BoxTimeRun } from '../src/box.ts';

type Mode = 'state' | 'time';
interface BoxSnapshot {
  mode: Mode;
  state: {
    current: Complex[]; params: BoxParameters; seed: number; revision: number;
    retainedWeight: number | null;
    batch: { counts: number[]; trials: number; initial: Complex[]; params: BoxParameters; seedBefore: number; seedAfter: number } | null;
    events: { n: number; probability: number; before: Complex[]; seedBefore: number; seedAfter: number }[];
  };
  time: { input: { coeffs: Complex[]; params: BoxParameters; revision: number }; run: BoxTimeRun; runInputRevision: number; cursor: number };
  selected: { coeffs: Complex[]; params: BoxParameters; time: number | null; moments: BoxMoments };
  panels: Record<Mode, { id: number; tool: string; pinned: unknown }[]>;
  drafts: Record<Mode, { length: string; mass: string; modes: string; coeffs: { re: string; im: string }[] }>;
}
interface Snapshot { system: 'qubit' | 'box'; box: BoxSnapshot; lang: 'mn' | 'en' }
const errors = new WeakMap<Page, string[]>();
const snapshot = (page: Page): Promise<Snapshot> => page.evaluate(() =>
  (window as unknown as { __quantumLab(): Snapshot }).__quantumLab());
const action = (page: Page, name: string) => page.locator(`[data-action="${name}"]`);
const boxPanel = (page: Page, id: number) => page.locator(`[data-panel="box-${id}"]`);

async function reveal(control: Locator): Promise<void> {
  // Use actual disclosure buttons; never mutate the app or its scientific state.
  const ancestors = await control.evaluate(element => {
    const ids: string[] = [];
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      if (parent instanceof HTMLDetailsElement && parent.id) ids.unshift(parent.id);
    }
    return ids;
  });
  for (const id of ancestors) {
    const details = control.page().locator(`#${id}`);
    if (!await details.evaluate(element => (element as HTMLDetailsElement).open)) {
      await details.locator(':scope > summary').click();
    }
  }
}

async function fill(page: Page, selector: string, value: number | string): Promise<void> {
  const input = page.locator(selector);
  await reveal(input);
  await input.fill(String(value));
  await input.press('Tab');
}

async function click(page: Page, selector: string): Promise<void> {
  const control = page.locator(selector);
  await reveal(control);
  await control.click();
}

async function language(page: Page, lang: 'mn' | 'en'): Promise<void> {
  await page.locator(`[data-action="language"][data-lang="${lang}"]`).click();
}

async function prepare(page: Page, preset: string, modes = 2): Promise<void> {
  await fill(page, '#box-modes', modes);
  await reveal(page.locator('#box-preset'));
  await page.locator('#box-preset').selectOption(preset);
  await click(page, '#box-prepare-preset');
}

async function download(page: Page, name: string): Promise<string> {
  const pending = page.waitForEvent('download');
  await action(page, name).click();
  const file = await pending;
  const path = await file.path();
  expect(path).not.toBeNull();
  return readFile(path!, 'utf8');
}

function csvMetadata(csv: string): Record<string, unknown> {
  return Object.fromEntries(csv.split('\n').filter(line => line.startsWith('# ')).map(line => {
    const colon = line.indexOf(': ');
    return [line.slice(2, colon), JSON.parse(line.slice(colon + 2))];
  }));
}

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on('pageerror', error => errors.get(page)!.push(error.message));
  await page.goto('/');
  await expect(page.locator('#method-code pre')).toHaveCount(1);
  await page.locator('#system-select').selectOption('box');
  await expect(page.locator('#box-preset')).toHaveCount(1);
});

test.afterEach(async ({ page }) => { expect(errors.get(page)).toEqual([]); });

test('complex coefficients apply explicitly, normalize, and preserve invalid drafts without sampling', async ({ page }) => {
  await language(page, 'en');
  await prepare(page, 'pair');
  const before = await snapshot(page);
  await fill(page, '#box-c-1-re', 1);
  await fill(page, '#box-c-1-im', 1);
  await fill(page, '#box-c-2-re', 0);
  await fill(page, '#box-c-2-im', 0);
  const edited = await snapshot(page);
  expect(edited.box.state).toEqual(before.box.state);
  expect(edited.box.time).toEqual(before.box.time);
  await language(page, 'mn');
  expect((await snapshot(page)).box.drafts).toEqual(edited.box.drafts);
  // The first click must both commit the focused edit and apply the action.
  await page.locator('#box-c-2-im').fill('1');
  await click(page, '#box-prepare-coefficients');
  const applied = await snapshot(page);
  expect(applied.box.state.current).toHaveLength(2);
  expect(applied.box.state.current[0].re).toBeCloseTo(1 / Math.sqrt(3), 12);
  expect(applied.box.state.current[0].im).toBeCloseTo(1 / Math.sqrt(3), 12);
  expect(applied.box.state.current[1].re).toBe(0);
  expect(applied.box.state.current[1].im).toBeCloseTo(1 / Math.sqrt(3), 12);
  expect(applied.box.state.current.reduce((sum, c) => sum + c.re ** 2 + c.im ** 2, 0)).toBeCloseTo(1, 12);
  expect(applied.box.state.seed).toBe(before.box.state.seed);
  for (const n of [1, 2]) for (const part of ['re', 'im']) await fill(page, `#box-c-${n}-${part}`, 0);
  await click(page, '#box-prepare-coefficients');
  expect((await snapshot(page)).box.state).toEqual(applied.box.state);
  await expect(page.locator('#box-notice.error')).toBeVisible();
  expect((await snapshot(page)).box.drafts.state.coeffs.slice(0, 2)).toEqual([
    { re: '0', im: '0' }, { re: '0', im: '0' },
  ]);
});

test('exact time selection agrees with interference and input edits retain the previous result', async ({ page }) => {
  await language(page, 'en');
  await prepare(page, 'pair');
  await click(page, '#box-use-state');
  const period = 4 / (3 * Math.PI);
  await reveal(page.locator('#box-end'));
  await page.locator('#box-end').fill(String(period));
  await click(page, '#box-calculate');
  const generated = await snapshot(page);
  expect(generated.box.mode).toBe('time');
  expect(generated.box.time.run.end).toBeCloseTo(period, 14);
  await fill(page, '#box-time-value', period / 4);
  const quarter = await snapshot(page);
  expect(quarter.box.time.cursor).toBeCloseTo(period / 4, 14);
  expect(quarter.box.time.run).toEqual(generated.box.time.run);
  expect(quarter.box.selected.moments.meanX).toBeCloseTo(0.5, 12);
  const momentsId = quarter.box.panels.time[2].id;
  await page.locator(`#box-tool-${momentsId}`).selectOption('moments');
  const meanReadout = boxPanel(page, momentsId).locator('.stats > div').filter({ hasText: /^⟨x⟩/ }).locator('dd');
  await expect(meanReadout).toHaveText('0.500000');
  await fill(page, '#box-time-value', period / 2);
  await expect(meanReadout).toHaveText((0.5 + 16 / (9 * Math.PI ** 2)).toFixed(6));
  // Select a time between retained samples and check independent analytic phases.
  const exactTime = period * 0.137;
  const pinnedId = generated.box.panels.time[0].id;
  await page.locator('#box-time-value').fill(String(exactTime));
  await click(page, `#box-pin-${pinnedId}`);
  const retained = await snapshot(page);
  expect(retained.box.panels.time.find(panel => panel.id === pinnedId)!.pinned).toEqual(expect.objectContaining({ time: exactTime }));
  expect(Math.min(...retained.box.time.run.points.map(point => Math.abs(point.t - exactTime)))).toBeGreaterThan(1e-6);
  expect(retained.box.selected.time).toBe(exactTime);
  retained.box.selected.coeffs.forEach((c, i) => {
    const phase = Math.PI ** 2 * (i + 1) ** 2 * exactTime / 2;
    expect(c.re).toBeCloseTo(Math.cos(phase) / Math.sqrt(2), 12);
    expect(c.im).toBeCloseTo(-Math.sin(phase) / Math.sqrt(2), 12);
  });
  expect(retained.box.selected.moments.meanX).toBeCloseTo(0.5 - 16 / (9 * Math.PI ** 2) * Math.cos(2 * Math.PI * 0.137), 12);
  expect(retained.box.selected.moments.meanEnergy).toBeCloseTo(5 * Math.PI ** 2 / 4, 12);
  expect(retained.box.state).toEqual(generated.box.state);
  await fill(page, '#box-c-1-re', 0.3);
  expect((await snapshot(page)).box.time.run).toEqual(retained.box.time.run);
  await click(page, '#box-prepare-coefficients');
  expect((await snapshot(page)).box.time.run).toEqual(retained.box.time.run);
  expect((await snapshot(page)).box.selected).toEqual(retained.box.selected);
  await expect(page.getByTestId('box-result-pending')).toContainText('changed');
  await click(page, '#box-calculate');
  const recalculated = await snapshot(page);
  expect(recalculated.box.time.run.id).not.toBe(retained.box.time.run.id);
  expect(recalculated.box.time.run.initial).not.toEqual(retained.box.time.run.initial);
  expect(recalculated.box.state.seed).toBe(generated.box.state.seed);
});

test('seeded energy measurements distinguish conditional collapse from independent copies', async ({ page }) => {
  await language(page, 'en');
  await prepare(page, 'pair');
  await fill(page, '#box-seed', 9173);
  await click(page, '#box-reset-seed');
  const initial = await snapshot(page);
  await click(page, '#box-measure');
  const first = await snapshot(page);
  expect(first.box.state.seed).not.toBe(initial.box.state.seed);
  const occupied = first.box.state.current.map((c, index) => c.re ** 2 + c.im ** 2 > 0.5 ? index : -1).filter(n => n >= 0);
  expect(occupied).toHaveLength(1);
  await click(page, '#box-measure');
  const second = await snapshot(page);
  expect(second.box.state.current).toEqual(first.box.state.current);
  expect(second.box.state.seed).not.toBe(first.box.state.seed);
  expect(second.box.time).toEqual(initial.box.time);
  expect(first.box.state.events.at(-1)!.probability).toBeCloseTo(0.5, 12);
  expect(second.box.state.events.at(-1)!.n).toBe(first.box.state.events.at(-1)!.n);
  expect(second.box.state.events.at(-1)!.probability).toBeCloseTo(1, 12);
  await click(page, '#box-reprepare');
  await fill(page, '#box-seed', 9173);
  await click(page, '#box-reset-seed');
  await reveal(page.locator('#box-trials'));
  await page.locator('#box-trials').fill('211');
  const copies = await snapshot(page);
  await click(page, '#box-sample');
  const sampled = await snapshot(page);
  expect(sampled.box.state.current).toEqual(copies.box.state.current);
  expect(sampled.box.state.batch).not.toBeNull();
  const firstBatch = sampled.box.state.batch!;
  await fill(page, '#box-seed', 9173);
  await click(page, '#box-reset-seed');
  await click(page, '#box-sample');
  const replay = await snapshot(page);
  expect(replay.box.state.current).toEqual(copies.box.state.current);
  expect(replay.box.state.batch!.counts).toEqual(firstBatch.counts);
  expect(replay.box.state.seed).toBe(sampled.box.state.seed);
  expect(firstBatch.counts.reduce((sum: number, count: number) => sum + count, 0)).toBe(211);
  expect(firstBatch.counts[0]).toBeGreaterThan(0);
  expect(firstBatch.counts[1]).toBeGreaterThan(0);
  expect(firstBatch.initial).toEqual(copies.box.state.current);
  expect(firstBatch.seedBefore).toBe(9173);
  await prepare(page, 'ground');
  expect((await snapshot(page)).box.state.batch).toEqual(replay.box.state.batch);
  await page.locator('#box-data-kind').selectOption('batch');
  const batchMetadata = csvMetadata(await download(page, 'export-data'));
  expect(batchMetadata.batch).toEqual(replay.box.state.batch);
});

test('box panels have compatible tools and pins survive preparation and experiment navigation', async ({ page }) => {
  await language(page, 'en');
  await prepare(page, 'pair');
  const before = await snapshot(page);
  const id = before.box.panels.state[0].id;
  const options = await page.locator(`#box-tool-${id} option`).evaluateAll(nodes => nodes.map(node => (node as HTMLOptionElement).value));
  expect(options).toEqual(['density', 'wavefunction', 'coefficients', 'moments', 'outcomes']);
  await click(page, `#box-pin-${id}`);
  const pinned = (await snapshot(page)).box.panels.state.find(p => p.id === id)!.pinned;
  const graph = await boxPanel(page, id).locator('svg').innerHTML();
  await prepare(page, 'ground');
  expect((await snapshot(page)).box.panels.state.find(p => p.id === id)!.pinned).toEqual(pinned);
  expect(await boxPanel(page, id).locator('svg').innerHTML()).toBe(graph);
  await click(page, '#box-add-panel');
  const stateView = await snapshot(page);
  await page.locator('#experiment-select').selectOption('time');
  await fill(page, '#box-end', 0.7);
  const timeView = await snapshot(page);
  const timeOptions = await page.locator(`#box-tool-${timeView.box.panels.time[0].id} option`).evaluateAll(nodes => nodes.map(node => (node as HTMLOptionElement).value));
  expect(timeOptions).toEqual(['trajectory', 'density', 'wavefunction', 'coefficients', 'moments']);
  await page.locator('#system-select').selectOption('qubit');
  await page.locator('#system-select').selectOption('box');
  expect((await snapshot(page)).box).toEqual(timeView.box);
  await page.locator('#experiment-select').selectOption('state');
  const restored = await snapshot(page);
  expect(restored.box.state).toEqual(stateView.box.state);
  expect(restored.box.panels.state).toEqual(stateView.box.panels.state);
  expect(restored.box.time).toEqual(timeView.box.time);
});

test('real setup, data, and pinned figure downloads carry the result that was exported', async ({ page }) => {
  await language(page, 'en');
  await prepare(page, 'pair');
  const initial = await snapshot(page);
  const id = initial.box.panels.state[0].id;
  await click(page, `#box-pin-${id}`);
  await fill(page, '#box-length', 1.4);
  const setup = JSON.parse(await download(page, 'export-setup'));
  expect(setup.kind).toBe('quantum-lab-setup');
  expect(setup.system).toBe('box');
  expect(setup.schemaVersion).toBe(1);
  expect(setup.provenance.numericalSourceHashes['src/box.ts']).toMatch(/^[a-f0-9]{64}$/);
  expect(setup.setup.current.params).toEqual(initial.box.state.params);
  expect(setup.setup.current.coeffs).toEqual(initial.box.state.current);
  expect(setup.setup.draft.length).toBe('1.4');
  expect(setup.setup.layout[0].pinned.parameters).toEqual(initial.box.state.params);
  expect(setup.setup.includesFullTimeHistory).toBe(false);
  await page.locator('#box-data-kind').selectOption('coefficients');
  const csv = await download(page, 'export-data');
  const metadata = csvMetadata(csv);
  expect(metadata.system).toBe('infinite-1d-box');
  expect(csv).toContain('0.707106');
  expect(csv).toContain('coeff');
  expect(metadata.parameters).toEqual(initial.box.state.params);
  expect(metadata.coefficients).toEqual(initial.box.state.current);
  expect(metadata.provenance).toEqual(setup.provenance);
  const rows = csv.split('\n').filter(line => line && !line.startsWith('# '));
  expect(rows[0]).toBe('n,re_c,im_c,probability,energy');
  expect(rows).toHaveLength(3);
  rows.slice(1).forEach((row, index) => {
    const values = row.split(',').map(Number);
    expect(values[1]).toBeCloseTo(1 / Math.sqrt(2), 12);
    expect(values[3]).toBeCloseTo(0.5, 12);
    expect(values[4]).toBeCloseTo(Math.PI ** 2 * (index + 1) ** 2 / 2, 12);
  });
  await click(page, '#box-prepare-preset');
  const changed = await snapshot(page);
  expect(changed.box.state.params.length).toBe(1.4);
  const svg = await download(page, 'export-figure');
  const figure = await page.evaluate(text => {
    const xml = new DOMParser().parseFromString(text, 'image/svg+xml');
    if (xml.querySelector('parsererror')) throw new Error('Invalid SVG download');
    return JSON.parse(xml.querySelector('metadata')!.textContent!);
  }, svg);
  expect(figure.parameters).toEqual(initial.box.state.params);
  expect(figure.coefficients).toEqual(initial.box.state.current);
  expect(figure.source.stateRevision).toBe(initial.box.state.revision);
  expect(figure.pinned).toBe(true);
  expect(figure.provenance).toEqual(setup.provenance);
  expect(svg).toContain('Pinned');
  expect((await snapshot(page)).box.state.seed).toBe(initial.box.state.seed);
});

test('both languages expose contextual activities, exact source, keyboard actions, and bounded layouts', async ({ page }, info) => {
  await expect(page.locator('html')).toHaveAttribute('lang', 'mn');
  for (const id of ['E04', 'E05']) await expect(page.locator(`#box-${id}`)).toHaveCount(1);
  await reveal(page.locator('#box-E05'));
  await expect(page.locator('#box-E05')).toContainText('Зүүн хэсэгт');
  await expect(page.locator('#box-project-section')).toContainText('Нэг систем, гурван бэлтгэл');
  const before = await snapshot(page);
  await language(page, 'en');
  expect((await snapshot(page)).box).toEqual(before.box);
  await expect(page.locator('#box-E05')).toContainText('Constructing a localized state');
  await expect(page.locator('#box-learning .exercise').first()).toHaveAttribute('id', 'box-E05');
  await expect(page.locator('#box-project-section')).toContainText('One system, three preparations');
  const source = await readFile(new URL('../src/box.ts', import.meta.url), 'utf8');
  const metadata = await (await page.request.get('/source.json')).json();
  const hash = createHash('sha256').update(source).digest('hex');
  expect(metadata.sourceFiles['src/box.ts']).toBe(hash);
  for (const id of ['box-wavefunction', 'box-evolution', 'box-energy-measurement']) {
    const part = metadata.snippets[id];
    expect(part.sourceHash).toBe(hash);
    expect(part.code).toBe(source.split('\n').slice(part.startLine - 1, part.endLine).join('\n'));
  }
  await reveal(page.locator('#method-code'));
  expect(await page.locator('#method-code pre code').allTextContents()).toContain(metadata.snippets['box-wavefunction'].code);
  await page.locator('#box-code-fragment').selectOption('box-energy-measurement');
  expect(await page.locator('#method-code pre code').allTextContents()).toContain(metadata.snippets['box-energy-measurement'].code);
  expect((await snapshot(page)).box.state).toEqual(before.box.state);
  expect((await snapshot(page)).box.drafts).toEqual(before.box.drafts);
  await page.locator('#experiment-select').selectOption('time');
  expect(await page.locator('#method-code pre code').allTextContents()).toContain(metadata.snippets['box-evolution'].code);
  await reveal(page.locator('#box-E04'));
  await expect(page.locator('#box-learning .exercise').first()).toHaveAttribute('id', 'box-E04');
  await language(page, 'mn');
  await expect(page.locator('#box-E04')).toContainText('Юу нь стационар вэ?');
  const add = page.locator('#box-add-panel');
  const count = (await snapshot(page)).box.panels.time.length;
  await add.focus();
  await page.keyboard.press('Enter');
  expect((await snapshot(page)).box.panels.time).toHaveLength(count + 1);
  await expect(add).toBeDisabled();
  const width = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth }));
  expect(width.content).toBeLessThanOrEqual(width.viewport + 1);
  await page.locator('#box-workspace').screenshot({ path: info.outputPath('box-time-mn.png') });
});
