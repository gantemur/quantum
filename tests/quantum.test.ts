import test from 'node:test';
import assert from 'node:assert/strict';
import {
  axisVector, blochFromAngles, densityMatrix, spinor, purity, probabilities,
  rotate, evolveSpectral, evolveBloch, spectrum, measure, nextRandom,
  protocolDistribution, sampleProtocol, norm, dot,
} from '../src/quantum.ts';
import type { Complex, Spinor, Vec3, Axis } from '../src/quantum.ts';

const TOL = 3e-13;
const close = (actual: number, expected: number, tolerance = TOL): void => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
};
const vectorClose = (actual: Vec3, expected: Vec3, tolerance = TOL): void => {
  actual.forEach((value, index) => close(value, expected[index], tolerance));
};
const complexClose = (actual: Complex, expected: Complex): void => {
  close(actual.re, expected.re); close(actual.im, expected.im);
};

test('angular preparation includes poles, relative phase, and the mixed interior', () => {
  vectorClose(blochFromAngles(0, 0), [0, 0, 1]);
  vectorClose(blochFromAngles(Math.PI, 7), [0, 0, -1]);
  vectorClose(blochFromAngles(Math.PI / 2, 0), [1, 0, 0]);
  vectorClose(blochFromAngles(Math.PI / 2, Math.PI / 2), [0, 1, 0]);
  vectorClose(blochFromAngles(Math.PI / 2, Math.PI, 0.4), [-0.4, 0, 0]);
  vectorClose(blochFromAngles(1, 2, 0), [0, 0, 0]);
});

test('density matrix has the correct imaginary off-diagonal sign for +y', () => {
  const rho = densityMatrix([0, 1, 0]);
  complexClose(rho[0][0], { re: 0.5, im: 0 });
  complexClose(rho[0][1], { re: 0, im: -0.5 });
  complexClose(rho[1][0], { re: 0, im: 0.5 });
  complexClose(rho[1][1], { re: 0.5, im: 0 });
});

test('Pauli basis changes preserve the physical state and give known populations', () => {
  for (const axis of ['x', 'y', 'z'] as const) {
    const rho = densityMatrix(axisVector(axis), axis);
    close(rho[0][0].re, 1); close(rho[1][1].re, 0);
    complexClose(rho[0][1], { re: 0, im: 0 });
  }
  const xInY = densityMatrix([1, 0, 0], 'y');
  complexClose(xInY[0][1], { re: 0, im: -0.5 });
  const yInX = densityMatrix([0, 1, 0], 'x');
  complexClose(yInX[0][1], { re: 0, im: 0.5 });
});

test('density matrices have unit trace, Hermiticity, and nonnegative eigenvalues', () => {
  for (const r of [[0, 0, 0], [0.2, -0.4, 0.3], [0, 0.96, -0.28]] as const) {
    for (const basis of ['x', 'y', 'z'] as const) {
      const rho = densityMatrix(r, basis);
      close(rho[0][0].re + rho[1][1].re, 1);
      close(rho[0][1].re, rho[1][0].re); close(rho[0][1].im, -rho[1][0].im);
      const determinant = rho[0][0].re * rho[1][1].re - rho[0][1].re ** 2 - rho[0][1].im ** 2;
      assert.ok(determinant >= -TOL);
      close(determinant, (1 - dot(r, r)) / 4);
    }
  }
});

test('pure representatives and global phase agree with direct known kets', () => {
  const plusY = spinor([0, 1, 0])!;
  complexClose(plusY[0], { re: Math.SQRT1_2, im: 0 });
  complexClose(plusY[1], { re: 0, im: Math.SQRT1_2 });
  const phase = spinor([0, 0, 1], 'z', Math.PI / 2)!;
  complexClose(phase[0], { re: 0, im: 1 });
  complexClose(phase[1], { re: 0, im: 0 });
  assert.equal(spinor([0, 0, 0]), null);
  assert.equal(spinor([0.999, 0, 0]), null);
  complexClose(spinor([0, 0, -1])![1], { re: 1, im: 0 });
});

test('spinor outer products match all three density-matrix representations', () => {
  const r: Vec3 = [0, 0.96, -0.28];
  for (const basis of ['x', 'y', 'z'] as const) {
    for (const phase of [0, 1.3, -2.1]) {
      const ket = spinor(r, basis, phase)!;
      const rho = densityMatrix(r, basis);
      for (const i of [0, 1] as const) for (const j of [0, 1] as const) {
        complexClose(rho[i][j], {
          re: ket[i].re * ket[j].re + ket[i].im * ket[j].im,
          im: ket[i].im * ket[j].re - ket[i].re * ket[j].im,
        });
      }
    }
  }
});

test('spinor reconstruction retains small coherences near the south pole', () => {
  const r = blochFromAngles(Math.PI - 1e-9, 0.7);
  const [a, b] = spinor(r)!;
  close(2 * (a.re * b.re + a.im * b.im), r[0], 1e-20);
  close(2 * (a.re * b.im - a.im * b.re), r[1], 1e-20);
  close(a.re ** 2 + a.im ** 2 + b.re ** 2 + b.im ** 2, 1);
});

test('coherence and mixture differ even when z populations agree', () => {
  close(probabilities([1, 0, 0], [0, 0, 1]).plus, 0.5);
  close(probabilities([0, 0, 0], [0, 0, 1]).plus, 0.5);
  close(probabilities([1, 0, 0], [1, 0, 0]).plus, 1);
  close(probabilities([0, 0, 0], [1, 0, 0]).plus, 0.5);
  close(purity([1, 0, 0]), 1); close(purity([0, 0, 0]), 0.5);
});

test('rotation obeys the positive spin/unitary convention and preserves length', () => {
  vectorClose(rotate([1, 0, 0], [0, 0, 1], Math.PI / 2), [0, 1, 0]);
  vectorClose(rotate([0, 0, 1], [1, 0, 0], Math.PI / 2), [0, -1, 0]);
  vectorClose(rotate([0, 0, 1], [0, 3, 0], Math.PI), [0, 0, -1]);
  const r: Vec3 = [0.2, -0.4, 0.3];
  close(norm(rotate(r, [1, 2, 3], 1.5)), norm(r));
  vectorClose(rotate(rotate(r, [1, 2, 3], 1.5), [1, 2, 3], -1.5), r);
});

test('spectra have analytic energies and a correctly unspecified degenerate axis', () => {
  const result = spectrum([3, 4, 0]);
  assert.deepEqual(result.energies, [-5, 5]);
  vectorClose(result.upper!, [0.6, 0.8, 0]);
  vectorClose(result.lower!, [-0.6, -0.8, 0]);
  assert.equal(result.gap, 10);
  assert.deepEqual(spectrum([0, 0, 0]), { energies: [0, 0], lower: null, upper: null, gap: 0 });
});

test('eigenstates satisfy H psi = E psi including complex off-diagonal Hamiltonians', () => {
  const h: Vec3 = [0.4, -0.7, 0.2];
  const spec = spectrum(h);
  for (const [r, energy] of [[spec.lower!, spec.energies[0]], [spec.upper!, spec.energies[1]]] as const) {
    const [a, b] = spinor(r)!;
    const applied = [
      { re: h[2] * a.re + h[0] * b.re + h[1] * b.im, im: h[2] * a.im + h[0] * b.im - h[1] * b.re },
      { re: h[0] * a.re - h[1] * a.im - h[2] * b.re, im: h[0] * a.im + h[1] * a.re - h[2] * b.im },
    ];
    complexClose(applied[0], { re: energy * a.re, im: energy * a.im });
    complexClose(applied[1], { re: energy * b.re, im: energy * b.im });
  }
});

test('fixed-H evolution gives the analytic frequencies and orientation', () => {
  for (const evolve of [evolveSpectral, evolveBloch]) {
    vectorClose(evolve([1, 0, 0], [0, 0, 1], Math.PI / 4), [0, 1, 0]);
    vectorClose(evolve([0, 0, 1], [1, 0, 0], Math.PI / 4), [0, -1, 0]);
    vectorClose(evolve([0, 0, 1], [0, 1, 0], Math.PI / 4), [1, 0, 0]);
    vectorClose(evolve([0.2, 0.1, -0.4], [0, 0, 0], 100), [0.2, 0.1, -0.4]);
  }
});

// Independent reference: Taylor action of exp(-iHt) on a ket, without eigenvalues,
// trigonometric closed forms, Bloch rotations, or production complex helpers.
function taylorKet(initial: Spinor, h: Vec3, time: number): Spinor {
  let term = initial.map((z) => ({ ...z }));
  const sum = initial.map((z) => ({ ...z }));
  for (let k = 1; k <= 45; k++) {
    const [a, b] = term;
    const H = [
      { re: h[2] * a.re + h[0] * b.re + h[1] * b.im, im: h[2] * a.im + h[0] * b.im - h[1] * b.re },
      { re: h[0] * a.re - h[1] * a.im - h[2] * b.re, im: h[0] * a.im + h[1] * a.re - h[2] * b.im },
    ];
    term = H.map((z) => ({ re: time * z.im / k, im: -time * z.re / k }));
    for (let i = 0; i < 2; i++) { sum[i].re += term[i].re; sum[i].im += term[i].im; }
  }
  return [sum[0], sum[1]];
}

test('both evolution methods agree with an independent complex exponential series', () => {
  const initial: Spinor = [{ re: 0.6, im: 0 }, { re: 0, im: 0.8 }];
  const r: Vec3 = [0, 0.96, -0.28];
  for (const time of [-2, 0, 0.01, 0.7, 2.5]) {
    const h: Vec3 = [0.3, -0.4, 0.2];
    const [a, b] = taylorKet(initial, h, time);
    const expected: Vec3 = [2 * (a.re * b.re + a.im * b.im), 2 * (a.re * b.im - a.im * b.re),
      a.re ** 2 + a.im ** 2 - b.re ** 2 - b.im ** 2];
    vectorClose(evolveSpectral(r, h, time), expected);
    vectorClose(evolveBloch(r, h, time), expected);
  }
});

test('mixed-state evolution preserves purity and energy and composes in time', () => {
  const r: Vec3 = [0.3, -0.2, 0.4], h: Vec3 = [0.5, 0.2, -0.7];
  const evolved = evolveSpectral(r, h, 3.7);
  close(purity(evolved), purity(r));
  close(dot(h, evolved), dot(h, r));
  vectorClose(evolved, evolveBloch(r, h, 3.7));
  vectorClose(evolveSpectral(evolveSpectral(r, h, 1.2), h, 2.5), evolved);
});

test('the static crossing family has a gap and an actual degeneracy only at Delta=lambda=0', () => {
  for (const lambda of [-2, -0.2, 0, 0.2, 2]) {
    close(spectrum([0.3, 0, lambda]).gap, 2 * Math.sqrt(0.09 + lambda * lambda));
  }
  assert.equal(spectrum([0, 0, 0]).upper, null);
  vectorClose(spectrum([0, 0, -2]).lower!, [0, 0, 1]);
});

test('measurement is explicit, conditional, and stable at zero-probability boundaries', () => {
  assert.equal(measure([0, 0, -1], [0, 0, 1], 0).outcome, -1);
  assert.equal(measure([0, 0, 1], [0, 0, 1], 1 - Number.EPSILON).outcome, 1);
  const result = measure([0, 0, 0], [0, 4, 0], 0.6);
  assert.equal(result.outcome, -1); close(result.probability, 0.5);
  vectorClose(result.state, [0, -1, 0]);
  close(probabilities(result.state, [0, 1, 0]).minus, 1);
});

test('successive z measurements have correlated outcomes, unlike re-prepared mixed copies', () => {
  const paths = Object.fromEntries(protocolDistribution([0, 0, 0], ['z', 'z']).map((entry) => [entry.path, entry.probability]));
  assert.deepEqual(paths, { '++': 0.5, '+-': 0, '-+': 0, '--': 0.5 });
  // Independent copies of I/2 would instead assign probability 1/4 to each pair.
});

test('an intermediate x measurement changes z-z into the z-x-z distribution', () => {
  const z = protocolDistribution([0, 0, 1], ['z', 'z']);
  close(z.find((entry) => entry.path === '++')!.probability, 1);
  const zxz = protocolDistribution([0, 0, 1], ['z', 'x', 'z']);
  for (const entry of zxz) close(entry.probability, entry.path.startsWith('+') ? 0.25 : 0);
  close(zxz.reduce((sum, entry) => sum + entry.probability, 0), 1);
});

test('seeded generator has a checked initial fixture and handles seed zero', () => {
  const first = nextRandom(1);
  assert.equal(first.seed, 1831565814);
  assert.equal(first.value, 0.6270739405881613);
  assert.notEqual(nextRandom(0).seed, 0);
  for (const seed of [0, 1, 42, 0xffff_ffff]) {
    const result = nextRandom(seed);
    assert.ok(result.value >= 0 && result.value < 1);
    assert.ok(Number.isInteger(result.seed) && result.seed >= 0 && result.seed <= 0xffff_ffff);
  }
});

test('sampling preserves its input state and reproduces the entire fixed-seed result', () => {
  const r = Object.freeze([0.2, -0.3, 0.4]) as Vec3;
  const axes = Object.freeze(['z', 'x', 'z']) as readonly Axis[];
  const first = sampleProtocol(r, axes, 300, 12345);
  assert.deepEqual(first, sampleProtocol(r, axes, 300, 12345));
  assert.equal(first.distribution.reduce((sum, entry) => sum + entry.count, 0), 300);
  assert.equal(first.finalPlus + first.finalMinus, 300);
  assert.deepEqual(r, [0.2, -0.3, 0.4]); assert.deepEqual(axes, ['z', 'x', 'z']);
});

test('batching preserves sampled counts and the next random state', () => {
  const r: Vec3 = [0, 0, 1], axes: Axis[] = ['z', 'x', 'z'];
  const together = sampleProtocol(r, axes, 500, 222);
  const a = sampleProtocol(r, axes, 200, 222);
  const b = sampleProtocol(r, axes, 300, a.seed);
  assert.equal(together.seed, b.seed);
  for (const entry of together.distribution) {
    assert.equal(entry.count, a.distribution.find((x) => x.path === entry.path)!.count + b.distribution.find((x) => x.path === entry.path)!.count);
  }
});

test('sampling an exact z-x-z law respects impossible paths and expected uncertainty', () => {
  const result = sampleProtocol([0, 0, 1], ['z', 'x', 'z'], 10_000, 2026);
  for (const path of result.distribution) {
    if (!path.path.startsWith('+')) assert.equal(path.count, 0);
    else assert.ok(Math.abs(path.count - 2500) < 6 * Math.sqrt(10_000 * 0.25 * 0.75));
  }
  assert.ok(Math.abs(result.finalPlus - 5000) < 6 * Math.sqrt(2500));
});

test('every event consumes one declared draw including deterministic outcomes', () => {
  const result = sampleProtocol([0, 0, 1], ['z', 'z'], 10, 0);
  let seed = 0;
  for (let i = 0; i < 20; i++) seed = nextRandom(seed).seed;
  assert.equal(result.seed, seed);
  assert.equal(result.distribution.find((entry) => entry.path === '++')!.count, 10);
});

test('invalid states, axes, parameters, draws, budgets, and seeds are rejected', () => {
  for (const r of [[1.01, 0, 0], [NaN, 0, 0], [0, Infinity, 0]] as const) assert.throws(() => densityMatrix(r), RangeError);
  assert.throws(() => probabilities([0, 0, 0], [0, 0, 0]), RangeError);
  assert.throws(() => rotate([0, 0, 0], [0, 0, 1], NaN), RangeError);
  assert.throws(() => evolveSpectral([1, 0, 0], [0, 0, 1], Infinity), RangeError);
  assert.throws(() => evolveBloch([1, 0, 0], [0, 0, 1], Infinity), RangeError);
  assert.throws(() => spectrum([Infinity, 0, 0]), RangeError);
  assert.throws(() => blochFromAngles(1, 2, -0.1), RangeError);
  assert.throws(() => blochFromAngles(1, 2, 1.01), RangeError);
  for (const draw of [-0.1, 1, NaN]) assert.throws(() => measure([0, 0, 0], [0, 0, 1], draw), RangeError);
  for (const seed of [-1, 0.5, 4294967296]) assert.throws(() => nextRandom(seed), RangeError);
  assert.throws(() => protocolDistribution([0, 0, 0], []), RangeError);
  assert.throws(() => protocolDistribution([0, 0, 0], Array(9).fill('z')), RangeError);
  assert.throws(() => sampleProtocol([0, 0, 0], ['z'], 0, 1), RangeError);
  assert.throws(() => sampleProtocol([0, 0, 0], ['z'], 100001, 1), RangeError);
  assert.throws(() => axisVector('bad' as Axis), RangeError);
});
