import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_BOX_MODES, MAX_BOX_TIME_SAMPLES, normalizeBox, boxEnergy, boxEigenfunction,
  boxWavefunction, boxEvolve, boxMoments, boxPreset, measureBoxEnergy, boxTimeRun,
} from '../src/box.ts';
import type { BoxParameters, BoxPresetKind } from '../src/box.ts';
import type { Complex } from '../src/quantum.ts';

const unitBox: BoxParameters = { length: 1, mass: 1 };
const close = (actual: number, expected: number, tolerance = 2e-12): void => {
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `${actual} differs from ${expected} (tolerance ${tolerance})`);
};
const complexClose = (a: Complex, b: Complex, tolerance = 2e-12): void => {
  close(a.re, b.re, tolerance); close(a.im, b.im, tolerance);
};
const eigenstate = (n: number, count = n): Complex[] => Array.from({ length: count }, (_, j) => ({ re: j + 1 === n ? 1 : 0, im: 0 }));

// Composite eight-point Gauss–Legendre reference: independent of the production
// moment matrices and of its Simpson target projection.
const nodes = [0.1834346424956498, 0.5255324099163290, 0.7966664774136267, 0.9602898564975363];
const weights = [0.3626837833783620, 0.3137066458778873, 0.2223810344533745, 0.1012285362903763];
function integrate(f: (x: number) => number, start: number, end: number): number {
  const panels = 64;
  const half = (end - start) / (2 * panels);
  let integral = 0;
  for (let i = 0; i < panels; i++) {
    const center = start + (2 * i + 1) * half;
    for (let j = 0; j < nodes.length; j++) {
      integral += half * weights[j] * (f(center - half * nodes[j]) + f(center + half * nodes[j]));
    }
  }
  return integral;
}
function referenceDensity(coeffs: readonly Complex[], x: number, params: BoxParameters): number {
  let real = 0, imaginary = 0;
  coeffs.forEach((coefficient, j) => {
    const value = Math.sqrt(2 / params.length) * Math.sin((j + 1) * Math.PI * x / params.length);
    real += coefficient.re * value;
    imaginary += coefficient.im * value;
  });
  return real ** 2 + imaginary ** 2;
}

test('box energies have n squared, inverse mass, and inverse length squared scaling', () => {
  close(boxEnergy(1, unitBox), Math.PI ** 2 / 2);
  close(boxEnergy(2, unitBox), 4 * boxEnergy(1, unitBox));
  close(boxEnergy(7, { length: 3, mass: 2 }), 49 * Math.PI ** 2 / 36);
  close(boxEnergy(16, { length: 2, mass: 4 }), boxEnergy(16, unitBox) / 16);
  assert.equal(MAX_BOX_MODES, 16);
});

test('sine eigenfunctions satisfy boundaries, exterior zero extension, and orthonormality', () => {
  const p = { length: 2.7, mass: 0.8 };
  for (const n of [1, 2, 7, 16]) {
    for (const x of [-1, 0, p.length, p.length + 1]) assert.equal(boxEigenfunction(n, x, p), 0);
    close(integrate((x) => boxEigenfunction(n, x, p) ** 2, 0, p.length), 1);
    for (const m of [1, 3, 8]) {
      close(integrate((x) => boxEigenfunction(n, x, p) * boxEigenfunction(m, x, p), 0, p.length), n === m ? 1 : 0);
    }
  }
  close(boxEigenfunction(1, p.length / 2, p), Math.sqrt(2 / p.length));
  close(boxEigenfunction(3, p.length / 2, p), -Math.sqrt(2 / p.length));
  close(boxEigenfunction(3, 0.3, { length: 2, mass: 5 }), boxEigenfunction(3, 0.15, unitBox) / Math.SQRT2);
});

test('explicit coefficient normalization is stable, complex, and leaves inputs untouched', () => {
  const raw = Object.freeze([Object.freeze({ re: 3, im: 0 }), Object.freeze({ re: 0, im: 4 })]);
  const normalized = normalizeBox(raw);
  complexClose(normalized[0], { re: 0.6, im: 0 });
  complexClose(normalized[1], { re: 0, im: 0.8 });
  assert.notStrictEqual(normalized[0], raw[0]);
  assert.deepEqual(raw, [{ re: 3, im: 0 }, { re: 0, im: 4 }]);
  for (const magnitude of [1e-300, 1e300]) {
    const result = normalizeBox([{ re: magnitude, im: 0 }, { re: 0, im: magnitude }]);
    complexClose(result[0], { re: Math.SQRT1_2, im: 0 });
    complexClose(result[1], { re: 0, im: Math.SQRT1_2 });
  }
});

test('eigenstate position moments match known analytic formulas across parameters', () => {
  for (const n of [1, 3, 16]) for (const p of [unitBox, { length: 2.7, mass: 0.3 }]) {
    const moments = boxMoments(eigenstate(n), p);
    close(moments.norm, 1);
    close(moments.meanX, p.length / 2);
    close(moments.meanX2, p.length ** 2 * (1 / 3 - 1 / (2 * Math.PI ** 2 * n ** 2)));
    close(moments.varianceX, p.length ** 2 * (1 / 12 - 1 / (2 * Math.PI ** 2 * n ** 2)));
    close(moments.leftProbability, 0.5);
    close(moments.meanEnergy, boxEnergy(n, p));
  }
});

test('complex wavefunction reconstruction preserves relative phase and physical scaling', () => {
  const state = boxPreset('phase', 2, unitBox).coeffs;
  const value = boxWavefunction(state, 0.25, unitBox);
  complexClose(value, { re: Math.SQRT1_2, im: 1 });
  const larger = boxWavefunction(state, 0.5, { length: 2, mass: 7 });
  complexClose(larger, { re: 0.5, im: Math.SQRT1_2 });
  for (const x of [-0.2, 0, 1, 2]) assert.deepEqual(boxWavefunction(state, x, unitBox), { re: 0, im: 0 });
});

test('two-mode interference has the correct sign and relative-phase frequency', () => {
  const pair = boxPreset('pair', 2, unitBox).coeffs;
  const phase = boxPreset('phase', 2, unitBox).coeffs;
  const gap = 3 * Math.PI ** 2 / 2;
  for (const time of [0, Math.PI / (2 * gap), Math.PI / gap, 2 * Math.PI / gap]) {
    const pairMoment = boxMoments(boxEvolve(pair, time, unitBox), unitBox);
    const phaseMoment = boxMoments(boxEvolve(phase, time, unitBox), unitBox);
    close(pairMoment.meanX, 0.5 - 16 * Math.cos(gap * time) / (9 * Math.PI ** 2));
    close(pairMoment.leftProbability, 0.5 + 4 * Math.cos(gap * time) / (3 * Math.PI));
    close(phaseMoment.meanX, 0.5 - 16 * Math.sin(gap * time) / (9 * Math.PI ** 2));
    close(phaseMoment.leftProbability, 0.5 + 4 * Math.sin(gap * time) / (3 * Math.PI));
  }
});

test('analytic moment matrices agree with independent spatial quadrature for complex expansions', () => {
  for (const count of [3, 8, 16]) {
    const coeffs = normalizeBox(Array.from({ length: count }, (_, j) => ({ re: Math.cos(0.71 * j), im: Math.sin(1.13 * (j + 1)) })));
    const p = { length: 0.7 + count / 6, mass: 0.4 + count / 10 };
    const evolved = boxEvolve(coeffs, 0.137, p);
    const density = (x: number) => referenceDensity(evolved, x, p);
    const actual = boxMoments(evolved, p);
    const mean = integrate((x) => x * density(x), 0, p.length);
    const second = integrate((x) => x ** 2 * density(x), 0, p.length);
    close(actual.norm, integrate(density, 0, p.length), 2e-11);
    close(actual.meanX, mean, 2e-11);
    close(actual.meanX2, second, 2e-11);
    close(actual.varianceX, second - mean ** 2, 2e-11);
    close(actual.leftProbability, integrate(density, 0, p.length / 2), 2e-11);
    close(actual.meanEnergy, coeffs.reduce((sum, c, j) => sum + (c.re ** 2 + c.im ** 2) * ((j + 1) * Math.PI / p.length) ** 2 / (2 * p.mass), 0), 2e-11);
  }
});

test('spectral evolution preserves populations, norm, and energy without modifying input', () => {
  const initial = normalizeBox(Array.from({ length: 16 }, (_, j) => ({ re: j + 1, im: 16 - j })));
  initial.forEach(Object.freeze); Object.freeze(initial);
  const before = JSON.stringify(initial);
  const p = { length: 1.3, mass: 2.5 };
  const evolved = boxEvolve(initial, 0.35, p);
  const recovered = boxEvolve(evolved, -0.35, p);
  close(boxMoments(evolved, p).norm, 1);
  close(boxMoments(evolved, p).meanEnergy, boxMoments(initial, p).meanEnergy);
  for (let j = 0; j < initial.length; j++) {
    close(evolved[j].re ** 2 + evolved[j].im ** 2, initial[j].re ** 2 + initial[j].im ** 2);
    complexClose(recovered[j], initial[j]);
    complexClose(boxEvolve(boxEvolve(initial, 0.1, p), 0.25, p)[j], evolved[j]);
  }
  assert.equal(JSON.stringify(initial), before);
});

test('a stationary eigenstate has changing complex amplitude but constant spatial statistics', () => {
  const initial = eigenstate(3, 5);
  const time = Math.PI / (2 * boxEnergy(3, unitBox));
  const evolved = boxEvolve(initial, time, unitBox);
  complexClose(evolved[2], { re: 0, im: -1 });
  const before = boxWavefunction(initial, 0.2, unitBox);
  const after = boxWavefunction(evolved, 0.2, unitBox);
  close(after.re ** 2 + after.im ** 2, before.re ** 2 + before.im ** 2);
  for (const key of ['norm', 'meanX', 'meanX2', 'varianceX', 'meanEnergy', 'leftProbability'] as const) {
    close(boxMoments(initial, unitBox)[key], boxMoments(evolved, unitBox)[key]);
  }
});

test('energy measurement uses Born weights and the normalized projected component', () => {
  const initial = Object.freeze([{ re: 0.6, im: 0 }, { re: 0, im: 0.8 }, { re: 0, im: 0 }]);
  const first = measureBoxEnergy(initial, unitBox, 0.1);
  assert.equal(first.n, 1); close(first.probability, 0.36);
  complexClose(first.state[0], { re: 1, im: 0 });
  const second = measureBoxEnergy(initial, unitBox, 0.36);
  assert.equal(second.n, 2); close(second.probability, 0.64);
  complexClose(second.state[1], { re: 0, im: 1 });
  assert.equal(second.energy, boxEnergy(2, unitBox));
  const again = measureBoxEnergy(second.state, unitBox, 0.8);
  assert.equal(again.n, 2); close(again.probability, 1);
  assert.equal(measureBoxEnergy(initial, unitBox, 1 - Number.EPSILON).n, 2);
  assert.equal(measureBoxEnergy(eigenstate(4, 8), unitBox, 0).n, 4);
  assert.deepEqual(initial, [{ re: 0.6, im: 0 }, { re: 0, im: 0.8 }, { re: 0, im: 0 }]);
});

test('localized cutoffs project one fixed target and report its retained probability weight', () => {
  const target = (y: number) => y * (1 - y) * Math.exp(-(((y - 0.25) / 0.1) ** 2) / 2);
  const targetNorm = integrate((y) => target(y) ** 2, 0, 1);
  const exactCoefficients = Array.from({ length: 16 }, (_, j) => integrate((y) => Math.SQRT2 * target(y) * Math.sin((j + 1) * Math.PI * y), 0, 1) / Math.sqrt(targetNorm));
  let previous = 0;
  for (const count of [1, 2, 4, 8, 16]) {
    const preset = boxPreset('localized', count, unitBox);
    const retained = exactCoefficients.slice(0, count).reduce((sum, c) => sum + c ** 2, 0);
    close(preset.retainedWeight!, retained, 8e-12);
    assert.ok(preset.retainedWeight! > previous && preset.retainedWeight! <= 1);
    previous = preset.retainedWeight!;
    close(boxMoments(preset.coeffs, unitBox).norm, 1);
    for (let j = 0; j < count; j++) close(preset.coeffs[j].re * Math.sqrt(preset.retainedWeight!), exactCoefficients[j], 8e-12);
    const scaled = boxPreset('localized', count, { length: 3, mass: 4 });
    assert.deepEqual(scaled, preset);
  }
  assert.ok(previous > 0.99999);
});

test('simple presets have explicit support and require two modes for interference', () => {
  assert.deepEqual(boxPreset('ground', 1, unitBox), { coeffs: [{ re: 1, im: 0 }], retainedWeight: null });
  for (const kind of ['pair', 'phase'] as const) {
    const preset = boxPreset(kind, 16, unitBox);
    assert.equal(preset.coeffs.length, 16);
    assert.equal(preset.retainedWeight, null);
    assert.ok(preset.coeffs.slice(2).every((c) => c.re === 0 && c.im === 0));
    assert.throws(() => boxPreset(kind, 1, unitBox), RangeError);
  }
});

test('stored histories resolve occupied energy differences, preserve snapshots, and cover the interval', () => {
  const initial = boxPreset('pair', 16, unitBox).coeffs;
  const params = { ...unitBox };
  const run = boxTimeRun(initial, params, 2, 31);
  const gap = boxEnergy(2, params) - boxEnergy(1, params);
  assert.equal(run.id, 31);
  assert.equal(run.maxEnergyGap, gap);
  assert.equal(run.sampleCount, run.points.length);
  assert.ok(run.sampleCount >= 201 && run.sampleCount <= MAX_BOX_TIME_SAMPLES);
  assert.equal(run.points[0].t, 0);
  assert.equal(run.points.at(-1)!.t, 2);
  for (let j = 1; j < run.points.length; j++) {
    assert.ok(gap * (run.points[j].t - run.points[j - 1].t) <= 2 * Math.PI / 32 + 1e-12);
  }
  for (const point of [run.points[0], run.points[Math.floor(run.points.length / 2)], run.points.at(-1)!]) {
    close(point.moments.meanX, 0.5 - 16 * Math.cos(gap * point.t) / (9 * Math.PI ** 2));
  }
  initial[0] = { re: 1, im: 0 }; params.length = 2;
  close(run.initial[0].re, Math.SQRT1_2);
  assert.equal(run.params.length, 1);
  const stationary = boxTimeRun(eigenstate(16), unitBox, 100, 32);
  assert.equal(stationary.maxEnergyGap, 0);
  assert.equal(stationary.phaseGap, 0);
  assert.equal(stationary.sampleCount, 201);
});

test('history sampling cap is explicit and never silently aliases a fast occupied pair', () => {
  const initial = eigenstate(1, 16);
  initial[15] = { re: 1, im: 0 };
  const coeffs = normalizeBox(initial);
  const gap = boxEnergy(16, unitBox) - boxEnergy(1, unitBox);
  const largestInterval = (MAX_BOX_TIME_SAMPLES - 1) * 2 * Math.PI / (32 * gap);
  const run = boxTimeRun(coeffs, unitBox, largestInterval * 0.9999, 40);
  assert.ok(run.sampleCount <= MAX_BOX_TIME_SAMPLES);
  assert.ok(run.sampleCount >= MAX_BOX_TIME_SAMPLES - 2);
  assert.ok(run.phaseGap <= 2 * Math.PI / 32 + 1e-12);
  assert.throws(() => boxTimeRun(coeffs, unitBox, largestInterval * 1.001, 41), /maximum is 16385/);
  // Exact point evaluation is still defined without allocating a stored history.
  close(boxMoments(boxEvolve(coeffs, largestInterval * 1.001, unitBox), unitBox).norm, 1);
});

test('invalid states, parameters, mode counts, draws, and time budgets are rejected', () => {
  for (const bad of [[], [{ re: 0, im: 0 }], Array(17).fill({ re: 1, im: 0 }), [{ re: NaN, im: 0 }]]) {
    assert.throws(() => normalizeBox(bad), RangeError);
  }
  for (const p of [{ length: 0, mass: 1 }, { length: 1, mass: -1 }, { length: Infinity, mass: 1 }, { length: 1, mass: NaN }]) {
    assert.throws(() => boxEnergy(1, p), RangeError);
    assert.throws(() => boxPreset('ground', 1, p), RangeError);
  }
  for (const n of [0, 1.5, 17]) assert.throws(() => boxEnergy(n, unitBox), RangeError);
  const badState = [{ re: 2, im: 0 }];
  assert.throws(() => boxWavefunction(badState, 0.2, unitBox), RangeError);
  assert.throws(() => boxMoments(badState, unitBox), RangeError);
  assert.throws(() => boxEvolve(badState, 1, unitBox), RangeError);
  assert.throws(() => boxEigenfunction(1, NaN, unitBox), RangeError);
  assert.throws(() => boxPreset('unknown' as BoxPresetKind, 2, unitBox), RangeError);
  for (const draw of [-0.1, 1, NaN]) assert.throws(() => measureBoxEnergy(eigenstate(1), unitBox, draw), RangeError);
  for (const end of [0, -1, 100.1, Infinity]) assert.throws(() => boxTimeRun(eigenstate(1), unitBox, end, 1), RangeError);
  assert.throws(() => boxEvolve(eigenstate(1), NaN, unitBox), RangeError);
});
